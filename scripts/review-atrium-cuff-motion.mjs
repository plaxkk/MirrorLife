// Diagnostic arm poses applied only to locally intercepted review responses.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const out=process.env.ATRIUM_REVIEW_OUTPUT;assert.ok(out);await fs.mkdir(out,{recursive:true});
const file=process.env.ATRIUM_REVIEW_CANDIDATE;assert.ok(file);
const mobile=process.env.ATRIUM_REVIEW_PROFILE==='mobile';
const body=await fs.readFile(file),response=await fetch(base+'/src/atrium-actors.js');assert.ok(response.ok);
const original=await response.text();
const anchor='        const smooth=poseVectors[key]||(poseVectors[key]=new THREE.Vector3(x,y,z));';
assert.equal(original.split(anchor).length,2);
let injected=original.replace(anchor,`        if(id==='you'&&window.__cuffPose?.[key]){[x,y,z]=window.__cuffPose[key];}\n`+anchor);
const after='q.setFromEuler(euler.set(smooth.x,smooth.y,smooth.z));entry.node.quaternion.copy(entry.rest).multiply(q);';
assert.equal(injected.split(after).length,2);
injected=injected.replace(after,after+`\n        if(id==='you'&&window.__cuffPose?.[key]){window.__cuffActual??={};window.__cuffActual[key]=smooth.toArray();window.__cuffPoints??={};window.__cuffPoints[key]=entry.node.getWorldPosition(new THREE.Vector3()).toArray();}`);
const cases=[['rest',0,0,0],['conversation',-.35,-.7,.15],['raised',-.8,-1.1,-.25],['wrist-flex',-.5,-.7,.45]];
const cameras=[['front',[-4.3,1.05,2.1],[-4.3,1,4]],['side',[-2.4,1.05,4],[-4.3,1,4]],['quarter',[-3.1,1.05,2.65],[-4.3,1,4]]];
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const errors=[],samples=[];let models=0,modules=0;
try{
 const page=await browser.newPage();await page.setViewport(mobile?{width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true}:{width:1200,height:1000});
 await page.setCacheEnabled(false);page.on('pageerror',e=>errors.push(String(e)));
 await page.setRequestInterception(true);page.on('request',r=>{
  const path=new URL(r.url()).pathname;
  if(path==='/src/atrium-actors.js'){modules++;return r.respond({status:200,contentType:'application/javascript',body:injected});}
  if(path===`/assets/atrium/residents/you${mobile?'-mobile':''}.glb`){models++;return r.respond({status:200,contentType:'model/gltf-binary',body});}
  return r.continue();
 });
 await page.goto(base+'/atrium.html?quality='+(mobile?'mobile':'desktop'));await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
 await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
 for(const [name,arm,elbow,hand]of cases){
  const pose=Object.fromEntries(['left','right'].flatMap(side=>[['Arm',arm],['Elbow',elbow],['Hand',hand]].map(([part,x])=>[side+part,[x,0,0]])));
  await page.evaluate(p=>{window.__cuffPose=p;},pose);
  await page.waitForFunction(p=>Object.entries(p).every(([k,a])=>window.__cuffActual?.[k]?.every((v,i)=>Math.abs(v-a[i])<.001)),{timeout:10000},pose);
  const wrist=await page.evaluate(()=>window.__cuffPoints.leftHand);
  const target=wrist.map((v,i)=>v+(i===1?.045:0));
  const wristCamera=['left-wrist',wrist.map((v,i)=>v+[.25,.15,-.38][i]),target];
  for(const [view,position,target]of [...cameras,wristCamera]){
   await page.evaluate(c=>window.__atrium.setReviewCamera(c.position,c.target),{position,target});
   await new Promise(r=>setTimeout(r,150));await page.screenshot({path:`${out}/${name}-${view}.png`});
  }
  samples.push({name,wristCamera,requested:pose,actual:await page.evaluate(()=>window.__cuffActual)});
 }
 assert.equal(modules,1);assert.ok(models>0);assert.deepEqual(errors,[]);
 await fs.writeFile(`${out}/report.json`,JSON.stringify({file,sha256:createHash('sha256').update(body).digest('hex'),moduleSha256:createHash('sha256').update(original).digest('hex'),injectedSha256:createHash('sha256').update(injected).digest('hex'),profile:mobile?'mobile-emulation':'desktop',models,modules,cameras,samples,errors,scope:'Four static diagnostic arm/elbow/wrist poses in the actual exported runtime rig. Local request injection only. Not natural animation, cloth collision proof, full motion range or real-device performance.'},null,2));
 console.log('CUFF_POSE_CAPTURES_READY',samples.length);
}finally{await browser.close();}
