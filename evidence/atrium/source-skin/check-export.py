import importlib.util,json,hashlib
from pathlib import Path
s=importlib.util.spec_from_file_location('check','scripts/verify-atrium-skin-occlusion.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
s=importlib.util.spec_from_file_location('uv','scripts/verify-atrium-textured-uv.py');uv=importlib.util.module_from_spec(s);s.loader.exec_module(uv)
base=Path('tmp/portrait-study/form-v2');root=Path('tmp/portrait-study/source-skin-v2');reports={}
for rel in ['models/atrium/residents/you-master.glb','public/assets/atrium/residents/you.glb','public/assets/atrium/residents/you-mobile.glb']:
 a,b,ha=m.glb(base/rel);c,d,hc=m.glb(root/rel)
 x=next(x for x in a['meshes'] if x['name']=='Player head and curved eyelids');y=next(x for x in c['meshes'] if x['name']=='Player head and curved eyelids')
 assert len(x['primitives'])==len(y['primitives'])
 for p,q in zip(x['primitives'],y['primitives']):
  for field in ['POSITION','NORMAL']:assert m.accessor(a,b,p['attributes'][field])==m.accessor(c,d,q['attributes'][field])
  assert m.accessor(a,b,p['indices'])==m.accessor(c,d,q['indices'])
  assert len(p.get('targets',[]))==len(q.get('targets',[]))
  for u,v in zip(p.get('targets',[]),q.get('targets',[])):
   assert u.keys()==v.keys()
   for field in u:assert m.accessor(a,b,u[field])==m.accessor(c,d,v[field])
  assert 'TEXCOORD_1' not in q['attributes']
 skin=next(x for x in c['materials'] if x['name']=='Resident authored skin baked PBR');pbr=skin['pbrMetallicRoughness']
 sizes={k:list(m.pixels(c,d,t).size) for k,t in [('albedo',pbr['baseColorTexture']),('normal',skin['normalTexture']),('orm',pbr['metallicRoughnessTexture'])]}
 expected=256 if 'mobile' in rel else 512
 assert all(v==[expected,expected] for v in sizes.values())
 allsizes=[list(m.pixels(c,d,{'index':i}).size) for i in range(len(c['textures']))]
 assert all(max(v)<2048 for v in allsizes)
 reports[rel]=dict(sha256=hc,bytes=(root/rel).stat().st_size,triangles=sum(c['accessors'][p['indices']]['count']//3 for x in c['meshes'] for p in x['primitives']),headMapSizes=sizes,images=len(c['images']),texturedUvChecks=uv.verify(root/rel),headGeometryNormalsIndicesAndMorphsUnchanged=True,noSecondaryHeadUV=True,noOriginal2048Texture=True)
Path('evidence/atrium/source-skin/assets-v2.json').write_text(json.dumps(reports,indent=2)+'\n');print(json.dumps(reports,indent=2))
