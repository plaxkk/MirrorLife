"""Two-bone cervical transition, with the native face and morphs unchanged."""
import bpy
from mathutils import Vector, Matrix


def author_neck_rig():
    head=bpy.data.objects['Head'];controller=bpy.data.objects['HeadPivot']
    bpy.context.view_layer.update();world=head.matrix_world.copy()
    data=bpy.data.armatures.new('Cervical transition bones')
    rig=bpy.data.objects.new('CervicalRig',data);bpy.context.collection.objects.link(rig)
    rig.parent=controller.parent
    position,rotation,_=controller.matrix_world.decompose()
    rig.matrix_world=Matrix.LocRotScale(position,rotation,Vector((1,1,1)))
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for name in ['SkinNeckAnchor','SkinNeckHead']:
        bone=data.edit_bones.new(name);bone.head=(0,0,0);bone.tail=(0,.1,0)
    bpy.ops.object.mode_set(mode='OBJECT')
    for kind in ['COPY_LOCATION','COPY_ROTATION']:
        constraint=rig.pose.bones['SkinNeckHead'].constraints.new(kind)
        constraint.target=controller;constraint.owner_space='WORLD';constraint.target_space='WORLD'
    head.parent=rig;head.matrix_world=world
    anchor=head.vertex_groups.new(name='SkinNeckAnchor');moving=head.vertex_groups.new(name='SkinNeckHead')
    counts={'anchor':0,'blend':0,'head':0}
    for vertex in head.data.vertices:
        z=(world@vertex.co).z
        t=max(0,min(1,(z-1.32)/.09));weight=t*t*(3-2*t)
        anchor.add([vertex.index],1-weight,'REPLACE');moving.add([vertex.index],weight,'REPLACE')
        counts['anchor' if weight==0 else 'head' if weight==1 else 'blend']+=1
    assert min(counts.values())>0, 'Cervical weight zones must all be populated'
    modifier=head.modifiers.new('Continuous cervical skin','ARMATURE');modifier.object=rig
    bpy.context.view_layer.update()
    evaluated=head.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
    error=max((world@v.co-evaluated.matrix_world@mesh.vertices[v.index].co).length for v in head.data.vertices)
    evaluated.to_mesh_clear();assert error<1e-5, 'Neck skin changed rest shape: '+str(error)
    head['cervical_skin']={'zones':counts,'restError':error,'fixedBelow':1.32,'headAbove':1.41}
    return rig
