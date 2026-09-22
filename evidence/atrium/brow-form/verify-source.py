import bpy,bmesh,json,hashlib,os
from pathlib import Path
p=Path(os.environ.get('ATRIUM_BROW_SOURCE','tmp/portrait-study/brow-v4/models/atrium/residents/you.blend'))
bpy.ops.wm.open_mainfile(filepath=str(p.resolve()))
head=bpy.data.objects['Head'];candidate={key.name:[tuple(v.co) for v in key.data] for key in head.data.shape_keys.key_blocks}
r=[]
for side in [-1,1]:
 ob=bpy.data.objects['Brow_'+str(side)];bm=bmesh.new();bm.from_mesh(ob.data)
 nonmanifold=sum(not e.is_manifold for e in bm.edges)
 volume=bm.calc_volume(signed=True)
 assert not nonmanifold and volume>0
 r.append(dict(side=side,nonManifoldEdges=nonmanifold,signedVolume=volume,vertices=len(bm.verts)))
 bm.free()
bpy.ops.wm.open_mainfile(filepath=str(Path('tmp/portrait-study/v7/models/atrium/residents/you.blend').resolve()))
baseline={key.name:[tuple(v.co) for v in key.data] for key in bpy.data.objects['Head'].data.shape_keys.key_blocks}
assert candidate==baseline, 'Brow-only study changed facial shapes'
out=Path('evidence/atrium/brow-form');out.mkdir(parents=True,exist_ok=True)
(out/'v4-source-audit.json').write_text(json.dumps(dict(sourceSha256=hashlib.sha256(p.read_bytes()).hexdigest(),brows=r,facialShapesUnchanged=list(candidate)),indent=2))
print('BROW_VOLUME_PASS',r)
