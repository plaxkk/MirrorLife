"""Turn the generated cage library into a directly openable editing document."""
import bpy,os,math
from pathlib import Path
from mathutils import Quaternion,Vector
source=Path(os.environ['ATRIUM_PANEL_CAGE']).resolve()
assert source.is_relative_to(Path(__file__).resolve().parents[1]/'tmp')
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.data.scenes['Garment cage editing'];bpy.context.window.scene=scene
for other in list(bpy.data.scenes):
    if other!=scene:bpy.data.scenes.remove(other)
ob=scene.objects['Garment panel cage']
for item in scene.objects:item.select_set(False)
ob.select_set(True);bpy.context.view_layer.objects.active=ob
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_location=Vector((0,0,1.06))
            area.spaces.active.region_3d.view_distance=1.7
            area.spaces.active.region_3d.view_rotation=Quaternion((1,0,0),math.pi/2)
            area.spaces.active.region_3d.view_perspective='ORTHO'
ob.show_wire=True;ob.show_all_edges=True
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(source))
print('PANEL_EDITING_DOCUMENT_READY',source)
