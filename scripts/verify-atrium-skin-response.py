"""Verify portable per-corner skin response against the saved editable source."""
import bpy, os, json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/os.environ['ATRIUM_SKIN_SOURCE'];baseline=ROOT/os.environ.get('ATRIUM_SKIN_BASELINE','models/atrium/residents/you.blend')
def shapes(head):return {k.name:[tuple(v.co) for v in k.data] for k in head.data.shape_keys.key_blocks}
bpy.ops.wm.open_mainfile(filepath=str(baseline));old=shapes(bpy.data.objects['Head'])
bpy.ops.wm.open_mainfile(filepath=str(source));head=bpy.data.objects['Head']
response=head.data.color_attributes['FaceResponse'];uv=head.data.uv_layers['FaceRoughness'];rough=[];errors=[]
for i in range(len(head.data.loops)):
 value=response.data[i].color[0];rough.append(value);errors.append(abs((uv.data[i].uv.x*256-.5)/255-value))
material=head.data.materials[0];image=next(n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image.name.startswith('Portrait roughness'))
assert list(image.size)==[256,1] and image.colorspace_settings.name=='Non-Color'
pixels=list(image.pixels);ramp_error=max(abs(pixels[i*4+1]-i/255) for i in range(256))
report={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'baselineSha256':hashlib.sha256(baseline.read_bytes()).hexdigest(),
 'morphsUnchanged':old==shapes(head),'loops':len(rough),'roughnessRange':[min(rough),max(rough)],'maxUvResponseError':max(errors),
 'lookupSize':list(image.size),'maxLookupError':ramp_error,'scope':'Saved editable source, all Basis/Blink/Talk coordinates and per-corner roughness encoding. Exported texture/channel and runtime appearance checked separately.'}
report['passed']=report['morphsUnchanged'] and max(errors)<1e-6 and ramp_error<1e-6 and .4<min(rough)<max(rough)<.75
out=ROOT/os.environ['ATRIUM_SKIN_REPORT'];out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2));assert report['passed'],report
print('SKIN_RESPONSE_PASS',report)
