"""Editable tea-only pad correction against the authored cup-handle surface."""
import bpy,os
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
    if os.environ.get('ATRIUM_TEA_ARC_STUDY','0')=='1':
        basis=core.data.shape_keys.key_blocks['Basis']
        middle=[local@((a.co+b.co)*.5) for a,b in zip(basis.data,tea.data)]
        offsets={i:correction(middle[i]) for i in ids}
        offsets={i:d for i,d in offsets.items() if d.length>1e-7}
        arc_ids=set(offsets)|{j for i in offsets for j in adjacent[i] if j in ids}
        for _ in range(2):
            smooth={i:offsets.get(i,Vector())*.6+sum((offsets.get(j,Vector()) for j in adjacent[i]),Vector())*(.4/max(1,len(adjacent[i]))) for i in arc_ids}
            offsets={i:d+correction(middle[i]+d) for i,d in smooth.items()}
        arc=core.shape_key_add(name='GripTeaArc')
        for i,v in enumerate(basis.data):
            arc.data[i].co=v.co+inverse.to_3x3()@offsets[i] if i in offsets else v.co
        arc.value=0
        core['atrium_tea_arc']={'vertices':len(offsets),'maxDisplacement':max(d.length for d in offsets.values()),'weight':'4 * teaWeight * (1 - teaWeight)','scope':'additive halfway pad correction; trajectory needs runtime verification'}
        if os.environ.get('ATRIUM_TEA_PHASE_STUDY','0')=='1':
            phases=[]
            for name,weight in [('GripTeaOpen',0),('GripTeaQuarter',.25),('GripTeaHalf',.5),('GripTeaLate',.75)]:
                coordinates=[a.co.lerp(b.co,weight) for a,b in zip(basis.data,tea.data)]
                for i,d in offsets.items():coordinates[i]+=inverse.to_3x3()@d*(4*weight*(1-weight))
                samples=[local@p for p in coordinates]
                pad={i:correction(samples[i]) for i in ids}
                pad={i:d for i,d in pad.items() if d.length>1e-7}
                affected=set(pad)|{j for i in pad for j in adjacent[i] if j in ids}
                for _ in range(2):
                    smooth={i:pad.get(i,Vector())*.6+sum((pad.get(j,Vector()) for j in adjacent[i]),Vector())*(.4/max(1,len(adjacent[i]))) for i in affected}
                    pad={i:d+correction(samples[i]+d) for i,d in smooth.items()}
                pose=core.shape_key_add(name=name)
                for i,v in enumerate(basis.data):pose.data[i].co=coordinates[i]+inverse.to_3x3()@pad.get(i,Vector()) if i in ids else v.co
                pose.value=0;phases.append({'name':name,'closure':weight,'padVertices':len(pad)})
            core.shape_key_remove(arc)
            core['atrium_tea_phases']={'poses':phases,'interpolation':'adjacent authored poses; runtime trajectory verification required'}
    for ob in loaded:bpy.data.objects.remove(ob,do_unlink=True)
