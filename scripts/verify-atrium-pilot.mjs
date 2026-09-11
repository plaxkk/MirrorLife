import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {startAtriumRecording} from './lib/atrium-recorder.mjs';
import {atriumWalkKeys} from './lib/atrium-navigation.mjs';

const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
const mode=process.argv[2]||'smoke';
const output=path.resolve('evidence/atrium');await fs.mkdir(output,{recursive:true});
const buildEvidence=JSON.parse(await fs.readFile(path.join(output,'assets.json'),'utf8'));
// Native-window resize/focus changes can shrink the CDP recording surface.
// Record the same real WebGL scene without an OS window; performance/gallery
// continue to use visible Chrome. Report the distinction explicitly.
const headed=process.env.ATRIUM_HEADED==='1'&&process.env.ATRIUM_RECORD!=='1';
const evidenceMeta={capturedAt:new Date().toISOString(),runtimeFingerprint:buildEvidence.runtimeFingerprint,browserMode:headed?'headed':'headless'};
const browser=await puppeteer.launch({executablePath:process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:!headed,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-networking']});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const problems=[];
let recorder;
async function stopRecording(){
  if(!recorder)return;
  const current=recorder;recorder=null;
  let timer;
  try{await Promise.race([current.stop(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Recording finalization timed out')),20000);})]);}
  finally{clearTimeout(timer);}
}
try{
  const page=await browser.newPage();
  page.on('pageerror',e=>problems.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')problems.push(m.text());});
  page.on('requestfailed',r=>problems.push(r.url()+': '+r.failure()?.errorText));
  await page.setViewport({width:mode==='mobile'?390:1920,height:mode==='mobile'?844:1080,deviceScaleFactor:mode==='mobile'?3:1,isMobile:mode==='mobile',hasTouch:mode==='mobile'});
  await page.goto(base+'/atrium.html'+(mode==='mobile'?'?quality=mobile':''),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#enter')?.hidden===false||document.querySelector('#retry')?.hidden===false,{timeout:90000});
  const error=await page.$eval('#retry',e=>!e.hidden);if(error)throw new Error(await page.$eval('#loading-text',e=>e.textContent));
  if(mode==='walkthrough'&&process.env.ATRIUM_RECORD==='1')recorder=await startAtriumRecording(page,path.join(output,'playthrough.mp4'));
  await page.click('#enter');await pause(1800);
  if(mode==='walkthrough'){
    const trace=[],inputTrace=[];
    await page.evaluate(()=>{const sample=()=>{const c=document.querySelector('canvas').getBoundingClientRect();return {width:innerWidth,height:innerHeight,canvasWidth:c.width,canvasHeight:c.height};};window.__qaViewportSamples=[sample()];window.addEventListener('resize',()=>window.__qaViewportSamples.push(sample()));});
    await page.evaluate(()=>{window.__qaFocusEvents=[];window.__qaPointerEvents=[];for(const type of ['blur','focus','visibilitychange'])window.addEventListener(type,()=>window.__qaFocusEvents.push({type,time:performance.now(),hidden:document.hidden}));
      for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','pointermove'])window.addEventListener(type,e=>{window.__qaPointerEvents.push({type,buttons:e.buttons,x:e.clientX,y:e.clientY,time:performance.now()});if(window.__qaPointerEvents.length>150)window.__qaPointerEvents.shift();});});
    // Read position and camera yaw to steer; all movement uses real keys.
    async function walk(x,z,label){
      await page.bringToFront();
      let held=new Set();let previous=null,stuck=0;
      try{
        for(let i=0;i<150;i++){
          const {p,yaw}=await page.evaluate(()=>({p:window.__atrium.getPosition(),yaw:window.__atrium.getHeading()}));
          const dx=x-p.x,dz=z-p.z;
          if(Math.hypot(dx,dz)<.16){
            for(const k of held)await page.keyboard.up(k);held.clear();
            await pause(100);
            const stopped=await page.evaluate(()=>window.__atrium.getPosition());
            // CDP input release can queue behind capture work. Do not declare
            // arrival using the position sampled while the key was still held.
            if(Math.hypot(x-stopped.x,z-stopped.z)<.2){trace.push({label,position:stopped,heading:yaw});console.log('REACHED',label,stopped);return;}
            previous=null;stuck=0;continue;
          }
          // Mouse events need not add up to exactly one revolution. Translate
          // world-space goals into the same camera-relative axes as the player.
          const next=atriumWalkKeys(dx,dz,yaw);
          inputTrace.push({label,p,yaw,keys:[...next]});if(inputTrace.length>120)inputTrace.shift();
          for(const k of held)if(!next.has(k))await page.keyboard.up(k);
          // Real keyboards repeat held keys. Renew through CDP too: the app
          // correctly clears input on blur, while the harness's held set would
          // otherwise retain a key that the application no longer considers down.
          for(const k of next)await page.keyboard.down(k);
          held=next;await pause(110);
          if(previous&&Math.hypot(p.x-previous.x,p.z-previous.z)<.012)stuck++;else stuck=0;
          if(stuck>18)throw new Error(`Blocked walking to ${label}: ${JSON.stringify(p)}`);
          previous=p;
        }
        throw new Error('Walk timeout '+label);
      }finally{for(const k of held)await page.keyboard.up(k);}
    }
    async function interact(expected,screenshot){
      // Recording can delay the next HUD update; wait for visible feedback, not a
      // fixed sleep followed by stale text from the previous nearby object.
      await page.waitForFunction(pattern=>!document.querySelector('#interaction').hidden&&new RegExp(pattern).test(document.querySelector('#interaction-text').textContent),{timeout:4000},expected);
      const tooltip=await page.$eval('#interaction-text',e=>e.textContent);
      assert.match(tooltip,new RegExp(expected),`Expected interaction ${expected}, found ${tooltip}`);
      await page.keyboard.press('KeyE');await pause(550);
      // Still-image capture temporarily changes Chromium's visible surface.
      // Keep the uninterrupted recording independent; standalone runs save stills.
      if(screenshot&&!recorder)await page.screenshot({path:path.join(output,screenshot+'.png')});
    }
    const close=async()=>{await page.keyboard.press('Escape');await pause(150);};
    try{
      await walk(-4.3,3.6,'entry');
      // A full input-driven orbit (approximately 360 degrees), not a review-camera cut.
      await page.mouse.move(400,500);await page.mouse.down();await page.mouse.move(1656,500,{steps:60});await page.mouse.up();
      await walk(-4.8,3.6,'west chair bypass');await walk(-4.8,-2.15,'west of table');
      await walk(-3.3,-2.15,'reading planter bypass');await walk(-3.3,-2.95,'behind reading planter');await walk(-2.6,-2.95,'Lin');
      await interact('林晓','dialogue-lin');await close();
      await walk(.8,-2.95,'Chen');await interact('陈屿','dialogue-chen');await close();
      await walk(0,-5.65,'records');await interact('轮值手记','discovery-records');await close();
      await walk(3.45,-3.3,'back of shared table');await walk(3.45,5.65,'front circulation');
      await walk(9.1,5.65,'plant room approach');await walk(9.1,4.45,'plant room');
      await interact('照料薄荷','life-action');await page.waitForFunction(()=>window.__atrium.getState().discovered.includes('plant'),{timeout:15000});await close();
      await walk(9.1,5.65,'plant room return');await walk(3.1,5.65,'social centre return');await walk(.1,2.6,'decision table');
      await interact('商量今晚','decision');
      assert.match(await page.$eval('#dialogue-choices button:nth-child(3)',e=>e.textContent),/楼下分享/);
      await page.click('#dialogue-choices button:nth-child(3)');await pause(600);
      assert.equal(await page.evaluate(()=>window.__atrium.getState().decision),'balanced');if(!recorder)await page.screenshot({path:path.join(output,'decision-result.png')});await close();
      await walk(3.1,5.65,'stair approach');await walk(5.8,5.65,'main stair foot');await walk(5.8,-5.65,'main stair upper landing');
      assert.ok((await page.evaluate(()=>window.__atrium.getPosition())).y>3.45);
      if(!recorder)await page.screenshot({path:path.join(output,'upper-landing.png')});
      await walk(8.55,-5.65,'east gallery');await walk(8.55,3.65,'upper side room');await walk(9.1,3.65,'postcard');
      await interact('明信片','discovery-postcard');await close();
      await walk(8.55,3.65,'observation chair bypass');await walk(8.55,5.85,'observation aisle');await walk(9.35,5.85,'lookout');await interact('从楼上','upper-lookout');await close();
      await walk(9.5,5.35,'upper seat');await interact('落座','seated');await page.keyboard.press('KeyE');await pause(650);
      await walk(8.55,5.35,'leave observation seat');await walk(8.55,3.65,'east corridor return');await walk(8.55,-5.65,'east corridor back');await walk(-7.15,-5.65,'west gallery');
      await walk(-7.15,.4,'quiet conversation');await interact('周宁','dialogue-quiet');await close();
      await walk(-7.15,2.15,'record player');await interact('旧录音','discovery-record');await close();
      await walk(-7.15,6.2,'west front landing');await walk(-9.8,6.2,'shortcut');await interact('返回楼梯','shortcut');await close();
      await walk(-9.9,5.4,'return stair top');await walk(-9.9,-4.6,'return stair ground');
      assert.ok((await page.evaluate(()=>window.__atrium.getPosition())).y<.1);
      await walk(-8.65,-4.6,'west lower passage');await walk(-8.65,1.8,'tea corner');await interact('泡一杯','tea-action');await page.waitForFunction(()=>window.__atrium.getState().discovered.includes('tea'),{timeout:15000});await close();
      await walk(-8.65,4.9,'tea return');await walk(-4.3,4.9,'entry return');
      await page.click('#journal-button');if(!recorder)await page.screenshot({path:path.join(output,'journal.png')});await close();
      const before=await page.evaluate(()=>window.__atrium.getState());
      const viewportSamples=await page.evaluate(()=>window.__qaViewportSamples);
      assert.ok(viewportSamples.every(s=>s.width===1920&&s.height===1080&&s.canvasWidth===1920&&s.canvasHeight===1080),'Recording layout must retain the full viewport');
      await fs.writeFile(path.join(output,'walkthrough-trace.json'),JSON.stringify({...evidenceMeta,trace,viewportSamples,focusEvents:await page.evaluate(()=>window.__qaFocusEvents),state:before,stats:await page.evaluate(()=>window.__atrium.getStats())},null,2));
      await walk(-4.3,6.9,'exit');await interact('返回城市');await page.waitForFunction(()=>location.pathname==='/game.html',{timeout:10000});
      await stopRecording();
      await page.goto(base+'/atrium.html',{waitUntil:'domcontentloaded'});await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(500);
      const after=await page.evaluate(()=>window.__atrium.getState());assert.equal(after.decision,before.decision);assert.deepEqual(after.discovered,before.discovered);assert.deepEqual(after.talked,before.talked);
      console.log('WALKTHROUGH_PASS',JSON.stringify({discovered:after.discovered,talked:after.talked,decision:after.decision,waypoints:trace.length}));
    }catch(error){await page.screenshot({path:path.join(output,'walkthrough-failure.png')});await fs.writeFile(path.join(output,'walkthrough-failure.json'),JSON.stringify({...evidenceMeta,error:String(error),trace,inputTrace,inputEvents:await page.evaluate(()=>({focus:window.__qaFocusEvents,pointer:window.__qaPointerEvents})),state:await page.evaluate(()=>window.__atrium?.getState()),stats:await page.evaluate(()=>window.__atrium?.getStats())},null,2));throw error;}
    finally{await stopRecording();}
  }
  if(mode==='performance'||mode==='mobile'){
    const coldStart=await page.evaluate(()=>window.__atrium.getStats());
    let touchMovement=null;
    if(mode==='mobile'){
      const initial=await page.evaluate(()=>window.__atrium.getPosition());
      const stick=await page.$eval('#joystick',e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
      const client=await page.createCDPSession();
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...stick,id:1}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:stick.x,y:stick.y-30,id:1}]});await pause(900);
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      const final=await page.evaluate(()=>window.__atrium.getPosition());
      touchMovement={initial,final,distance:Math.hypot(final.x-initial.x,final.z-initial.z)};assert.ok(touchMovement.distance>.5,'touch joystick must move the player');
      await client.detach();
    }
    await page.evaluate(()=>window.__atrium.beginMeasurement());
    for(let i=0;i<6;i++){
      const start=mode==='mobile'?[330,390]:[700,400],end=mode==='mobile'?[120,390]:[490,400];
      await page.mouse.move(...start);await page.mouse.down();await page.mouse.move(...end,{steps:24});await page.mouse.up();
      await pause(5000);
    }
    const measured=await page.evaluate(()=>window.__atrium.getStats());
    await fs.writeFile(path.join(output,mode+'-measurement.json'),JSON.stringify({...evidenceMeta,method:'30+ seconds of input-driven orbit, after initial loading and 1.8 second warm-up; local Chrome. Mobile is viewport/touch/DPR emulation on desktop GPU, NOT phone hardware.',coldStart,touchMovement,measured,problems},null,2));
  }
  if(mode==='gallery'){
    const views=[
      ['first-floor',[-4.2,2.2,6.1],[.7,2.2,-2]],
      ['upper-floor',[8.8,5.2,-5.8],[-1,1.2,1.8]],
      ['quiet-room',[-7.05,5.05,4.7],[-7.9,4.3,.4]],
      ['back-view',[3.5,2.35,-6.7],[-2,1.6,5.5]],
      ['plant-room',[8,1.6,5.8],[9.35,1,2.9]],
      ['table-close',[-3.5,1.5,2.5],[-.65,.65,.1]],
      ['resident-close',[-3.7,1.5,-.1],[-2.2,1.05,-1.95]],
    ];
    const shots=[];
    for(const [name,position,target]of views){
      await page.evaluate(({position,target})=>{window.__atrium.setCapture(true);window.__atrium.setReviewCamera(position,target);},{position,target});await pause(450);
      await page.screenshot({path:path.join(output,name+'.png')});shots.push({name,position,target,stats:await page.evaluate(()=>window.__atrium.getStats())});
    }
    await page.evaluate(()=>{window.__atrium.setReviewPosition([9.1,0,4.45]);window.__atrium.setCapture(false);});await pause(300);await page.keyboard.press('KeyE');
    await page.evaluate(()=>window.__atrium.setReviewCamera([7.9,1.45,3.6],[9.25,1.05,4.1]));await pause(1000);await page.screenshot({path:path.join(output,'care-contact.png')});
    await fs.writeFile(path.join(output,'gallery-cameras.json'),JSON.stringify({...evidenceMeta,method:'Runtime review cameras for multi-view art inspection. Not traversal evidence; continuous keyboard playthrough is separate.',shots},null,2));
    await page.keyboard.press('Escape');
  }
  await page.screenshot({path:path.join(output,mode+'-entry.png')});
  await page.evaluate(()=>{window.__atrium.setCapture(true);window.__atrium.setReviewCamera(window.__atrium.calibration.position,window.__atrium.calibration.target);});await pause(800);
  await page.screenshot({path:path.join(output,mode+'-reference.png')});
  const stats=await page.evaluate(()=>window.__atrium.getStats());
  await fs.writeFile(path.join(output,mode+'-stats.json'),JSON.stringify({...evidenceMeta,stats,problems},null,2));
  console.log(JSON.stringify({stats,problems},null,2));
  assert.equal(stats.actors,7);assert.equal(problems.length,0);
}finally{try{await stopRecording();}finally{await browser.close();}}
