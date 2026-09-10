import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:process.env.ATRIUM_HEADED!=='1',args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const results=[];
const assetEvidence=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
const metadata={capturedAt:new Date().toISOString(),runtimeFingerprint:assetEvidence.runtimeFingerprint,browserMode:process.env.ATRIUM_HEADED==='1'?'headed':'headless'};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function boot(page){
  await page.goto(base+'/atrium.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await wait(500);
}
async function fixture(page,position){
  // Fixtures isolate exceptional states. These teleports are never used in the continuous playthrough.
  await page.evaluate(p=>window.__atrium.setReviewPosition(p),position);await wait(300);
}
try{
  const page=await browser.newPage();await page.setViewport({width:1280,height:800});await boot(page);
  await fixture(page,[3.2,0,5.5]);await page.keyboard.press('KeyE');assert.equal(await page.$eval('#dialogue',e=>e.hidden),true);
  results.push({case:'out of range E',pass:true});
  await fixture(page,[9.5,3.5,4.95]);
  await page.waitForFunction(()=>/落座/.test(document.querySelector('#interaction-text').textContent)&&!document.querySelector('#interaction').hidden,{timeout:4000});
  await page.keyboard.press('KeyE');await wait(650);
  assert.equal(await page.evaluate(()=>window.__atrium.getInteractionState().seated),'seat-upper');
  await page.keyboard.press('KeyE');await wait(300);
  assert.equal(await page.evaluate(()=>window.__atrium.getInteractionState().seated),null);
  results.push({case:'upper seat can be selected beside postcard, sit and stand',pass:true});
  await fixture(page,[9.1,0,4.45]);await page.keyboard.press('KeyE');await wait(350);await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>window.__atrium.getState().discovered.includes('plant')),false);
  assert.equal(await page.evaluate(()=>window.__atrium.getInteractionState().care),null);
  results.push({case:'cancel care before completion does not unlock a discovery',pass:true});
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__atrium.getState().discovered.includes('plant'),{timeout:15000});await page.keyboard.press('Escape');
  await page.keyboard.press('KeyE');await wait(3500);await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>window.__atrium.getState().journal.filter(x=>x.id==='plant').length),1);
  results.push({case:'completed and repeated care is recorded once',pass:true});
  await fixture(page,[-2.6,0,-2.6]);await page.keyboard.press('KeyE');
  await wait(1100);await page.screenshot({path:'evidence/atrium/dialogue-contact-after.png'});
  for(let i=0;i<5;i++)await page.keyboard.press('KeyE');
  assert.equal(await page.evaluate(()=>window.__atrium.getState().journal.filter(x=>x.id==='meet-lin').length),1);
  const before=await page.evaluate(()=>window.__atrium.getPosition());await page.keyboard.down('KeyW');await wait(650);await page.keyboard.up('KeyW');
  const after=await page.evaluate(()=>window.__atrium.getPosition());assert.ok(Math.hypot(before.x-after.x,before.z-after.z)<.05);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.querySelector('#dialogue').contains(document.activeElement)),true);
  await page.keyboard.press('Escape');assert.equal(await page.$eval('#dialogue',e=>e.hidden),true);
  results.push({case:'repeated E, modal movement lock, focus trap and Escape',pass:true});
  await fixture(page,[8.4,0,2]);
  await page.waitForFunction(()=>window.__atrium.getInteractionState().residents.find(x=>x.id==='xu').busy,{timeout:25000});
  await page.keyboard.press('KeyE');assert.equal(await page.$eval('#dialogue',e=>e.hidden),true);
  assert.match(await page.$eval('#toast',e=>e.textContent),/稍等/);
  await page.waitForFunction(()=>!window.__atrium.getInteractionState().residents.find(x=>x.id==='xu').busy,{timeout:10000});
  await page.keyboard.press('KeyE');assert.match(await page.$eval('#dialogue-title',e=>e.textContent),/许禾/);await page.keyboard.press('Escape');
  results.push({case:'busy resident waits and becomes interactable again',pass:true});
  const memories=await page.evaluate(async()=>{
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('mirrorlife');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    return new Promise((resolve,reject)=>{const r=db.transaction('memories').objectStore('memories').getAll();r.onsuccess=()=>{db.close();resolve(r.result.filter(x=>x.source==='atrium-pilot'));};r.onerror=()=>reject(r.error);});
  });
  assert.ok(memories.length>=3);assert.equal(new Set(memories.map(x=>x.id)).size,memories.length);
  results.push({case:'existing IndexedDB archive receives distinct pilot memories',pass:true,count:memories.length});
  await page.evaluate(()=>{document.querySelector('#world').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();});
  await page.waitForSelector('#retry:not([hidden])');assert.match(await page.$eval('#loading-text',e=>e.textContent),/连接中断/);
  await page.screenshot({path:'evidence/atrium/context-loss.png'});await page.click('#retry');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
  assert.ok(await page.evaluate(()=>window.__atrium.getState().discovered.includes('plant')));
  results.push({case:'WebGL context loss offers recovery without losing progress',pass:true});
  await page.close();
  const broken=await browser.newPage();await broken.setViewport({width:1280,height:800});await broken.setRequestInterception(true);let block=true;
  broken.on('request',request=>request.url().includes('/atrium-desktop.glb')&&block?request.abort('failed'):request.continue());
  await broken.goto(base+'/atrium.html',{waitUntil:'domcontentloaded'});await broken.waitForSelector('#retry:not([hidden])',{timeout:90000});
  assert.match(await broken.$eval('#loading-text',e=>e.textContent),/未能打开/);await broken.screenshot({path:'evidence/atrium/resource-failure.png'});
  block=false;await broken.click('#retry');await broken.waitForSelector('#enter:not([hidden])',{timeout:90000});
  results.push({case:'GLB load failure is visible and retry succeeds',pass:true});
  await broken.close();
  const contactFailure=await browser.newPage();await contactFailure.setRequestInterception(true);
  contactFailure.on('request',request=>request.url().includes('/floor-contact.png')?request.abort('failed'):request.continue());
  await boot(contactFailure);
  assert.equal(await contactFailure.evaluate(()=>window.__atrium.getStats().active),true);
  assert.ok(await contactFailure.evaluate(()=>window.__atrium.getStats().errors.some(e=>e.type==='optional-contact-texture')));
  await contactFailure.keyboard.down('KeyW');await wait(600);await contactFailure.keyboard.up('KeyW');
  assert.ok(await contactFailure.evaluate(()=>window.__atrium.getStats().distanceWalked>.5));
  results.push({case:'optional contact texture failure retains an active walkable scene and diagnostic',pass:true});
  await fs.writeFile('evidence/atrium/resilience.json',JSON.stringify({...metadata,fixtureNotice:'Review position fixture changes test-player position only to isolate exceptional states, not evidence of route accessibility.',results},null,2));
  console.log(JSON.stringify(results,null,2));
}catch(error){
  await fs.writeFile('evidence/atrium/resilience.json',JSON.stringify({...metadata,results,failure:String(error)},null,2));throw error;
}finally{await browser.close();}
