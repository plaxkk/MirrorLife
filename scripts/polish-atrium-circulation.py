"""Repair measured gallery clearance in the authored source, not via hidden physics gaps."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/atrium';SOURCE=ROOT/'models/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
COLLIDERS=json.loads(bpy.context.scene['collision_manifest'])
if not bpy.context.scene.get('circulation_pass_v2'):
    # Upstairs already has quiet chairs and a lookout seat. Keep the inset reading
    # benches downstairs, where their depth does not pinch a through-route.
    for ob in list(bpy.context.scene.objects):
        if ob.name.startswith('Window bench') and ob.location.z>3:
            bpy.data.objects.remove(ob,do_unlink=True)
        elif ob.name.startswith(('Quiet table','Listening record player','Record disk')):
            ob.location.x-=.3
    COLLIDERS=[d for d in COLLIDERS if not(d['name']=='Window bench base' and d['position'][1]>3)]
    for d in COLLIDERS:
        if d['name']=='Quiet table':d['position'][0]-=.3
    bpy.context.scene['circulation_pass_v2']=True
    bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
if not bpy.context.scene.get('circulation_pass_v3'):
    for ob in list(bpy.context.scene.objects):
        if ob.name.startswith('Gallery handrail') and ob.type=='CURVE' and ob.data.splines[0].bezier_points[0].co.x>7:
            bpy.data.objects.remove(ob,do_unlink=True)
        elif ob.name.startswith('Gallery post') and ob.location.x>7:
            bpy.data.objects.remove(ob,do_unlink=True)
        elif ob.name.startswith(('Tea kitchen','Kitchen door','Cup on tea counter','Tea kettle','Kettle handle')):
            ob.location.x+=.45
    COLLIDERS=[d for d in COLLIDERS if not(d['name']=='Gallery rail' and d['position'][0]>7)]
    for d in COLLIDERS:
        if d['name']=='Tea kitchen cabinet':d['position'][0]+=.45
    bpy.context.scene['circulation_pass_v3']=True
    bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
source=(ROOT/'scripts/build-atrium-assets.py').read_text();exec(source[source.index('# Export evaluated authored mesh.'):])
