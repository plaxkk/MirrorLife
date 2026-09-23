"""Check that the candidate changes only sleeve cuff geometry and preserves controls."""
import bpy, os, json, hashlib
from pathlib import Path
from collections import Counter
from mathutils import Vector

def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
    meshes={};controls={}
    elbows=[bpy.data.objects[s+'ElbowPivot'].matrix_world.inverted() for s in ['Left','Right']]
    for ob in bpy.context.scene.objects:
        if ob.type=='EMPTY':controls[ob.name]=[tuple(r) for r in ob.matrix_world]
        if ob.type!='MESH':continue
        vs=[tuple(ob.matrix_world@v.co) for v in ob.data.vertices]
        faces=[]
        for p in ob.data.polygons:
            ring=tuple(vs[i] for i in p.vertices)
            faces.append(min(ring[i:]+ring[:i] for i in range(len(ring))))
        keys={k.name:[tuple(v.co) for v in k.data] for k in ob.data.shape_keys.key_blocks} if ob.data.shape_keys else {}
        meshes[ob.name]=(Counter(vs),Counter(faces),keys)
    return meshes,controls,elbows
baseline=Path(os.environ['ATRIUM_CUFF_BASELINE']);source=Path(os.environ['ATRIUM_CUFF_SOURCE'])
a,ac,elbows=read(baseline);b,bc,_=read(source)
assert a.keys()==b.keys();assert ac==bc,'Controller transform changed'
changed=[];points=[]
for name in a:
    av,af,ak=a[name];bv,bf,bk=b[name]
    assert ak==bk, 'Shape keys changed: '+name
    if av==bv and af==bf:continue
    changed.append(name)
    assert name=='SkinnedArticulationCore','Unrelated geometry changed: '+name
    points.extend((av-bv).elements());points.extend((bv-av).elements())
assert changed and points
for p in points:
    local=[m@Vector(p) for m in elbows]
    assert any(-.312<q.z<-.215 and abs(q.x)<.085 and abs(q.y)<.085 for q in local),('Outside wrist region',p)
report=dict(passed=True,changedMeshes=changed,changedVertexOccurrences=len(points),controllersPreserved=len(ac),shapeKeysPreserved=True,baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),scope='Canonical world-space vertices and oriented faces; changed positions confined to wrist regions. Does not prove surface contact or unchanged UV/material/weights.')
out=Path(os.environ['ATRIUM_CUFF_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2));print('CUFF_SCOPE_PASS',json.dumps(report))
