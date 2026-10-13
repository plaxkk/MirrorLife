// Diagnostic only: alternate one resident GLB in the same current runtime.
// Never substitute this comparison for the production candidate measurement.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const baseline=process.env.ATRIUM_HERO_BASELINE;
assert.ok(baseline,'Set ATRIUM_HERO_BASELINE to the previous player GLB');
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193';
const buffers={old:await fs.readFile(baseline),current:await fs.readFile('public/assets/atrium/residents/you.glb')};
const candidate=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const results=[],errors=[];const pause=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
try{
  for(const variant of ['old','current','current','old']){
    const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});await page.setCacheEnabled(false);
    page.on('pageerror',e=>errors.push(String(e)));await page.setRequestInterception(true);
    page.on('request',r=>r.url().endsWith('/residents/you.glb')?r.respond({status:200,contentType:'model/gltf-binary',body:buffers[variant]}):r.continue());
    await page.goto(base+'/atrium.html');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(1800);
    await page.evaluate(()=>window.__atrium.beginMeasurement());
    for(let i=0;i<6;i++){
      await page.mouse.move(700,400);await page.mouse.down();await page.mouse.move(490,400,{steps:24});await page.mouse.up();await pause(5000);
    }
    const measured=await page.evaluate(()=>window.__atrium.getStats());
    results.push({variant,assetSha256:createHash('sha256').update(buffers[variant]).digest('hex'),measured});
    console.log(variant,JSON.stringify({frame:measured.frameMs,peak:measured.renderPeaks}));await page.close();
  }
}finally{await browser.close();}
await fs.mkdir('evidence/atrium/hero',{recursive:true});
await fs.writeFile('evidence/atrium/hero/performance-abba.json',JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:candidate.runtimeFingerprint,base,order:['old','current','current','old'],scope:'Diagnostic GLB substitution, same current runtime and other assets, visible local Chrome, sequential fresh pages and matched input orbit. Small sample, no thermal/power controls; not a replacement for production or phone certification.',results,errors},null,2));
assert.equal(errors.length,0);
