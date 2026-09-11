import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='evidence/atrium/controls';await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();await page.setViewport({width:1280,height:720});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const report=[];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
  await page.goto(`${process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193'}/atrium.html`);
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const key of ['KeyW','KeyS','KeyA','KeyD']){
    await page.evaluate(y=>{window.__atrium.setReviewPosition([0,0,4.8]);window.__atrium.setHeading(y);},yaw);await wait(200);
    const before=await page.evaluate(()=>window.__atrium.getPosition());
    await page.keyboard.down(key);await wait(650);await page.keyboard.up(key);await wait(250);
    const after=await page.evaluate(()=>window.__atrium.getPosition());
    const dx=after.x-before.x,dz=after.z-before.z;
    const sx=dx*Math.cos(yaw)-dz*Math.sin(yaw),sz=dx*Math.sin(yaw)+dz*Math.cos(yaw);
    const along={KeyW:-sz,KeyS:sz,KeyA:-sx,KeyD:sx}[key];
    assert.ok(along>.8,JSON.stringify({yaw,key,before,after}));
    report.push({yaw,key,before,after,screenDisplacement:[sx,sz]});
  }
  for(const [name,position,yaw] of [['chair',[-5,0,.15],-Math.PI/2],['planter',[-7.7,0,4.4],0],['return-window',[-9.9,1.6,.3],Math.PI/2],['upper-window',[9.5,3.5,5.7],-Math.PI/2]]){
    await page.evaluate(({position,yaw})=>{window.__atrium.setReviewPosition(position);window.__atrium.setHeading(yaw);},{position,yaw});await wait(250);
    if(name==='chair'||name==='planter'){await page.keyboard.down('KeyW');await wait(1500);await page.keyboard.up('KeyW');await wait(300);}
    if(name==='return-window'){
      await page.screenshot({path:`${out}/return-window-transition.png`});
      await wait(1200);
    }
    await page.screenshot({path:`${out}/${name}.png`});
    const state=await page.evaluate(()=>window.__atrium.getStats());
    if(name==='chair')assert.ok(state.position.x<-4.2,JSON.stringify(state.position));
    if(name==='planter')assert.ok(state.position.z>3.7,JSON.stringify(state.position));
    const controls=await page.evaluate(()=>window.__atrium.getCameraDiagnostics());
    if(name==='return-window'){
      assert.ok(controls.clearancePitch>.65,'cramped stair camera reveals steps with a higher pitch');
      assert.ok(controls.fade>.99,'open overhead space restores opaque avatar after camera settles');
    }
    report.push({name,position:state.position,camera:state.camera,controls});
  }
  await page.setViewport({width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await page.goto(`${process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193'}/atrium.html?quality=mobile`);
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
  await page.evaluate(()=>{window.__atrium.setReviewPosition([0,0,4.8]);window.__atrium.setHeading(0);});
  const client=await page.createCDPSession();
  const stick=await page.$eval('#joystick',e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2-29,id:1};});
  const initial=await page.evaluate(()=>window.__atrium.getPosition());
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[stick]});await wait(250);
  const moving=await page.evaluate(()=>window.__atrium.getPosition());
  const touchStart={initial,moving,elapsedMs:250,stats:await page.evaluate(()=>window.__atrium.getStats())};
  await fs.writeFile(`${out}/touch-start.json`,JSON.stringify(touchStart,null,2));
  assert.ok(initial.z-moving.z>.2,'off-centre touch-down starts movement without requiring touchMove: '+JSON.stringify({initial,moving}));
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[stick,{x:335,y:350,id:2}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[stick,{x:245,y:350,id:2}]});await wait(400);
  const turned=await page.evaluate(()=>window.__atrium.getCameraDiagnostics());assert.ok(turned.heading>.35,'second finger rotates camera while first finger moves');
  await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await wait(450);
  const stopped=await page.evaluate(()=>window.__atrium.getPosition());await wait(300);
  const final=await page.evaluate(()=>window.__atrium.getPosition());
  assert.ok(Math.hypot(final.x-stopped.x,final.z-stopped.z)<.04,'cancel releases joystick movement');
  await page.screenshot({path:`${out}/mobile-two-finger.png`});
  report.push({name:'mobile-two-finger',initial,moving,turned,stopped,final,scope:'Desktop Chrome touch emulation; not physical phone ergonomics'});
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),report,errors,scope:'Real keyboard cardinal input at four headings; fixture placement for isolated obstacle and camera cases. Separate full-route verification required.'},null,2));
  console.log('CONTROLS_READY',report.length);
}finally{await browser.close();}
