// Pose/contact review fixtures, deliberately separate from the input-driven tour.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const out=path.resolve('evidence/atrium/character-contact');await fs.mkdir(out,{recursive:true});
const meta=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding']});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),samples=[],errors=[];
try{
  const page=await browser.newPage();await page.setViewport({width:1600,height:1000,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193')+'/atrium.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(700);
  for(const [id,position,views]of [
    ['plant',[9.1,0,4.45],[['side',[7.9,1.45,3.6],[9.25,1.05,4.1]],['front',[8.45,1.6,3.25],[9.2,1.12,4.35]],['hand',[8.4,1.25,3.8],[9.26,1.01,4.1]]]],
    ['tea',[-8.65,0,1.8],[['side',[-7.25,1.4,2.7],[-8.6,1.05,1.7]]]],
  ])for(const [name,camera,target]of views){
    await page.evaluate(position=>{window.__atrium.setCapture(false);window.__atrium.setReviewPosition(position);},position);
    await page.waitForFunction(expected=>!document.querySelector('#interaction').hidden&&document.querySelector('#interaction-text').textContent.includes(expected),{},id==='plant'?'照料薄荷':'泡一杯');await page.keyboard.press('KeyE');
    await page.waitForFunction(id=>window.__atrium.getInteractionState().care===id,{},id);
    await page.evaluate(({camera,target})=>{window.__atrium.setCapture(true);window.__atrium.setReviewCamera(camera,target);},{camera,target});
    await pause(450);
    const activeGrips=await page.evaluate(()=>window.__atrium.getGripDiagnostics());
    assert.ok(activeGrips.find(a=>a.id==='you').grips.length,`${id}/${name}: capture during the action, not after it ends`);
    samples.push({action:id,view:name,actors:activeGrips});
    await page.screenshot({path:path.join(out,`${id}-${name}.png`)});await page.keyboard.press('Escape');await pause(150);
  }
  for(let i=0;i<80;i++){await pause(180);samples.push({action:'resident-activity',actors:await page.evaluate(()=>window.__atrium.getGripDiagnostics())});}
  const grips=samples.flatMap(s=>s.actors.flatMap(a=>a.grips.map(g=>({...g,id:a.id}))));
  for(const id of ['you','xu','he'])assert.ok(grips.some(g=>g.id===id),`${id} has a sampled active prop`);
  for(const g of grips){assert.ok(g.errorMetres<.00001,JSON.stringify(g));assert.ok(g.scale.every(s=>Math.abs(s-1)<.00001),JSON.stringify(g));}
  assert.equal(errors.length,0);
  const report={capturedAt:new Date().toISOString(),runtimeFingerprint:meta.runtimeFingerprint,method:'Actual runtime E-key care actions, positioned review fixtures and multi-view cameras. NOT traversal or finger-surface contact proof. Grip-frame distance only; source topology and visual checks are separate.',maxGripFrameErrorMetres:Math.max(...grips.map(g=>g.errorMetres)),sampleCount:grips.length,samples,errors};
  await fs.writeFile(path.join(out,'contact.json'),JSON.stringify(report,null,2));console.log('CONTACT_PASS',report.sampleCount,report.maxGripFrameErrorMetres);
}finally{await browser.close();}
