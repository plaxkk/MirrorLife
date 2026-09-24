// Current installed cast, shared camera and neutral standing pose.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=process.argv[2];assert.ok(out);
const manifest=JSON.parse(await fs.readFile('public/assets/atrium/residents/manifest.json','utf8'));
const ids=manifest.map(row=>row.id);assert.equal(ids.length,7);
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(/\/residents\/[^/]+\.glb$/.test(new URL(r.url()).pathname))requests.push(new URL(r.url()).pathname);});
 await page.setViewport({width:2100,height:1050,deviceScaleFactor:1});
 await page.goto(process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203');
 await page.evaluate(async ids=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {loadAtriumActor}=await import('/src/atrium-actors.js');
  const scene=new T.Scene();scene.background=new T.Color('#414950');
  scene.add(new T.HemisphereLight(0xffffff,0x686060,3));
  const light=new T.DirectionalLight(0xffffff,3);light.position.set(-3,5,-4);scene.add(light);
  const actors=[];
  for(const [i,id] of ids.entries()){
   const actor=await loadAtriumActor(id,{position:[(3-i)*.75,0,0],yaw:0});
   for(let f=0;f<60;f++)actor.update(f/60,1/60,{care:false});
   actor.group.position.set((3-i)*.75,0,0);scene.add(actor.group);actors.push(actor);
  }
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(2100,1000);
  const camera=new T.OrthographicCamera(-2.85,2.85,1.357,-1.357,.01,30);camera.position.set(0,.86,-6);camera.lookAt(0,.86,0);
  document.body.innerHTML='';document.body.style.cssText='margin:0;background:#414950;color:white;font:24px sans-serif';
  document.body.append(renderer.domElement);
  const labels=document.createElement('div');labels.style.cssText='display:flex;justify-content:space-around;padding:8px 110px';
  for(const id of ids){const label=document.createElement('span');label.textContent=id;labels.append(label);}document.body.append(labels);
  window.renderCast=angle=>{for(const actor of actors)actor.group.rotation.y=angle;scene.updateMatrixWorld(true);renderer.render(scene,camera);};
  window.renderCast(0);
 },ids);
 await fs.mkdir(out,{recursive:true});
 for(const [name,angle] of [['front',Math.PI],['side',Math.PI/2],['back',0]]){
  await page.evaluate(angle=>window.renderCast(angle),angle);await page.screenshot({path:`${out}/${name}.png`});
 }
 assert.deepEqual(errors,[]);for(const id of ids)assert.ok(requests.includes(`/assets/atrium/residents/${id}.glb`));
 const assets=await Promise.all(ids.map(async id=>{const file=`public/assets/atrium/residents/${id}.glb`,body=await fs.readFile(file);return {id,file,bytes:body.length,sha256:createHash('sha256').update(body).digest('hex')};}));
 await fs.writeFile(`${out}/report.json`,JSON.stringify({ids,assets,requests,errors,scope:'Installed desktop GLBs in neutral standing fixture and shared isolated lighting. Native activities, game environment, mobile, gameplay and performance not verified.'},null,2));
 console.log('CAST_LINEUP_CAPTURED',ids);
}finally{await browser.close();}
