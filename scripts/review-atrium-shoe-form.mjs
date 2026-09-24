// Shoe form in actual actor materials, three foot-relative views.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const [candidate,out]=process.argv.slice(2);assert.ok(candidate&&out);
const body=await fs.readFile(candidate);let requests=0;
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.setRequestInterception(true);
 page.on('request',r=>{if(new URL(r.url()).pathname==='/assets/atrium/residents/you.glb'){requests++;return r.respond({status:200,contentType:'model/gltf-binary',body});}return r.continue();});
 await page.goto(process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203');
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {loadAtriumActor}=await import('/src/atrium-actors.js');
  const actor=await loadAtriumActor('you',{position:[0,0,0],yaw:0});
  for(let i=0;i<60;i++)actor.update(i/60,1/60,{care:false});
  actor.group.updateMatrixWorld(true);
  const hand=actor.group.getObjectByName('ShoeUpper_1Pivot');
  const scene=new T.Scene();scene.background=new T.Color('#45494d');scene.add(actor.group,new T.HemisphereLight(0xffffff,0x686060,3));
  const light=new T.DirectionalLight(0xffffff,3);light.position.set(2,4,3);scene.add(light);
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(800,800);
  const bounds=new T.Box3(),core=actor.group.getObjectByName('SkinnedArticulationCore');core.skeleton.update();
  const g=core.geometry;
  for(let i=0;i<g.attributes.position.count;i++)for(const key of ['getX','getY','getZ','getW']){
   if(g.attributes.skinWeight[key](i)>.999&&core.skeleton.bones[g.attributes.skinIndex[key](i)].name==='SkinRightFoot'){
    bounds.expandByPoint(core.getVertexPosition(i,new T.Vector3()).applyMatrix4(core.matrixWorld));break;
   }
  }
  const camera=new T.PerspectiveCamera(35,1,.01,20),target=bounds.getCenter(new T.Vector3()),distance=bounds.getSize(new T.Vector3()).length()/2/Math.sin(T.MathUtils.degToRad(17.5))*1.3;
  camera.up.set(0,1,0).transformDirection(hand.matrixWorld);
  const images=[];
  for(const [name,offset] of [['toe',[0,.16,1]],['outer',[1,.15,0]],['top',[.35,.7,1]]]){
   camera.up.set(0,1,0).transformDirection(hand.matrixWorld);
   camera.position.fromArray(offset).transformDirection(hand.matrixWorld).multiplyScalar(distance).add(target);camera.lookAt(target);renderer.render(scene,camera);
   images.push({name,image:renderer.domElement.toDataURL('image/png')});
  }
  renderer.dispose();return {images,poses:actor.handPoseDiagnostics(),scope:'Actual GLTF shoe and materials in isolated lighting; no walking, foot-ground contact or performance acceptance.'};
 });
 assert.ok(requests>0&&result.poses.every(p=>p.grip===0));await fs.mkdir(out,{recursive:true});
 const files=[];
 for(const shot of result.images){const file=path.join(out,`${shot.name}.png`);await fs.writeFile(file,Buffer.from(shot.image.split(',')[1],'base64'));files.push(file);}
 delete result.images;result.files=files;result.candidate={file:candidate,sha256:createHash('sha256').update(body).digest('hex'),requests};
 result.runtimeSha256=createHash('sha256').update(await fs.readFile('src/atrium-actors.js')).digest('hex');
 await fs.writeFile(path.join(out,'review.json'),JSON.stringify(result,null,2));console.log('SHOE_FORM_CAPTURED',files);
}finally{await browser.close();}
