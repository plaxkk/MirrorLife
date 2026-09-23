"""Check that tea grip frames do not change the existing hand morph geometry."""
import bpy,os,json,hashlib
from pathlib import Path
from mathutils import Vector

def capture(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
    core=bpy.data.objects['SkinnedArticulationCore']
    return {k.name:[tuple(v.co) for v in k.data] for k in core.data.shape_keys.key_blocks}

base=Path(os.environ['ATRIUM_GRIP_BASELINE']);source=Path(os.environ['ATRIUM_GRIP_SOURCE'])
old=capture(base);new=capture(source)
assert old==new,'Tea frame study changed the existing hand morph geometry'
wrist=bpy.data.objects['TeaWristOffset_1'];anchor=bpy.data.objects['TeaGripAnchor_1'];original=bpy.data.objects['HandGripAnchor_1']
assert wrist.parent==anchor.parent==original.parent
combined=wrist.rotation_quaternion@anchor.rotation_quaternion
angle=combined.rotation_difference(original.rotation_euler.to_quaternion()).angle
axis=anchor.rotation_quaternion@Vector((0,0,1))
assert angle<1e-5 and abs(axis.dot(Vector((1,0,0))))>.99999
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),coreShapeKeysEqual=True,keys=list(new),rotationCompensationErrorRadians=angle,handleAxis=tuple(axis),anchor=tuple(anchor.location),scope='Exact source core shape-key coordinates and local rotation composition. Does not validate skin deformation, scaled-world orientation, contact or animation transitions.')
out=Path(os.environ['ATRIUM_GRIP_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2));print(json.dumps(report))
