"""Editable continuous hands and shaped sneaker soles for the atrium cast."""
import bpy, bmesh, math
from mathutils import Vector

def descendants(root):
    return [ob for ob in root.children_recursive if ob.type in {'MESH','CURVE'}]

def hands():
    for side in [-1,1]:
        root=bpy.data.objects['Hand_'+str(side)]
        bpy.context.view_layer.update();inv=root.matrix_world.inverted();deps=bpy.context.evaluated_depsgraph_get()
        sources=[ob for ob in descendants(root) if ob.name.startswith((root.name+'Palm','HandWebSurface_','FingerVolume_','ThumbVolume_','FingerCrease_','ThumbCrease_','PalmLifeLine_','PalmHeartLine_'))];points=[];faces=[];material=None
        for ob in sources:
            if ob.type!='MESH' or any(word in ob.name for word in ['Crease','Line']):continue
            material=material or ob.data.materials[0]
            evaluated=ob.evaluated_get(deps);mesh=evaluated.to_mesh();matrix=inv@ob.matrix_world
            offset=len(points)
            for vertex in mesh.vertices:
                point=matrix@vertex.co;point.y*=.82;points.append(tuple(point))
            faces.extend(tuple(offset+i for i in poly.vertices) for poly in mesh.polygons)
            evaluated.to_mesh_clear()
        mesh=bpy.data.meshes.new('Continuous palm and five digits');mesh.from_pydata(points,[],faces);mesh.update();mesh.materials.append(material)
        ob=bpy.data.objects.new('ContinuousHand_'+str(side),mesh);bpy.context.collection.objects.link(ob);ob.parent=root
        bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
        remesh=ob.modifiers.new('Fuse palm and finger roots','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.0025;remesh.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=remesh.name)
        smooth=ob.modifiers.new('Relax knuckle transitions','SMOOTH');smooth.factor=.55;smooth.iterations=4;bpy.ops.object.modifier_apply(modifier=smooth.name)
        ob.data.calc_loop_triangles();dec=ob.modifiers.new('Hand topology allocation','DECIMATE');dec.ratio=min(1,900/len(ob.data.loop_triangles));bpy.ops.object.modifier_apply(modifier=dec.name)
        for poly in ob.data.polygons:poly.use_smooth=True
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.012);bpy.ops.object.mode_set(mode='OBJECT')
        for source in sources:bpy.data.objects.remove(source,do_unlink=True)
        audit=bmesh.new();audit.from_mesh(ob.data)
        unseen=set(audit.verts);components=0;islands=[];slivers=[]
        while unseen:
            components+=1;todo=[unseen.pop()];island=set(todo)
            while todo:
                for edge in todo.pop().link_edges:
                    for vertex in edge.verts:
                        if vertex in unseen:unseen.remove(vertex);todo.append(vertex);island.add(vertex)
            if len(island)<=4 and max(max(v.co[i] for v in island)-min(v.co[i] for v in island) for i in range(3))<.001:
                slivers.extend(island);components-=1
            islands.append({'vertices':len(island),'bounds':[(min(v.co[i] for v in island),max(v.co[i] for v in island)) for i in range(3)]})
        removed=len(slivers)
        if slivers:bmesh.ops.delete(audit,geom=slivers,context='VERTS');audit.to_mesh(ob.data)
        if components>1:print('HAND_ISLANDS',root.name,islands,flush=True)
        nonmanifold=sum(not edge.is_manifold for edge in audit.edges);audit.free()
        ob.data.calc_loop_triangles()
        root['hand_surface_audit']={'components':components,'nonManifoldEdges':nonmanifold,'triangles':len(ob.data.loop_triangles),'removedSubmillimetreSliverVertices':removed}
        assert components==1 and nonmanifold==0,dict(root['hand_surface_audit'])
        root['hand_continuity_contract']='atrium-fused-palm-v1'
        root['construction']='Five original digits fused at roots; wrist rig and contact anchors retained'

def shoes(civic,mats):
    for side in [-1,1]:
        prefix='ShoeUpper_'+str(side);root=bpy.data.objects[prefix+'Pivot']
        # Rounded sole follows the last in plan view, with the original ground
        # contact height. The square bumper and side plate are removed.
        for suffix in ['Sole','Midsole','ToeBumper','OuterQuarterPanel','ToeCapSeam']:
            ob=bpy.data.objects.get(prefix+suffix)
            if ob:bpy.data.objects.remove(ob,do_unlink=True)
        points=[];faces=[];sides=48
        for z,scale in [(-.061,.91),(-.057,1),(-.037,1),(-.031,.93)]:
            for i in range(sides):
                a=i*math.tau/sides
                y=-.067+.158*math.cos(a)
                width=.080*(1-.19*max(0,math.cos(a)))
                points.append((width*math.copysign(abs(math.sin(a))**.55,math.sin(a))*scale,-.067+(y+.067)*scale,z))
        for row in range(3):
            for i in range(sides):
                a=row*sides+i;b=row*sides+(i+1)%sides;faces.append((a,b,b+sides,a+sides))
        faces.extend([tuple(reversed(range(sides))),tuple(3*sides+i for i in range(sides))])
        faces=[tuple(reversed(face)) for face in faces]
        mesh=bpy.data.meshes.new(prefix+'ShapedSoleMesh');mesh.from_pydata(points,[],faces);mesh.update();mesh.materials.append(mats['sole'])
        ob=bpy.data.objects.new(prefix+'ShapedSole',mesh);bpy.context.collection.objects.link(ob);ob.parent=root
        for poly in mesh.polygons:poly.use_smooth=len(poly.vertices)==4
        bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.012);bpy.ops.object.mode_set(mode='OBJECT')
        # A narrow welt visually separates textile upper from the rubber sole.
        civic.curve_tube(prefix+'FlexibleWelt',[(points[3*sides+i%sides][0],points[3*sides+i%sides][1],-.030) for i in range(49)],.002,mats['sole'],root,resolution=1)
        # Shorten and narrow the complete shoe in its own local frame, keeping
        # ankle pivots and minimum Z unchanged for existing planted-foot IK.
        root.scale.x*=.88;root.scale.y*=.88
        root['sole_contract']='atrium-shaped-last-v1; unchanged minimum Z'
