// Diagnostic only: substitute the historical hero or remove its normal maps.
// No runtime code or shipped asset is changed. ABBA order exposes host/order noise.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const output='evidence/atrium/production-tailoring/textile-cost';
await fs.mkdir(output,{recursive:true});
const assetPath='public/assets/atrium/residents/you.glb';
const current=await fs.readFile(assetPath);
const baselineCommit='21d5c9b';
const baseline=execFileSync('git',['show',`${baselineCommit}:${assetPath}`],{maxBuffer:8*1024*1024});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const meta=JSON.parse(await fs.readFile('evidence/atrium/assets.json','utf8'));
assert.equal(meta.assets.find(a=>a.file===assetPath).sha256,sha(current),'Regenerate asset inventory first');
assert.equal(sha(await fs.readFile('dist/assets/atrium/residents/you.glb')),sha(current),'Production build must contain current hero');
const jsonLength=current.readUInt32LE(12);
const json=JSON.parse(current.subarray(20,20+jsonLength));
let removedNormals=0;
for(const material of json.materials){if(material.normalTexture){delete material.normalTexture;removedNormals++;}}
assert.equal(removedNormals,2,'This experiment expects the body and clothing normal maps');
const text=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(padded);
const binaryChunk=current.subarray(20+jsonLength),header=Buffer.alloc(20);
header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(20+padded.length+binaryChunk.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);
const noNormals=Buffer.concat([header,padded,binaryChunk]);
const variants={baseline,candidate:current,'normals-off':noNormals};
const order=['baseline','candidate','candidate','baseline','normals-off','candidate','normals-off','candidate'];
const base='http://127.0.0.1:4197';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4197','--strictPort'],{stdio:['ignore','pipe','pipe']});
const results=[];
let browser;
try{
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Preview startup timeout')),15000);
  server.once('error',error=>{clearTimeout(timer);reject(error);});
  server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Preview exited ${code}`));});
  server.stdout.on('data',data=>{if(String(data).includes(base)){clearTimeout(timer);resolve();}});
 });
 browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-networking']});
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 for(const [index,variant] of order.entries()){
  const page=await browser.newPage();let substitutions=0;const errors=[];
  await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});await page.setCacheEnabled(false);
  page.on('pageerror',e=>errors.push(String(e)));
  // Intercept every variant, so request delivery itself is consistent.
  await page.setRequestInterception(true);
  page.on('request',request=>{
   if(request.url().endsWith('/residents/you.glb')){substitutions++;return request.respond({status:200,contentType:'model/gltf-binary',body:variants[variant]});}
   return request.continue();
  });
  console.log('TEXTILE_COST_START',index,variant);
  await page.goto(base+'/atrium.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');await pause(1800);
  await page.evaluate(()=>window.__atrium.beginMeasurement());
  for(let i=0;i<6;i++){
   await page.mouse.move(700,400);await page.mouse.down();await page.mouse.move(490,400,{steps:24});await page.mouse.up();await pause(5000);
  }
  const stats=await page.evaluate(()=>window.__atrium.getStats());
  assert.equal(substitutions,1);assert.deepEqual(errors,[]);
  results.push({index,variant,assetSha256:sha(variants[variant]),substitutions,errors,stats});
  await fs.writeFile(`${output}/samples.json`,JSON.stringify({capturedAt:new Date().toISOString(),candidateRuntimeFingerprint:meta.runtimeFingerprint,baselineCommit,order,removedNormals,
   scope:'Visible Chrome 1920x1080 DPR1, one fresh page per sample, all variants request-intercepted. Same production code and six real orbit drags after 1.8s warm-up. Historical hero/current/current/historical hero followed by normal-map isolation. A diagnostic, not production acceptance; loading times are not a network benchmark.',results},null,2));
  console.log('TEXTILE_COST_SAMPLE',index,variant,JSON.stringify({frameMs:stats.frameMs,gpuMs:stats.gpuMs,renderPeaks:stats.renderPeaks}));
  await page.close();await pause(500);
 }
}finally{await browser?.close();server.kill('SIGTERM');}
console.log('TEXTILE_COST_READY');
