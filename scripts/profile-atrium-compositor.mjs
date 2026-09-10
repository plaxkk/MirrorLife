// Diagnostic A/B only: restores the old five backdrop filters in a test stylesheet.
// No geometry, resolution, shadows, actors or HUD elements are removed.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
const out='evidence/atrium/compositor';await fs.mkdir(out,{recursive:true});
const meta=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const rows=[],pause=ms=>new Promise(r=>setTimeout(r,ms));
const oldCSS='.location,nav button{backdrop-filter:blur(12px)!important}.objective,#drawer{backdrop-filter:blur(14px)!important}#dialogue{backdrop-filter:blur(18px)!important}';
try{
  const p=await browser.newPage();await p.setViewport({width:1920,height:1080,deviceScaleFactor:1});
  await p.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194')+'/atrium.html');
  await p.waitForSelector('#enter:not([hidden])',{timeout:90000});await p.click('#enter');await p.bringToFront();
  await p.evaluate(()=>{window.__long=[];new PerformanceObserver(l=>window.__long.push(...l.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:false});});
  for(const [index,mode]of ['blur','flat','blur','flat'].entries()){
    await p.evaluate(({mode,oldCSS})=>{
      let s=document.getElementById('profile-css');if(!s){s=document.createElement('style');s.id='profile-css';document.head.append(s);}
      s.textContent=mode==='blur'?oldCSS:'*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';
      window.__atrium.setHeading(0);
    },{mode,oldCSS});
    await pause(1800);await p.evaluate(()=>{window.__long=[];window.__atrium.beginMeasurement();});
    await pause(12000);
    const row=await p.evaluate(()=>({stats:window.__atrium.getStats(),longTasks:window.__long,focus:document.hasFocus(),hidden:document.hidden}));
    rows.push({mode,...row});console.log(mode,JSON.stringify({frame:row.stats.frameMs,gpu:row.stats.gpuMs,focus:row.focus}));
    if(index<2)await p.screenshot({path:`${out}/${mode}-hud.png`});
  }
  await fs.writeFile(`${out}/fixed-camera-ab.json`,JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:meta.runtimeFingerprint,
    method:'Visible local Chrome 1920x1080 DPR1. Four alternating 12-second samples, 1.8-second warm-up. Fixed player camera; all residents animate. Diagnostic stylesheet restores the five former blur declarations. Source build fingerprint does not represent those temporary stylesheet overrides.',rows},null,2));
}finally{await browser.close();}
