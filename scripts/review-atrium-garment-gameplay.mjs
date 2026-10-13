// Real entry/WASD/orbit/dialogue comparison; close cameras are separately labelled.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {atriumWalkKeys} from './lib/atrium-navigation.mjs';
const out=process.argv[2];assert.ok(out);
const variants=[['installed','public/assets/atrium/residents/lin.glb'],
 ['panels','tmp/portrait-study/garment-panels-v2/public/assets/atrium/residents/lin.glb'],
 ['edited','tmp/portrait-study/panel-armscye-v1/public/assets/atrium/residents/lin.glb']];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 for(const [name,file] of variants){
  const folder=path.join(out,name);await fs.mkdir(folder,{recursive:true});
  const context=await browser.createBrowserContext(),page=await context.newPage();
  const body=await fs.readFile(file),errors=[],failedAssets=[],trace=[],inputs=[],captures=[];let requests=0;
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('requestfailed',r=>{if(new URL(r.url()).pathname.endsWith('.glb'))failedAssets.push(r.url());});
  await page.setRequestInterception(true);
  page.on('request',r=>{if(new URL(r.url()).pathname==='/assets/atrium/residents/lin.glb'){requests++;r.respond({status:200,contentType:'model/gltf-binary',body});}else r.continue();});
  await page.setViewport({width:1600,height:1000,deviceScaleFactor:1});
  async function snapshot(label,kind='player-camera'){
   const state=await page.evaluate(()=>({position:window.__atrium.getPosition(),camera:window.__atrium.getCameraDiagnostics(),interaction:window.__atrium.getInteractionState(),talked:window.__atrium.getState().talked}));
   captures.push({label,kind,...state});await page.screenshot({path:path.join(folder,label+'.png')});
  }
  async function walk(x,z,label){
   let held=new Set(),previous=null,stuck=0;
   try{
    for(let i=0;i<150;i++){
     const {p,yaw}=await page.evaluate(()=>({p:window.__atrium.getPosition(),yaw:window.__atrium.getHeading()}));
     const dx=x-p.x,dz=z-p.z;
     if(Math.hypot(dx,dz)<.16){
      for(const key of held)await page.keyboard.up(key);held.clear();await pause(100);
      const stopped=await page.evaluate(()=>window.__atrium.getPosition());
      if(Math.hypot(x-stopped.x,z-stopped.z)<.2){trace.push({label,position:stopped});return;}
      previous=null;stuck=0;continue;
     }
     const next=atriumWalkKeys(dx,dz,yaw);inputs.push({label,position:p,heading:yaw,keys:[...next]});
     for(const key of held)if(!next.has(key))await page.keyboard.up(key);
     for(const key of next)await page.keyboard.down(key);
     held=next;await pause(110);
     stuck=previous&&Math.hypot(p.x-previous.x,p.z-previous.z)<.012?stuck+1:0;
     assert.ok(stuck<=18,`Blocked route ${label}: ${JSON.stringify(p)}`);previous=p;
    }
    throw new Error('Walk timeout '+label);
   }finally{for(const key of held)await page.keyboard.up(key);}
  }
  try{
   await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203')+'/atrium.html');
   await page.waitForFunction(()=>document.querySelector('#enter')?.hidden===false,{timeout:90000});
   await page.click('#enter');await pause(900);await snapshot('entry');
   for(const [x,z,label] of [[-4.3,3.6,'entry aisle'],[-4.8,3.6,'west chair bypass'],[-4.8,-2.15,'west table'],[-3.3,-2.15,'planter bypass'],[-3.3,-2.95,'behind planter'],[-2.6,-2.95,'Lin approach']])await walk(x,z,label);
   await snapshot('approach');
   for(let i=0;i<4;i++){
    const before=await page.evaluate(()=>window.__atrium.getHeading());
    await page.mouse.move(700,380);await page.mouse.down();await page.mouse.move(1014,380,{steps:16});await page.mouse.up();await pause(750);
    const after=await page.evaluate(()=>window.__atrium.getHeading());
    assert.ok(Math.abs(Math.atan2(Math.sin(after-before),Math.cos(after-before)))>.8,'Orbit input did not turn camera');
    inputs.push({type:'mouse-orbit',before,after,deltaPixels:314});await snapshot('orbit-'+i);
   }
   await page.waitForFunction(()=>!document.querySelector('#interaction').hidden&&document.querySelector('#interaction-text').textContent.includes('林晓'),{timeout:5000});
   await page.keyboard.press('KeyE');
   await page.waitForFunction(()=>window.__atrium.getInteractionState().dialogue==='lin',{timeout:5000});
   await page.waitForFunction(()=>window.__atrium.getInteractionState().residents.find(r=>r.id==='lin').seatBlend<.05,{timeout:10000});
   await snapshot('dialogue-standing');
   await page.click('#dialogue-choices button');await pause(1500);await snapshot('dialogue-reply');
   // Actual standing/talking state and game lighting; only these cameras are fixtures.
   const lin=await page.evaluate(()=>window.__atrium.getInteractionState().residents.find(r=>r.id==='lin'));
   for(const [view,offset] of [['front',0],['side',Math.PI/2],['back',Math.PI]]){
    const angle=lin.yaw+offset,position=[lin.position[0]+1.8*Math.sin(angle),lin.position[1]+1.15,lin.position[2]+1.8*Math.cos(angle)],target=[lin.position[0],lin.position[1]+1.05,lin.position[2]];
    await page.evaluate(({position,target})=>{window.__atrium.setCapture(true);window.__atrium.setReviewCamera(position,target);},{position,target});
    await pause(250);await snapshot('cloth-'+view,'review-camera / live dialogue state');
   }
   await page.evaluate(()=>{window.__atrium.setCapture(false);window.__atrium.followCamera();});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__atrium.getInteractionState().dialogue===null);
   await walk(-3.3,-2.95,'leave conversation');await walk(-4.8,-2.15,'leave reading area');
   await page.waitForFunction(()=>window.__atrium.getInteractionState().residents.find(r=>r.id==='lin').seatBlend>.95,{timeout:10000});
   await snapshot('seated-again');
   assert.equal(requests,1);assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);
   assert.ok(captures.find(c=>c.label==='dialogue-standing').talked.includes('lin'));
   await fs.writeFile(path.join(folder,'report.json'),JSON.stringify({name,file,assetSHA:createHash('sha256').update(body).digest('hex'),requests,trace,inputs,captures,errors,failedAssets,passed:true,scope:'Fresh browser storage per variant. Actual entry, WASD traversal, four mouse-drag camera turns, E dialogue, UI reply, Escape and departure/reseating. Labelled close review cameras do not teleport actors or replace animation. Desktop only; no full-game/performance/mobile/contact-surface certification. Poses and elapsed lighting are not frame matched.'},null,2));
   console.log('GARMENT_GAMEPLAY_PASS',name);
  }catch(error){
   await page.screenshot({path:path.join(folder,'failure.png')}).catch(()=>{});
   await fs.writeFile(path.join(folder,'failure.json'),JSON.stringify({error:String(error),trace,inputs,captures,errors,failedAssets},null,2));throw error;
  }finally{await context.close();}
 }
}finally{await browser.close();}
