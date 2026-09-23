"""Verify default authoring reproduces the installed hair rather than just study flags."""
import bpy,runpy,os,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Path(os.environ['ATRIUM_HAIR_SOURCE'])
baseline=Path(os.environ['ATRIUM_HAIR_BASELINE'])
report=Path(os.environ['ATRIUM_HAIR_REPORT'])
bpy.ops.wm.open_mainfile(filepath=str(source))
h=bpy.data.objects['HairAuthored_short01'];expected_parent=h.parent.name;expected=[tuple(v.co) for v in h.data.vertices];uv=[tuple(v.uv) for v in h.data.uv_layers['UVMap'].data]
bpy.ops.wm.open_mainfile(filepath=str(baseline))
for key in list(os.environ):
 if key.startswith('ATRIUM_HAIR_') or key=='ATRIUM_REFINED_HAIR':del os.environ[key]
ob=runpy.run_path(str(root/'scripts/atrium-authored-hair.py'))['build'](root,bpy.data.objects['Head'],'short01')
actual=[tuple(v.co) for v in ob.data.vertices]
errors=[sum((x-y)**2 for x,y in zip(a,b))**.5 for a,b in zip(actual,expected)]
print('DEFAULT_DIAGNOSTIC',len(actual),len(expected),max(errors),sum(e>1e-7 for e in errors),flush=True)
assert actual==expected, 'Default build hair differs from installed source'
assert ob.parent.name==expected_parent=='HeadPivot'
assert [tuple(v.uv) for v in ob.data.uv_layers['UVMap'].data]==uv
report.write_text(json.dumps(dict(passed=True,vertices=len(actual),maxCoordinateError=max(errors),parent=ob.parent.name,scope='Default hair authoring on old installed source reproduces new installed hair coordinates and UVs exactly; no other objects exported.'),indent=2))
print('DEFAULT_HAIR_REPRODUCTION_PASS')
