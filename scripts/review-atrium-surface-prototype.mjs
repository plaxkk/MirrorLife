// Isolated visual fixture: mount Chen's existing rig in the player slot to
// compare identical cameras/expressions. This is NOT a gameplay acceptance run.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193';
const out=process.env.ATRIUM_REVIEW_OUTPUT||'evidence/atrium/cast-surfaces/chen-prototype';await fs.mkdir(out,{recursive:true});
const files={before:'public/assets/atrium/residents/chen.glb',after:process.env.ATRIUM_REVIEW_CANDIDATE||'tmp/cast-surfaces/chen/public/assets/atrium/residents/chen.glb'};
const cameras=[['body',[-4.3,1.12,1.6],[-4.3,1,4]],['front',[-4.3,1.57,3.40],[-4.3,1.55,4]],['side',[-3.62,1.57,4],[-4.3,1.55,4]],['back',[-4.3,1.57,4.70],[-4.3,1.55,4]],['quarter',[-3.85,1.57,3.48],[-4.3,1.55,4]]];
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const results=[];
try{
 for(const variant of ['before','after']){
  const body=await fs.readFile(files[variant]);const page=await browser.newPage();const errors=[];
  await page.setViewport({width:1200,height:1000});await page.setCacheEnabled(false);page.on('pageerror',e=>errors.push(String(e)));
  await page.setRequestInterception(true);page.on('request',r=>r.url().endsWith('/residents/you.glb')?r.respond({status:200,contentType:'model/gltf-binary',body}):r.continue());
  await page.goto(base+'/atrium.html');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
  await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
  const poses=[];
  for(const [pose,blink,talk] of [['neutral',0,0],['closed',1,0],['talk',0,1]]){
   await page.evaluate(v=>window.__atrium.setReviewFace(v),{blink,talk});
   for(const [name,pos,target] of cameras){
    if(pose!=='neutral'&&!['front','side'].includes(name))continue;
    await page.evaluate(({pos,target})=>window.__atrium.setReviewCamera(pos,target),{pos,target});
    await new Promise(r=>setTimeout(r,250));await page.screenshot({path:`${out}/${variant}-${pose}-${name}.png`});
   }
   const actual=await page.evaluate(()=>window.__atrium.getFaceDiagnostics());assert.equal(actual[0].blink,blink);assert.equal(actual[0].talk,talk);poses.push({pose,actual});
  }
  assert.deepEqual(errors,[]);results.push({variant,file:files[variant],sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length,poses,errors});await page.close();
 }
 await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),base,cameras,viewport:[1200,1000],scope:'Before/after Chen isolated visual prototype in the player review slot, same rig and cameras; forced neutral/closed/talk weights. This does not validate Chen in his native interaction role or the complete gameplay path.',results},null,2));
 console.log('SURFACE_PROTOTYPE_CAPTURES_READY');
}finally{await browser.close();}
