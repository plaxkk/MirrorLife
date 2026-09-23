"""Editable tea-only pad correction against the authored cup-handle surface."""
import bpy
from pathlib import Path
from mathutils import Matrix,Vector
from mathutils.bvhtree import BVHTree

def author(core,hand,anchor):
    root=Path(__file__).resolve().parents[1]
    with bpy.data.libraries.load(str(root/'models/atrium/life-props.blend'),link=False) as (source,target):
        target.objects=['TeaCup','TeaCupGrip','Cup handle']
    loaded=[ob for ob in target.objects if ob]
    assert len(loaded)==3
    for ob in loaded:bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.update()
    handle=next(ob for ob in loaded if ob.type=='CURVE')
    grip=next(ob for ob in loaded if ob.name.startswith('TeaCupGrip'))
    # Same rigid target construction as alignAtriumProp: inherited nonuniform
    # scale moves the anchor but must not resize the metre-authored prop.
    wrist=bpy.data.objects['TeaWristOffset_1']
    fitted_hand=hand.matrix_world@wrist.rotation_quaternion.to_matrix().to_4x4()
    position,rotation,scale=(fitted_hand@anchor.matrix_local).decompose()
    rotation.normalize()
    prop=Matrix.LocRotScale(position,rotation,Vector((1,1,1)))@grip.matrix_local.inverted()
    transform=fitted_hand.inverted()@prop@handle.matrix_local
    evaluated=handle.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
    tree=BVHTree.FromPolygons([transform@v.co for v in mesh.vertices],[tuple(p.vertices) for p in mesh.polygons])
    evaluated.to_mesh_clear()
    local=hand.matrix_world.inverted()@core.matrix_world;inverse=local.inverted()
    base=core.data.shape_keys.key_blocks['GripRight']
    tea=core.shape_key_add(name='GripTea');group=core.vertex_groups['SkinRightHand'].index
    points=[local@v.co for v in base.data];deltas={};adjacent={i:set() for i in range(len(points))}
    for edge in core.data.edges:
        a,b=edge.vertices;adjacent[a].add(b);adjacent[b].add(a)
    ids={v.index for v in core.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)}
    def correction(point):
        nearest,normal,face,distance=tree.find_nearest(point)
        signed=(point-nearest).dot(normal)
        return normal*(.0008-signed) if signed<.0008 and distance<.015 else Vector((0,0,0))
    for i in ids:
        delta=correction(points[i])
        if delta.length>1e-7:deltas[i]=delta
    initial=len(deltas)
    # Spread pad displacement to one neighbour ring, then restore the explicit
    # surface clearance. This is a source sculpt aid, never runtime snapping.
    affected=set(deltas)|{j for i in deltas for j in adjacent[i] if j in ids}
    for _ in range(2):
        smooth={i:deltas.get(i,Vector())*.6+sum((deltas.get(j,Vector()) for j in adjacent[i]),Vector())*(.4/max(1,len(adjacent[i]))) for i in affected}
        deltas={i:d+correction(points[i]+d) for i,d in smooth.items()}
    maximum=max((d.length for d in deltas.values()),default=0)
    assert initial>0 and maximum<.018, 'Unexpected tea-pad correction extent'
    for i,p in enumerate(points):tea.data[i].co=inverse@(p+deltas[i]) if i in deltas else base.data[i].co
    tea.value=0
    core['atrium_tea_fit']={'initialVertices':initial,'affectedVertices':len(affected),'maxDisplacement':maximum,'clearance':.0008,'scope':'nearest-normal source pad fit; not complete collision approval'}
    for ob in loaded:bpy.data.objects.remove(ob,do_unlink=True)
