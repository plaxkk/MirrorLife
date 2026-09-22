// Review-only expression fixtures plus an unmodified automatic blink observation.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {startAtriumRecording} from './lib/atrium-recorder.mjs';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193',out=process.env.ATRIUM_FACE_OUTPUT||'evidence/atrium/facial-motion';
const mobile=process.env.ATRIUM_REVIEW_PROFILE==='mobile';
const viewport=mobile?{width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true}:{width:1200,height:1000};
const candidate=process.env.ATRIUM_REVIEW_CANDIDATE;
const body=candidate?await fs.readFile(candidate):null;
let requests=0,recorder=null,page;
await fs.mkdir(out,{recursive:true});
const asset=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:process.env.ATRIUM_HEADED!=='1',args:['--no-sandbox']});
const errors=[],poses=[];let samples=[],responsePeak=0;
try{
 page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));await page.setViewport(viewport);
 if(body){await page.setCacheEnabled(false);await page.setRequestInterception(true);page.on('request',r=>{
  if(new URL(r.url()).pathname===`/assets/atrium/residents/you${mobile?'-mobile':''}.glb`){requests++;return r.respond({status:200,contentType:'model/gltf-binary',body});}
  return r.continue();
 });}
 await page.goto(base+'/atrium.html?quality='+(mobile?'mobile':'desktop'));await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
 await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
 await page.evaluate(()=>window.__atrium.setReviewCamera([-4.3,1.49,3.45],[-4.3,1.46,4]));
 if(process.env.ATRIUM_RECORD==='1')recorder=await startAtriumRecording(page,`${out}/automatic-blink.mp4`);
 samples=await page.evaluate(()=>new Promise(resolve=>{const samples=[],start=performance.now();function tick(){samples.push(window.__atrium.getFaceDiagnostics());if(performance.now()-start>9600)resolve(samples);else requestAnimationFrame(tick);}tick();}));
 if(recorder){await recorder.stop();recorder=null;await page.setViewport(viewport);}
 await fs.writeFile(`${out}/automatic-blink-samples.json`,JSON.stringify(samples));
 const values=samples.flat().map(x=>x.blink);assert.ok(values.length>30);assert.ok(Math.max(...values)>.8&&Math.min(...values)<.01,'Real automatic blink must close and reopen the native lids');
 for(const [name,blink,talk] of [['neutral',0,0],['closed',1,0],['talk',0,1]]){
  await page.evaluate(({blink,talk})=>window.__atrium.setReviewFace({blink,talk}),{blink,talk});
  for(const [angle,position] of [['front',[-4.3,1.49,3.45]],['side',[-3.6,1.48,4]]]){
   await page.evaluate(p=>window.__atrium.setReviewCamera(p,[-4.3,1.46,4]),position);await new Promise(r=>setTimeout(r,150));
   const yaw=await page.evaluate(()=>window.__atrium.getCameraDiagnostics().playerYaw);assert.ok(Math.abs(Math.atan2(Math.sin(yaw-Math.PI),Math.cos(yaw-Math.PI)))<.02,'Portrait fixture must face the front camera');
   await page.screenshot({path:`${out}/${name}-${angle}.png`});
  }
  const actual=await page.evaluate(()=>window.__atrium.getFaceDiagnostics());assert.equal(actual[0].blink,blink);assert.equal(actual[0].talk,talk);if(poses.length)assert.deepEqual(actual[0].eyeScales,poses[0].actual[0].eyeScales,'Native eyelids must close without shrinking the eyeballs');poses.push({name,actual});
 }
 await page.evaluate(()=>window.__atrium.setReviewFace(null));
 await page.evaluate(()=>{window.__atrium.setCapture(false);window.__atrium.setReviewPosition([-2.6,0,-2.6]);});
 await page.bringToFront();
 await page.setViewport(viewport);
 await fs.writeFile(`${out}/input-viewport.json`,JSON.stringify(await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visual:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null,button:document.querySelector('#mobile-interact').getBoundingClientRect().toJSON()})),null,2));
 await page.waitForFunction(()=>!document.querySelector('#interaction').hidden&&document.querySelector('#interaction-text').textContent.includes('聊聊'));
 await fs.writeFile(`${out}/dialogue-input.json`,JSON.stringify(await page.evaluate(()=>({prompt:document.querySelector('#interaction-text').textContent,position:window.__atrium.getPosition(),state:window.__atrium.getInteractionState()})),null,2));
 if(mobile)await page.tap('#mobile-interact');else await page.keyboard.press('KeyE');
 await page.waitForSelector('#dialogue-choices button:first-child',{visible:true});
 if(mobile)await page.tap('#dialogue-choices button:first-child');else await page.click('#dialogue-choices button:first-child');
 responsePeak=await page.evaluate(()=>new Promise(resolve=>{let peak=0;const start=performance.now();function tick(){peak=Math.max(peak,...window.__atrium.getFaceDiagnostics().map(x=>x.talk));if(performance.now()-start>1300)resolve(peak);else requestAnimationFrame(tick);}tick();}));
 assert.ok(responsePeak>.4,'Choosing a spoken player question must animate the mouth');
 if(mobile)await page.tap('#dialogue-close');else await page.keyboard.press('Escape');
 await page.waitForSelector('#dialogue[hidden]');
 await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
 await page.close();assert.deepEqual(errors,[]);if(candidate)assert.ok(requests>0,'Candidate asset was not loaded');
 await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:candidate?null:asset.runtimeFingerprint,installedBaselineFingerprint:asset.runtimeFingerprint,candidate:candidate?{file:candidate,sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length,requests}:null,base,browserMode:process.env.ATRIUM_HEADED==='1'?'headed':'headless',viewport,profile:mobile?'mobile-emulation':'desktop',portraitPlayerYaw:Math.PI,portraitCameras:{front:[-4.3,1.49,3.45],side:[-3.6,1.48,4],target:[-4.3,1.46,4]},playerQuestionTalkPeak:responsePeak,automaticBlink:{samples:values.length,min:Math.min(...values),max:Math.max(...values)},poses,errors,scope:'Automatic blink sampled in live runtime. Still images force named facial weights for inspection only; they do not replace gameplay or prove lip sync, eyelid contact or human visual approval.'},null,2));
 console.log('FACIAL_MOTION_PASS',values.length);
}catch(error){
 await fs.writeFile(`${out}/failure.json`,JSON.stringify({error:String(error),candidate,requests,profile:mobile?'mobile-emulation':'desktop'},null,2));
 if(page&&!page.isClosed())await page.screenshot({path:`${out}/failure.png`});
 throw error;
}finally{if(recorder)await recorder.stop();await browser.close();}
