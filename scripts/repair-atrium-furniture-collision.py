"""Derive missing furniture blockers from the editable, evaluated source."""
import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/atrium'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/atrium/atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
if not bpy.context.scene.get('quiet_chair_clearance_v1'):
    for ob in bpy.context.scene.objects:
        if ob.name.startswith('Quiet chair'):ob.location.x-=.3
    bpy.context.scene['quiet_chair_clearance_v1']=True
bpy.context.view_layer.update()
definitions=json.loads(bpy.context.scene['collision_manifest'])
definitions=[d for d in definitions if d.get('sourcePass')!='furniture-contact' and d['name']!='Shared table']
deps=bpy.context.evaluated_depsgraph_get()
def bounds(ob):
    ev=ob.evaluated_get(deps);mesh=ev.to_mesh()
    pts=[ev.matrix_world@v.co for v in mesh.vertices]
    points=[(p.x,p.z,-p.y) for p in pts];ev.to_mesh_clear()
    return [min(p[i] for p in points) for i in range(3)],[max(p[i] for p in points) for i in range(3)]
for ob in bpy.context.scene.objects:
    name=ob.name.lower()
    cushion='cushion' in name and ('chair' in name or 'seat' in name)
    pot=' pot' in name
    table=ob.name=='Shared table edge'
    back=('chair back' in name or 'seat back' in name)
    if not (cushion or pot or table or back):continue
    lo,hi=bounds(ob)
    if pot and min(abs(lo[1]-f) for f in [0,3.5])>.06:continue
    if cushion:lo[1]=round(lo[1]/3.5)*3.5
    if table:lo[1]=0;hi[1]=.95
    center=[round((a+b)/2,5) for a,b in zip(lo,hi)]
    size=[round(b-a,5) for a,b in zip(lo,hi)]
    d={'name':'Shared table' if table else ob.name,'position':center,'size':size,'sourcePass':'furniture-contact','sourceObject':ob.name}
    if pot or table:d['type']='ellipse'
    else:d['type']='box'
    definitions.append(d)
bpy.context.scene['collision_manifest']=json.dumps(definitions)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/atrium/atrium-master.blend'))
(OUT/'collision.json').write_text(json.dumps(definitions,ensure_ascii=False,indent=2))
manifest=json.loads((OUT/'manifest.json').read_text());manifest['collisionCount']=len(definitions)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('FURNITURE_COLLISION_READY',len([d for d in definitions if d.get('sourcePass')]),flush=True)
