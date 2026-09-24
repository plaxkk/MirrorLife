"""Check authored tea phases preserve endpoints and remain scoped to the hand."""
import bpy, os, json, hashlib
from pathlib import Path

def endpoints(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    keys=bpy.data.objects['SkinnedArticulationCore'].data.shape_keys.key_blocks
    return {name:[tuple(v.co) for v in keys[name].data] for name in ['Basis','GripRight','GripTea']}

base=Path(os.environ['ATRIUM_GRIP_BASELINE'])
source=Path(os.environ['ATRIUM_GRIP_SOURCE'])
assert endpoints(base)==endpoints(source), 'Existing endpoint geometry changed'
mesh=bpy.data.objects['SkinnedArticulationCore']; keys=mesh.data.shape_keys.key_blocks
assert 'GripTeaArc' not in keys
group=mesh.vertex_groups['SkinRightHand'].index
phases=[]
for name in ['GripTeaOpen','GripTeaQuarter','GripTeaHalf','GripTeaLate']:
    changed=[]; outside=[]; maximum=0
    for vertex,a,b in zip(mesh.data.vertices,keys['Basis'].data,keys[name].data):
        if tuple(a.co)!=tuple(b.co):
            changed.append(vertex.index); maximum=max(maximum,(a.co-b.co).length)
            if not any(g.group==group and g.weight>.999 for g in vertex.groups):outside.append(vertex.index)
    assert changed and not outside
    assert keys[name].value==0
    phases.append(dict(name=name,changedVertices=len(changed),outsideHand=outside,maxDisplacementFromBasis=maximum))
assert keys['GripRight'].value==keys['GripTea'].value==0
result=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),existingEndpointsExact=True,phases=phases,scope='Source scope and endpoint preservation only; not runtime collision or art approval.')
out=Path(os.environ['ATRIUM_GRIP_REPORT']);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,indent=2));print(result)
