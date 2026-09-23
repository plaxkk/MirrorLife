// Runtime-driven trajectory screening. Never force morphs to their closed state.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const [candidate,output]=process.argv.slice(2);assert.ok(candidate&&output);
const capture=process.env.ATRIUM_GRIP_CAPTURE==='1';
const body=await fs.readFile(candidate);let requests=0;
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.setRequestInterception(true);
 page.on('request',r=>{if(new URL(r.url()).pathname==='/assets/atrium/residents/you.glb'){requests++;return r.respond({status:200,contentType:'model/gltf-binary',body});}return r.continue();});
 await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203')+'/');
 const report=await page.evaluate(async capture=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {loadAtriumActor}=await import('/src/atrium-actors.js');
  const {loadAtriumGLB}=await import('/src/atrium-assets.js');
  const actor=await loadAtriumActor('you',{position:[0,0,0],yaw:0});
  const props=(await loadAtriumGLB('/assets/atrium/life-props.glb')).scene;
  actor.attachLifeProp(props);props.getObjectByName('WateringCan').visible=false;
  const cup=props.getObjectByName('TeaCup'),handle=cup.getObjectByName('Cup_handle');
  const hand=actor.group.getObjectByName('Hand_1'),core=actor.group.getObjectByName('SkinnedArticulationCore');
  if(core.morphTargetDictionary.GripTea===undefined)throw new Error('Missing tea target');
  const g=core.geometry,ids=[];
  for(let i=0;i<g.attributes.position.count;i++)for(const method of ['getX','getY','getZ','getW']){
   if(g.attributes.skinWeight[method](i)>.999&&core.skeleton.bones[g.attributes.skinIndex[method](i)].name==='SkinRightHand'){ids.push(i);break;}
  }
  const samples=[],captures=[],point=new T.Vector3(),nearest=new T.Vector3(),normal=new T.Vector3(),delta=new T.Vector3();
  const scene=new T.Scene();scene.background=new T.Color('#45494d');scene.add(actor.group,new T.HemisphereLight(0xffffff,0x686060,3));
  const light=new T.DirectionalLight(0xffffff,3);light.position.set(2,4,3);scene.add(light);
  const renderer=capture?new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}):null;
  if(renderer)renderer.setSize(800,800);
  const camera=new T.PerspectiveCamera(35,1,.01,20);
  for(let frame=-60;frame<0;frame++)actor.update(frame/60,1/60,{care:false});
  // 60Hz integration; measure first frame, then every 100ms through a 3s care
  // action and 600ms release. World scale/morph/skin are the actual actor code.
  for(let frame=1;frame<=216;frame++){
   const time=frame/60,care=frame<=180;actor.update(time,1/60,{care});actor.group.updateMatrixWorld(true);core.skeleton.update();
   if(renderer&&[1,6,12,30,180,216].includes(frame)){
    const target=hand.getWorldPosition(new T.Vector3());camera.position.copy(target).add(new T.Vector3(-.32,.25,.38));camera.lookAt(target);
    renderer.render(scene,camera);captures.push({frame,time,image:renderer.domElement.toDataURL('image/png')});
   }
   if(frame!==1&&frame%6!==0)continue;
   const poses=actor.handPoseDiagnostics()[0];
   const row={frame,time,care,poses,cupUp:care?actor.gripDiagnostics().find(g=>g.name==='TeaCup').cupUp:null};
   if(care){
    const inverse=hand.matrixWorld.clone().invert();
    const transform=inverse.clone().multiply(handle.matrixWorld),hg=handle.geometry,hi=hg.index,hp=hg.attributes.position,triangles=[];
    for(let i=0;i<(hi?.count||hp.count);i+=3)triangles.push(new T.Triangle(...[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(hp,hi?hi.getX(i+j):i+j).applyMatrix4(transform))));
    let inside=0,minSigned=Infinity,near=0;
    for(const id of ids){
     core.getVertexPosition(id,point);point.applyMatrix4(core.matrixWorld).applyMatrix4(inverse);
     let best=Infinity,signed=Infinity;
     for(const triangle of triangles){triangle.closestPointToPoint(point,nearest);const distance=point.distanceTo(nearest);if(distance<best){best=distance;triangle.getNormal(normal);signed=Math.sign(delta.copy(point).sub(nearest).dot(normal))*distance;}}
     if(best<.015){near++;minSigned=Math.min(minSigned,signed);if(signed<-.001)inside++;}
    }
    Object.assign(row,{vertices:ids.length,nearSurfaceVertices:near,insideOver1mm:inside,minNearSignedMetres:Number.isFinite(minSigned)?minSigned:null});
   }
   samples.push(row);
  }
  return {samples,captures,idleWarmupFrames:60,scope:'60Hz actual actor updates after idle warmup, 37 sampled instants at first frame then 100ms spacing. Fully weighted right-hand vertices versus handle nearest-triangle normal within 15mm; not watertight containment, triangle intersection, self-collision or continuous-time proof. Captures use actual actor materials in an isolated lit review scene, not the game environment.'};
 },capture);
 assert.ok(requests>0);assert.ok(report.samples.every(s=>s.poses.grip>=0&&s.poses.grip<=1.000001));
 assert.ok(report.samples.at(-1).poses.grip<.01&&report.samples.at(-1).poses.teaBlend<.01);
 const active=report.samples.filter(s=>s.care);
 report.worst=active.filter(s=>s.minNearSignedMetres!==null).reduce((a,b)=>!a||a.minNearSignedMetres>b.minNearSignedMetres?b:a,null);
 report.candidate={file:candidate,sha256:createHash('sha256').update(body).digest('hex'),requests};
 report.runtimeModules=Object.fromEntries(await Promise.all(['src/atrium-actors.js','src/atrium-main.js'].map(async file=>[file,createHash('sha256').update(await fs.readFile(file)).digest('hex')])));
 await fs.mkdir(path.dirname(output),{recursive:true});
 report.captureFiles=[];
 for(const frame of report.captures){const file=output.replace(/\.json$/,`-frame-${String(frame.frame).padStart(3,'0')}.png`);await fs.writeFile(file,Buffer.from(frame.image.split(',')[1],'base64'));report.captureFiles.push({frame:frame.frame,time:frame.time,file});}
 delete report.captures;
 await fs.writeFile(output,JSON.stringify(report,null,2));
 console.log(JSON.stringify({worst:report.worst,flagged:active.filter(s=>s.insideOver1mm).length,samples:report.samples.length,release:report.samples.at(-1).poses}));
}finally{await browser.close();}
