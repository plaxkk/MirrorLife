"""Check additive trajectory correction without changing either endpoint pose."""
import bpy,os,json,hashlib
from pathlib import Path
def capture(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    mesh=bpy.data.objects['SkinnedArticulationCore']
    return {name:[tuple(v.co) for v in mesh.data.shape_keys.key_blocks[name].data] for name in ['Basis','GripRight','GripTea']}
base=Path(os.environ['ATRIUM_GRIP_BASELINE']);source=Path(os.environ['ATRIUM_GRIP_SOURCE'])
assert capture(base)==capture(source),'Existing endpoint geometry changed'
mesh=bpy.data.objects['SkinnedArticulationCore'];keys=mesh.data.shape_keys.key_blocks
group=mesh.vertex_groups['SkinRightHand'].index;changed=0;outside=[];maximum=0
for vertex,a,b in zip(mesh.data.vertices,keys['Basis'].data,keys['GripTeaArc'].data):
    if tuple(a.co)!=tuple(b.co):
        changed+=1;maximum=max(maximum,(a.co-b.co).length)
        if not any(g.group==group and g.weight>.999 for g in vertex.groups):outside.append(vertex.index)
assert changed>0 and not outside and maximum<.020
assert all(keys[name].value==0 for name in ['GripRight','GripTea','GripTeaArc'])
result=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),existingEndpointsExact=True,changedVertices=changed,outsideHand=outside,maxDisplacement=maximum,arc=dict(mesh['atrium_tea_arc']),scope='Source vertex and shape-key scope; not runtime collision, deformation quality or performance proof.')
out=Path(os.environ['ATRIUM_GRIP_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2));print(result)
