import * as THREE from 'three';
import { loadAtriumGLB } from './atrium-assets.js';
import { sampleCivicAnimationPose } from './civic-animation-clips.js';
import { CIVIC_ARTICULATION_BINDING_SPECS,createCivicArticulationBinding,syncCivicArticulationBinding } from './reference-fidelity-runtime-contract.js';

const JOINTS={headGroup:'HeadPivot',leftArm:'LeftArmPivot',rightArm:'RightArmPivot',leftElbow:'LeftElbowPivot',rightElbow:'RightElbowPivot',leftHand:'Hand_-1',rightHand:'Hand_1',leftLeg:'LeftLegPivot',rightLeg:'RightLegPivot',leftKnee:'LeftKneePivot',rightKnee:'RightKneePivot',leftFoot:'ShoeUpper_-1Pivot',rightFoot:'ShoeUpper_1Pivot',leftSleeveCompression:'SleeveCompressionPivot_-1',rightSleeveCompression:'SleeveCompressionPivot_1',leftTrouserCompression:'TrouserCompressionPivot_-1',rightTrouserCompression:'TrouserCompressionPivot_1'};
const euler=new THREE.Euler(),q=new THREE.Quaternion();
// A seated thigh slopes towards a floor-supported shin. A fixed 90-degree
// knee left these short shins dangling above the floor on a 53cm chair.
export function seatedAtriumLeg(seatHeight,upper,lower,soleOffset,hipRest){
  const hip=seatHeight+.08;
  const angle=Math.acos(THREE.MathUtils.clamp((hip-lower-soleOffset)/upper,-.95,.95));
  return {hipOffset:hip-hipRest,hipAngle:-angle,kneeAngle:angle};
}
// Match authored grip frames in the actor's parent space. Cancel inherited hand
// scale so the same metre-sized cup does not grow/shrink between residents.
export function alignAtriumProp(prop,grip,handGrip,parent){
  parent.updateWorldMatrix(true,false);handGrip.updateWorldMatrix(true,false);
  const target=new THREE.Matrix4().copy(handGrip.matrixWorld);
  const p=new THREE.Vector3(),r=new THREE.Quaternion(),s=new THREE.Vector3();
  target.decompose(p,r,s);target.compose(p,r,s.set(1,1,1));
  const transform=new THREE.Matrix4().copy(parent.matrixWorld).invert().multiply(target).multiply(grip.matrix.clone().invert());
  transform.decompose(prop.position,prop.quaternion,prop.scale);prop.updateMatrixWorld(true);
}
export async function loadAtriumActor(id,definition,mobile=false) {
  const gltf=await loadAtriumGLB(`/assets/atrium/residents/${id}${mobile?'-mobile':''}.glb`);
  const group=new THREE.Group();group.name=`resident-${id}`;group.add(gltf.scene);
  const visual=gltf.scene.getObjectByName('VisualRoot');
  if(!visual)throw new Error(`${id} 缺少角色根节点`);
  const joints=Object.fromEntries(Object.entries(JOINTS).map(([key,name])=>{
    const node=visual.getObjectByName(name);return [key,node?{node,rest:node.quaternion.clone()}:null];
  }));
  group.updateMatrixWorld(true);
  const legDimensions=Object.fromEntries(['left','right'].map(side=>{
    const hip=joints[`${side}Leg`].node,knee=joints[`${side}Knee`].node,foot=joints[`${side}Foot`].node;
    return [side,{upper:knee.position.length(),lower:foot.position.length(),
      soleOffset:foot.getWorldPosition(new THREE.Vector3()).y-group.position.y,
      hipRest:hip.getWorldPosition(new THREE.Vector3()).y-group.position.y}];
  }));
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
  let walkPhase=0,seatBlend=0,lifeProp=null,propGrips=[],sitting,lastSeatHeight;
  const handGrip=visual.getObjectByName('HandGripAnchor_1');
  const poseVectors={};
  return {id,group,visual,definition,bindings,velocity:0,action:definition.activity||'idle',
    get seatBlend(){return seatBlend;},
    footDiagnostics(){return ['left','right'].map(side=>{
      const knee=joints[`${side}Knee`].node.getWorldPosition(new THREE.Vector3()).sub(group.position);
      return {side,soleY:joints[`${side}Foot`].node.getWorldPosition(new THREE.Vector3()).y-legDimensions[side].soleOffset,
        floorY:group.position.y,kneeForward:knee.x*Math.sin(group.rotation.y)+knee.z*Math.cos(group.rotation.y)};
    });},
    attachLifeProp(model){
      if(!handGrip)throw new Error(`${id} 缺少手掌握持点`);
      lifeProp=model;group.add(model);model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.set(1,1,1);
      propGrips=['WateringCan','TeaCup'].map(name=>{
        const prop=model.getObjectByName(name),grip=prop?.getObjectByName(`${name}Grip`);
        if(!grip)throw new Error(`${name} 缺少握持点`);
        grip.updateMatrix();return {prop,grip};
      });model.visible=false;
    },
    gripDiagnostics(){
      return propGrips.filter(({prop})=>lifeProp.visible&&prop.visible).map(({prop,grip})=>({name:prop.name,
        errorMetres:grip.getWorldPosition(new THREE.Vector3()).distanceTo(handGrip.getWorldPosition(new THREE.Vector3())),
        scale:prop.getWorldScale(new THREE.Vector3()).toArray(),hand:handGrip.getWorldPosition(new THREE.Vector3()).toArray(),
        handle:grip.getWorldPosition(new THREE.Vector3()).toArray()}));
    },
    update(time,dt,{moving=0,talking=false,lookingAt=null,seated=false,stepping=false,care=false,listening=false,seatHeight=.53}={}) {
      walkPhase+=moving*dt/1.25;
      const state=moving>.08?'walk':talking||care?'gesture':listening||definition.activity==='think'?'listen':definition.activity==='talk'?'gesture':'idle';
      const pose=sampleCivicAnimationPose(state,state==='walk'?walkPhase:time/(state==='idle'?3.2:4.4),definition.role||'player');
      seatBlend=THREE.MathUtils.damp(seatBlend,seated?1:0,8,dt);
      if(lastSeatHeight!==seatHeight){
        sitting=Object.fromEntries(Object.entries(legDimensions).map(([side,d])=>[side,seatedAtriumLeg(seatHeight,d.upper,d.lower,d.soleOffset,d.hipRest)]));
        lastSeatHeight=seatHeight;
      }
      for(const [key,entry]of Object.entries(joints)){
        if(!entry)continue;
        const v=pose[key]||[0,0,0];
        let x=v[0],y=v[1],z=v[2];
        if(care&&key==='rightArm'){x=-.5;y=0;z=-.12;}
        if(care&&key==='rightElbow'){x=-.7;y=0;z=0;}
        if(care&&key==='rightHand')z=.24*Math.sin(time*1.8);
        if(key==='leftLeg'||key==='rightLeg')x=THREE.MathUtils.lerp(x,sitting[key.startsWith('left')?'left':'right'].hipAngle,seatBlend);
        if(key==='leftKnee'||key==='rightKnee')x=THREE.MathUtils.lerp(x,sitting[key.startsWith('left')?'left':'right'].kneeAngle,seatBlend)+(stepping&&moving>.1?.13:0);
        if(['leftLeg','rightLeg','leftKnee','rightKnee'].includes(key)){y*=1-seatBlend;z*=1-seatBlend;}
        if(key==='leftFoot'||key==='rightFoot'){x*=1-seatBlend;y*=1-seatBlend;z*=1-seatBlend;}
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
      visual.position.y=sitting.left.hipOffset*seatBlend+(moving>.08?(pose.rootY||0)*.25:0);
      // Bring knees beyond the 70cm cushion before the shins drop to the floor.
      visual.position.z=.2*seatBlend;
      visual.rotation.z=(pose.visual?.[2]||0)*.4*(1-seatBlend);
      visual.updateMatrixWorld(true);for(const b of bindings)syncCivicArticulationBinding(b);
      const phase=(time+(id.length*1.13))%4.7;
      const blink=phase<.15?Math.max(.03,Math.abs(phase-.075)/.075):1;
      eyes.forEach((eye,i)=>{eye.scale.copy(eyeScales[i]);eye.scale.y*=blink;});
      if(open)open.visible=talking&&Math.sin(time*9)>.25;
      if(closed)closed.visible=!open?.visible;
      if(lifeProp){
        lifeProp.visible=care;
        if(care)for(const {prop,grip}of propGrips)if(prop.visible)alignAtriumProp(prop,grip,handGrip,lifeProp);
      }
    },
  };
}
