// Asset-only ABBA comparison. Supplementary evidence, never replaces release samples.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
assert.ok(process.env.ATRIUM_FACE_BASELINE,'Supply the baseline player GLB');
const assets={before:await fs.readFile(process.env.ATRIUM_FACE_BASELINE),after:await fs.readFile('public/assets/atrium/residents/you.glb')};
const out='evidence/atrium/hero-expression/performance-comparison.json';
const runs=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
for(const variant of ['before','after','after','before']){
  const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-networking']});
  try{
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
    await page.setCacheEnabled(false);await page.setRequestInterception(true);
    page.on('request',r=>r.url().endsWith('/residents/you.glb')?r.respond({status:200,contentType:'model/gltf-binary',body:assets[variant]}):r.continue());
    await page.goto(base+'/atrium.html');
    await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(1800);
    await page.evaluate(()=>window.__atrium.beginMeasurement());
    for(let i=0;i<6;i++){
      await page.mouse.move(700,400);await page.mouse.down();await page.mouse.move(490,400,{steps:24});await page.mouse.up();await pause(5000);
    }
    const measured=await page.evaluate(()=>window.__atrium.getStats());
    runs.push({variant,assetSha256:createHash('sha256').update(assets[variant]).digest('hex'),capturedAt:new Date().toISOString(),measured,errors});
    await fs.writeFile(out,JSON.stringify({base,order:['before','after','after','before'],scope:'Visible desktop Chrome, identical current production runtime, only player GLB intercepted. Six input orbit drags and 30+ seconds per run. Supplementary causal check; does not replace original candidate performance or certify phone hardware.',runs},null,2));
    assert.deepEqual(errors,[]);console.log(variant,JSON.stringify(measured.frameMs));
  }finally{await browser.close();}
}
