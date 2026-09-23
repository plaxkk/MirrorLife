"""Audit isolated brow volumes against the installed facial shape keys."""
import bpy,bmesh,json,hashlib,os
from pathlib import Path
source=Path(os.environ['ATRIUM_BROW_SOURCE']).resolve()
baseline=Path(os.environ.get('ATRIUM_BROW_BASELINE','models/atrium/residents/you.blend')).resolve()
report=Path(os.environ['ATRIUM_BROW_REPORT'])
bpy.ops.wm.open_mainfile(filepath=str(source))
candidate={k.name:[tuple(v.co) for v in k.data] for k in bpy.data.objects['Head'].data.shape_keys.key_blocks}
rows=[]
for side in [-1,1]:
    ob=bpy.data.objects['Brow_'+str(side)]
    assert ob.parent.name=='BrowPivot_'+str(side)
    bm=bmesh.new();bm.from_mesh(ob.data)
    nonmanifold=sum(not e.is_manifold for e in bm.edges)
    volume=bm.calc_volume(signed=True)
    assert nonmanifold==0 and volume>0
    rows.append(dict(side=side,vertices=len(bm.verts),nonManifoldEdges=nonmanifold,signedVolume=volume))
    bm.free()
bpy.ops.wm.open_mainfile(filepath=str(baseline))
original={k.name:[tuple(v.co) for v in k.data] for k in bpy.data.objects['Head'].data.shape_keys.key_blocks}
assert candidate==original, 'Brow study changed facial shape keys'
report.parent.mkdir(parents=True,exist_ok=True)
report.write_text(json.dumps(dict(passed=True,source=str(source),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),brows=rows,facialShapesUnchanged=list(candidate)),indent=2))
print('BROW_SOURCE_PASS',rows)
