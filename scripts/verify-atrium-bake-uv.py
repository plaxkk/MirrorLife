"""Blender regression: textured morph head retains UVs after two-colour baking.

Run Blender --background --python-exit-code 1 --python this_file.
Only writes under tmp/; the installed source is opened without saving it.
"""
import bpy, importlib.util, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def module(name, path):
    spec=importlib.util.spec_from_file_location(name, ROOT/path)
    loaded=importlib.util.module_from_spec(spec);spec.loader.exec_module(loaded)
    return loaded

bake=module('bake', 'scripts/atrium-textile-bake.py')
check=module('check', 'scripts/verify-atrium-textured-uv.py')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/atrium/residents/you.blend'))
head=bpy.data.objects['Head']
assert head.data.shape_keys and head.data.color_attributes.get('Color')
if not head.data.color_attributes.get('FaceResponse'):
    head.data.color_attributes.new(name='FaceResponse',type='FLOAT_COLOR',domain='CORNER')
before={key.name:[tuple(v.co) for v in key.data] for key in head.data.shape_keys.key_blocks}
images=bake.bake_object(head,64,family='skin')
assert len(head.data.uv_layers['UVMap'].data)==len(head.data.loops)
assert not head.data.color_attributes
assert before=={key.name:[tuple(v.co) for v in key.data] for key in head.data.shape_keys.key_blocks}
bpy.ops.object.select_all(action='DESELECT');head.select_set(True);bpy.context.view_layer.objects.active=head
out=ROOT/'tmp/portrait-study/uv-regression';out.mkdir(parents=True,exist_ok=True)
path=out/'head.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=False,export_animations=False)
result={'texturedPrimitives':check.verify(path),'morphKeysUnchanged':list(before),'retainedUVLoops':len(head.data.loops),'removedColourLayers':True,'maps':list(images)}
(out/'report.json').write_text(json.dumps(result,indent=2)+'\n')
print('BAKE_UV_REGRESSION_PASS',result)
