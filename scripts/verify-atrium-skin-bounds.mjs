// Exercise actual decoded actors: raw bind-space bounds can hide visible skin.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4194';
const out=process.env.ATRIUM_BOUNDS_REPORT||'evidence/atrium/head-visibility-fix/bounds.json';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();await page.goto(base+'/');
 const report=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {loadAtriumActor}=await import('/src/atrium-actors.js');
  const results=[];
  for(const mobile of [false,true])for(const id of ['you','lin','chen','xu','zhou','he','tang']){
   results.push(await check(id,mobile));
  }
  async function check(id,mobile){
   const actor=await loadAtriumActor(id,{position:[0,0,0]},mobile);
   const meshes=[];actor.visual.traverse(n=>{if(n.isSkinnedMesh)meshes.push(n);});
   const rawBounds=meshes.map(n=>{n.geometry.computeBoundingSphere();const sphere=n.geometry.boundingSphere.clone();sphere.radius+=.65;return sphere;});
   const entries=meshes.map((n,i)=>({name:n.name,bounds:n.boundingSphere.clone(),oldRawBounds:rawBounds[i],maxOutside:0,maxOutsideOldRawBounds:0,samples:0}));
   for(const pose of [{},{moving:1},{talking:true},{seated:true},{lookingAt:{x:2,z:1}}]){
    for(let frame=0;frame<30;frame++)actor.update(frame/30,1/30,pose);
    actor.group.updateMatrixWorld(true);
    for(let j=0;j<meshes.length;j++){
     const mesh=meshes[j],entry=entries[j],v=new THREE.Vector3();
     for(let i=0;i<mesh.geometry.attributes.position.count;i++){
      mesh.getVertexPosition(i,v);entry.maxOutside=Math.max(entry.maxOutside,v.distanceTo(mesh.boundingSphere.center)-mesh.boundingSphere.radius);entry.maxOutsideOldRawBounds=Math.max(entry.maxOutsideOldRawBounds,v.distanceTo(rawBounds[j].center)-rawBounds[j].radius);entry.samples++;
     }
    }
   }
   return {id,profile:mobile?'mobile':'desktop',meshes:entries};
  }
  return {results,scope:'All exported skin vertices inside runtime local bounds in idle, walk, talk, sitting and looking poses. This checks culling bounds, not visual quality or real-device performance.'};
 });
 report.passed=report.results.length===14&&report.results.every(r=>r.meshes.length&&r.meshes.every(m=>m.maxOutside<1e-5));
 await fs.mkdir(path.dirname(out),{recursive:true});
 await fs.writeFile(out,JSON.stringify(report,null,2));assert.ok(report.passed,JSON.stringify(report));console.log('SKIN_BOUNDS_PASS',report.results.length);
}finally{await browser.close();}
