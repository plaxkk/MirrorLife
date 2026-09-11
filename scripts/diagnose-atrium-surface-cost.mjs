// Diagnostic A/B: same current assets, previous vs current camera/glass behavior.
// Dev-server samples are not production certification and do not replace acceptance.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4193';
const prior=execFileSync('git',['show','18821a4:src/atrium-camera-clearance.js'],{encoding:'utf8'});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)),results=[];
try{
  for(const variant of ['previous','current','current','previous']){
    const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
    const patches=[];await page.setCacheEnabled(false);
    if(variant==='previous'){
      await page.setRequestInterception(true);
      page.on('request',async request=>{
        const url=new URL(request.url());
        if(url.pathname==='/src/atrium-camera-clearance.js'){
          patches.push('camera');return request.respond({status:200,contentType:'application/javascript',body:prior});
        }
        if(url.pathname==='/src/atrium-main.js'){
          const response=await fetch(request.url());const text=await response.text();
          const needle="node.castShadow=node.material.name!=='Window glass'";
          assert.ok(text.includes(needle),'Expected glass assignment before diagnostic replacement');
          patches.push('glass');return request.respond({status:200,contentType:'application/javascript',body:text.replace(needle,'node.castShadow=true')});
        }
        return request.continue();
      });
    }
    await page.goto(base+'/atrium.html');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await wait(1800);
    if(variant==='previous')assert.deepEqual(patches.sort(),['camera','glass']);
    await page.evaluate(()=>window.__atrium.beginMeasurement());
    for(let i=0;i<6;i++){
      await page.mouse.move(1000,650);await page.mouse.down();await page.mouse.move(i%2?1110:890,650,{steps:24});await page.mouse.up();await wait(5000);
    }
    const stats=await page.evaluate(()=>window.__atrium.getStats());
    results.push({variant,patches,stats});console.log(variant,JSON.stringify(stats.frameMs));await page.close();
  }
  await fs.writeFile('evidence/atrium/controls/surface-cost-ab.json',JSON.stringify({capturedAt:new Date().toISOString(),scope:'Visible local Chrome dev-server diagnostic; current assets in all runs. Previous injects only camera clearance module and glass castShadow from prior behavior. Order previous/current/current/previous; not a replacement for production acceptance or proof of host-load cause.',results},null,2));
}finally{await browser.close();}
