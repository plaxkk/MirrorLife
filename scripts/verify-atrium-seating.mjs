import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='evidence/atrium/seating';await fs.mkdir(out,{recursive:true});
const asset=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:process.env.ATRIUM_HEADED!=='1',args:['--no-sandbox','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding']});
const pause=ms=>new Promise(r=>setTimeout(r,ms)),samples=[],errors=[];
try{
  const page=await browser.newPage();await page.setViewport({width:1600,height:1000});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194')+'/atrium.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(1700);
  async function feet(id,label){
    const value=await page.evaluate(id=>window.__atrium.getFootDiagnostics().find(a=>a.id===id),id);
    assert.ok(value.seatBlend>.99,`${label}: settled seated pose`);
    for(const foot of value.feet){
      assert.ok(Math.abs(foot.soleY-foot.floorY)<.012,`${label}: ${JSON.stringify(foot)}`);
      assert.ok(foot.kneeForward>.43,`${label}: knee must clear cushion front plus shin radius`);
    }
    samples.push({label,...value});
  }
  for(const [id,position,home,camera] of [
    ['lin',[-2.6,0,-2.8],[-2.2,0,-1.95],[-4.1,1.1,-1]],
    ['chen',[1.45,0,-2.8],[1.1,0,-1.95],[3,1.1,-1]],
  ]){
    await feet(id,'rest-'+id);
    await page.evaluate(({position,camera,home})=>{window.__atrium.setReviewPosition(position);window.__atrium.setReviewCamera(camera,[home[0],.65,home[2]]);window.__atrium.setCapture(true);},{position,camera,home});
    await page.screenshot({path:`${out}/${id}-seated.png`});
    await page.waitForFunction(id=>document.querySelector('#interaction-text').textContent.includes(id==='lin'?'林晓':'陈屿'),{},id);
    await page.keyboard.press('KeyE');await pause(1700);
    const standing=await page.evaluate(id=>window.__atrium.getInteractionState().residents.find(a=>a.id===id),id);
    assert.ok(Math.hypot(standing.position[0]-home[0],standing.position[2]-home[2])>.75);
    assert.ok(standing.seatBlend<.01);
    const target=Math.atan2(position[0]-standing.position[0],position[2]-standing.position[2]);
    assert.ok(Math.abs(Math.atan2(Math.sin(target-standing.yaw),Math.cos(target-standing.yaw)))<.08);
    samples.push({label:'standing-'+id,...standing});
    await page.evaluate(({id,p})=>window.__atrium.setReviewCamera([id==='lin'?-1.1:3.2,1.45,-3.8],[p[0],.85,p[2]]),{id,p:standing.position});await pause(150);
    await page.screenshot({path:`${out}/${id}-conversation.png`});
    await page.keyboard.press('Escape');await pause(2700);await feet(id,'returned-'+id);
    const returned=await page.evaluate(id=>window.__atrium.getInteractionState().residents.find(a=>a.id===id),id);
    assert.ok(Math.hypot(returned.position[0]-home[0],returned.position[2]-home[2])<.025);
    await page.keyboard.press('KeyE');await pause(100);await page.keyboard.press('Escape');await pause(2500);await feet(id,'quick-cancel-'+id);
  }
  await page.evaluate(()=>{window.__atrium.setCapture(false);window.__atrium.setReviewPosition([9.5,3.5,4.95]);});
  await page.waitForFunction(()=>/落座/.test(document.querySelector('#interaction-text').textContent));await page.keyboard.press('KeyE');await pause(2000);await feet('you','upper-player');
  await page.evaluate(()=>{window.__atrium.setCapture(true);window.__atrium.setReviewCamera([7.5,4.3,6.4],[9.4,4.05,4.6]);});await page.screenshot({path:`${out}/player-upper.png`});
  assert.equal(errors.length,0);
  await fs.writeFile(`${out}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:asset.runtimeFingerprint,
    method:'Actual E and Escape actions after review positioning. Sole estimate uses authored neutral foot offset; not full shoe-mesh penetration or stair IK proof.',samples,errors},null,2));
  console.log('SEATING_PASS',samples.length);
}catch(error){console.error(error);throw error;}finally{await browser.close();}
