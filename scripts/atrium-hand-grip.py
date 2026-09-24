"""Editable grip target on the fused core; opt-in art candidate only."""
import math,os
import bpy
from mathutils import Vector

def author(core):
    assert not core.data.shape_keys, 'Do not replace existing body expressions'
    core.shape_key_add(name='Basis')
    key=core.shape_key_add(name='GripRight')
    hand=bpy.data.objects['Hand_1']
    bpy.context.view_layer.update()
    local=hand.matrix_world.inverted()@core.matrix_world
    inverse=local.inverted()
    group=core.vertex_groups['SkinRightHand'].index
    joint_pose=None
    if os.environ.get('ATRIUM_FINGER_JOINT_STUDY','0')=='1':
        import runpy
        from pathlib import Path
        joint_pose=runpy.run_path(str(Path(__file__).with_name('atrium-finger-joints.py')))['prepare'](hand)
    changed=0
    for v in core.data.vertices:
        if not any(g.group==group and g.weight>.999 for g in v.groups):continue
        p=local@v.co;q=p.copy()
        # Continuous circular flexion beyond the knuckle plane. Preserve root
        # position and tangent, and rotate the cross-section with the centerline.
        length=max(0,-.027-p.z)
        if length:
            radius=.025;angle=min(2.35,length/radius)
            depth=p.y-(-.009-.32*length)
            q.z=-.027-radius*math.sin(angle)-depth*math.sin(angle)
            q.y=-.009-radius*(1-math.cos(angle))+depth*math.cos(angle)
            if os.environ.get('ATRIUM_GRIP_TIP_STUDY','0')=='1':
                # After the angular cap, continue along its tangent. Discarding
                # this length collapses the distal volume into a cross-section.
                excess=max(0,length-radius*2.35)
                q.z-=excess*math.cos(angle)
                q.y-=excess*math.sin(angle)
            # A hard x cutoff created a crease through connected thumb-web
            # triangles. Blend the displacement across the complete web width.
            weight=min(1,max(0,(p.x+.060)/.025))
            weight=weight*weight*(3-2*weight)
            q=p.lerp(q,weight)
        # Bring the thumb pad inward; independent from the four curled digits.
        if joint_pose:q=joint_pose(p)
        if not joint_pose and p.x<-.042:
            if os.environ.get('ATRIUM_THUMB_FLOW_STUDY','0')=='1':
                # The one-shot offset has dx'/dx as low as -0.32, reversing
                # the web. Re-evaluate the same velocity field in small steps:
                # each x map has derivative >= 1-1.32/32 > 0.
                for _ in range(32):
                    weight=min(1,max(0,(-q.x-.042)/.025))
                    weight=weight*weight*(3-2*weight)
                    q.x+=.022*weight/32;q.y-=.012*weight/32
            else:
                weight=min(1,max(0,(-p.x-.042)/.025))
                weight=weight*weight*(3-2*weight)
                q.x+=.022*weight;q.y-=.012*weight
        key.data[v.index].co=inverse@q
        changed+=(q-p).length>1e-7
    assert changed>100, 'Grip target missing right-hand vertices'
    core['atrium_grip_study']={'target':'GripRight','changedVertices':changed,'status':'candidate; requires multi-view contact review'}
    key.value=0
    if os.environ.get('ATRIUM_TEA_GRIP_STUDY','0')=='1':
        # The cup's vertical handle segment must span the finger bank, unlike
        # the watering can's transverse handle. Rotate the palm, compensating
        # the prop frame so the cup keeps its existing upright orientation.
        original=bpy.data.objects['HandGripAnchor_1']
        handle_axis=original.rotation_euler.to_quaternion()@Vector((0,0,1))
        turn=Vector((1,0,0)).rotation_difference(handle_axis)
        wrist=bpy.data.objects.new('TeaWristOffset_1',None)
        bpy.context.collection.objects.link(wrist);wrist.parent=hand
        wrist.rotation_mode='QUATERNION';wrist.rotation_quaternion=turn
        anchor=bpy.data.objects.new('TeaGripAnchor_1',None)
        bpy.context.collection.objects.link(anchor);anchor.parent=hand
        anchor.location=(0,-.044,-.049)
        anchor.rotation_mode='QUATERNION'
        anchor.rotation_quaternion=turn.inverted()@original.rotation_euler.to_quaternion()
        anchor['contract']='tea-side-grip-study-v1; compensate wrist roll'
        if os.environ.get('ATRIUM_TEA_FINGER_FIT','0')=='1':
            import runpy
            from pathlib import Path
            runpy.run_path(str(Path(__file__).with_name('atrium-tea-finger-fit.py')))['author'](core,hand,anchor)
