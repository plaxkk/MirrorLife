// Separate timer-query measurement overhead from actual game rendering cost.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
const results=[];
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
  for(const enabled of [true,false,false,true]){
    const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});await page.setCacheEnabled(false);
    if(!enabled){await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/src/atrium-gpu-timing.js'?r.respond({status:200,contentType:'application/javascript',body:'export function createAtriumGpuTiming(){return {begin(){},end(){},reset(){},dispose(){},stats(){return {supported:false,diagnosticDisabled:true}}};}'}):r.continue());}
    await page.goto('http://127.0.0.1:4193/atrium.html');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await wait(1800);
    await page.evaluate(()=>window.__atrium.beginMeasurement());
    for(let i=0;i<6;i++){await page.mouse.move(1000,650);await page.mouse.down();await page.mouse.move(i%2?1110:890,650,{steps:24});await page.mouse.up();await wait(5000);}
    const stats=await page.evaluate(()=>window.__atrium.getStats());results.push({enabled,stats});console.log(enabled,JSON.stringify(stats.frameMs));await page.close();
  }
  await fs.writeFile('evidence/atrium/controls/timer-overhead.json',JSON.stringify({capturedAt:new Date().toISOString(),scope:'Visible Chrome 1080p dev-server A/B/B/A diagnostic. Only timer-query instrumentation disabled; no rendering or gameplay reduction. Does not replace production acceptance.',results},null,2));
}finally{await browser.close();}
