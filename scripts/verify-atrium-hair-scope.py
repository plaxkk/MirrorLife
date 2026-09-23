"""Distinguish mesh ordering from physical geometry changes before hair integration."""
import bpy,json,os,hashlib
from pathlib import Path
from collections import Counter
from mathutils.kdtree import KDTree
def read(p):
 bpy.ops.wm.open_mainfile(filepath=str(p));bpy.context.view_layer.update()
 out={}
 for o in bpy.context.scene.objects:
  if o.type!='MESH':continue
  vs=[tuple(v.co) for v in o.data.vertices]
  fs=[]
  for f in o.data.polygons:
   ps=tuple(vs[i] for i in f.vertices);fs.append(min(ps[i:]+ps[:i] for i in range(len(ps))))
  out[o.name]=(vs,fs)
 return out
baseline=Path(os.environ['ATRIUM_HAIR_BASELINE']);source=Path(os.environ['ATRIUM_HAIR_SOURCE'])
a=read(baseline);b=read(source)
assert a.keys()==b.keys(), 'Mesh object set changed'
report={}
for name in a.keys()&b.keys():
 if a[name]==b[name]:continue
 p,q=a[name],b[name];tree=KDTree(len(p[0]))
 for i,v in enumerate(p[0]):tree.insert(v,i)
 tree.balance()
 report[name]=dict(vertexMultisetEqual=Counter(p[0])==Counter(q[0]),orientedFaceMultisetEqual=Counter(p[1])==Counter(q[1]),maxCandidateToBaselineVertexDistance=max(tree.find(v)[2] for v in q[0]))
print('CANONICAL_SCOPE',report)
out=Path(os.environ['ATRIUM_HAIR_REPORT']);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(dict(baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),changes=report),indent=2))
assert all(k=='HairAuthored_short01' or (v['vertexMultisetEqual'] and v['orientedFaceMultisetEqual']) for k,v in report.items()), 'Unrelated mesh geometry changed'
