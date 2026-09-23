// Local-only head pose probe. No production module or actor controller is edited.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const path=process.env.ATRIUM_REVIEW_CANDIDATE;assert.ok(path);
const out=process.env.ATRIUM_REVIEW_OUTPUT;assert.ok(out);await fs.mkdir(out,{recursive:true});
const body=await fs.readFile(path),response=await fetch(base+'/src/atrium-actors.js');assert.ok(response.ok);
const original=await response.text();
const anchor='        const smooth=poseVectors[key]||(poseVectors[key]=new THREE.Vector3(x,y,z));';
assert.equal(original.split(anchor).length,2);
let injected=original.replace(anchor,`        if(id==='you'&&key==='headGroup'&&window.__neckPose){[x,y,z]=window.__neckPose;}\n`+anchor);
const after='q.setFromEuler(euler.set(smooth.x,smooth.y,smooth.z));entry.node.quaternion.copy(entry.rest).multiply(q);';
assert.equal(injected.split(after).length,2);
injected=injected.replace(after,after+`\n        if(id==='you'&&key==='headGroup')window.__neckActual={angles:smooth.toArray(),relativeQuaternion:q.toArray(),jointQuaternion:entry.node.quaternion.toArray()};`);
const probeAnchor='  const poseVectors={};let reviewFace=null;';
assert.equal(injected.split(probeAnchor).length,2);
injected=injected.replace(probeAnchor,probeAnchor+`
  if(id==='you')window.__neckSkinProbe=()=>{
   const mesh=visual.getObjectByName('Head');
   if(!mesh?.isSkinnedMesh)return null;
   visual.updateMatrixWorld(true);mesh.skeleton.update();
   const inv=visual.matrixWorld.clone().invert(),fixed=mesh.skeleton.bones.findIndex(b=>b.name==='SkinNeckAnchor');
   const joints=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight,points=[];
   for(let i=0;i<joints.count;i++){
    let w=0;for(let j=0;j<4;j++)if(joints[['getX','getY','getZ','getW'][j]](i)===fixed)w+=weights[['getX','getY','getZ','getW'][j]](i);
    if(w>.99999){const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);points.push(p.toArray());}
   }
   return points;
  }`);
let neutralAnchor=null;const anchorErrors=[];
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const poses=[['neutral',[0,0,0]],['left',[0,-.45,0]],['right',[0,.45,0]],['pitch-positive',[.25,0,0]],['pitch-negative',[-.25,0,0]],['combined',[.2,.45,0]]];
const cameras=[['front',[-4.3,1.44,3.27],[-4.3,1.39,4]],['side',[-3.57,1.44,4],[-4.3,1.39,4]],['quarter',[-3.83,1.44,3.44],[-4.3,1.39,4]]];
const samples=[],errors=[];let modelRequests=0,moduleRequests=0;
try{
 const page=await browser.newPage();await page.setViewport({width:1200,height:1000});await page.setCacheEnabled(false);
 page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);
 page.on('request',r=>{
  const pathname=new URL(r.url()).pathname;
  if(pathname==='/src/atrium-actors.js'){moduleRequests++;return r.respond({status:200,contentType:'application/javascript',body:injected});}
  if(pathname==='/assets/atrium/residents/you.glb'){modelRequests++;return r.respond({status:200,contentType:'model/gltf-binary',body});}
  return r.continue();
 });
 await page.goto(base+'/atrium.html?quality=desktop');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
 await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);window.__atrium.setReviewFace({blink:0,talk:0});});
 for(const [name,angles]of poses){
  await page.evaluate(a=>{window.__neckPose=a;},angles);
  await page.waitForFunction(a=>window.__neckActual?.angles.every((v,i)=>Math.abs(v-a[i])<.001),{timeout:10000},angles);
  const anchorPoints=await page.evaluate(()=>window.__neckSkinProbe());
  if(anchorPoints){
   assert.ok(anchorPoints.length>0);
   if(!neutralAnchor)neutralAnchor=anchorPoints;
   assert.equal(anchorPoints.length,neutralAnchor.length);
   const maximum=Math.max(...anchorPoints.map((p,i)=>Math.hypot(...p.map((v,j)=>v-neutralAnchor[i][j]))));
   anchorErrors.push({name,vertices:anchorPoints.length,maxBodyLocalDisplacement:maximum});
   assert.ok(maximum<1e-5,'Collar anchor moved with the head');
  }
  for(const [view,position,target]of cameras){
   await page.evaluate(v=>window.__atrium.setReviewCamera(v.position,v.target),{position,target});
   await new Promise(r=>setTimeout(r,150));await page.screenshot({path:`${out}/${name}-${view}.png`});
   samples.push({name,view,requestedAngles:angles,actual:await page.evaluate(()=>window.__neckActual)});
  }
 }
 assert.equal(moduleRequests,1);assert.ok(modelRequests>0);assert.deepEqual(errors,[]);
 await fs.writeFile(`${out}/report.json`,JSON.stringify({asset:path,assetSha256:createHash('sha256').update(body).digest('hex'),originalModuleSha256:createHash('sha256').update(original).digest('hex'),injectedModuleSha256:createHash('sha256').update(injected).digest('hex'),cameras,samples,anchorErrors,errors,scope:'Six diagnostic relative head poses; local response injection only. Real exported head/neck and runtime smoothing/rig. Static multi-angle visual probe, not natural animation, full range coverage or gameplay acceptance.'},null,2));
 console.log('NECK_POSE_CAPTURES_READY',samples.length);
}finally{await browser.close();}
