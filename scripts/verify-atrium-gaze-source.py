"""Check that the gaze candidate changes only the orbital head region."""
import bpy,os,json,hashlib
from pathlib import Path
source=Path(os.environ['ATRIUM_GAZE_SOURCE']).resolve()
baseline=Path('models/atrium/residents/you.blend').resolve()
def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    mesh=bpy.data.objects['Head'].data
    return {k.name:[v.co.copy() for v in k.data] for k in mesh.shape_keys.key_blocks},[tuple(p.vertices) for p in mesh.polygons]
candidate,topology=read(source);original,previous=read(baseline)
assert topology==previous
rows=[]
for name,points in candidate.items():
    differences=[(a-b).length for a,b in zip(points,original[name])]
    changed=[i for i,d in enumerate(differences) if d>1e-6]
    assert changed, 'Expected authored orbital changes'
    for i in changed:
        p=original['Basis'][i]
        assert abs(p.x)<.17 and -.065<p.z<.13 and p.y<-.07, (name,i,tuple(p))
    rows.append(dict(shape=name,changedVertices=len(changed),maxDisplacement=max(differences)))
talk_error=max(((candidate['Talk'][i]-candidate['Basis'][i])-(original['Talk'][i]-original['Basis'][i])).length for i in range(len(candidate['Basis'])))
assert talk_error<1e-7, 'Changed speech deformation'
output=Path(os.environ['ATRIUM_GAZE_REPORT']);output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(dict(passed=True,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),topologyUnchanged=True,talkDeltaMaxError=talk_error,shapes=rows),indent=2))
print('GAZE_LOCALITY_PASS',rows)
