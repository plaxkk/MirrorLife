"""Catch the observed black sliver regression in decoded Lin runtime assets.

Samples the upper-body atlas at triangle centroids after Draco decoding.
This is a narrow regression guard, not a complete raster/visual certification.
"""
import bpy, hashlib, json, os
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
reports=[]
for filename in ('lin.glb','lin-mobile.glb'):
    path=ROOT/'public/assets/atrium/residents'/filename
    raw=path.read_bytes()
    gltf=json.loads(raw[20:20+int.from_bytes(raw[12:16],'little')])
    core=next(m for m in gltf['meshes'] if 'SkinnedArticulationCore' in m['name'])
    assert all('TANGENT' not in p['attributes'] for p in core['primitives']), 'Palette normal lookup requires the runtime derivative tangent frame'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    ob=next(o for o in bpy.data.objects if o.type=='MESH' and 'SkinnedArticulationCore' in o.name)
    mesh=ob.data;mat=mesh.materials[0]
    bs=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    image=bs.inputs['Base Color'].links[0].from_node.image
    pixels=np.empty(image.size[0]*image.size[1]*4,dtype=np.float32)
    image.pixels.foreach_get(pixels);pixels=pixels.reshape(image.size[1],image.size[0],4)
    uv=mesh.uv_layers.active.data;bad=[];checked=0
    for face in mesh.polygons:
        centre=sum((mesh.vertices[i].co for i in face.vertices),Vector())/len(face.vertices)
        if not .92<centre.z<1.3 or abs(centre.x)>.4:continue
        point=sum((uv[i].uv for i in face.loop_indices),Vector((0,0)))/len(face.loop_indices)
        rgb=pixels[min(image.size[1]-1,int(point.y*image.size[1])),min(image.size[0]-1,int(point.x*image.size[0])),:3]
        checked+=1
        if max(rgb)<1e-6:bad.append({'face':face.index,'position':list(centre),'uv':list(point)})
    assert checked>100,'Upper-body sampling range missed decoded cloth'
    reports.append({'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'checkedTriangles':checked,'blackCentroids':bad})
output=ROOT/os.environ.get('ATRIUM_CLOTH_TEXEL_REPORT','evidence/atrium/dialogue-tailoring/cloth-texels.json')
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps({'scope':__doc__,'assets':reports},indent=2))
assert all(not r['blackCentroids'] for r in reports),reports
print('CLOTH_TEXELS_PASS',[(r['file'],r['checkedTriangles']) for r in reports])
