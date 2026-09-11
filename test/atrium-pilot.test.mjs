import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {freshState,normalizeState,applyDecision,canDecide,RESIDENTS,residentSpeech} from '../src/atrium-content.js';
import {createAtriumPhysics} from '../src/atrium-physics.js';
import {loadAtriumState,saveAtriumState} from '../src/atrium-persistence.js';
import * as THREE from 'three';
import {alignAtriumProp,seatedAtriumLeg} from '../src/atrium-actors.js';
import {updateAtriumSeatMotion} from '../src/atrium-seat-motion.js';
import {createAtriumGpuTiming} from '../src/atrium-gpu-timing.js';
import {applyAtriumFloorContact} from '../src/atrium-floor-contact.js';
import {solveAtriumLeg} from '../src/atrium-stair-pose.js';

test('stair legs reach forward and rearward floor targets without reversing the knee',()=>{
  for(const down of [.35,.5,.64])for(const forward of [-.23,0,.23]){
    const p=solveAtriumLeg(.32,.395,down,forward);
    assert.ok(p.knee>=0&&p.unreachable<.00001);
    assert.ok(Math.abs(.32*Math.cos(p.hip)+.395*Math.cos(p.hip+p.knee)-down)<1e-6);
    assert.ok(Math.abs(-.32*Math.sin(p.hip)-.395*Math.sin(p.hip+p.knee)-forward)<1e-6);
    assert.ok(Math.abs(p.hip+p.knee+p.foot)<1e-6);
  }
  assert.ok(solveAtriumLeg(.32,.395,1,0).unreachable>.28);
});

test('foot probes hit tread tops, reject walls and ignore resident capsules',async()=>{
  const p=await createAtriumPhysics([
    {type:'box',name:'Ground',position:[0,-.1,0],size:[4,.2,4]},
    {type:'box',name:'Main stair tread 0',position:[0,.08,0],size:[1,.16,1]},
    {type:'box',name:'Wall',position:[1.5,1,0],size:[.3,2,2]},
  ]);
  try{
    p.addResident('probe',{x:0,y:.16,z:0});p.world.step();
    const hit=p.floorAt(0,0,.19);assert.equal(hit.stair,true);assert.ok(Math.abs(hit.height-.16)<1e-6);
    assert.equal(p.floorAt(1.5,0,.1),null);
    assert.equal(p.floorAt(5,5,0),null);
    assert.ok(Math.abs(p.floorAt(-1,0,.02).height)<1e-6);
  }finally{p.dispose();}
});

test('GPU timing distinguishes unavailable hardware and discards disjoint results',()=>{
  const unavailable=createAtriumGpuTiming({getExtension:()=>null});unavailable.reset();unavailable.begin();unavailable.end();
  assert.equal(unavailable.stats().supported,false);assert.equal(unavailable.stats().p50,null);
  let disjoint=false,deleted=0;
  const gl={QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,getExtension:()=>({GPU_DISJOINT_EXT:3,TIME_ELAPSED_EXT:4}),
    getParameter:()=>disjoint,createQuery:()=>({}),beginQuery(){},endQuery(){},deleteQuery(){deleted++;},
    getQueryParameter:(q,key)=>key===1?true:4200000};
  const timing=createAtriumGpuTiming(gl);timing.reset();for(let i=0;i<10;i++){timing.begin();timing.end();}
  disjoint=true;timing.begin();assert.equal(timing.stats().samples,0);assert.equal(timing.stats().discarded,1);assert.equal(deleted,1);
  disjoint=false;for(let i=0;i<11;i++){timing.begin();timing.end();}
  assert.equal(timing.stats().p50,4.2);timing.dispose();
});

test('seated hips clear cushion and the lower legs reach the floor across chair heights',()=>{
  for(const height of [.46,.5,.53,.56]){
    const pose=seatedAtriumLeg(height,.32,.395,.065,.78);
    const hip=.78+pose.hipOffset;
    const sole=hip-.32*Math.cos(pose.hipAngle)-.395*Math.cos(pose.hipAngle+pose.kneeAngle)-.065;
    assert.ok(Math.abs(sole)<1e-8);assert.ok(hip-height>=.079);
  }
});
test('residents leave the chair before turning, cancel safely, and wait for a blocked exit',()=>{
  for(const definition of RESIDENTS.filter(r=>r.standPosition)){
    const group=new THREE.Group();group.position.set(...definition.position);group.rotation.y=definition.yaw;
    const actor={definition,group,seatBlend:1};
    const visitor=new THREE.Vector3(definition.position[0],0,-3.1);
    function step(talking){const before=group.position.clone();const state=updateAtriumSeatMotion(actor,talking,visitor,1/60);actor.seatBlend=THREE.MathUtils.damp(actor.seatBlend,state.seated?1:0,8,1/60);assert.ok(before.distanceTo(group.position)<.02);return state;}
    for(let i=0;i<120;i++){
      const state=step(true);
      if(!state.clearOfChair)assert.equal(group.rotation.y,definition.yaw);
    }
    assert.ok(group.position.distanceTo(new THREE.Vector3(...definition.standPosition))<.01);
    for(let i=0;i<240;i++)step(false);
    assert.ok(group.position.distanceTo(new THREE.Vector3(...definition.position))<.025);assert.ok(actor.seatBlend>.99);
    // A person occupying the exit must not be pushed through by the animation.
    visitor.set(definition.position[0]+Math.sign(definition.standPosition[0]-definition.position[0])*.62,0,definition.position[2]);
    const blocked=step(true);assert.ok(blocked.blocked);assert.ok(blocked.seated);
    visitor.set(0,0,-4);for(let i=0;i<10;i++)step(true);for(let i=0;i<180;i++)step(false);
    assert.ok(actor.seatBlend>.99);assert.ok(group.position.distanceTo(new THREE.Vector3(...definition.position))<.025);
  }
});

test('floor contact atlas follows transformed floor levels and excludes vertical furniture',()=>{
  const root=new THREE.Group(),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,3.5,0,0,1,0,1,0,1],3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0,1,0,0],3));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());root.add(mesh);root.position.x=2;
  const texture=new THREE.Texture();assert.equal(applyAtriumFloorContact(root,texture),2);
  const uv=geometry.getAttribute('uv1');
  assert.ok(Math.abs(uv.getX(0)-13.2/22.4)<1e-6);
  assert.equal(uv.getY(0),.25);assert.equal(uv.getY(1),.75);
  assert.ok(uv.getX(2)<.002&&uv.getY(3)<.002);
  assert.equal(texture.channel,1);assert.equal(mesh.material.aoMap,texture);
});

async function glbJson(path){
  const bytes=await fs.readFile(new URL(path,import.meta.url));
  return JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
}
test('both resident LODs keep full digits and one continuous long-sleeve surface',async()=>{
  for(const id of ['you','lin','chen','xu','zhou','he','tang'])for(const lod of ['','-mobile']){
    const glb=await glbJson(`../public/assets/atrium/residents/${id}${lod}.glb`);
    const core=glb.nodes.find(n=>n.name==='SkinnedArticulationCore');
    const garment=glb.nodes.find(n=>n.extras?.atrium_garment)?.extras.atrium_garment;
    assert.equal(garment?.contract,'atrium-continuous-shoulder-v1',`${id}${lod}: missing Blender garment audit`);
    assert.equal(garment.components,1);assert.equal(garment.nonManifoldEdges,0);
    assert.ok(garment.triangles<=1700&&garment.weightError<.0001);
    for(const primitive of glb.meshes[core.mesh].primitives)
      assert.ok(Number.isInteger(primitive.attributes.TEXCOORD_0),`${id}${lod}: exported cloth UV missing`);
    const parts=core.extras.rigid_source_parts.split(',');
    assert.ok(!parts.some(n=>n.startsWith('TravelerForearmSkin')),`${id}${lod}: bare skin intersects long sleeve`);
    for(const side of [-1,1]){
      for(let digit=1;digit<=4;digit++)assert.ok(parts.includes(`EssentialFinger_${side}_${digit}`),`${id}${lod}: missing digit ${side}/${digit}`);
      assert.ok(parts.includes(`EssentialThumb_${side}`),`${id}${lod}: missing thumb`);
    }
    assert.ok(glb.nodes.some(n=>n.name==='HandGripAnchor_1'),`${id}: authored palm grip`);
  }
});
test('each life prop contains an authored grip frame',async()=>{
  const glb=await glbJson('../public/assets/atrium/life-props.glb');
  for(const name of ['WateringCan','TeaCup']){
    const root=glb.nodes.find(n=>n.name===name);
    assert.ok(root.children.some(i=>glb.nodes[i].name===`${name}Grip`),`${name}: missing handle grip`);
  }
});
test('portable motion clips include feet and all corrective bindings',async()=>{
  const glb=await glbJson('../public/assets/atrium/animations/you-motion.glb');
  for(const clip of glb.animations){
    const names=new Set(clip.channels.map(c=>glb.nodes[c.target.node].name));
    for(const side of ['Left','Right'])for(const part of ['Foot','SleeveCorrective','TrouserCorrective'])assert.ok(names.has(`Skin${side}${part}`),`${clip.name}: Skin${side}${part} binding missing`);
  }
});
test('prop grip follows a moving, scaled hand without scaling the metre-sized vessel',()=>{
  const actor=new THREE.Group(),arm=new THREE.Group(),hand=new THREE.Group(),palm=new THREE.Object3D(),props=new THREE.Group();
  actor.add(arm,props);arm.add(hand);hand.add(palm);hand.scale.setScalar(.82);hand.position.set(.31,.95,0);palm.position.set(0,-.038,.045);
  const vessel=new THREE.Group(),grip=new THREE.Object3D();props.add(vessel);vessel.add(grip);grip.position.set(0,.174,0);grip.updateMatrix();
  for(let i=0;i<40;i++){
    actor.position.set(i*.2,3.5,2);actor.rotation.y=i*.37;arm.rotation.x=-i*.03;hand.rotation.z=Math.sin(i)*.24;
    alignAtriumProp(vessel,grip,palm,props);
    assert.ok(grip.getWorldPosition(new THREE.Vector3()).distanceTo(palm.getWorldPosition(new THREE.Vector3()))<1e-8);
    assert.ok(vessel.getWorldScale(new THREE.Vector3()).distanceTo(new THREE.Vector3(1,1,1))<1e-8);
  }
});

test('decision requires discoveries and residents, changes memories once',()=>{
  const s=freshState();assert.equal(applyDecision(s,'balanced'),false);
  s.talked=['lin','chen'];s.discovered=['records','tea'];assert.ok(canDecide(s));
  assert.ok(applyDecision(s,'balanced',100));assert.equal(s.relations.lin,2);
  assert.equal(applyDecision(s,'together',200),false);assert.equal(s.journal.length,1);
  assert.match(residentSpeech(RESIDENTS[0],s),/谢谢/);
});
test('corrupt and unknown state cannot unlock decisions or destroy the main save',()=>{
  const s=normalizeState({version:1,talked:['unknown','lin','lin'],discovered:['tea','tea'],relations:{lin:99},decision:'__proto__',position:[0,Infinity,0]});
  assert.deepEqual(s.talked,['lin']);assert.deepEqual(s.discovered,['tea']);assert.equal(s.decision,null);assert.equal(s.position,null);assert.equal(s.relations.lin,10);
  const store={getItem(){return '{'},setItem(){throw new Error('quota');}};
  assert.equal(loadAtriumState(store).state.version,1);assert.match(saveAtriumState(s,store),/quota/);
});
test('discoveries alter local dialogue',()=>{
  const s=freshState();const before=residentSpeech(RESIDENTS[0],s);s.discovered.push('records');assert.notEqual(residentSpeech(RESIDENTS[0],s),before);
});
test('wall camera probes contract while residents remain physical but do not obstruct the orbit ray',async()=>{
  const p=await createAtriumPhysics(JSON.parse(await fs.readFile(new URL('../public/assets/atrium/collision.json',import.meta.url),'utf8')));
  try{
    const distance=p.cameraDistance({x:10.4,y:1.3,z:2},{x:1,y:0,z:0},3.3);
    assert.ok(distance<.6&&distance>=.2,String(distance));
    // The new visible flared stair shell occupies the old x=4 probe corridor.
    // It must obstruct the camera, while an NPC alone in the clear aisle must not.
    assert.ok(p.cameraDistance({x:4,y:1.3,z:4},{x:0,y:0,z:-1},2)<1,'visible curved stair wall contracts the camera');
    p.addResident('test',{x:3.1,y:0,z:2.5});p.teleport([3.1,0,4]);
    assert.equal(p.cameraDistance({x:3.1,y:1.3,z:4},{x:0,y:0,z:-1},2),2);
    for(let i=0;i<100;i++)p.move(0,-.0375);
    assert.ok(p.feet().z>3,'resident capsule stops the player');
  }finally{p.dispose();}
});
test('both physical stair flights are traversable and land on the upper floor',async()=>{
  const p=await createAtriumPhysics(JSON.parse(await fs.readFile(new URL('../public/assets/atrium/collision.json',import.meta.url),'utf8')));
  const go=(x,z,steps)=>{for(let i=0;i<steps;i++)p.move(x,z);return p.feet();};
  try{
    p.teleport([5.8,0,5.5]);let pos=go(0,-2.25/60,390);assert.ok(pos.y>3.45,JSON.stringify({main:pos}));assert.ok(pos.z< -5.2);
    pos=go(0,2.25/60,390);assert.ok(pos.y<.1,JSON.stringify({mainDown:pos}));
    p.teleport([-9.9,0,-4.35]);pos=go(0,2.25/60,390);assert.ok(pos.y>3.45,JSON.stringify({returnUp:pos}));
    pos=go(0,-2.25/60,390);assert.ok(pos.y<.1,JSON.stringify({returnDown:pos}));
    p.teleport([-.65,0,3]);pos=go(0,-2.25/60,200);assert.ok(pos.z>1.75,'table blocks a push through its centre; curved edges may slide');
    p.teleport([9,3.5,5.5]);pos=go(-2.25/60,0,150);assert.ok(pos.x>7.75,'upper guard stops a fall');
  }finally{p.dispose();}
});
