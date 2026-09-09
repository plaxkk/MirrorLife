"""Correct shelf orientation found in runtime close-ups; preserve physical dimensions."""
import bpy,json,math
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/atrium';SOURCE=ROOT/'models/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
COLLIDERS=json.loads(bpy.context.scene['collision_manifest'])
if not bpy.context.scene.get('library_orientation_v1'):
    # North-wall shelves were exposing their solid backs to the room. Move the
    # rear board behind the books and place the spine labels on the readable side.
    for obj in bpy.context.scene.objects:
        if obj.name.startswith(('Living library back','Reading room library back')):obj.location.y=7.54
        if obj.name.startswith(('Living library spine label','Reading room library spine label')):obj.location.y=7.225
    pivot=Vector((9.85,.2,3.5));rotation=Matrix.Translation(pivot)@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation(-pivot)
    for obj in bpy.context.scene.objects:
        if obj.name.startswith('Quiet room library'):obj.matrix_world=rotation@obj.matrix_world
    for d in COLLIDERS:
        if d['name']=='Quiet room library':d['size']=[.5,2.3,1.45]
    cam=bpy.data.objects.get('Reference calibration camera')
    if cam:
        cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24;cam.data.lens=24/(2*math.tan(math.radians(62)/2))
        bpy.context.scene.render.resolution_x=1920;bpy.context.scene.render.resolution_y=1080
    bpy.context.scene['library_orientation_v1']=True
    bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
source=(ROOT/'scripts/build-atrium-assets.py').read_text();exec(source[source.index('# Export evaluated authored mesh.'):])
