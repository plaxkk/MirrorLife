// Ray-test the actual decoded eye stack: preserved vertex colour alone cannot
// detect LOD collapsing the sclera in front of the pupil or iris.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
const files=process.argv.slice(2);assert.ok(files.length);
const out=process.env.ATRIUM_IRIS_RUNTIME_REPORT||'evidence/atrium/iris-colour-study/runtime-depth.json';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();await page.goto(base+'/');
 const rows=[];
 for(const file of files){
  const result=await page.evaluate(async file=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {loadAtriumGLB}=await import('/src/atrium-assets.js');
   const gltf=await loadAtriumGLB('/'+file.replace(/^public\//,''));gltf.scene.updateMatrixWorld(true);
   const eyes=[];
   for(const side of [-1,1]){
    const eye=gltf.scene.getObjectByName('EyePivot_'+side),meshes=[];
    eye.traverse(n=>{if(n.isMesh)meshes.push(n);});
    const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,0,-1).transformDirection(eye.matrixWorld);
    let samples=0,whiteOcclusions=0,missingIris=0,maxOcclusion=0,pupilMismatches=0;
    for(let ix=-12;ix<=12;ix++)for(let iy=-12;iy<=12;iy++){
     const x=-side*.001+ix/12*.026,y=-.001+iy/12*.021;
     if((ix/12)**2+(iy/12)**2>1)continue;
     // The tiny authored white catchlight intentionally covers the iris.
     if(Math.abs(x+side*.0058)<.004&&Math.abs(y-.0064)<.004)continue;
     const origin=new THREE.Vector3(x,y,1).applyMatrix4(eye.matrixWorld);
     ray.set(origin,direction);const hits=ray.intersectObjects(meshes,false);
     const isWhite=hit=>{const c=hit.object.geometry.attributes.color;return (c.getX(hit.face.a)+c.getX(hit.face.b)+c.getX(hit.face.c))/3>.5;};
     const iris=hits.find(h=>!isWhite(h));samples++;
     if(!iris){missingIris++;continue;}
     const radius=Math.hypot((x+side*.001)/.0374,(y+.001)/.031);
     const colour=iris.object.geometry.attributes.color;
     const pupil=(colour.getX(iris.face.a)+colour.getX(iris.face.b)+colour.getX(iris.face.c))/3<.02;
     if(Math.abs(radius-.32)>.03&&pupil!==(radius<.32))pupilMismatches++;
     if(isWhite(hits[0])&&hits[0].distance<iris.distance-1e-6){whiteOcclusions++;maxOcclusion=Math.max(maxOcclusion,iris.distance-hits[0].distance);}
    }
    eyes.push({side,samples,whiteOcclusions,missingIris,maxOcclusion,pupilMismatches,triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0)});
   }
   return {file,eyes};
  },file);rows.push(result);
 }
 const passed=rows.every(r=>r.eyes.every(e=>e.samples>300&&e.whiteOcclusions===0&&e.missingIris===0&&e.pupilMismatches===0));
 await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify({passed,rows,scope:'Actual GLTFLoader decoding, neutral pose central iris ray grid, excluding the authored catchlight. Checks depth order and a circular pupil outside a 0.03-radius boundary tolerance; not a complete visual or blink acceptance.'},null,2));
 console.log(JSON.stringify(rows));assert.ok(passed,'Eye surface depth order or pupil boundary is corrupted');
}finally{await browser.close();}
