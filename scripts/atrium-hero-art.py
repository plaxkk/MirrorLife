"""Hero art direction: soft everyday tailoring and a swept, layered short groom.

Authoring only. All surfaces export through the resident's existing rig/LOD path.
"""
import bpy, bmesh, math, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def prepare_body():
    """Shape the cloth BEFORE its shoulder union, rather than smoothing a notch."""
    torso = bpy.data.objects['Torso']
    shoulder_study=int(os.environ.get('ATRIUM_SHOULDER_STUDY','0'))
    assert shoulder_study in (0,1,2)
    for v in torso.data.vertices:
        p = v.co
        # More upper chest width and a gently falling shoulder, less conical body.
        p.x *= 1 + (.06 if shoulder_study==1 else .20) * math.exp(-((p.z - 1.25) / .075) ** 2)
        if shoulder_study:
            # Reduce the inflated upper chest before union. A broad continuous
            # falloff is tested in isolation; v1 narrowing worsened the join.
            p.y *= 1-.14*math.exp(-((p.z-1.29)/.085)**2)
            outer=max(0,min(1,(abs(p.x)-.09)/.15))
            if shoulder_study==1:p.z -= .014*outer*outer*(3-2*outer)*math.exp(-((p.z-1.25)/.07)**2)


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

    groom_study=int(os.environ.get('ATRIUM_GROOM_STUDY','0'))
    assert groom_study in (0,1,2,3,4,5,6,7)
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
    sides, rows = (80,20) if groom_study==1 else (48,12)
    points = [tuple(scalp(0,0,.004)[0])]; faces = []
    for row in range(1, rows+1):
        for i in range(sides):
            az = i*math.tau/sides
            extent = 1.10+.58*(1-math.cos(az))*.5-.07*math.sin(az)**4
            extent += .025*math.sin(az*7+.4)
            if groom_study>=2:extent-=(.04 if groom_study>=4 else .085)*(1-math.cos(az))*.5
            if groom_study==1:
                extent += .027*math.sin(az*19+.7)+.010*math.sin(az*31)
                theta=row/rows*extent
                # Connected side/back hair mass. Narrow directional ridges grow
                # from the crown and taper at the perimeter rather than ending
                # as disconnected leaf-shaped clumps on a smooth cap.
                flow=az*18+theta*3.2+.5*math.sin(az*3)
                crest=(.5+.5*math.cos(flow))**2
                lift=.003+.010*crest*math.sin(theta)**.8*math.sin(math.pi*row/rows)**.4
                points.append(tuple(scalp(theta,az,lift)[0]))
            else:points.append(tuple(scalp(row/rows*extent, az, .001 if groom_study>=4 else .004)[0]))
    for i in range(sides): faces.append((0,1+i,1+(i+1)%sides))
    for row in range(rows-1):
        for i in range(sides):
            a=1+row*sides+i; b=1+row*sides+(i+1)%sides
            faces.append((a,a+sides,b+sides,b))
    cap = mesh_object('Hair tailored underlayer', points, faces)
    solid = cap.modifiers.new('Hairline thickness', 'SOLIDIFY'); solid.thickness=.003

    def lock(name, start, end, az, sweep, width, lift):
        if groom_study==7:
            tip=az+sweep
            edge=1.10+.54*(1-math.cos(tip))*.5-.07*math.sin(tip)**4+.025*math.sin(tip*7+.4)
            end=min(end,edge+.022)
        steps, cross = (9 if groom_study>=6 else 14), 8
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
            if groom_study>=6:
                tip=max(0,min(1,(t-.55)/.45));taper=1-tip*tip*(3-2*tip)
                root=min(1,t/.22);root=.32+.68*root*root*(3-2*root)
                w=width*(.76+.24*math.sin(math.pi*t))*taper*root+.0004
            else:w=width*(.72+.32*math.sin(math.pi*t))*taper+.0005
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
                if groom_study>=6:
                    height=.0005+lift*math.sin(math.pi*t)**1.2*crest**.6+.001*t**6
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
        lock('swept primary %02d'%i,start,end,az,sweep,width*(.76 if groom_study>=6 else 1),lift*(.55 if groom_study>=6 else .78 if groom_study else 1))
    if groom_study>=6:
        # Smaller secondary groups complete the silhouette without duplicating
        # the heavy primary profile; redistribute longitudinal samples to keep
        # the overall hair triangle allocation near the original 27 groups.
        for i in range(3):
            lock('front secondary %s'%i,.20+.09*i,1.12+.035*i,-1.1+.48*i,.54,.015,.010)
        def hairline(az):
            return 1.10+.54*(1-math.cos(az))*.5-.07*math.sin(az)**4+.025*math.sin(az*7+.4)
        for side in [-1,1]:
            for i in range(7):
                az=side*(1.0+i*.29);sweep=side*(.14+.04*math.sin(i))
                lock('temple layer %s %s'%(side,i),.42+.07*(i%3),hairline(az+sweep)+.018,
                     az,sweep,.017+.002*math.sin(i*2.1),.007+.002*math.sin(i*1.7))
        for i in range(17):
            az=1.05+i*.235;sweep=.20+.09*math.sin(i*1.7)
            lock('crown layer %s'%i,-.10+.035*(i%5),hairline(az+sweep)+.018,
                 az,sweep,.021+.0025*math.sin(i*2.3),.011+.003*math.sin(i*1.8))
    elif groom_study>=4:
        # Cover the full posterior hemisphere and cross the crown. The earlier
        # six guides occupied only azimuth 1.65..3.40, leaving a broad region
        # visible between the low-starting temple groups and frontal sweep.
        for side in [-1,1]:
            for i in range(5):
                lock('temple layer %s %s'%(side,i),.48+.04*(i%2),1.34+.22*(i/4),
                     side*(1.05+i*.44),side*.18,.027,.011+.002*(i%2))
        for i in range(10):
            az=1.12+i*.405;sweep=.25+.1*math.sin(i)
            end=1.54+.09*math.sin(i*1.7)**2
            if groom_study==5:
                tip=az+sweep
                end=1.10+.54*(1-math.cos(tip))*.5-.07*math.sin(tip)**4+.025*math.sin(tip*7+.4)+.025
            lock('crown layer %s'%i,-.12+.045*(i%4),end,az,sweep,
                 .030 if groom_study==5 else .034,(.017 if groom_study==5 else .024)+.004*math.sin(i*2.1))
    else:
        for side in ([] if groom_study==1 else [-1,1]):
            for i in range(7):
                end=1.32+.13*(i/6)
                if groom_study>=2:end+=.04+.19*(i/6)
                lock('temple layer %s %s'%(side,i),.63+.06*(i%2),end,
                     side*(1.1+i*.29),side*.23,.028 if groom_study>=2 else .022,
                     (.008 if groom_study>=2 else .012)+.003*(i%2))
        for i in range(0 if groom_study==1 else 6):
            lock('crown layer %s'%i,.10+.03*(i%3),(1.64 if groom_study>=2 else 1.38)+.09*(i%2),1.65+i*.35,.35,.031 if groom_study>=2 else .026,(.017 if groom_study>=2 else .031)-.002*i)
    if groom_study==3:
        # Resolve root/cap intersections in the authoring mesh, not with a
        # camera-dependent mask. Retain a bounded real 3D surface for all LODs.
        hair=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Hair')]
        budget=0
        for ob in hair:
            bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
            for modifier in list(ob.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
            ob.data.calc_loop_triangles();budget+=len(ob.data.loop_triangles)
        bpy.ops.object.select_all(action='DESELECT')
        for ob in hair:ob.select_set(True)
        bpy.context.view_layer.objects.active=hair[0];bpy.ops.object.join();groom=hair[0]
        groom.name='Hair integrated groom'
        remesh=groom.modifiers.new('Fused roots','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.003
        remesh.use_smooth_shade=True
        bpy.ops.object.modifier_apply(modifier=remesh.name)
        relax=groom.modifiers.new('Blend root intersections','SMOOTH');relax.factor=.75;relax.iterations=4
        bpy.ops.object.modifier_apply(modifier=relax.name)
        groom.data.calc_loop_triangles()
        reduce=groom.modifiers.new('Preserve hair allocation','DECIMATE');reduce.ratio=min(1,budget/len(groom.data.loop_triangles));reduce.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier=reduce.name)
        for face in groom.data.polygons:face.use_smooth=True
        groom['groom_triangle_budget']=budget
    head['hero_art_direction']='soft youth face; rooted swept short groom; reference study 2026-09-19'
