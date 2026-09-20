"""Hero art direction: soft everyday tailoring and a swept, layered short groom.

Authoring only. All surfaces export through the resident's existing rig/LOD path.
"""
import bpy, bmesh, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def prepare_body():
    """Shape the cloth BEFORE its shoulder union, rather than smoothing a notch."""
    torso = bpy.data.objects['Torso']
    for v in torso.data.vertices:
        p = v.co
        # More upper chest width and a gently falling shoulder, less conical body.
        p.x *= 1 + .20 * math.exp(-((p.z - 1.25) / .075) ** 2)


def finish_garment(garment, mats):
    """Sewn ochre forearm panels, with topology following the colour boundary."""
    # The remeshed underarm has short edges with steep root/arm transitions.
    # Diffuse weights along the actual connected cloth, never across the air
    # gap to the waist. Keep the forearm and root away from the join fixed.
    adjacency=[set() for _ in garment.data.vertices]
    for edge in garment.data.edges:
        a,b=edge.vertices; adjacency[a].add(b); adjacency[b].add(a)
    weights=[[0.] * len(garment.vertex_groups) for _ in garment.data.vertices]
    for vertex in garment.data.vertices:
        for g in vertex.groups: weights[vertex.index][g.group]=g.weight
    for _ in range(14):
        previous=[row[:] for row in weights]
        for vertex in garment.data.vertices:
            p=vertex.co; neighbours=adjacency[vertex.index]
            strength=.65*math.exp(-((p.z-1.14)/.09)**4-((abs(p.x)-.235)/.09)**4)
            if not neighbours: continue
            weights[vertex.index]=[(1-strength)*value+strength*sum(previous[i][g] for i in neighbours)/len(neighbours)
                                   for g,value in enumerate(previous[vertex.index])]
    for vertex,row in zip(garment.data.vertices,weights):
        for group,weight in zip(garment.vertex_groups,row): group.add([vertex.index],weight,'REPLACE')
        p=vertex.co
        arm=sum(weight for group,weight in zip(garment.vertex_groups,row) if 'Arm' in group.name or 'Elbow' in group.name)
        # Broad elbow compression changes the silhouette rather than adding
        # microscopic texture noise; it follows the existing weighted sleeve.
        fold=.006*math.sin((p.z-.93)*88+p.y*17)*math.exp(-((p.z-.96)/.075)**2)*arm
        vertex.co += vertex.normal*fold
    garment.data.update()
    bm = bmesh.new(); bm.from_mesh(garment.data)
    sleeves = [f for f in bm.faces if f.material_index == 1]
    edges = {e for f in sleeves for e in f.edges}
    vertices = {v for f in sleeves for v in f.verts}
    bmesh.ops.bisect_plane(bm, geom=list(vertices)+list(edges)+sleeves,
        dist=.000001, plane_co=Vector((0, 0, 1.025)), plane_no=Vector((0, 0, 1)),
        clear_inner=False, clear_outer=False)
    bm.to_mesh(garment.data); bm.free()
    garment.data.materials.append(mats['accent'])
    for polygon in garment.data.polygons:
        c = sum((garment.data.vertices[i].co for i in polygon.vertices), Vector()) / len(polygon.vertices)
        arm=sum(g.weight for i in polygon.vertices for g in garment.data.vertices[i].groups
                if 'Arm' in garment.vertex_groups[g.group].name or 'Elbow' in garment.vertex_groups[g.group].name)/len(polygon.vertices)
        if polygon.material_index == 1 and c.z < 1.025 and arm > .5:
            polygon.material_index = 2
    garment.data.calc_loop_triangles()
    report = dict(garment.parent.parent['atrium_garment'])
    report['triangles'] = len(garment.data.loop_triangles)
    audit = bmesh.new(); audit.from_mesh(garment.data)
    report['nonManifoldEdges'] = sum(not e.is_manifold for e in audit.edges); audit.free()
    report['weightError'] = max(abs(sum(g.weight for g in v.groups)-1) for v in garment.data.vertices)
    assert report['nonManifoldEdges'] == 0 and report['weightError'] < .0001
    assert report['triangles'] <= 2400, 'Hero panelling exceeds existing allocation: '+str(report['triangles'])
    garment.parent.parent['atrium_garment'] = report


def finish_head(head):
    """Replace thick stuck-on locks with rooted swept ribbons of real volume."""
    # Soften the pursed lower face, preserving every eyelid vertex and blink key.
    basis = [v.co.copy() for v in head.data.vertices]
    offsets = []
    for p in basis:
        x, y, z = p
        front = max(0, min(1, (-y-.105)/.06))
        lip = math.exp(-(x/.076)**4 - ((z+.111)/.030)**4) * front
        chin = math.exp(-(x/.095)**4 - ((z+.155)/.043)**4) * front
        nose=math.exp(-(x/.047)**4-((z+.038)/.039)**4)*front
        corner=math.exp(-((abs(x)-.053)/.026)**2-((z+.108)/.028)**2)*front
        offsets.append(Vector((-.12*x*nose, .010*lip + .004*chin+.005*nose, .003*lip+.006*corner)))
    for key in head.data.shape_keys.key_blocks:
        for v, offset in zip(key.data, offsets): v.co += offset
    for v, p, offset in zip(head.data.vertices, basis, offsets): v.co = p+offset
    head.data.update()

    old_hair = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith('Hair')]
    material = old_hair[0].data.materials[0]
    for ob in old_hair: bpy.data.objects.remove(ob, do_unlink=True)
    surface = BVHTree.FromPolygons([v.co for v in head.data.vertices], [tuple(p.vertices) for p in head.data.polygons])
    centre = Vector((0, 0, .04))

    def scalp(theta, az, lift=0):
        normal = Vector((math.sin(theta)*math.sin(az), -math.sin(theta)*math.cos(az), math.cos(theta)))
        hit = surface.ray_cast(centre+normal*2, -normal)[0]
        if hit is None: hit = centre+normal*.21
        return hit+normal*(.009+lift), normal

    def mesh_object(name, points, faces):
        mesh = bpy.data.meshes.new(name); mesh.from_pydata(points, [], faces); mesh.update()
        mesh.materials.append(material)
        ob = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(ob); ob.parent = head.parent
        uv = mesh.uv_layers.new(name='GroomUV')
        for poly in mesh.polygons:
            poly.use_smooth = True
            coords = []
            for i in poly.vertices:
                p = mesh.vertices[i].co-centre
                coords.append(((math.atan2(p.x, -p.y)/math.tau)%1, math.acos(max(-1, min(1, p.z/max(.0001,p.length))))/math.pi))
            crossing = max(u for u,v in coords)-min(u for u,v in coords) > .5
            for loop, (u,v) in zip(poly.loop_indices, coords): uv.data[loop].uv = (u+1 if crossing and u<.5 else u,v)
        return ob

    # A shallow underlayer is mostly covered by locks; it is not the outer shape.
    sides, rows = 48, 12
    points = [tuple(scalp(0,0,.004)[0])]; faces = []
    for row in range(1, rows+1):
        for i in range(sides):
            az = i*math.tau/sides
            extent = 1.10+.58*(1-math.cos(az))*.5-.07*math.sin(az)**4
            extent += .025*math.sin(az*7+.4)
            points.append(tuple(scalp(row/rows*extent, az, .004)[0]))
    for i in range(sides): faces.append((0,1+i,1+(i+1)%sides))
    for row in range(rows-1):
        for i in range(sides):
            a=1+row*sides+i; b=1+row*sides+(i+1)%sides
            faces.append((a,a+sides,b+sides,b))
    cap = mesh_object('Hair tailored underlayer', points, faces)
    solid = cap.modifiers.new('Hairline thickness', 'SOLIDIFY'); solid.thickness=.003

    def lock(name, start, end, az, sweep, width, lift):
        steps, cross = 14, 8
        centres=[]; normals=[]
        for i in range(steps+1):
            t=i/steps
            # Roots sit within the underlayer; lift gathers in the middle and
            # tips leave the common hairline at different lengths/directions.
            p,n=scalp(start+(end-start)*t, az+sweep*(t*t*(3-2*t)),
                      -.003*(1-t)+lift*math.sin(math.pi*t)**.9+.008*t**6)
            centres.append(p); normals.append(n)
        vertices=[]; polygons=[]
        for i,(p,n) in enumerate(zip(centres,normals)):
            t=i/steps
            tangent=(centres[min(i+1,steps)]-centres[max(0,i-1)]).normalized()
            across=tangent.cross(n).normalized()
            # Keep a broad overlapping mass until the final quarter. A long
            # linear taper makes every lock read as an isolated pointed blade.
            taper=1-max(0,(t-.72)/.28)**1.4
            w=width*(.72+.32*math.sin(math.pi*t))*taper+.0005
            for j in range(cross):
                angle=math.tau*j/cross
                # Flattened wedge, curved crest and buried underside; avoid
                # thick tubular clumps that read as separate plastic pieces.
                lateral=p+across*w*math.cos(angle)
                direction=(lateral-centre).normalized()
                theta=math.acos(max(-1,min(1,direction.z)))
                azimuth=math.atan2(direction.x,-direction.y)
                crest=max(0,math.sin(angle))
                height=.002+lift*math.sin(math.pi*t)**.9*crest+.002*t**6
                if math.sin(angle)<0:height=-.002
                vertices.append(tuple(scalp(theta,azimuth,height)[0]))
        for i in range(steps):
            for j in range(cross):
                a=i*cross+j; b=i*cross+(j+1)%cross
                polygons.append((a,b,b+cross,a+cross))
        polygons.extend([tuple(reversed(range(cross))),tuple(steps*cross+j for j in range(cross))])
        return mesh_object('Hair '+name,vertices,polygons)

    # Off-centre part, overlapping primary masses, varied tips. Front is -Y.
    for i,(az,start,end,width,lift,sweep) in enumerate([
        (-1.35,.36,1.20,.035,.018,.55),(-1.00,.24,1.24,.039,.028,.60),
        (-.64,.16,1.16,.040,.034,.64),(-.26,.18,1.11,.036,.032,.68),
        (.12,.25,1.15,.032,.025,.64),(.53,.35,1.21,.028,.018,.27),
        (.89,.48,1.25,.027,.015,.20)]):
        lock('swept primary %02d'%i,start,end,az,sweep,width,lift)
    for side in [-1,1]:
        for i in range(7):
            lock('temple layer %s %s'%(side,i),.63+.06*(i%2),1.32+.13*(i/6),
                 side*(1.1+i*.29),side*.23,.022,.012+.003*(i%2))
    for i in range(6):
        lock('crown layer %s'%i,.10+.03*(i%3),1.38+.09*(i%2),1.65+i*.35,.35,.026,.031-.002*i)
    head['hero_art_direction']='soft youth face; rooted swept short groom; reference study 2026-09-19'
