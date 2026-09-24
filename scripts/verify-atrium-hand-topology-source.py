"""Validate rebuilt hand topology and unchanged non-hand source geometry."""
import bpy,bmesh,os,json,hashlib
from pathlib import Path

def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    core=bpy.data.objects['SkinnedArticulationCore']
    groups={core.vertex_groups[name].index for name in ['SkinLeftHand','SkinRightHand']}
    hands={v.index for v in core.data.vertices if any(g.group in groups and g.weight>.999 for g in v.groups)}
    return core,hands,sorted(tuple(v.co) for v in core.data.vertices if v.index not in hands)

baseline=Path(os.environ['ATRIUM_HAND_BASELINE']);source=Path(os.environ['ATRIUM_HAND_SOURCE'])
def wrists(core):
    result=[]
    for side,name in [(-1,'SkinLeftHand'),(1,'SkinRightHand')]:
        group=core.vertex_groups[name].index
        local=bpy.data.objects[f'Hand_{side}'].matrix_world.inverted()@core.matrix_world
        result.append(sorted(tuple(v.co) for v in core.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups) and (local@v.co).z>.04499))
    return result
base_core,_,outside=read(baseline);base_wrists=wrists(base_core)
core,hands,candidate_outside=read(source)
assert outside==candidate_outside, 'Non-hand source coordinates changed'
for key in core.data.shape_keys.key_blocks:
    assert all(tuple(v.co)==tuple(core.data.shape_keys.key_blocks['Basis'].data[i].co) for i,v in enumerate(key.data) if i not in hands)
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),outsideHandCoordinatesExact=True,hands=[],digitGroups=[])
if os.environ.get('ATRIUM_REQUIRE_PINNED_WRIST')=='1':
    candidate_wrists=wrists(core)
    assert all(a and len(a)==len(b) for a,b in zip(base_wrists,candidate_wrists))
    maximum=max(sum((x-y)**2 for x,y in zip(p,q))**.5 for a,b in zip(base_wrists,candidate_wrists) for p,q in zip(a,b))
    assert maximum<1e-6, 'Wrist cap moved'
    report['maxWristCoordinateDelta']=maximum
for side,name in [(-1,'SkinLeftHand'),(1,'SkinRightHand')]:
    group=core.vertex_groups[name].index
    ids={v.index for v in core.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)}
    bm=bmesh.new();mapping={i:bm.verts.new(core.data.vertices[i].co) for i in ids}
    for poly in core.data.polygons:
        if all(i in ids for i in poly.vertices):bm.faces.new([mapping[i] for i in poly.vertices])
    unseen=set(bm.verts);components=0
    while unseen:
        components+=1;todo=[unseen.pop()]
        while todo:
            for edge in todo.pop().link_edges:
                for vertex in edge.verts:
                    if vertex in unseen:unseen.remove(vertex);todo.append(vertex)
    bad=sum(not e.is_manifold for e in bm.edges)
    area=min(f.calc_area() for f in bm.faces)
    assert components==1 and bad==0 and area>1e-12
    report['hands'].append(dict(side=side,vertices=len(ids),faces=len(bm.faces),components=components,nonManifoldEdges=bad,minFaceArea=area,construction=bpy.data.objects[f'Hand_{side}']['construction']))
    bm.free()
for digit in range(5):
    group=core.vertex_groups[f'SourceDigit_1_{digit}'].index
    ids=[v.index for v in core.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)]
    assert ids and all(i in hands for i in ids)
    report['digitGroups'].append(dict(digit=digit,vertices=len(ids)))
report['scope']='Merged source topology and non-hand coordinate scope; no anatomy, intersections, runtime contact or performance approval.'
out=Path(os.environ['ATRIUM_HAND_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2));print(report)
