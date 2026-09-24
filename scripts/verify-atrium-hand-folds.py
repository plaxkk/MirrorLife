"""Screen source hand poses for new sharp folds; not a collision acceptance test."""
import bpy,os,json,math,hashlib
from pathlib import Path
baseline=None
if os.environ.get('ATRIUM_GRIP_BASELINE'):
 bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.environ['ATRIUM_GRIP_BASELINE']))
 baseline={k.name:[tuple(v.co) for v in k.data] for k in bpy.data.objects['SkinnedArticulationCore'].data.shape_keys.key_blocks}
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.environ['ATRIUM_GRIP_SOURCE']))
m=bpy.data.objects['SkinnedArticulationCore'];h=bpy.data.objects['Hand_1'];local=h.matrix_world.inverted()@m.matrix_world
keys=m.data.shape_keys.key_blocks;group=m.vertex_groups['SkinRightHand'].index
ids={v.index for v in m.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)}
if baseline:
 assert baseline['Basis']==[tuple(v.co) for v in keys['Basis'].data], 'Neutral shape changed'
 for key in keys:
  assert all(tuple(v.co)==baseline[key.name][i] for i,v in enumerate(key.data) if i not in ids), 'Change outside right hand'
m.data.calc_loop_triangles();tris=[tuple(t.vertices) for t in m.data.loop_triangles if all(i in ids for i in t.vertices)]
edges={}
for n,t in enumerate(tris):
 for a,b in zip(t,t[1:]+t[:1]):edges.setdefault(tuple(sorted((a,b))),[]).append(n)
def shape(name):
 p=[local@v.co for v in keys[name].data];normals=[];areas=[]
 for a,b,c in tris:
  cross=(p[b]-p[a]).cross(p[c]-p[a]);areas.append(cross.length/2);normals.append(cross.normalized())
 return p,normals,areas
bp,bn,ba=shape('Basis');out={}
for name in ['Basis','GripRight','GripTeaOpen','GripTeaQuarter','GripTeaHalf','GripTeaLate','GripTea']:
 p,n,a=shape(name);fold=[]
 for e,adj in edges.items():
  if len(adj)!=2:continue
  i,j=adj;angle=math.degrees(n[i].angle(n[j],0));original=math.degrees(bn[i].angle(bn[j],0))
  if angle>90 and angle-original>30:fold.append(dict(edge=e,angle=angle,basisAngle=original,midpoint=list((p[e[0]]+p[e[1]])*.5),thumbRegion=(bp[e[0]].x+bp[e[1]].x)*.5<-.042))
 out[name]=dict(triangles=len(tris),foldCount=len(fold),thumbRegionFoldCount=sum(f['thumbRegion'] for f in fold),folds=sorted(fold,key=lambda x:-x['angle'])[:12],minAreaRatio=min(x/y for x,y in zip(a,ba) if y>1e-12))
out['sourceSha256']=hashlib.sha256(Path(os.environ['ATRIUM_GRIP_SOURCE']).read_bytes()).hexdigest()
out['baselineScopeVerified']=bool(baseline)
out['scope']='Source local dihedral screening, not intersection or anatomy proof. Fold means >90 degrees and >30 degrees increase over Basis.'
path=Path(os.environ['ATRIUM_GRIP_REPORT']);path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2))
print({k:(v['foldCount'],v['minAreaRatio']) for k,v in out.items() if isinstance(v,dict)})
