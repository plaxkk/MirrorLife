import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='evidence/atrium/window-contact';await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)),results=[],errors=[];
try{
  const page=await browser.newPage();await page.setViewport({width:1280,height:720});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193')+'/atrium.html');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
  for(const floor of [0,3.5])for(const side of [-1,1]){
    const id=`window-${floor}-${side}`;
    await page.evaluate(({floor,side})=>{window.__atrium.setReviewPosition([side*9.8,floor,-7.4]);window.__atrium.setHeading(-side*Math.PI/2);},{floor,side});await wait(400);
    await page.keyboard.down('KeyW');await wait(1800);await page.keyboard.up('KeyW');await wait(350);
    const state=await page.evaluate(()=>({position:window.__atrium.getPosition(),clear:window.__atrium.isPositionClear(),camera:window.__atrium.getCameraDiagnostics()}));
    assert.ok(Math.abs(state.position.x)<10.5,JSON.stringify(state));assert.ok(state.clear,JSON.stringify(state));assert.ok(Math.abs(state.position.y-floor)<.1,JSON.stringify(state));
    await page.screenshot({path:`${out}/${id}.png`});
    // A separate interior camera exposes the body/window gap hidden when the
    // follow camera must fade the avatar against the adjacent corner wall.
    await page.evaluate(({side,floor,p})=>window.__atrium.setReviewCamera([side*8.4,floor+1.5,-5.8],[p.x,p.y+.85,p.z]),{side,floor,p:state.position});await wait(300);
    await page.screenshot({path:`${out}/${id}-contact.png`});await page.evaluate(()=>window.__atrium.followCamera());
    results.push({id,...state});
  }
  await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.8,0,3.6]);window.__atrium.setHeading(0);});await wait(500);
  await page.evaluate(()=>{window.__followSamples=[];window.__followSampling=true;const sample=()=>{if(!window.__followSampling)return;window.__followSamples.push({t:performance.now(),...window.__atrium.getCameraDiagnostics()});requestAnimationFrame(sample);};requestAnimationFrame(sample);});
  await page.keyboard.down('KeyW');await wait(2100);await page.keyboard.up('KeyW');await wait(350);
  const samples=await page.evaluate(()=>{window.__followSampling=false;return window.__followSamples;});
  const pitches=samples.map(s=>s.lookPitch),range=Math.max(...pitches)-Math.min(...pitches);
  assert.ok(range<.025,`flat walking camera pitch variation ${range}`);
  assert.ok(samples.every(s=>Math.abs(s.clearancePitch-s.pitch)<1e-6),'automatic pitch mode returned');
  assert.deepEqual(errors,[]);await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),scope:'Four input-driven window pushes from reachable rear-corner fixtures, physical capsule clearance, flat-walk camera angles. Does not certify every animated hand or garment vertex.',results,camera:{pitchRange:range,samples},errors},null,2));
  console.log('WINDOW_CONTACT_READY',results.length,'PITCH_RANGE',range);
}finally{await browser.close();}
