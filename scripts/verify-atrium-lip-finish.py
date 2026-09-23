"""Compare a lip surface study to its exact geometric baseline."""
import bpy, hashlib, json, os
from pathlib import Path


def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    head = bpy.data.objects['Head']
    mesh = head.data
    return {
        'vertices': [tuple(v.co) for v in mesh.vertices],
        'faces': [tuple(p.vertices) for p in mesh.polygons],
        'keys': {k.name: [tuple(v.co) for v in k.data] for k in mesh.shape_keys.key_blocks},
        'weights': [[(g.group, g.weight) for g in v.groups] for v in mesh.vertices],
        'uv': [tuple(v.uv) for v in mesh.uv_layers['UVMap'].data],
        'parent': head.parent.name,
        'transform': [tuple(row) for row in head.matrix_world],
        'color': [tuple(v.color) for v in mesh.color_attributes['Color'].data],
        'response': [v.color[0] for v in mesh.color_attributes['FaceResponse'].data],
    }


baseline = Path(os.environ['ATRIUM_LIP_BASELINE'])
source = Path(os.environ['ATRIUM_LIP_SOURCE'])
a, b = read(baseline), read(source)
unchanged = ['vertices', 'faces', 'keys', 'weights', 'uv', 'parent', 'transform']
for field in unchanged:
    assert a[field] == b[field], field
assert len(a['color']) == len(b['color'])
color_delta = [max(abs(x-y) for x,y in zip(p,q)) for p,q in zip(a['color'],b['color'])]
rough_delta = [y-x for x,y in zip(a['response'],b['response'])]
assert max(color_delta) > .001, 'No exported source color change'
assert min(rough_delta) >= -1e-7 and .01 < max(rough_delta) <= .070001
report = dict(passed=True, unchanged=unchanged,
    baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),
    sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    changedColorCorners=sum(v>1e-7 for v in color_delta), maxColorDelta=max(color_delta),
    minRoughnessDelta=min(rough_delta), maxRoughnessDelta=max(rough_delta),
    scope='Source head only; proves geometric and morph identity, not appearance quality or all other objects.')
out=Path(os.environ['ATRIUM_LIP_REPORT']); out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,indent=2))
print('LIP_FINISH_SOURCE_PASS',json.dumps(report))
