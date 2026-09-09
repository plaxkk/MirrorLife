import * as THREE from 'three';
import { loadAtriumGLB } from './atrium-assets.js';
import { sampleCivicAnimationPose } from './civic-animation-clips.js';
import { CIVIC_ARTICULATION_BINDING_SPECS,createCivicArticulationBinding,syncCivicArticulationBinding } from './reference-fidelity-runtime-contract.js';

const JOINTS={headGroup:'HeadPivot',leftArm:'LeftArmPivot',rightArm:'RightArmPivot',leftElbow:'LeftElbowPivot',rightElbow:'RightElbowPivot',leftHand:'Hand_-1',rightHand:'Hand_1',leftLeg:'LeftLegPivot',rightLeg:'RightLegPivot',leftKnee:'LeftKneePivot',rightKnee:'RightKneePivot',leftFoot:'ShoeUpper_-1Pivot',rightFoot:'ShoeUpper_1Pivot',leftSleeveCompression:'SleeveCompressionPivot_-1',rightSleeveCompression:'SleeveCompressionPivot_1',leftTrouserCompression:'TrouserCompressionPivot_-1',rightTrouserCompression:'TrouserCompressionPivot_1'};
const euler=new THREE.Euler(),q=new THREE.Quaternion();
export async function loadAtriumActor(id,definition,mobile=false) {
  const gltf=await loadAtriumGLB(`/assets/atrium/residents/${id}${mobile?'-mobile':''}.glb`);
  const group=new THREE.Group();group.name=`resident-${id}`;group.add(gltf.scene);
  const visual=gltf.scene.getObjectByName('VisualRoot');
  if(!visual)throw new Error(`${id} 缺少角色根节点`);
  const joints=Object.fromEntries(Object.entries(JOINTS).map(([key,name])=>{
    const node=visual.getObjectByName(name);return [key,node?{node,rest:node.quaternion.clone()}:null];
  }));
  group.updateMatrixWorld(true);
  const bindings=CIVIC_ARTICULATION_BINDING_SPECS.map(s=>createCivicArticulationBinding({...s,controller:joints[s.controlKey]?.node,bone:visual.getObjectByName(s.boneName)})).filter(Boolean);
  const eyes=[-1,1].map(i=>visual.getObjectByName(`EyePivot_${i}`)).filter(Boolean);
  const eyeScales=eyes.map(x=>x.scale.clone());
  const open=visual.getObjectByName('MouthOpenPivot'),closed=visual.getObjectByName('MouthClosedPivot');
  if(open)open.visible=false;
  group.traverse(node=>{if(node.isMesh){
    // Tiny eye/mouth surfaces lie inside the head's shadow silhouette.
    // Keep the complete head, clothing and articulated body in live shadows.
    node.castShadow=!/^(EyePivot|MouthClosedPivot|MouthOpenPivot)/.test(node.name);node.receiveShadow=true;
    if(node.isSkinnedMesh){
      // A conservative bound contains authored walking, sitting and hand gestures.
      // This avoids keeping every off-screen resident in the main render pass.
      node.geometry.computeBoundingSphere();node.boundingSphere=node.geometry.boundingSphere.clone();node.boundingSphere.radius+=.65;node.frustumCulled=true;
    }
  }});
  const position=definition.position||[-4.3,0,6.3];group.position.set(...position);group.rotation.y=definition.yaw||0;
  let walkPhase=0,seatBlend=0,lifeProp=null;
  const poseVectors={};
  return {id,group,visual,definition,bindings,velocity:0,action:definition.activity||'idle',
    get seatBlend(){return seatBlend;},
    attachLifeProp(model){
      lifeProp=model;joints.rightHand?.node.add(model);model.position.set(-.06,-.13,.015);model.rotation.z=.25;model.visible=false;
    },
    update(time,dt,{moving=0,talking=false,lookingAt=null,seated=false,stepping=false,care=false,listening=false,seatHeight=.53}={}) {
      walkPhase+=moving*dt/1.25;
      const state=moving>.08?'walk':talking||care?'gesture':listening||definition.activity==='think'?'listen':definition.activity==='talk'?'gesture':'idle';
      const pose=sampleCivicAnimationPose(state,state==='walk'?walkPhase:time/(state==='idle'?3.2:4.4),definition.role||'player');
      seatBlend=THREE.MathUtils.damp(seatBlend,seated?1:0,8,dt);
      for(const [key,entry]of Object.entries(joints)){
        if(!entry)continue;
        const v=pose[key]||[0,0,0];
        let x=v[0],y=v[1],z=v[2];
        if(care&&key==='rightArm'){x=-.5;y=0;z=-.12;}
        if(care&&key==='rightElbow'){x=-.7;y=0;z=0;}
        if(care&&key==='rightHand')z=.24*Math.sin(time*1.8);
        if(key==='leftLeg'||key==='rightLeg')x=THREE.MathUtils.lerp(x,-Math.PI/2,seatBlend);
        if(key==='leftKnee'||key==='rightKnee')x=THREE.MathUtils.lerp(x,Math.PI/2,seatBlend)+(stepping&&moving>.1?.13:0);
        if(!talking&&!care&&(key==='leftArm'||key==='rightArm'))x=THREE.MathUtils.lerp(x,-.35,seatBlend);
        if(!talking&&!care&&(key==='leftElbow'||key==='rightElbow'))x=THREE.MathUtils.lerp(x,-.7,seatBlend);
        if(key==='headGroup'&&lookingAt){
          const toward=Math.atan2(lookingAt.x-group.position.x,lookingAt.z-group.position.z)-group.rotation.y;
          y+=THREE.MathUtils.clamp(Math.atan2(Math.sin(toward),Math.cos(toward)),-.45,.45);
        }
        const smooth=poseVectors[key]||(poseVectors[key]=new THREE.Vector3(x,y,z));
        smooth.x=THREE.MathUtils.damp(smooth.x,x,14,dt);smooth.y=THREE.MathUtils.damp(smooth.y,y,14,dt);smooth.z=THREE.MathUtils.damp(smooth.z,z,14,dt);
        q.setFromEuler(euler.set(smooth.x,smooth.y,smooth.z));entry.node.quaternion.copy(entry.rest).multiply(q);
      }
      // Hip height follows the actual seat surface; transitions use the same articulated rig.
      visual.position.y=(seatHeight-.78)*seatBlend+(moving>.08?(pose.rootY||0)*.25:0);
      visual.rotation.z=(pose.visual?.[2]||0)*.4;
      visual.updateMatrixWorld(true);for(const b of bindings)syncCivicArticulationBinding(b);
      const phase=(time+(id.length*1.13))%4.7;
      const blink=phase<.15?Math.max(.03,Math.abs(phase-.075)/.075):1;
      eyes.forEach((eye,i)=>{eye.scale.copy(eyeScales[i]);eye.scale.y*=blink;});
      if(open)open.visible=talking&&Math.sin(time*9)>.25;
      if(closed)closed.visible=!open?.visible;
      if(lifeProp)lifeProp.visible=care;
    },
  };
}
