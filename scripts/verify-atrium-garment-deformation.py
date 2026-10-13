"""Measure cloth edge stretch under shoulder/elbow and hip/knee controls."""
import bpy,json,hashlib,os
from pathlib import Path
from mathutils import Euler
ROOT=Path(__file__).resolve().parents[1]
reports=[]
for identity in os.environ.get('ATRIUM_RESIDENT_IDS','you,lin,chen,xu,zhou,he,tang').split(','):
    source=ROOT/os.environ.get('ATRIUM_SOURCE_DIR','models/atrium/residents')/(identity+'.blend')
    bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update()
    rig=bpy.data.objects['CivicSkinRig'];mesh=bpy.data.objects['SkinnedArticulationCore']
    bindings=[]
    for side in ['Left','Right']:
        for part in ['Arm','Elbow','Leg','Knee']:
            control=bpy.data.objects[side+part+'Pivot'];bone=rig.pose.bones['Skin'+side+part]
            bindings.append((control,bone,control.matrix_world.inverted()@rig.matrix_world@bone.matrix,control.matrix_basis.copy(),part))
    lengths=[(a,b,(mesh.data.vertices[a].co-mesh.data.vertices[b].co).length) for a,b in (e.vertices for e in mesh.data.edges)]
    samples=[]
    cases=[{'arm':a,'elbow':e,'leg':0,'knee':0,'name':'upper'} for a,e in [(0,0),(-.35,-.7),(-.5,-.7),(-.8,-1.1),(.35,-.15)]]
    cases += [{'arm':0,'elbow':0,'leg':h,'knee':k,'name':name} for h,k,name in [(-.55,.8,'stride'),(-1.1,1.4,'stair'),(-1.57,1.57,'sit')]]
    for case in cases:
        for control,bone,offset,rest,part in bindings:
            control.matrix_basis=rest;control.rotation_mode='QUATERNION'
            control.rotation_quaternion=rest.to_quaternion()@Euler((case[part.lower()],0,0)).to_quaternion()
        bpy.context.view_layer.update()
        for control,bone,offset,rest,part in bindings:
            bone.matrix=rig.matrix_world.inverted()@control.matrix_world@offset;bpy.context.view_layer.update()
        evaluated=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());posed=evaluated.to_mesh()
        assert len(posed.vertices)==len(mesh.data.vertices)
        ratios=sorted((posed.vertices[a].co-posed.vertices[b].co).length/length for a,b,length in lengths if length>.005)
        samples.append({**case,'maxEdgeStretch':ratios[-1],'p99EdgeStretch':ratios[int(len(ratios)*.99)]})
        evaluated.to_mesh_clear()
    report={'identity':identity,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'poses':samples}
    reports.append(report);print('CLOTH_DEFORMATION',json.dumps(report),flush=True)
    report['passed']=max(p['maxEdgeStretch'] for p in samples)<4
(ROOT/os.environ.get('ATRIUM_DEFORMATION_REPORT','evidence/atrium/garments/deformation.json')).write_text(json.dumps({'scope':'Source rig five shoulder/elbow and three hip/knee poses, edges longer than 5mm. Stretch regression guard, not a cloth simulation or visual approval.','residents':reports},indent=2))

assert all(r['passed'] for r in reports),'Garment tears into stretched spikes; see deformation.json'
