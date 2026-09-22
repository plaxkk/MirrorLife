// Same-camera hero art comparison, using isolated GLB request substitution.
// This is a visual fixture, not a gameplay/performance acceptance run.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193';
const out=process.env.ATRIUM_REVIEW_OUTPUT||'evidence/atrium/hero-art-study';await fs.mkdir(out,{recursive:true});
const files={before:process.env.ATRIUM_REVIEW_BASELINE,after:process.env.ATRIUM_REVIEW_CANDIDATE};
const mobile=process.env.ATRIUM_REVIEW_PROFILE==='mobile';
const partialBlink=process.env.ATRIUM_REVIEW_PARTIAL_BLINK==='1';
const viewport=mobile?{width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true}:{width:1200,height:1000};
assert.ok(files.before&&files.after,'Set ATRIUM_REVIEW_BASELINE and ATRIUM_REVIEW_CANDIDATE to immutable comparison assets');
const cameras=[['body',[-4.3,1.12,1.6],[-4.3,1,4]],['front',[-4.3,1.49,3.40],[-4.3,1.46,4]],['side',[-3.62,1.49,4],[-4.3,1.46,4]],['back',[-4.3,1.49,4.70],[-4.3,1.46,4]],['quarter',[-3.85,1.49,3.48],[-4.3,1.46,4]]];
if(process.env.ATRIUM_REVIEW_GROOM==='1')cameras.push(['left',[-4.98,1.49,4],[-4.3,1.46,4]],['crown',[-4.3,2.25,3.8],[-4.3,1.52,4]]);
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const results=[];
try{
 for(const variant of ['before','after']){
  const body=await fs.readFile(files[variant]);const page=await browser.newPage();const errors=[];let requests=0;
  await page.setViewport(viewport);await page.setCacheEnabled(false);page.on('pageerror',e=>errors.push(String(e)));
  await page.setRequestInterception(true);page.on('request',r=>{
   if(new URL(r.url()).pathname===`/assets/atrium/residents/you${mobile?'-mobile':''}.glb`){requests++;return r.respond({status:200,contentType:'model/gltf-binary',body});}
   return r.continue();
  });
  await page.goto(base+'/atrium.html?quality='+(mobile?'mobile':'desktop'));await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
  await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
  const poses=[];
  const fixtures=[['neutral',0,0],...(partialBlink?[['quarter-blink',.25,0],['half-blink',.5,0],['three-quarter-blink',.75,0]]:[]),['closed',1,0],['talk',0,1]];
  for(const [pose,blink,talk] of fixtures){
   await page.evaluate(v=>window.__atrium.setReviewFace(v),{blink,talk});
   for(const [name,pos,target] of cameras){
    if(pose!=='neutral'&&!['front','side'].includes(name))continue;
    await page.evaluate(({pos,target})=>window.__atrium.setReviewCamera(pos,target),{pos,target});
    await new Promise(r=>setTimeout(r,250));await page.screenshot({path:`${out}/${variant}-${pose}-${name}.png`});
   }
   const actual=await page.evaluate(()=>window.__atrium.getFaceDiagnostics());assert.equal(actual[0].blink,blink);assert.equal(actual[0].talk,talk);poses.push({pose,actual});
  }
  assert.ok(requests>0,'Comparison asset was never requested');
  assert.deepEqual(errors,[]);results.push({variant,file:files[variant],sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length,requests,poses,errors});await page.close();
 }
 await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),base,cameras,viewport,profile:mobile?'mobile-emulation':'desktop',partialBlink,scope:'Before/after hero isolated visual prototype in the player review slot, same rig and cameras; forced named facial weights. Mobile is desktop GPU viewport emulation. This does not validate the complete gameplay path or performance.',results},null,2));
 console.log('SURFACE_PROTOTYPE_CAPTURES_READY');
}finally{await browser.close();}
