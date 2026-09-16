"""Fit a CC0 MakeHuman head subset to the existing player rig in Blender.
Mesh provenance: models/atrium/source/README.md. No MakeHuman program code.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def build_player_head(root_path, identity="you"):
    old=bpy.data.objects['Head'];skin=old.data.materials[0].copy();skin.name=identity+' anatomical skin'
    vertices=[];tex=[];faces=[];uv_faces=[]
    for line in (Path(root_path)/'models/atrium/source/makehuman-head.obj').read_text().splitlines():
        p=line.split()
        if not p:continue
        if p[0]=='v':vertices.append(tuple(map(float,p[1:4])))
        elif p[0]=='vt':tex.append(tuple(map(float,p[1:3])))
        elif p[0]=='f':
            faces.append([int(x.split('/')[0])-1 for x in p[1:]])
            uv_faces.append([int(x.split('/')[1])-1 for x in p[1:]])
    def fit(p):
        x,y,z=p[0]*.255,-(p[2]-.55)*.22,(p[1]-7.124)*.215
        jaw_scale={'you':1,'lin':.88,'chen':1.09,'xu':.94,'zhou':.98,'he':1.10,'tang':.93}[identity]
        jaw_weight=max(0,min(1,(-z-.025)/.13))
        x*=1+(jaw_scale-1)*jaw_weight
        # Soften the adult base below the orbital rim, retaining lid topology.
        front=max(0,min(1,(-y-.10)/.07))
        nose=math.exp(-(x/.050)**4-((z+.032)/.055)**4)*front
        mouth=math.exp(-(x/.090)**4-((z+.113)/.050)**4)*front
        y+=.016*nose+.020*mouth
        x*=1-.075*math.exp(-((z+.155)/.045)**2)*front
        z+=.007*math.exp(-((abs(x)-.052)/.027)**2-((z+.112)/.023)**2)*front
        # Preserve jaw volume but blend the neck cut inside the existing collar.
        t=max(0,min(1,(-z-.13)/.10));t=t*t*(3-2*t)
        angle=math.atan2(x,y-.015)
        x=x*(1-t)+.125*math.sin(angle)*t
        y=y*(1-t)+(.105*math.cos(angle)+.005)*t
        z+=.004*math.exp(-((abs(x)-.052)/.025)**2-((z+.112)/.025)**2)*max(0,min(1,(-y-.17)/.03))
        return x,y,z
    mesh=bpy.data.meshes.new('Player anatomical head mesh');mesh.from_pydata([fit(v) for v in vertices],[],faces);mesh.update();mesh.materials.append(skin)
    uv=mesh.uv_layers.new(name='UVMap')
    for poly,indices in zip(mesh.polygons,uv_faces):
        poly.use_smooth=True
        for loop,i in zip(poly.loop_indices,indices):uv.data[loop].uv=tex[i]
    old.data=mesh
    # Reduce the exposed straight neck while keeping its cut inside the collar.
    old.parent.location.z-=.018 if identity=='you' else .01
    # Continue the native neck to a ring inside the collar; remove the second
    # neck shell. This eliminates the two independently visible cut edges.
    edges={}
    for poly in mesh.polygons:
        ids=list(poly.vertices)
        for a,b in zip(ids,ids[1:]+ids[:1]):
            key=tuple(sorted((a,b)));edges[key]=edges.get(key,0)+1
    boundary={i for edge,count in edges.items() if count==1 for i in edge}
    base_z=(1.305-old.parent.location.z)/old.parent.scale.z
    for i in boundary:mesh.vertices[i].co.z=base_z
    neck=bpy.data.objects.get('Neck')
    if neck:bpy.data.objects.remove(neck,do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT');old.select_set(True);bpy.context.view_layer.objects.active=old
    # Relax cheek planes locally, retaining the original orbital boundary.
    # Global subdivision followed by collapse changed the socket boundary and
    # made visible eye-corner spikes, despite passing the closed-eye ray guard.
    adjacency=[set() for _ in old.data.vertices]
    for edge in old.data.edges:
        a,b=edge.vertices;adjacency[a].add(b);adjacency[b].add(a)
    for _ in range(2):
        positions=[v.co.copy() for v in old.data.vertices]
        for vertex in old.data.vertices:
            x,y,z=positions[vertex.index];neighbours=adjacency[vertex.index]
            weight=.35*math.exp(-((abs(x)-.12)/.06)**2-((z+.06)/.055)**2)*max(0,min(1,(-y-.09)/.07))
            if neighbours and z<-.015:
                average=sum((positions[i] for i in neighbours),Vector())/len(neighbours)
                vertex.co=positions[vertex.index].lerp(average,weight)
    dec=old.modifiers.new('Facial topology allocation','DECIMATE');dec.ratio=4000/8440;dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
    old['atrium_facial_morphs']=True
    old['source_license']='CC0-1.0; MakeHuman head subset with MirrorLife fitting'
    # Native nose, ears and lips replace the detached facial pieces.
    for ob in list(bpy.context.scene.objects):
        if ob.type not in {'MESH','CURVE'} or ob==old:continue
        p=ob.parent;mouth=False
        while p:
            if p.name=='MouthPivot':mouth=True
            p=p.parent
        if mouth or ob.name.startswith(('EarShell','EarConcha','Nasal crease','UpperLidSkin','LowerLidSkin','UpperLid_','LowerLidCrease','EyeCanthus')):
            bpy.data.objects.remove(ob,do_unlink=True)
    surface=BVHTree.FromPolygons([v.co for v in old.data.vertices],[tuple(p.vertices) for p in old.data.polygons])
    def front(x,z):
        point=surface.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))[0]
        return point.y if point else -.18
    for side in [-1,1]:
        eye=bpy.data.objects['EyePivot_'+str(side)];eye.location=(side*.0785,-.177,.0344);eye.scale=(.52,.4,.48);eye.rotation_euler=(0,0,side*.32)
        brow=bpy.data.objects['BrowPivot_'+str(side)];brow.location=(side*.079,front(side*.079,.08)-.003,.08);brow.scale.x=.68
        if identity=='you':
            # Relax the raised-brow expression and give the gaze a readable iris.
            # Keep the eyeball and lid anchors fixed so blink coverage can be
            # derived from the actual adjusted eye stack below.
            brow.location.z=.066
            brow.location.y=front(side*.079,.066)-.0025
            brow.scale.z=.72
            for prefix in ['Iris_', 'IrisCore_', 'Pupil_']:
                part=bpy.data.objects[prefix+str(side)]
                part.scale.x*=1.22;part.scale.z*=1.12
            glint=bpy.data.objects['EyeGlint_'+str(side)]
            glint.scale*=.72
    bpy.context.view_layer.update()
    # Fit a continuous convex front envelope to each complete eye stack.
    # Point rays have discontinuous hit/no-hit boundaries at the sclera edge;
    # projecting only vertices there left small holes between lid triangles.
    envelopes=[]
    for side in [-1,1]:
        points=[]
        for ob in bpy.data.objects['EyePivot_'+str(side)].children_recursive:
            if ob.type!='MESH':continue
            matrix=old.matrix_world.inverted()@ob.matrix_world
            points.extend(matrix@v.co for v in ob.data.vertices)
        cx=side*.0785;cz=.0344;plane=-.177;slope=side*.32
        rx=max(abs(p.x-cx) for p in points)*1.15
        rz=max(abs(p.z-cz) for p in points)*1.15
        # A single ellipse must contain every projected vertex, including the
        # iris and glint. Increase both axes by the measured worst radial ratio.
        radial=max(math.sqrt(((p.x-cx)/rx)**2+((p.z-cz)/rz)**2) for p in points)
        factor=max(1,radial*1.08);rx*=factor;rz*=factor
        depth=max((plane+slope*(p.x-cx)-p.y)/math.sqrt(max(.00001,1-((p.x-cx)/rx)**2-((p.z-cz)/rz)**2)) for p in points)
        envelopes.append((cx,cz,rx,rz,plane,slope,depth))
    def cover_eye(point):
        for cx,cz,rx,rz,plane,slope,depth in envelopes:
            r=((point.x-cx)/rx)**2+((point.z-cz)/rz)**2
            if r<1:
                front_y=plane+slope*(point.x-cx)-depth*math.sqrt(1-r)
                point.y=min(point.y,front_y-.002)
        return point
    if identity=='you':
        # Groom directly on the fitted skull. Broad, overlapping flattened clumps
        # have independent lift; projecting all old vertices erased their volume.
        hair_objects=[ob for ob in bpy.context.scene.objects if ob.type=='MESH' and ob.name.startswith('Hair')]
        hair_material=hair_objects[0].data.materials[0]
        for ob in hair_objects:bpy.data.objects.remove(ob,do_unlink=True)
        centre=Vector((0,0,.04))
        def scalp(theta,azimuth,lift=0):
            direction=Vector((math.sin(theta)*math.sin(azimuth),-math.sin(theta)*math.cos(azimuth),math.cos(theta)))
            hit=surface.ray_cast(centre+direction*2,-direction)[0]
            if hit is None:hit=centre+direction*.21
            return hit+direction*(.007+lift),direction
        def hair_mesh(name,points,faces):
            mesh=bpy.data.meshes.new(name);mesh.from_pydata(points,[],faces);mesh.update();mesh.materials.append(hair_material)
            ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.parent=old.parent
            uv=mesh.uv_layers.new(name='GroomUV')
            for poly in mesh.polygons:
                poly.use_smooth=True
                coords=[]
                for i in poly.vertices:
                    p=mesh.vertices[i].co-centre;r=max(.0001,p.length)
                    coords.append(((math.atan2(p.x,-p.y)/math.tau)%1,math.acos(max(-1,min(1,p.z/r)))/math.pi))
                crossing=max(u for u,v in coords)-min(u for u,v in coords)>.5
                for loop,(u,v) in zip(poly.loop_indices,coords):uv.data[loop].uv=(u+1 if crossing and u<.5 else u,v)
            return ob
        sides=48;rings=14;points=[tuple(scalp(0,0,.014)[0])];faces=[]
        for row in range(1,rings+1):
            for i in range(sides):
                az=i*math.tau/sides
                extent=1.06+.69*(1-math.cos(az))*.5+.12*math.sin(az)**2
                # Break the hairline without exposing disconnected scalp islands.
                extent+=.025*math.sin(az*7)+.012*math.sin(az*11)
                extent-=.11*math.sin(az)**4
                theta=row/rings*extent
                point,_=scalp(theta,az,.022*max(0,math.cos(theta)))
                points.append(tuple(point))
        for i in range(sides):faces.append((0,1+i,1+(i+1)%sides))
        for row in range(rings-1):
            for i in range(sides):
                a=1+row*sides+i;b=1+row*sides+(i+1)%sides;faces.append((a,a+sides,b+sides,b))
        cap=hair_mesh('Hair fitted short undercut',points,faces)
        solid=cap.modifiers.new('Closed hairline','SOLIDIFY');solid.thickness=.004
        def groom(name,start,end,az,sweep,width,lift):
            steps=12;cross=8;centres=[];normals=[]
            for i in range(steps+1):
                t=i/steps;theta=start+(end-start)*t
                point,normal=scalp(theta,az+sweep*t,lift*math.sin(math.pi*t)**.8)
                centres.append(point);normals.append(normal)
            points=[];faces=[]
            for i,(point,normal) in enumerate(zip(centres,normals)):
                t=i/steps
                tangent=(centres[min(i+1,steps)]-centres[max(0,i-1)]).normalized()
                across=tangent.cross(normal).normalized()
                # Wide soft middle, buried root and tapered end; no round cables.
                w=width*(.35+.8*math.sin(math.pi*t))*(1-t**5)+.0004
                for j in range(cross):
                    angle=j*math.tau/cross
                    points.append(tuple(point+across*(w*math.cos(angle))+normal*(w*.22*math.sin(angle))))
            for i in range(steps):
                for j in range(cross):
                    a=i*cross+j;b=i*cross+(j+1)%cross;faces.append((a,b,b+cross,a+cross))
            faces.extend([tuple(reversed(range(cross))),tuple(steps*cross+j for j in range(cross))])
            hair_mesh(name,points,faces)
        # Unequal groups follow a side part, with lifted crown and staggered tips.
        for i,(az,end,width,lift,sweep) in enumerate([
            (-1.18,1.18,.032,.027,.32),(-.91,1.04,.037,.037,.48),
            (-.61,1.13,.039,.043,.57),(-.29,1.00,.036,.040,.65),
            (.05,1.16,.028,.030,.55),(.43,1.08,.024,.022,-.10),
            (.73,1.19,.027,.021,-.16),(.99,1.10,.022,.017,-.12)]):
            groom('Hair swept top %02d'%i,.13+.041*(i%3),end,az,sweep,width,lift)
        for side in [-1,1]:
            for i in range(5):
                groom('Hair short side %s %s'%(side,i),.55,1.38+.12*i/4,side*(1.1+i*.36),side*.30,.025,.012)
        for i in range(3):
            groom('Hair broken crown %s'%i,.10,.95,2.3+i*.4,.22,.028,.025)
    else:
        # Keep each resident's bob, fringe, ponytail, bun or cap silhouette.
        # Fit only scalp-adjacent pieces; hanging hair is not projected flat.
        centre=Vector((0,0,.04))
        for ob in list(bpy.context.scene.objects):
            if ob.type!='MESH' or not ob.name.startswith('Hair'):continue
            if any(part in ob.name for part in ['ponytail','bun','tie']):continue
            for vertex in ob.data.vertices:
                point=ob.matrix_local@vertex.co;direction=(point-centre).normalized()
                hit=surface.ray_cast(centre+direction*2,-direction)[0]
                if hit is None:continue
                radius=1/math.sqrt((direction.x/.241)**2+(direction.y/.205)**2+(direction.z/.278)**2)
                relief=max(-.004,min(.045,(point-centre).length-radius))
                fitted=hit+direction*(.010+relief*.8)
                vertex.co=ob.matrix_local.inverted()@fitted
            ob.data.update()
    # Replace the native socket patch, rather than layering a second eyelid
    # over it. Reuse its exact boundary indices so normals and topology join.
    points=[tuple(v.co) for v in old.data.vertices];polys=[];old_uv=[];lid_targets={};lid_uv=[];lid_shade={}
    uv_source=old.data.uv_layers.active.data
    def in_socket(point,side):
        x,y,z=point
        return y<-.08 and ((x-side*.0785)/.055)**2+((z-.0344)/.037)**2<1
    for poly in old.data.polygons:
        centre=sum((old.data.vertices[i].co for i in poly.vertices),Vector())/len(poly.vertices)
        if any(in_socket(centre,side) for side in [-1,1]):continue
        polys.append(tuple(poly.vertices));old_uv.extend(tuple(uv_source[i].uv) for i in poly.loop_indices)
    edges={}
    for poly in polys:
        for a,b in zip(poly,poly[1:]+poly[:1]):
            key=tuple(sorted((a,b)));edges[key]=edges.get(key,0)+1
    for side in [-1,1]:
        cx=side*.0785;cz=.0344
        all_adjacency={}
        for (a,b),count in edges.items():
            if count==1:all_adjacency.setdefault(a,[]).append(b);all_adjacency.setdefault(b,[]).append(a)
        unseen=set(all_adjacency);components=[]
        while unseen:
            todo=[unseen.pop()];component=set(todo)
            while todo:
                for neighbour in all_adjacency[todo.pop()]:
                    if neighbour in unseen:unseen.remove(neighbour);component.add(neighbour);todo.append(neighbour)
            components.append(component)
        def distance(component):
            centre=sum((Vector(points[i]) for i in component),Vector())/len(component)
            return (centre.x-cx)**2+(centre.z-cz)**2+max(0,centre.y+.08)**2
        component=min(components,key=distance)
        adjacency={i:all_adjacency[i] for i in component}
        print('SOCKET_BOUNDARY',side,len(adjacency),[(min(points[i][axis] for i in component),max(points[i][axis] for i in component)) for axis in range(3)])
        assert adjacency and all(len(v)==2 for v in adjacency.values()),'Socket boundary is not a closed loop'
        first=next(iter(adjacency));loop=[first];prev=None;current=first
        while True:
            following=next(n for n in adjacency[current] if n!=prev)
            if following==first:break
            loop.append(following);prev,current=current,following
        assert len(loop)==len(adjacency),'Multiple socket boundary loops'
        # Increasing polar angle is outward-facing for the front (-Y) surface.
        area=sum((points[a][0]-cx)*(points[b][2]-cz)-(points[b][0]-cx)*(points[a][2]-cz) for a,b in zip(loop,loop[1:]+loop[:1]))
        if area<0:loop.reverse()
        rows=7;rings=[loop]
        lengths=[math.hypot(points[b][0]-points[a][0],points[b][2]-points[a][2]) for a,b in zip(loop,loop[1:]+loop[:1])]
        total=sum(lengths);distance=0;angles=[];start_angle=math.atan2(points[loop[0]][2]-cz,points[loop[0]][0]-cx)
        for length in lengths:
            angles.append(start_angle+math.tau*distance/total);distance+=length
        for row in range(1,rows+1):
            t=row/rows;blend=t*t*(3-2*t);ring=[]
            for boundary_id,theta in zip(loop,angles):
                outer=Vector(points[boundary_id]);upper=math.sin(theta)>=0
                inner=Vector((cx+.032*math.cos(theta),-.183+side*.32*.032*math.cos(theta),cz+(.012 if upper else .008)*math.sin(theta)))
                point=outer.lerp(inner,t);point.y=outer.y*(1-blend)+inner.y*blend;point=cover_eye(point)
                shut=inner.copy();shut.z=cz+(-.0002 if upper else .0002)
                target=outer.lerp(shut,t);target.y=outer.y*(1-blend)+shut.y*blend;target=cover_eye(target)
                index=len(points);points.append(tuple(point));lid_targets[index]=target;ring.append(index)
                lid_shade[index]=(.25 if upper else .08)*max(0,(t-.82)/.18)
            rings.append(ring)
        for row in range(rows):
            for i in range(len(loop)):
                j=(i+1)%len(loop)
                polys.append((rings[row][i],rings[row][j],rings[row+1][j],rings[row+1][i]))
                lid_uv.extend([(i/len(loop),row/rows),(j/len(loop),row/rows),(j/len(loop),(row+1)/rows),(i/len(loop),(row+1)/rows)])
    # Discard removed cavity vertices, preserving index correspondence of keys.
    used=sorted({i for poly in polys for i in poly});mapping={old:i for i,old in enumerate(used)}
    points=[points[i] for i in used];polys=[tuple(mapping[i] for i in poly) for poly in polys]
    lid_targets={mapping[i]:point for i,point in lid_targets.items() if i in mapping}
    lid_shade={mapping[i]:value for i,value in lid_shade.items() if i in mapping}
    rebuilt=bpy.data.meshes.new('Player head and curved eyelids');rebuilt.from_pydata(points,[],polys);rebuilt.update();rebuilt.materials.append(skin)
    uv=rebuilt.uv_layers.new(name='UVMap')
    for loop,value in zip(uv.data,old_uv+lid_uv):loop.uv=value
    for polygon in rebuilt.polygons:polygon.use_smooth=True
    old.data=rebuilt
    # Vertex tint follows native lip volume, rather than a second mouth shell.
    colors=old.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    base=tuple(skin.diffuse_color[:3])
    for loop in old.data.loops:
        x,y,z=old.data.vertices[loop.vertex_index].co
        lip=math.exp(-(x/.067)**4-((z+.109)/.020)**6)*max(0,min(1,(-y-.167)/.023))
        tint=(base[0]*.86,base[1]*.61,base[2]*.63)
        cheek=math.exp(-((abs(x)-.109)/.057)**2-((z+.033)/.054)**2)*max(0,min(1,(-y-.105)/.055))
        warm=(1.035,.92,.91)
        colors.data[loop.index].color=tuple((base[i]*(1-lip*.48)+tint[i]*lip*.48)*(1+cheek*(warm[i]-1))*(1-lid_shade.get(loop.vertex_index,0)) for i in range(3))+(1,)
    nodes=skin.node_tree.nodes;bs=nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.74
    vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='Color';skin.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color']);skin['atrium_surface_family']='skin'
    old.shape_key_add(name='Basis');blink=old.shape_key_add(name='Blink');talk=old.shape_key_add(name='Talk')
    for i,vertex in enumerate(old.data.vertices):
        x,y,z=vertex.co
        if i in lid_targets:blink.data[i].co=lid_targets[i]
        jaw=max(0,min(1,(-z-.109)/.010))*max(0,min(1,(-y+.02)/.09))
        talk.data[i].co.z-=.020*jaw;talk.data[i].co.y+=.004*jaw
    old.data.calc_loop_triangles();old['facial_triangles']=len(old.data.loop_triangles)
    return old
