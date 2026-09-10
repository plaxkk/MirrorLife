import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='evidence/atrium/stairs';await fs.mkdir(out,{recursive:true});
const asset=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:process.env.ATRIUM_HEADED!=='1',args:['--no-sandbox','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding']});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),cases=[],errors=[];
try{
  const page=await browser.newPage();await page.setViewport({width:1600,height:1000});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194')+'/atrium.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(1200);
  for(const [name,x,start,end,key]of [['main-up',5.8,5.5,-5.3,'KeyW'],['main-down',5.8,-5.3,5.5,'KeyS'],['return-up',-9.9,-4.8,6.1,'KeyS'],['return-down',-9.9,6.1,-4.8,'KeyW']]){
    await page.evaluate(({x,start,name})=>{window.__atrium.setReviewPosition([x,name.endsWith('down')?3.5:0,start]);window.__atrium.setHeading(0);window.__stairSamples=[];window.__collectStairs=true;
      const sample=()=>{if(!window.__collectStairs)return;const p=window.__atrium.getPosition(),feet=window.__atrium.getFootDiagnostics()[0].feet;window.__stairSamples.push({p,feet});requestAnimationFrame(sample);};requestAnimationFrame(sample);
    },{x,start,name});await pause(300);
    await page.keyboard.down(key);
    try{
      await page.waitForFunction(()=>{const y=window.__atrium.getPosition().y;return y>1.5&&y<2.05;},{timeout:12000});
      await page.keyboard.up(key);await pause(1000);
      const stopped=await page.evaluate(()=>({p:window.__atrium.getPosition(),feet:window.__atrium.getFootDiagnostics()[0].feet}));
      await page.evaluate(({p,x})=>{window.__atrium.setCapture(true);window.__atrium.setReviewCamera([x+(x>0?-2.1:1.35),p.y+.85,p.z+1.2],[x,p.y+.55,p.z]);},{p:stopped.p,x});
      await pause(150);await page.screenshot({path:`${out}/${name}.png`});
      await page.evaluate(()=>{window.__atrium.setCapture(false);window.__atrium.setHeading(0);});await page.keyboard.down(key);
      await page.waitForFunction(({end,key})=>key==='KeyW'?window.__atrium.getPosition().z<end:window.__atrium.getPosition().z>end,{timeout:12000},{end,key});
      await page.keyboard.up(key);await pause(300);
      const result=await page.evaluate(()=>{window.__collectStairs=false;return {end:window.__atrium.getPosition(),frames:window.__stairSamples};});
      const support=result.frames.flatMap(f=>f.feet).filter(f=>f.stairBlend>.99&&f.stair?.onStair&&f.stair.lift<.002);
      assert.ok(support.length>30,name+' support samples');
      const errorsMetres=support.map(f=>f.soleY-f.stair.ground).sort((a,b)=>a-b);
      const transition=result.frames.flatMap(f=>f.feet).filter(f=>f.stairBlend>0&&f.stairBlend<=.99&&f.stair?.onStair&&f.stair.lift<.002).map(f=>f.soleY-f.stair.ground);
      cases.push({name,stopped,end:result.end,frames:result.frames.length,supportSamples:support.length,minSoleError:errorsMetres[0],maxSoleError:errorsMetres.at(-1),p95AbsoluteSoleError:errorsMetres.map(Math.abs).sort((a,b)=>a-b)[Math.floor(errorsMetres.length*.95)],transition:{samples:transition.length,min:transition.length?Math.min(...transition):null,max:transition.length?Math.max(...transition):null}});
      console.log(name,JSON.stringify(cases.at(-1)));
      for(const f of stopped.feet)assert.ok(Math.abs(f.soleY-f.stair.ground)<.015,`${name} stopped sole ${JSON.stringify(f)}`);
      assert.ok(errorsMetres[0]>-.025&&errorsMetres.at(-1)<.04,name+' moving sole tolerance');
      assert.ok(transition.every(error=>error>-.015&&error<.04),name+' entry/exit contact tolerance');
      assert.ok(name.endsWith('up')?result.end.y>3.45:result.end.y<.08,name+' landing');
    }finally{await page.keyboard.up(key);await page.evaluate(()=>{window.__collectStairs=false;});}
  }
  assert.equal(errors.length,0);
}finally{
  await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:asset.runtimeFingerprint,method:'Review fixtures at flight entrances; actual W/S input along both flights, pause halfway. Sole height estimates use rig offset, not decoded shoe-mesh collision. No claim of planted world-space feet or complete foot-slip elimination.',cases,errors},null,2));
  await browser.close();
}
