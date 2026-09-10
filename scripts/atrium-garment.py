"""Continuous shoulder garment authored in Blender; no runtime replacement rig."""
import bpy, math
from mathutils.bvhtree import BVHTree

def continuous_garment(civic, material):
    torso=bpy.data.objects['Torso'];arms=bpy.data.objects['SkinnedArmVolume'];rig=arms.parent
    bpy.context.view_layer.update()
    inv=rig.matrix_world.inverted();deps=bpy.context.evaluated_depsgraph_get()
    vertices=[];faces=[];surfaces=[]
    for source in [torso,arms]:
        # Rig is still in bind pose. Convert both meshes into the rig's metre space.
        evaluated=source.evaluated_get(deps);mesh=evaluated.to_mesh();transform=inv@source.matrix_world
        points=[transform@v.co for v in mesh.vertices];polygons=[tuple(p.vertices) for p in mesh.polygons]
        surfaces.append(BVHTree.FromPolygons(points,polygons))
        base=len(vertices);vertices.extend(points);faces.extend(tuple(base+i for i in p) for p in polygons)
        evaluated.to_mesh_clear()
    mesh=bpy.data.meshes.new('Continuous jacket construction');mesh.from_pydata(vertices,[],faces);mesh.update()
    garment=bpy.data.objects.new('Continuous jacket construction',mesh);bpy.context.collection.objects.link(garment);garment.parent=rig
    bpy.ops.object.select_all(action='DESELECT');garment.select_set(True);bpy.context.view_layer.objects.active=garment
    union=garment.modifiers.new('Joined shoulder and underarm volume','REMESH');union.mode='VOXEL';union.voxel_size=.007;union.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=union.name)
    smooth=garment.modifiers.new('Relax shoulder fabric','SMOOTH');smooth.factor=.8;smooth.iterations=4;bpy.ops.object.modifier_apply(modifier=smooth.name)
    garment.data.calc_loop_triangles()
    lod=garment.modifiers.new('Garment topology budget','DECIMATE');lod.ratio=min(1,1700/len(garment.data.loop_triangles));bpy.ops.object.modifier_apply(modifier=lod.name)
    for polygon in garment.data.polygons:polygon.use_smooth=True
    garment.data.materials.append(material)
    groups={name:garment.vertex_groups.new(name=name) for name in ['SkinRoot','SkinLeftArm','SkinLeftElbow','SkinRightArm','SkinRightElbow']}
    def ease(v):
        v=max(0,min(1,v));return v*v*(3-2*v)
    for vertex in garment.data.vertices:
        p=vertex.co;dt=surfaces[0].find_nearest(p)[3];da=surfaces[1].find_nearest(p)[3]
        arm=ease(.5+(dt-da)/.055);lower=ease((1.1-p.z)/.21)
        side='Left' if p.x<0 else 'Right'
        for bone,weight in [('SkinRoot',1-arm),('Skin'+side+'Arm',arm*(1-lower)),('Skin'+side+'Elbow',arm*lower)]:
            if weight>.00001:groups[bone].add([vertex.index],weight,'REPLACE')
    modifier=garment.modifiers.new('Continuous jacket skin','ARMATURE');modifier.object=rig
    # UVs remain editable even though this vertex-colour garment has no bitmap dependency.
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
    bpy.data.objects.remove(torso,do_unlink=True);bpy.data.objects.remove(arms,do_unlink=True)
    garment.name='SkinnedArmVolume'
    garment['garment_contract']='atrium-continuous-shoulder-v1'
    garment['construction']='voxel union, relaxation, triangle decimation; torso/arm distance-field weights'
    garment['triangle_budget']=1700
    edges={};adj=[set() for _ in garment.data.vertices]
    for polygon in garment.data.polygons:
        ids=list(polygon.vertices)
        for a,b in zip(ids,ids[1:]+ids[:1]):
            key=tuple(sorted((a,b)));edges[key]=edges.get(key,0)+1;adj[a].add(b);adj[b].add(a)
    unseen=set(range(len(adj)));components=0
    while unseen:
        components+=1;todo=[unseen.pop()]
        while todo:
            for neighbour in adj[todo.pop()]:
                if neighbour in unseen:unseen.remove(neighbour);todo.append(neighbour)
    garment.data.calc_loop_triangles()
    report={'contract':'atrium-continuous-shoulder-v1','components':components,'nonManifoldEdges':sum(n!=2 for n in edges.values()),'triangles':len(garment.data.loop_triangles),'weightError':max(abs(sum(g.weight for g in v.groups)-1) for v in garment.data.vertices)}
    assert report['components']==1 and report['nonManifoldEdges']==0,report
    assert report['weightError']<.0001,report
    rig.parent['atrium_garment']=report
    return garment
