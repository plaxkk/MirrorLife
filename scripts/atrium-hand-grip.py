"""Editable grip target on the fused core; opt-in art candidate only."""
import math
import bpy

def author(core):
    assert not core.data.shape_keys, 'Do not replace existing body expressions'
    core.shape_key_add(name='Basis')
    key=core.shape_key_add(name='GripRight')
    hand=bpy.data.objects['Hand_1']
    bpy.context.view_layer.update()
    local=hand.matrix_world.inverted()@core.matrix_world
    inverse=local.inverted()
    group=core.vertex_groups['SkinRightHand'].index
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
            # A hard x cutoff created a crease through connected thumb-web
            # triangles. Blend the displacement across the complete web width.
            weight=min(1,max(0,(p.x+.060)/.025))
            weight=weight*weight*(3-2*weight)
            q=p.lerp(q,weight)
        # Bring the thumb pad inward; independent from the four curled digits.
        if p.x<-.042:
            weight=min(1,max(0,(-p.x-.042)/.025))
            weight=weight*weight*(3-2*weight)
            q.x+=.022*weight;q.y-=.012*weight
        key.data[v.index].co=inverse@q
        changed+=(q-p).length>1e-7
    assert changed>100, 'Grip target missing right-hand vertices'
    core['atrium_grip_study']={'target':'GripRight','changedVertices':changed,'status':'candidate; requires multi-view contact review'}
    key.value=0
