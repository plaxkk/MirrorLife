"""Bake static floor contact occlusion from the editable 3D scene, on CPU.

Two world-space atlas tiles cover the ground and gallery. This is short-range
hemispherical visibility, not GI, a photographic overlay, or character shadows.
Re-run after changing static furniture; moving people keep runtime shadows.
"""
import bpy, math, json, time, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'models/atrium/atrium-master.blend'
out=ROOT/'public/assets/atrium'
bpy.ops.wm.open_mainfile(filepath=str(source))
bpy.context.preferences.filepaths.save_version=0
started=time.monotonic()
vertices=[]; polygons=[]
deps=bpy.context.evaluated_depsgraph_get()
for obj in bpy.context.scene.objects:
    if obj.type not in {'MESH','CURVE'} or obj.name.startswith(('City ','Side skyline')):continue
    evaluated=obj.evaluated_get(deps);mesh=evaluated.to_mesh()
    if mesh is None:continue
    offset=len(vertices);matrix=obj.matrix_world
    vertices.extend(matrix@v.co for v in mesh.vertices)
    polygons.extend(tuple(offset+i for i in poly.vertices) for poly in mesh.polygons)
    evaluated.to_mesh_clear()
tree=BVHTree.FromPolygons(vertices,polygons)
width=384;tile_height=288;samples=24;radius=1.15
directions=[]
for i in range(samples):
    r=math.sqrt((i+.5)/samples);a=i*math.pi*(3-math.sqrt(5))
    directions.append(Vector((r*math.cos(a),r*math.sin(a),math.sqrt(1-r*r))))
pixels=[1.0]*(width*tile_height*2*4)
for layer,height in enumerate([.03,3.53]):
    for y in range(2,tile_height-2):
        for x in range(2,width-2):
            origin=Vector(((x+.5)/width*22.4-11.2,(y+.5)/tile_height*16.4-8.2,height))
            blocked=0
            for direction in directions:
                hit=tree.ray_cast(origin,direction,radius)
                if hit[0] is not None:blocked+=(1-hit[3]/radius)**.65
            value=max(.18,1-blocked/samples)
            index=((layer*tile_height+y)*width+x)*4
            pixels[index:index+4]=[value,value,value,1]
        if y%72==0:print('CONTACT_BAKE',layer,y,flush=True)
image=bpy.data.images.get('Atrium floor contact atlas') or bpy.data.images.new('Atrium floor contact atlas',width=width,height=tile_height*2)
image.colorspace_settings.name='Non-Color';image.pixels.foreach_set(pixels)
image.filepath_raw=str(out/'floor-contact.png');image.file_format='PNG';image.save();image.pack()
metadata={'method':'24 cosine-weighted hemisphere rays from evaluated static scene; short-range visibility with distance falloff',
    'source':'models/atrium/atrium-master.blend','size':[width,tile_height*2],'heightMetres':[.03,3.53],
    'boundsXZ':[-11.2,11.2,-8.2,8.2],'radiusMetres':radius,'samples':samples,
    'triangulatedBy':'Blender BVHTree','seconds':round(time.monotonic()-started,2),
    'scope':'static horizontal floor surfaces only; no baked residents; not indirect diffuse GI',
    'textureSha256':hashlib.sha256((out/'floor-contact.png').read_bytes()).hexdigest()}
bpy.context.scene['floor_contact_bake']=json.dumps(metadata)
bpy.ops.wm.save_as_mainfile(filepath=str(source))
(out/'floor-contact.json').write_text(json.dumps(metadata,indent=2))
print('CONTACT_BAKE_READY',json.dumps(metadata),flush=True)
