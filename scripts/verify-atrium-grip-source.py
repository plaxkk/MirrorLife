"""Scope and finite shape-key checks, not contact or anatomical approval."""
import bpy,os,json,hashlib
from pathlib import Path
source=Path(os.environ['ATRIUM_GRIP_SOURCE'])
bpy.ops.wm.open_mainfile(filepath=str(source))
core=bpy.data.objects['SkinnedArticulationCore'];keys=core.data.shape_keys.key_blocks
group=core.vertex_groups['SkinRightHand'].index
changed=[];outside=[];max_delta=0
for v,a,b in zip(core.data.vertices,keys['Basis'].data,keys['GripRight'].data):
    delta=(a.co-b.co).length
    if delta>1e-7:
        changed.append(v.index);max_delta=max(max_delta,delta)
        if not any(g.group==group and g.weight>.999 for g in v.groups):outside.append(v.index)
assert len(changed)>100 and not outside
assert keys['GripRight'].value==0
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),changedVertices=len(changed),outsideHand=outside,maxDelta=max_delta,neutralValue=0,scope='Morph displacement limited to fully weighted right hand; does not establish collision-free flexion or realistic grip.')
out=Path(os.environ['ATRIUM_GRIP_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
print('GRIP_SOURCE_PASS',report)
