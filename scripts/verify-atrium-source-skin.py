"""Blender regression for source UV, multi-attribute authoring and masked bake."""
import bpy,importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
 value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
surface=module('surface','atrium-surface-authoring.py');bake=module('bake','atrium-textile-bake.py');check=module('check','verify-atrium-textured-uv.py')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/atrium/residents/you.blend'))
head=bpy.data.objects['Head']
source=head.data.uv_layers.new(name='SourceUV')
for a,b in zip(source.data,head.data.uv_layers['UVMap'].data):a.uv=b.uv
before={key.name:[tuple(v.co) for v in key.data] for key in head.data.shape_keys.key_blocks}
surface.skin_shader(head,portrait=True,source_texture=ROOT/'models/atrium/source/skin-young-asian-male/young_lightskinned_male_diffuse3.png')
assert len(head.data.color_attributes['Color'].data)==len(head.data.loops)
assert len(head.data.color_attributes['FaceResponse'].data)==len(head.data.loops)
images=bake.bake_object(head,64,family='skin')
assert set(images)=={'DIFFUSE','ROUGHNESS','NORMAL'}
assert not head.data.uv_layers.get('SourceUV') and head.data.uv_layers.get('UVMap')
assert not head.data.color_attributes
assert before=={key.name:[tuple(v.co) for v in key.data] for key in head.data.shape_keys.key_blocks}
bpy.ops.object.select_all(action='DESELECT');head.select_set(True);bpy.context.view_layer.objects.active=head
out=ROOT/'tmp/portrait-study/source-skin-regression';out.mkdir(parents=True,exist_ok=True)
path=out/'head.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=False,export_animations=False)
r=dict(texturedUvChecks=check.verify(path),sourceUvRemoved=True,colourAttributesRemoved=True,morphsUnchanged=list(before),maps=list(images))
(out/'report.json').write_text(json.dumps(r,indent=2))
print('SOURCE_SKIN_REGRESSION_PASS',r)
