// Same runtime, alternating old/new model requests. Run without other QA jobs.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
const out=process.env.ATRIUM_REVIEW_OUTPUT||'evidence/atrium/groom-continuity/performance-ab';
const baseline=process.env.ATRIUM_HAIR_BASELINE||'tmp/groom-study/installed-before-authored';
const results=[];await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 for(const profile of ['desktop','mobile'])for(const variant of ['old','new','new','old']){
  const mobile=profile==='mobile',filename=`you${mobile?'-mobile':''}.glb`;
  const file=variant==='old'?`${baseline}/${filename}`:`public/assets/atrium/residents/${filename}`;
  const body=await fs.readFile(file),page=await browser.newPage(),errors=[];let requests=0;
  await page.setViewport({width:mobile?390:1920,height:mobile?844:1080,deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setCacheEnabled(false);await page.setRequestInterception(true);page.on('request',r=>{
   if(new URL(r.url()).pathname===`/assets/atrium/residents/${filename}`){requests++;return r.respond({status:200,contentType:'model/gltf-binary',body});}
   return r.continue();
  });
  await page.goto(`${base}/atrium.html?quality=${profile}`);await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await page.bringToFront();await wait(1800);
  const initial=await page.evaluate(()=>window.__atrium.getStats());await page.evaluate(()=>window.__atrium.beginMeasurement());
  for(let i=0;i<4;i++){
   const x=mobile?300:1000,y=mobile?390:650;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+(i%2?100:-100),y,{steps:24});await page.mouse.up();await wait(5000);
  }
  const stats=await page.evaluate(()=>window.__atrium.getStats());assert.ok(requests);assert.deepEqual(errors,[]);
  results.push({profile,variant,file,sha256:createHash('sha256').update(body).digest('hex'),requests,initial,stats,errors});
  await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),base,scope:'Alternating old/new/new/old GLBs on the same current runtime and host. Visible Chrome; mobile viewport emulation, not a phone. Host activity is uncontrolled. Diagnostic, not release certification.',results},null,2));
  console.log(profile,variant,JSON.stringify(stats.frameMs));await page.close();
 }
}finally{await browser.close();}
