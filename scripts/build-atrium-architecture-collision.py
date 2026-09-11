"""Export evaluated window masonry/reveals as physical surfaces, not filled holes."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/atrium/atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
definitions=json.loads(bpy.context.scene['collision_manifest'])
definitions=[d for d in definitions if d.get('sourcePass')!='architecture-contact']
vertices=[];indices=[];objects=[]
for ob in bpy.context.scene.objects:
    if not ob.name.startswith(('Rear window ','Side window ','Front window ')):continue
    if ' wall' not in ob.name and ' reveal ' not in ob.name:continue
    evaluated=ob.evaluated_get(deps);mesh=evaluated.to_mesh();mesh.calc_loop_triangles()
    offset=len(vertices)//3
    for vertex in mesh.vertices:
        p=evaluated.matrix_world@vertex.co
        vertices.extend(round(v,5) for v in (p.x,p.z,-p.y))
    for triangle in mesh.loop_triangles:indices.extend(offset+i for i in triangle.vertices)
    objects.append(ob.name);evaluated.to_mesh_clear()
assert len(objects)>100 and len(indices)>10000
definitions.append({'type':'trimesh','name':'Evaluated window masonry and reveals','sourcePass':'architecture-contact','sourceObjects':objects,'vertices':vertices,'indices':indices})
bpy.context.scene['collision_manifest']=json.dumps(definitions,separators=(',',':'))
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/atrium/atrium-master.blend'))
(ROOT/'public/assets/atrium/collision.json').write_text(json.dumps(definitions,separators=(',',':')))
manifest_path=ROOT/'public/assets/atrium/manifest.json';manifest=json.loads(manifest_path.read_text());manifest['collisionCount']=len(definitions);manifest_path.write_text(json.dumps(manifest,separators=(',',':')))
print('ARCHITECTURE_COLLISION',len(objects),'objects',len(indices)//3,'triangles',flush=True)
