// Multi-angle runtime art fixtures; not an input-driven traversal test.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='evidence/atrium/garments';await fs.mkdir(out,{recursive:true});
const meta=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const views=[],errors=[];
try{
  const page=await browser.newPage();await page.setViewport({width:1200,height:1000,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193')+'/atrium.html');
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
  await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);});
  const ids=['you','lin','chen','xu','zhou','he','tang'];
  for(const id of ids)for(const angle of ['front','side',...(id==='you'?['back']:[])]){
    const state=await page.evaluate(()=>window.__atrium.getInteractionState());
    const actor=id==='you'?{position:[-4.3,0,4],yaw:Math.PI}:state.residents.find(r=>r.id===id);
    const [x,y,z]=actor.position,look=[x,y+(actor.seatBlend>.5?1:1.15),z];
    const yaw=actor.yaw+(angle==='back'?Math.PI:angle==='side'?(x>0?-Math.PI/2:Math.PI/2):id==='he'?.65:0);
    const camera=[x+Math.sin(yaw)*1.15,look[1]+.12,z+Math.cos(yaw)*1.15];
    await page.evaluate(({camera,look})=>window.__atrium.setReviewCamera(camera,look),{camera,look});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const file=`${id}-${angle}.png`;await page.screenshot({path:`${out}/${file}`});
    views.push({id,angle,file,camera,look,actor});
  }
  assert.equal(errors.length,0);
  await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:meta.runtimeFingerprint,
    method:'Local Chrome headless, 1200x1000 DPR1; real runtime actors in their room positions, diagnostic cameras. Animation is not frozen. Screenshots require visual review; no automatic art pass.',views,errors},null,2));
  console.log('GARMENT_CAPTURES_READY',views.length);
}finally{await browser.close();}
