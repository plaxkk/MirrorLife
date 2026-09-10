// Real runtime cameras. Optional baseline asset is injected only for comparison.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='evidence/atrium/faces';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193';
const baseline=process.env.ATRIUM_FACE_BASELINE;
const cameras=[
  ['body',[-4.3,1.1,1.7],[-4.3,.95,4]],
  ['front',[-4.3,1.49,3.45],[-4.3,1.46,4]],
  ['side',[-3.6,1.48,4],[-4.3,1.46,4]],
  ['quarter',[-3.8,1.48,3.5],[-4.3,1.46,4]],
];
await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const assets={};
try{
  for(const variant of baseline?['before','after']:['after']){
    const page=await browser.newPage();
    await page.setViewport({width:1200,height:1000});await page.setCacheEnabled(false);
    if(variant==='before'){
      const body=await fs.readFile(baseline);assets.before=createHash('sha256').update(body).digest('hex');
      await page.setRequestInterception(true);
      page.on('request',r=>r.url().endsWith('/residents/you.glb')?r.respond({status:200,contentType:'model/gltf-binary',body}):r.continue());
    }
    await page.goto(`${base}/atrium.html`);
    await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
    await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
    for(const [name,pos,target] of cameras){
      await page.evaluate(({pos,target})=>window.__atrium.setReviewCamera(pos,target),{pos,target});
      await new Promise(r=>setTimeout(r,300));await page.screenshot({path:`${out}/${variant}-${name}.png`});
    }
    await page.close();
  }
  assets.after=createHash('sha256').update(await fs.readFile('public/assets/atrium/residents/you.glb')).digest('hex');
  await fs.writeFile(`${out}/cameras.json`,JSON.stringify({capturedAt:new Date().toISOString(),base,viewport:[1200,1000],cameras,assets,
    scope:'Player diagnostic cameras in the live scene. Idle and blinking remain active; phases are not matched. Not reference calibration or route evidence.'},null,2));
}finally{await browser.close();}
