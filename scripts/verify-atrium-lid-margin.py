"""Audit an isolated pigmentation edit without changing facial geometry."""
import bpy,json,os,hashlib
from pathlib import Path
source=Path(os.environ['ATRIUM_MARGIN_SOURCE']).resolve()
baseline=Path(os.environ['ATRIUM_MARGIN_BASELINE']).resolve()
def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    mesh=bpy.data.objects['Head'].data
    return dict(keys={k.name:[tuple(v.co) for v in k.data] for k in mesh.shape_keys.key_blocks},
        polygons=[tuple(p.vertices) for p in mesh.polygons],loops=[l.vertex_index for l in mesh.loops],
        colours=[tuple(c.color) for c in mesh.color_attributes['Color'].data],
        response=[tuple(c.color) for c in mesh.color_attributes['FaceResponse'].data],
        uv={u.name:[tuple(v.uv) for v in u.data] for u in mesh.uv_layers})
a=read(source);b=read(baseline)
for field in ['keys','polygons','loops','response','uv']:
    assert a[field]==b[field], 'Unexpected change: '+field
changed=[];maximum=0
for i,(x,y) in enumerate(zip(a['colours'],b['colours'])):
    delta=max(abs(v-w) for v,w in zip(x,y))
    if delta<1e-7:continue
    maximum=max(maximum,delta);p=a['keys']['Basis'][a['loops'][i]]
    assert abs(abs(p[0])-.0785)<.045 and .015<p[2]<.06 and p[1]<-.12, p
    changed.append(i)
assert changed, 'No visible pigmentation was authored'
out=Path(os.environ['ATRIUM_MARGIN_REPORT']);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(dict(passed=True,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),unchanged=['facial geometry and morphs','topology','UVs','skin roughness'],changedCorners=len(changed),maxColourDelta=maximum),indent=2))
print('LID_MARGIN_PASS',len(changed),maximum)
