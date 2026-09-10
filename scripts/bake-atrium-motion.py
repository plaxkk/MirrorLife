"""Bake a portable animation reference from the same authored runtime poses."""
import bpy,json,math
from pathlib import Path
from mathutils import Euler,Quaternion
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'models/atrium';OUT=ROOT/'public/assets/atrium/animations';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'residents/you.blend'))
bpy.context.preferences.filepaths.save_version=0
motion=json.loads((SOURCE/'animations/motion.json').read_text())
names={'visual':'VisualRoot','headGroup':'HeadPivot','leftArm':'LeftArmPivot','rightArm':'RightArmPivot','leftElbow':'LeftElbowPivot','rightElbow':'RightElbowPivot','leftHand':'Hand_-1','rightHand':'Hand_1','leftLeg':'LeftLegPivot','rightLeg':'RightLegPivot','leftKnee':'LeftKneePivot','rightKnee':'RightKneePivot'}
names.update(leftFoot='ShoeUpper_-1Pivot',rightFoot='ShoeUpper_1Pivot',leftSleeveCompression='SleeveCompressionPivot_-1',rightSleeveCompression='SleeveCompressionPivot_1',leftTrouserCompression='TrouserCompressionPivot_-1',rightTrouserCompression='TrouserCompressionPivot_1')
controls={k:bpy.data.objects.get(v) for k,v in names.items()};rest={k:o.matrix_basis.copy() for k,o in controls.items() if o}
rig=bpy.data.objects['CivicSkinRig'];bpy.context.view_layer.update()
bindings=[]
for key,bone in [('leftArm','SkinLeftArm'),('rightArm','SkinRightArm'),('leftElbow','SkinLeftElbow'),('rightElbow','SkinRightElbow'),('leftLeg','SkinLeftLeg'),('rightLeg','SkinRightLeg'),('leftKnee','SkinLeftKnee'),('rightKnee','SkinRightKnee'),('leftElbow','SkinLeftElbowRigid'),('rightElbow','SkinRightElbowRigid'),('leftKnee','SkinLeftKneeRigid'),('rightKnee','SkinRightKneeRigid'),('leftHand','SkinLeftHand'),('rightHand','SkinRightHand')]:
    pb=rig.pose.bones.get(bone);ob=controls[key]
    if pb:bindings.append((ob,pb,ob.matrix_world.inverted()@rig.matrix_world@pb.matrix))
# Shoes/correctives use root-parented rigid bones. Omitting them leaves shoes
# at their bind location in portable clips even though the runtime drives them.
for key,bone in [('leftFoot','SkinLeftFoot'),('rightFoot','SkinRightFoot'),('leftSleeveCompression','SkinLeftSleeveCorrective'),('rightSleeveCompression','SkinRightSleeveCorrective'),('leftTrouserCompression','SkinLeftTrouserCorrective'),('rightTrouserCompression','SkinRightTrouserCorrective')]:
    pb=rig.pose.bones.get(bone);ob=controls[key]
    if pb:bindings.append((ob,pb,ob.matrix_world.inverted()@rig.matrix_world@pb.matrix))
assert len(bindings)==20,'Portable motion must drive the same 20 articulation bindings as runtime'
bpy.context.scene.render.fps=30
for clip in motion['clips']:
    for ob in [*controls.values(),rig]:
        if not ob:continue
        ob.animation_data_create();ob.animation_data.action=bpy.data.actions.new(clip['name']+' '+ob.name)
    for frame in clip['frames']:
        f=1+round(frame['time']*30)
        for key,ob in controls.items():
            if not ob:continue
            v=frame['pose'].get(key,[0,0,0]);qt=Euler(v,'XYZ').to_quaternion();qb=Quaternion((qt.w,qt.x,-qt.z,qt.y))
            ob.matrix_basis=rest[key];ob.rotation_mode='QUATERNION';ob.rotation_quaternion=rest[key].to_quaternion()@qb
            if key=='visual':ob.location.z=rest[key].translation.z+frame['pose'].get('rootY',0)
            ob.keyframe_insert('rotation_quaternion',frame=f);ob.keyframe_insert('location',frame=f)
        bpy.context.view_layer.update()
        for ob,pb,offset in bindings:
            pb.rotation_mode='QUATERNION';pb.matrix=rig.matrix_world.inverted()@ob.matrix_world@offset
            pb.keyframe_insert('location',frame=f);pb.keyframe_insert('rotation_quaternion',frame=f);pb.keyframe_insert('scale',frame=f)
    for ob in [*controls.values(),rig]:
        if not ob:continue
        action=ob.animation_data.action;track=ob.animation_data.nla_tracks.new();track.name=clip['name']
        strip=track.strips.new(clip['name'],1,action);strip.extrapolation='NOTHING';ob.animation_data.action=None
        track.mute=True
    for key,ob in controls.items():
        if ob:ob.matrix_basis=rest[key]
    for pb in rig.pose.bones:pb.matrix_basis.identity()
bpy.context.scene.frame_set(0)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'animations/you-motion.blend'),compress=True)
for ob in [*controls.values(),rig]:
    if ob and ob.animation_data:
        for track in ob.animation_data.nla_tracks:track.mute=False
bpy.ops.export_scene.gltf(filepath=str(OUT/'you-motion.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_draco_mesh_compression_enable=True)
print('ATRIUM_MOTION_READY',len(motion['clips']),flush=True)
