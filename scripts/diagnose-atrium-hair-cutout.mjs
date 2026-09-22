// Isolated diagnostic: inject a candidate and test one material property at a time.
// These variants are never installed as production runtime settings.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4193';
const candidate=process.env.ATRIUM_REVIEW_CANDIDATE||'tmp/groom-study/authored-short01-fitted/public/assets/atrium/residents/you.glb';
const out=process.env.ATRIUM_REVIEW_OUTPUT||'evidence/atrium/groom-continuity/cutout-diagnosis';
await fs.mkdir(out,{recursive:true});const body=await fs.readFile(candidate);
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const errors=[],results=[];let assets=0,injections=0;
try{
 const page=await browser.newPage();await page.setViewport({width:1200,height:1000});await page.setCacheEnabled(false);
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.setRequestInterception(true);page.on('request',async r=>{
  const url=new URL(r.url());
  if(url.pathname==='/assets/atrium/residents/you.glb'){assets++;return r.respond({status:200,contentType:'model/gltf-binary',body});}
  if(url.pathname==='/src/atrium-main.js'){
   const original=await (await fetch(r.url())).text();assert.ok(original.includes('window.__atrium = {')||original.includes('window.__atrium={'));
   const source=original.replace(/window\.__atrium\s*=\s*\{/,`window.__groomDiagnostic={player,THREE,renderer,composer};window.__atrium={`);
   injections++;return r.respond({status:200,contentType:'text/javascript',body:source});
  }
  return r.continue();
 });
 await page.goto(base+'/atrium.html?quality=desktop');await page.waitForSelector('#enter:not([hidden])',{timeout:90000});await page.click('#enter');
 await page.evaluate(()=>{window.__atrium.setReviewPosition([-4.3,0,4]);window.__atrium.setCapture(true);window.__atrium.setReviewFace({blink:0,talk:0});});
 const variants=['hash','mask','coverage','no-receive-shadow','opaque','unlit','separated-full','separated-half','separated-zero','separated-restored'];
 for(const variant of variants){
  const state=await page.evaluate(async variant=>{
   const {configureAtriumPlayerFade}=await import('/src/atrium-player-fade.js');
   const {player,THREE,renderer,composer}=window.__groomDiagnostic;const items=[];
   player.group.traverse(o=>{if(!o.isMesh||!o.name.startsWith('HairAuthored'))return;
    o.userData.originalMaterial??=o.material;const original=o.userData.originalMaterial;
    if(o.material!==original)o.material.dispose();o.material=original.clone();
    o.receiveShadow=variant!=='no-receive-shadow';
    const m=o.material;m.alphaHash=variant==='hash';m.alphaToCoverage=variant==='coverage';
    m.alphaTest=variant==='opaque'?0:.4;
    if(variant==='unlit'){o.material=new THREE.MeshBasicMaterial({map:m.map,alphaTest:.4,side:THREE.DoubleSide});m.dispose();}
    if(variant.startsWith('separated-')){configureAtriumPlayerFade(m);m.opacity=variant==='separated-half'?.5:variant==='separated-zero'?0:1;}
    o.material.needsUpdate=true;
    items.push({name:o.name,opacity:o.material.opacity,alphaHash:o.material.alphaHash,alphaToCoverage:o.material.alphaToCoverage,alphaTest:o.material.alphaTest,receiveShadow:o.receiveShadow});
   });
   return {items,antialias:renderer.getContext().getContextAttributes().antialias,composerSamples:composer?.renderTarget1?.samples};
  },variant);assert.equal(state.items.length,1);
  for(const [angle,pos] of [['side',[-3.62,1.49,4]],['front',[-4.3,1.49,3.40]],['back',[-4.3,1.49,4.70]]]){
   await page.evaluate(pos=>window.__atrium.setReviewCamera(pos,[-4.3,1.46,4]),pos);await new Promise(r=>setTimeout(r,300));await page.screenshot({path:`${out}/${variant}-${angle}.png`});
  }
  results.push({variant,...state});
 }
 assert.ok(assets&&injections);assert.deepEqual(errors,[]);
 await fs.writeFile(`${out}/report.json`,JSON.stringify({candidate,sha256:createHash('sha256').update(body).digest('hex'),assets,injections,results,errors,scope:'Isolated material ablations, not production behavior or gameplay acceptance.'},null,2));
 console.log('HAIR_DIAGNOSIS_READY');
}finally{await browser.close();}
