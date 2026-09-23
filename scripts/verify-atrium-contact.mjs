// Pose/contact review fixtures, deliberately separate from the input-driven tour.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
const out=path.resolve(process.env.ATRIUM_CONTACT_OUTPUT||'evidence/atrium/character-contact');await fs.mkdir(out,{recursive:true});
const meta=JSON.parse(await fs.readFile(process.env.ATRIUM_ASSET_REPORT||'evidence/atrium/assets.json','utf8'));
const runtimeModules=Object.fromEntries(await Promise.all(['src/atrium-actors.js','src/atrium-main.js'].map(async file=>[file,createHash('sha256').update(await fs.readFile(file)).digest('hex')])));
const candidate=process.env.ATRIUM_REVIEW_CANDIDATE;
const mobile=process.env.ATRIUM_REVIEW_PROFILE==='mobile';
const candidateBody=candidate?await fs.readFile(candidate):null;let candidateRequests=0;
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding']});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),samples=[],errors=[];
try{
  const page=await browser.newPage();await page.setViewport(mobile?{width:430,height:932,deviceScaleFactor:1,isMobile:true,hasTouch:true}:{width:1600,height:1000,deviceScaleFactor:1});
  if(candidateBody){
    await page.setCacheEnabled(false);await page.setRequestInterception(true);
    page.on('request',r=>{
      if(new URL(r.url()).pathname===`/assets/atrium/residents/you${mobile?'-mobile':''}.glb`){
        candidateRequests++;return r.respond({status:200,contentType:'model/gltf-binary',body:candidateBody});
      }
      return r.continue();
    });
  }
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193')+'/atrium.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(700);
  for(const [id,position,views]of [
    ['plant',[9.1,0,4.45],[['side',[7.9,1.45,3.6],[9.25,1.05,4.1]],['front',[8.45,1.6,3.25],[9.2,1.12,4.35]],['hand',[8.4,1.25,3.8],[9.26,1.01,4.1]]]],
    ['tea',[-8.65,0,1.8],[['side',[-7.25,1.4,2.7],[-8.6,1.05,1.7]],['hand-reverse',[-8.95,1.16,1.10],[-8.4,1.0,1.38]],['hand-top',[-8.45,1.65,1.4],[-8.4,1.0,1.38]]]],
  ])for(const [name,camera,target]of views){
    await page.evaluate(position=>{window.__atrium.setCapture(false);window.__atrium.setReviewPosition(position);},position);
    await page.waitForFunction(expected=>!document.querySelector('#interaction').hidden&&document.querySelector('#interaction-text').textContent.includes(expected),{},id==='plant'?'照料薄荷':'泡一杯');const triggerTime=Date.now();await page.keyboard.press('KeyE');
    await page.waitForFunction(id=>window.__atrium.getInteractionState().care===id,{},id);
    await page.evaluate(({camera,target})=>{window.__atrium.setCapture(true);window.__atrium.setReviewCamera(camera,target);},{camera,target});
    if(process.env.ATRIUM_REQUIRE_REACH_TIMING==='1')await page.waitForFunction(()=>window.__atrium.getGripDiagnostics().find(a=>a.id==='you').handPoses.some(p=>p.grip>.95),{timeout:900});
    else await pause(450);
    const settledAfterMs=Date.now()-triggerTime;
    if(process.env.ATRIUM_REQUIRE_REACH_TIMING==='1')assert.ok(settledAfterMs<1000,'Reach took over one second');
    const activeGrips=await page.evaluate(()=>window.__atrium.getGripDiagnostics());
    assert.ok(activeGrips.find(a=>a.id==='you').grips.length,`${id}/${name}: capture during the action, not after it ends`);
    if(process.env.ATRIUM_REQUIRE_GRIP_MORPH==='1'){
      const poses=activeGrips.find(a=>a.id==='you').handPoses;
      assert.ok(poses.length&&poses.every(p=>p.grip>.95),'Grip morph did not close');
    }
    if(process.env.ATRIUM_REQUIRE_TEA_FIT==='1'){
      const poses=activeGrips.find(a=>a.id==='you').handPoses;
      assert.ok(poses.length&&poses.every(p=>id==='tea'?p.tea>.95&&p.generic<.01:p.generic>.95&&p.tea<.01),'Wrong prop-specific grip');
    }
    samples.push({action:id,view:name,settledAfterMs,actors:activeGrips});
    await page.screenshot({path:path.join(out,`${id}-${name}.png`)});
    if(id==='tea'&&name==='hand-top'){
      await page.waitForFunction(()=>!window.__atrium.getInteractionState().care,{timeout:10000});
      samples.push({action:'natural-completion',actors:await page.evaluate(()=>window.__atrium.getGripDiagnostics())});
    }
    await page.keyboard.press('Escape');await pause(150);
    if(process.env.ATRIUM_REQUIRE_TEA_FIT==='1'&&!(id==='tea'&&name==='hand-top')){
      assert.equal(await page.evaluate(()=>window.__atrium.getInteractionState().care),null);
      await pause(650);
      const cancelled=await page.evaluate(()=>window.__atrium.getGripDiagnostics());
      assert.ok(cancelled.find(a=>a.id==='you').handPoses.every(p=>p.grip<.01&&p.teaBlend<.01),'Grip or wrist remained after cancellation');
      samples.push({action:'cancelled',actors:cancelled});
    }
  }
  if(process.env.ATRIUM_REQUIRE_GRIP_MORPH==='1'){
    await page.waitForFunction(()=>!window.__atrium.getInteractionState().care);
    await pause(700);
    const released=await page.evaluate(()=>window.__atrium.getGripDiagnostics());
    const poses=released.find(a=>a.id==='you').handPoses;
    assert.ok(poses.length&&poses.every(p=>p.grip<.01),'Grip morph did not release');
    samples.push({action:'released',actors:released});
    await page.screenshot({path:path.join(out,'tea-released.png')});
  }
  for(let i=0;i<80;i++){await pause(180);samples.push({action:'resident-activity',actors:await page.evaluate(()=>window.__atrium.getGripDiagnostics())});}
  const grips=samples.flatMap(s=>s.actors.flatMap(a=>a.grips.map(g=>({...g,id:a.id}))));
  for(const id of ['you','xu','he'])assert.ok(grips.some(g=>g.id===id),`${id} has a sampled active prop`);
  for(const g of grips){assert.ok(g.errorMetres<.00001,JSON.stringify(g));assert.ok(g.scale.every(s=>Math.abs(s-1)<.00001),JSON.stringify(g));}
  assert.equal(errors.length,0);
  if(candidateBody)assert.ok(candidateRequests>0,'Candidate was not loaded');
  const report={runtimeModules,profile:mobile?'mobile-emulation':'desktop',capturedAt:new Date().toISOString(),runtimeFingerprint:candidateBody?null:meta.runtimeFingerprint,installedBaselineFingerprint:meta.runtimeFingerprint,candidate:candidateBody?{file:candidate,sha256:createHash('sha256').update(candidateBody).digest('hex'),requests:candidateRequests}:null,method:'Actual runtime E-key care actions, positioned review fixtures and multi-view cameras. NOT traversal or finger-surface contact proof. Grip-frame distance only; source topology and visual checks are separate.',maxGripFrameErrorMetres:Math.max(...grips.map(g=>g.errorMetres)),sampleCount:grips.length,samples,errors};
  await fs.writeFile(path.join(out,'contact.json'),JSON.stringify(report,null,2));console.log('CONTACT_PASS',report.sampleCount,report.maxGripFrameErrorMetres);
}finally{await browser.close();}
