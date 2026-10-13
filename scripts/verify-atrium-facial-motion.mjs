// Review-only expression fixtures plus an unmodified automatic blink observation.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193',out='evidence/atrium/facial-motion';
await fs.mkdir(out,{recursive:true});
const asset=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:process.env.ATRIUM_HEADED!=='1',args:['--no-sandbox']});
const errors=[],poses=[];let samples=[],responsePeak=0;
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(String(e)));await page.setViewport({width:1200,height:1000});
 await page.goto(base+'/atrium.html');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
 await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
 samples=await page.evaluate(()=>new Promise(resolve=>{const samples=[],start=performance.now();function tick(){samples.push(window.__atrium.getFaceDiagnostics());if(performance.now()-start>9600)resolve(samples);else requestAnimationFrame(tick);}tick();}));
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
 await page.waitForFunction(()=>!document.querySelector('#interaction').hidden&&document.querySelector('#interaction-text').textContent.includes('聊聊'));
 await fs.writeFile(`${out}/dialogue-input.json`,JSON.stringify(await page.evaluate(()=>({prompt:document.querySelector('#interaction-text').textContent,position:window.__atrium.getPosition(),state:window.__atrium.getInteractionState()})),null,2));
 await page.keyboard.press('KeyE');
 await page.waitForSelector('#dialogue:not([hidden])');await page.click('#dialogue-choices button:first-child');
 responsePeak=await page.evaluate(()=>new Promise(resolve=>{let peak=0;const start=performance.now();function tick(){peak=Math.max(peak,...window.__atrium.getFaceDiagnostics().map(x=>x.talk));if(performance.now()-start>1300)resolve(peak);else requestAnimationFrame(tick);}tick();}));
 assert.ok(responsePeak>.4,'Choosing a spoken player question must animate the mouth');await page.keyboard.press('Escape');
 await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
 await page.close();assert.deepEqual(errors,[]);
 await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:asset.runtimeFingerprint,base,browserMode:process.env.ATRIUM_HEADED==='1'?'headed':'headless',viewport:[1200,1000],portraitPlayerYaw:Math.PI,portraitCameras:{front:[-4.3,1.49,3.45],side:[-3.6,1.48,4],target:[-4.3,1.46,4]},playerQuestionTalkPeak:responsePeak,automaticBlink:{samples:values.length,min:Math.min(...values),max:Math.max(...values)},poses,errors,scope:'Automatic blink sampled in live runtime. Still images force named facial weights for inspection only; they do not replace gameplay or prove lip sync, eyelid contact or human visual approval.'},null,2));
 console.log('FACIAL_MOTION_PASS',values.length);
}finally{await browser.close();}
