// Current installed cast, shared camera and neutral standing pose.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.argv[2];assert.ok(out);
const manifest=JSON.parse(await fs.readFile('public/assets/atrium/residents/manifest.json','utf8'));
const focus=process.env.ATRIUM_CAST_FOCUS;
const rest=process.env.ATRIUM_CAST_REST==='1';
const mobile=process.env.ATRIUM_CAST_LOD==='mobile';
const suffix=mobile?'-mobile':'';
const candidate=process.env.ATRIUM_CAST_CANDIDATE;
const candidateId=process.env.ATRIUM_CAST_CANDIDATE_ID;
assert.equal(Boolean(candidate),Boolean(candidateId),'Set candidate path and identity together');
const ids=manifest.map(row=>row.id);assert.equal(ids.length,7);if(focus)assert.ok(ids.includes(focus));
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(/\/residents\/[^/]+\.glb$/.test(new URL(r.url()).pathname))requests.push(new URL(r.url()).pathname);});
 if(candidate){
  assert.ok(ids.includes(candidateId));
  const body=await fs.readFile(candidate);await page.setRequestInterception(true);
  page.on('request',r=>new URL(r.url()).pathname===`/assets/atrium/residents/${candidateId}${suffix}.glb`?r.respond({status:200,contentType:'model/gltf-binary',body}):r.continue());
 }
 await page.setViewport({width:focus?1200:2100,height:1050,deviceScaleFactor:1});
 await page.goto(process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203');
 await page.evaluate(async ({ids,focus,mobile,rest})=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {loadAtriumActor}=await import('/src/atrium-actors.js');
  const scene=new T.Scene();scene.background=new T.Color('#414950');
  scene.add(new T.HemisphereLight(0xffffff,0x686060,3));
  const light=new T.DirectionalLight(0xffffff,3);light.position.set(-3,5,-4);scene.add(light);
  const actors=[];
  for(const [i,id] of ids.entries()){
   const actor=await loadAtriumActor(id,{position:[(3-i)*.75,0,0],yaw:0},mobile);
   for(let f=0;f<(rest?0:60);f++)actor.update(f/60,1/60,{care:false});
   actor.group.position.set((3-i)*.75,0,0);scene.add(actor.group);actors.push(actor);
  }
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(focus?1200:2100,1000);
  const camera=new T.OrthographicCamera(-2.85,2.85,1.357,-1.357,.01,30);camera.position.set(0,.86,-6);camera.lookAt(0,.86,0);
  if(focus){
   const index=ids.indexOf(focus),x=(3-index)*.75;
   actors.forEach((actor,i)=>actor.group.visible=i===index);
   Object.assign(camera,{left:-.6,right:.6,top:.5,bottom:-.5});camera.position.set(x,1.12,-6);camera.lookAt(x,1.12,0);camera.updateProjectionMatrix();
  }
  document.body.innerHTML='';document.body.style.cssText='margin:0;background:#414950;color:white;font:24px sans-serif';
  document.body.append(renderer.domElement);
  const labels=document.createElement('div');labels.style.cssText='display:flex;justify-content:space-around;padding:8px 110px';
  for(const id of (focus?[focus]:ids)){const label=document.createElement('span');label.textContent=id;labels.append(label);}document.body.append(labels);
  let castFrame=rest?0:60;
  window.advanceCast=(moving,frames)=>{for(let f=0;f<frames;f++,castFrame++)for(const actor of actors)actor.update(castFrame/60,1/60,{care:false,moving});};
  window.renderCast=angle=>{for(const actor of actors)actor.group.rotation.y=angle;scene.updateMatrixWorld(true);renderer.render(scene,camera);};
  window.renderCast(0);
 },{ids,focus,mobile,rest});
 await fs.mkdir(out,{recursive:true});
 for(const [name,angle] of [['front',Math.PI],['side',Math.PI/2],['back',0]]){
  await page.evaluate(angle=>window.renderCast(angle),angle);await page.screenshot({path:`${out}/${name}.png`});
 }
 for(let step=0;step<3;step++){
  await page.evaluate(()=>{window.advanceCast(1.25,15);window.renderCast(Math.PI/4);});
  await page.screenshot({path:`${out}/walk-${step}.png`});
 }
 assert.deepEqual(errors,[]);for(const id of ids)assert.ok(requests.includes(`/assets/atrium/residents/${id}${suffix}.glb`));
 const assets=await Promise.all(ids.map(async id=>{const file=id===candidateId?candidate:`public/assets/atrium/residents/${id}${suffix}.glb`,body=await fs.readFile(file);return {id,file,bytes:body.length,sha256:createHash('sha256').update(body).digest('hex')};}));
 await fs.writeFile(`${out}/report.json`,JSON.stringify({ids,initialPose:rest?'loaded without actor updates':'60-frame idle',lod:mobile?'mobile':'desktop',focus:focus||null,assets,requests,errors,candidate:candidate?{id:candidateId,file:path.resolve(candidate)}:null,scope:'Selected LOD GLBs in shared isolated lighting; viewport remains a desktop art fixture, not mobile-device verification; initialPose records whether actor updates preceded standing captures; three simulated walking pose samples use the real actor update. Optional candidate substituted only by request interception. No real player input, native activity acceptance, game environment, mobile, gameplay or performance verification.'},null,2));
 console.log('CAST_LINEUP_CAPTURED',ids);
}finally{await browser.close();}
