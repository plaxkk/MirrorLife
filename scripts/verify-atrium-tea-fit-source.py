"""Verify tea corrective target scope and preservation of existing hand poses."""
import bpy,os,json,hashlib
from pathlib import Path
base=Path(os.environ['ATRIUM_GRIP_BASELINE']);source=Path(os.environ['ATRIUM_GRIP_SOURCE'])
def existing(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    mesh=bpy.data.objects['SkinnedArticulationCore']
    return {name:[tuple(v.co) for v in mesh.data.shape_keys.key_blocks[name].data] for name in ['Basis','GripRight']}
old=existing(base);new=existing(source)
assert old==new,'Generic hand geometry changed'
mesh=bpy.data.objects['SkinnedArticulationCore'];group=mesh.vertex_groups['SkinRightHand'].index
keys=mesh.data.shape_keys.key_blocks;outside=[];changed=0;maximum=0
for v,a,b in zip(mesh.data.vertices,keys['GripRight'].data,keys['GripTea'].data):
    if tuple(a.co)!=tuple(b.co):
        changed+=1;maximum=max(maximum,(a.co-b.co).length)
        if not any(g.group==group and g.weight>.999 for g in v.groups):outside.append(v.index)
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),existingKeysEqual=True,changedVertices=changed,outsideHand=outside,maxDisplacement=maximum,sourceFit=dict(mesh['atrium_tea_fit']),scope='Exact existing core Basis/GripRight preservation and new corrective target restricted to right hand; not self-collision or prop collision proof.')
out=Path(os.environ['ATRIUM_GRIP_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
assert changed>0 and not outside and all(keys[name].value==0 for name in ['GripRight','GripTea'])
print('TEA_FIT_SOURCE_PASS',report)
