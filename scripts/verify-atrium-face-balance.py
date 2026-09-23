"""Audit regional face balance and retain the original facial animation vectors."""
import bpy,os,json,hashlib
from pathlib import Path
from mathutils import Vector
source=Path(os.environ['ATRIUM_FACE_SOURCE']);baseline=Path(os.environ['ATRIUM_FACE_BASELINE'])
def read(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
 head=bpy.data.objects['Head'];m=head.data
 return dict(keys={k.name:[tuple(v.co) for v in k.data] for k in m.shape_keys.key_blocks},
  faces=[tuple(p.vertices) for p in m.polygons],uv=[tuple(v.uv) for v in m.uv_layers['UVMap'].data],
  weights=[[(g.group,g.weight) for g in v.groups] for v in m.vertices],
  parent=head.parent.name,transform=[tuple(row) for row in head.matrix_world])
a=read(source);b=read(baseline)
for field in ['faces','uv','weights','parent','transform']:assert a[field]==b[field],field
assert a['keys'].keys()==b['keys'].keys()
assert len(a['keys']['Basis'])==len(b['keys']['Basis'])
changes=[];morph_error=0;protected=0
for i,(p,q) in enumerate(zip(a['keys']['Basis'],b['keys']['Basis'])):
 delta=Vector(p)-Vector(q)
 if delta.length>1e-8:
  assert -.165<q[2]<.005 and abs(q[0])<.16 and q[1]<-.105, 'Edit outside nasal/oral region'
  assert abs(delta.x)<1e-8 and abs(delta.z)<1e-8 and -.02<delta.y<0
  changes.append(delta.length)
 if q[2]>=.005 or q[2]<=-.165:
  protected+=1
  assert p==q,'Orbital or lower-neck vertex changed'
 for name in ['Blink','Talk']:
  old=Vector(b['keys'][name][i])-Vector(q);new=Vector(a['keys'][name][i])-Vector(p)
  morph_error=max(morph_error,(new-old).length)
assert changes and morph_error<1e-7
report=dict(passed=True,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),
 changedVertices=len(changes),maxDisplacement=max(changes),protectedVertices=protected,maxMorphDeltaError=morph_error,
 unchanged=['polygon topology','UVMap','skin weights','parent','transform','orbital and lower-neck coordinates'],
 scope='Compares source geometry and facial offset vectors. Does not prove continuous surface contact, shape quality, lip sync or all animation poses.')
out=Path(os.environ['ATRIUM_FACE_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
print('FACE_BALANCE_SOURCE_PASS',len(changes),max(changes),morph_error)
