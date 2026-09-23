// Decode the actual compressed portable asset and evaluate all animation clips.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
const candidate=process.env.ATRIUM_MOTION_CANDIDATE,out=process.env.ATRIUM_MOTION_REPORT;
assert.ok(candidate&&out);const body=await fs.readFile(candidate);
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();let intercepted=0;await page.setRequestInterception(true);
 page.on('request',r=>{if(new URL(r.url()).pathname==='/neck-animation-probe.glb'){intercepted++;return r.respond({status:200,contentType:'model/gltf-binary',body});}return r.continue();});
 await page.goto(base+'/');
 const report=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {loadAtriumGLB}=await import('/src/atrium-assets.js');
  const gltf=await loadAtriumGLB('/neck-animation-probe.glb'),root=gltf.scene;
  const controller=root.getObjectByName('HeadPivot'),bone=root.getObjectByName('SkinNeckHead');
  if(!bone?.parent)throw Error('Missing portable cervical bone');
  root.updateMatrixWorld(true);
  // Authoring places the scale-free rig at the controller's rest position. Animated
  // control nodes may omit default translation in glTF, so deriving rest from
  // the unsampled HeadPivot would invent an offset before its first key loads.
  if(bone.parent.name!=='CervicalRig')throw Error('Unexpected cervical bone parent');
  const restController=bone.parent.matrixWorld.clone().multiply(new THREE.Matrix4().makeScale(...controller.scale.toArray()));
  const offset=restController.invert().multiply(bone.matrixWorld);
  const mixer=new THREE.AnimationMixer(root),clips=[];
  for(const clip of gltf.animations){
   mixer.stopAllAction();const action=mixer.clipAction(clip);action.reset().play();
   let maxMatrixError=0,headMotion=0,first=null,diagnostic=null;
   for(let i=0;i<=24;i++){
    mixer.setTime(clip.duration*(i/25));root.updateMatrixWorld(true);
    const expected=bone.parent.matrixWorld.clone().invert().multiply(controller.matrixWorld).multiply(offset);
    maxMatrixError=Math.max(maxMatrixError,...expected.elements.map((v,j)=>Math.abs(v-bone.matrix.elements[j])));
    if(i===0)diagnostic={expected:expected.elements,actual:bone.matrix.elements.slice(),offset:offset.elements.slice()};
    if(!first)first=controller.quaternion.clone();headMotion=Math.max(headMotion,first.angleTo(controller.quaternion));
   }
   clips.push({diagnostic,name:clip.name,maxMatrixError,headMotion,hasCervicalTrack:clip.tracks.some(t=>t.name.startsWith('SkinNeckHead.')),samples:25});
  }
  return {clips,scope:'Actual GLTFLoader decoding and AnimationMixer evaluation, compares baked neck bone with HeadPivot rest-offset transform across nine clips. Not a visual, collision or gameplay acceptance.'};
 });
 report.passed=report.clips.length===9&&report.clips.every(c=>c.hasCervicalTrack&&c.maxMatrixError<.0001)&&report.clips.some(c=>c.headMotion>.01);
 await fs.writeFile(out,JSON.stringify({...report,assetSha256:createHash('sha256').update(body).digest('hex')},null,2));
 assert.equal(intercepted,1);assert.equal(report.clips.length,9);
 assert.ok(report.clips.every(c=>c.hasCervicalTrack&&c.maxMatrixError<.0001),JSON.stringify(report.clips));
 assert.ok(report.clips.some(c=>c.headMotion>.01),'No meaningful head motion was exercised');
 console.log('PORTABLE_CERVICAL_PASS',report.clips.length);
}finally{await browser.close();}
