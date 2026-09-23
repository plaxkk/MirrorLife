"""Actual evaluated source skin: fixed collar root, rigid upper head, blended neck."""
import bpy,os,json,hashlib
from pathlib import Path
from mathutils import Euler
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/os.environ['ATRIUM_NECK_SOURCE'];out=ROOT/os.environ['ATRIUM_NECK_REPORT']
baseline=None
if os.environ.get('ATRIUM_NECK_BASELINE'):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/os.environ['ATRIUM_NECK_BASELINE']));bpy.context.view_layer.update()
    reference=bpy.data.objects['Head'];matrix=reference.matrix_world.copy()
    baseline={key.name:[matrix@v.co for v in key.data] for key in reference.data.shape_keys.key_blocks}
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update()
head=bpy.data.objects['Head'];pivot=bpy.data.objects['HeadPivot'];rest=pivot.matrix_basis.copy();world=head.matrix_world.copy()
weights={v.index:next(g.weight for g in v.groups if g.group==head.vertex_groups['SkinNeckHead'].index) for v in head.data.vertices}
original={k.name:[tuple(v.co) for v in k.data] for k in head.data.shape_keys.key_blocks}
baseline_error=None
if baseline:
    assert set(baseline)==set(original)
    baseline_error=0
    for key in head.data.shape_keys.key_blocks:
        assert len(key.data)==len(baseline[key.name])
        baseline_error=max(baseline_error,max((world@v.co-p).length for v,p in zip(key.data,baseline[key.name])))
    assert baseline_error<1e-5,'Baseline neutral or facial geometry changed'
base=[world@v.co for v in head.data.vertices];rest_head=pivot.matrix_world.copy();samples=[]
for angles in [(0,0,0),(0,0,.45),(0,0,-.45),(.25,0,0),(-.25,0,0),(.2,0,.45)]:
 pivot.matrix_basis=rest; pivot.rotation_mode='QUATERNION';pivot.rotation_quaternion=rest.to_quaternion()@Euler(angles).to_quaternion();bpy.context.view_layer.update()
 delta=pivot.matrix_world@rest_head.inverted();evaluated=head.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
 actual=[evaluated.matrix_world@v.co for v in mesh.vertices];evaluated.to_mesh_clear()
 anchor_error=max((a-b).length for i,(a,b) in enumerate(zip(actual,base)) if weights[i]==0)
 face_error=max((a-delta@b).length for i,(a,b) in enumerate(zip(actual,base)) if weights[i]==1)
 blend_error=max((a-b.lerp(delta@b,weights[i])).length for i,(a,b) in enumerate(zip(actual,base)) if 0<weights[i]<1)
 assert max(anchor_error,face_error,blend_error)<1e-5,(angles,anchor_error,face_error,blend_error)
 samples.append(dict(blenderAngles=angles,anchorError=anchor_error,upperHeadError=face_error,blendError=blend_error))
assert original=={k.name:[tuple(v.co) for v in k.data] for k in head.data.shape_keys.key_blocks}
r=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),zones=dict(head['cervical_skin']['zones']),baselineWorldGeometryAndMorphMaxError=baseline_error,samples=samples,morphDataUnchanged=True,scope='Blender evaluated source deformation at six poses. Checks weighted transforms, not skin/clothing collision, full motion range or art approval.')
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(r,indent=2)+'\n');print('CERVICAL_SOURCE_PASS',r['zones'])
