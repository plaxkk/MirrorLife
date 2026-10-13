"""Editable quad garment cage: torso armholes share loops with authored sleeves."""
import bpy, bmesh, math, os, hashlib
from pathlib import Path

def build(civic, material, profile):
    old=bpy.data.objects['SkinnedArmVolume'];rig=old.parent
    vertices=[];faces=[];weights=[];sides=24
    # Height, half-width, half-depth: quiet chest volume and a falling shoulder.
    sections=[(.79,.174,.125),(.805,.177,.128),(.84,.185,.136),(.90,.188,.143),
              (.98,.195,.150),(1.045,.202,.151),(1.125,.211,.149),
              (1.16125,.216,.145),(1.1975,.217,.138),(1.23375,.213,.130),
              (1.27,.205,.119),(1.30,.150,.096),(1.325,.095,.073),(1.335,.084,.068)]
    def ease(t):
        t=max(0,min(1,t));return t*t*(3-2*t)
    def add(point, values):
        index=len(vertices);vertices.append(point);weights.append(values);return index
    def body_weight(x,z):
        a=ease((abs(x)-.12)/.18)*ease((z-1.02)/.15)
        return {'SkinRoot':1-a,'Skin'+('Left' if x<0 else 'Right')+'Arm':a}
    grid=[]
    for z,rx,ry in sections:
        row=[]
        for j in range(sides):
            angle=j*math.tau/sides;x=rx*math.cos(angle);y=ry*math.sin(angle)
            row.append(add((x,y,z),body_weight(x,z)))
        grid.append(row)
    low,high,half=6,10,3
    holes={j%sides for centre in (0,sides//2) for j in range(centre-half,centre+half)}
    for row in range(len(grid)-1):
        for j in range(sides):
            if low<=row<high and j in holes:continue
            k=(j+1)%sides;faces.append((grid[row][j],grid[row][k],grid[row+1][k],grid[row+1][j]))
    faces.extend([tuple(reversed(grid[0])),tuple(grid[-1])])
    width,depth=profile['arm_width'],profile['arm_depth'];shoulder=profile['shoulder_x']
    for side,centre in ((1,0),(-1,sides//2)):
        def at(row,j):return grid[row][j%sides]
        start,end=centre-half,centre+half
        loop=[at(low,j) for j in range(start,end+1)]
        loop += [at(row,end) for row in range(low+1,high+1)]
        loop += [at(high,j) for j in range(end-1,start-1,-1)]
        loop += [at(row,start) for row in range(high-1,low,-1)]
        assert len(loop)==20 and len(set(loop))==20
        phases=[math.atan2((vertices[i][2]-1.18)/.09,vertices[i][1]/.10) for i in loop]
        # x centre, z, section radii, y centre, section-plane tilt, arm ownership.
        sleeve=[(shoulder-.005,1.195,.068,.078,0,math.pi/4,.82),
                (shoulder+.005,1.115,.080,.076,-.004,0,1),
                (shoulder+.003,1.035,.079,.073,-.008,0,1),
                (shoulder,1.005,.073,.068,-.006,0,1),
                (shoulder,.982,.069,.065,-.004,0,1),
                (shoulder,.945,.071,.067,-.002,0,1),
                (shoulder,.895,.073,.068,.001,0,1),
                (shoulder,.83,.069,.064,.003,0,1),
                (shoulder,.76,.061,.057,.004,0,1),
                (shoulder,.705,.053,.049,.002,0,1)]
        label='Right' if side>0 else 'Left'
        for cx,z,rx,ry,cy,tilt,arm in sleeve:
            next_loop=[];elbow=ease((1.1-z)/.21)
            for phase in phases:
                along=rx*width*math.sin(phase)
                point=(side*(cx+along*math.cos(tilt)),cy+ry*depth*math.cos(phase),z+along*math.sin(tilt))
                values={'SkinRoot':1-arm,'Skin'+label+'Arm':arm*(1-elbow),'Skin'+label+'Elbow':arm*elbow}
                next_loop.append(add(point,values))
            for i in range(len(loop)):
                j=(i+1)%len(loop);faces.append((loop[i],loop[j],next_loop[j],next_loop[i]))
            loop=next_loop
        faces.append(tuple(reversed(loop)))
    mesh=bpy.data.meshes.new('Authored torso and sleeve quad panels');mesh.from_pydata(vertices,[],faces);mesh.update();mesh.materials.append(material)
    ob=bpy.data.objects.new('Garment panel cage',mesh);bpy.context.collection.objects.link(ob);ob.parent=rig
    groups={name:ob.vertex_groups.new(name=name) for name in ['SkinRoot','SkinLeftArm','SkinLeftElbow','SkinRightArm','SkinRightElbow']}
    for i,row in enumerate(weights):
        for name,value in row.items():
            if value>0:groups[name].add([i],value,'REPLACE')
    input_file=os.environ.get('ATRIUM_PANEL_CAGE_INPUT')
    if input_file:
        input_path=Path(input_file).resolve()
        output_path=Path(os.environ['ATRIUM_BUILD_ROOT']).resolve()/'models/atrium/residents/lin-garment-cage.blend'
        assert input_path!=output_path, 'Never overwrite the edited input cage'
        before_objects=set(bpy.data.objects)
        with bpy.data.libraries.load(str(input_path),link=False) as (available,loaded):
            assert 'Garment panel cage' in available.objects
            loaded.objects=['Garment panel cage']
        imported=loaded.objects[0]
        assert imported.type=='MESH' and imported.parent and imported.parent.type=='ARMATURE'
        assert not imported.data.shape_keys, 'Apply cage shape keys before import'
        assert imported.parent.matrix_basis==rig.matrix_basis, 'Edited cage changed the rig object transform'
        assert imported.matrix_basis==ob.matrix_basis, 'Apply object transforms before importing the cage'
        expected={b.name:tuple(tuple(row) for row in b.matrix_local) for b in rig.data.bones}
        actual={b.name:tuple(tuple(row) for row in b.matrix_local) for b in imported.parent.data.bones}
        assert actual==expected, 'Edited cage changed the bind skeleton'
        assert {g.name for g in imported.vertex_groups}==set(groups), 'Edited cage has unsupported vertex groups'
        source_coordinates=[tuple(v.co) for v in imported.data.vertices]
        source_faces=[tuple(p.vertices) for p in imported.data.polygons]
        source_weights=[[(g.group,g.weight) for g in v.groups] for v in imported.data.vertices]
        ob.data=imported.data.copy();mesh=ob.data
        ob.vertex_groups.clear()
        for group in imported.vertex_groups:ob.vertex_groups.new(name=group.name)
        for index,row in enumerate(source_weights):
            for group,weight in row:ob.vertex_groups[group].add([index],weight,'REPLACE')
        assert [[(g.group,g.weight) for g in v.groups] for v in mesh.vertices]==source_weights
        mesh.materials.clear();mesh.materials.append(material)
        for face in mesh.polygons:face.material_index=0
        assert [tuple(v.co) for v in mesh.vertices]==source_coordinates
        assert [tuple(p.vertices) for p in mesh.polygons]==source_faces
        rig.parent['atrium_panel_input']={'file':str(input_path),'sha256':hashlib.sha256(input_path.read_bytes()).hexdigest(),
            'vertices':len(source_coordinates),'faces':len(source_faces),'coordinatesExactOnImport':True,'facesExactOnImport':True,'bindSkeletonExact':True,'weightsExactOnImport':True}
        for imported_object in set(bpy.data.objects)-before_objects:bpy.data.objects.remove(imported_object,do_unlink=True)
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();mesh.update()
    for p in mesh.polygons:p.use_smooth=True
    mod=ob.modifiers.new('Panel garment skin','ARMATURE');mod.object=rig
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
    audit=bmesh.new();audit.from_mesh(mesh);bad=sum(not e.is_manifold for e in audit.edges);audit.free()
    mesh.calc_loop_triangles()
    adjacent=[set() for _ in mesh.vertices]
    for edge in mesh.edges:
        a,b=edge.vertices;adjacent[a].add(b);adjacent[b].add(a)
    remaining=set(range(len(mesh.vertices)));components=0
    while remaining:
        components+=1;todo=[remaining.pop()]
        while todo:
            for other in adjacent[todo.pop()]:
                if other in remaining:remaining.remove(other);todo.append(other)
    report={'contract':'authored-quad-panels-v1','components':components,'nonManifoldEdges':bad,'triangles':len(mesh.loop_triangles),'quads':sum(len(p.vertices)==4 for p in mesh.polygons),'weightError':max(abs(sum(g.weight for g in v.groups)-1) for v in mesh.vertices)}
    assert not bad and components==1 and report['weightError']<.0001,report
    # Independent editable cage survives the later game batch triangulation.
    cage=Path(os.environ['ATRIUM_BUILD_ROOT'])/'models/atrium/residents/lin-garment-cage.blend';cage.parent.mkdir(parents=True,exist_ok=True)
    ob['panel_cage_contract']='Shared torso/sleeve boundary loops; no voxel remesh or triangle decimation'
    editing_scene=bpy.data.scenes.new('Garment cage editing')
    editing_scene.collection.objects.link(ob)
    ancestor=rig
    while ancestor:
        if ancestor.name not in editing_scene.objects:editing_scene.collection.objects.link(ancestor)
        ancestor=ancestor.parent
    bpy.data.libraries.write(str(cage),{editing_scene},fake_user=True)
    bpy.data.scenes.remove(editing_scene)
    if os.environ.get('ATRIUM_GARMENT_PANELS')=='2':
        # Smooth the authored cage before export reduction. The editable quad
        # source remains separately saved, never reconstructed from triangles.
        smooth=ob.modifiers.new('Quad panel surface preview','SUBSURF');smooth.levels=1
        bpy.ops.object.modifier_move_up(modifier=smooth.name);bpy.ops.object.modifier_apply(modifier=smooth.name)
        if os.environ.get('ATRIUM_DIALOGUE_FINISH','1')=='1':
            import runpy
            runpy.run_path(str(Path(__file__).with_name('atrium-dialogue-finish.py')))['cloth'](ob)
        ob.data.calc_loop_triangles()
        lod=ob.modifiers.new('Panel runtime allocation','DECIMATE');lod.ratio=min(1,2000/len(ob.data.loop_triangles))
        bpy.ops.object.modifier_move_up(modifier=lod.name);bpy.ops.object.modifier_apply(modifier=lod.name)
        ob.data.calc_loop_triangles()
        audit=bmesh.new();audit.from_mesh(ob.data)
        bad=sum(not e.is_manifold for e in audit.edges);audit.free()
        report={**report,'contract':'authored-quad-panels-v2','sourceCageQuads':report['quads'],'triangles':len(ob.data.loop_triangles),'nonManifoldEdges':bad,
                'weightError':max(abs(sum(g.weight for g in v.groups)-1) for v in ob.data.vertices)}
        assert bad==0 and report['triangles']<=2000 and report['weightError']<.0001,report
    for source in (old,bpy.data.objects['Torso']):bpy.data.objects.remove(source,do_unlink=True)
    ob.name='SkinnedArmVolume';ob['garment_contract']=report['contract'];rig.parent['atrium_garment']=report
    return ob
