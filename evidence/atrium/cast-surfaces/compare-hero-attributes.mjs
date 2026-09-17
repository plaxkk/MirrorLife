import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4193/');
 const result=await page.evaluate(async()=>{
  const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
  const {DRACOLoader}=await import('/node_modules/three/examples/jsm/loaders/DRACOLoader.js');
  const decoder=new DRACOLoader().setDecoderPath('/assets/atrium/draco/');const loader=new GLTFLoader().setDRACOLoader(decoder);
  const results=[];
  for(const suffix of ['.glb','-mobile.glb']){
   const pair=[];
   for(const prefix of ['/tmp/cast-surfaces/hero-control', '/tmp/cast-surfaces/hero-regression']){
    const g=await loader.loadAsync(prefix+'/public/assets/atrium/residents/you'+suffix).catch(()=>loader.loadAsync(prefix+'/assets/atrium/residents/you'+suffix));
    const meshes={};g.scene.traverse(o=>{if(!o.isMesh)return;const geom=o.geometry;
     const names=Object.keys(geom.attributes).sort();
     const rows=Array.from({length:geom.attributes.position.count},(_,i)=>names.map(n=>{const a=geom.attributes[n];return Array.from(a.array.slice(i*a.itemSize,(i+1)*a.itemSize)).map(v=>Math.round(v*1e6)/1e6)}).flat().join(','));
     const tri=[];const indices=geom.index?.array||rows.map((_,i)=>i);
     for(let i=0;i<indices.length;i+=3)tri.push([rows[indices[i]],rows[indices[i+1]],rows[indices[i+2]]].sort().join(';'));
     meshes[o.name]={names,rows:rows.sort(),tri:tri.sort(),attributes:Object.fromEntries(names.map(n=>[n,Array.from(geom.attributes[n].array).sort((a,b)=>a-b)]))};
    });pair.push(meshes);
   }
   const meshes=Object.keys(pair[0]).map(name=>({name,same:JSON.stringify(pair[0][name])===JSON.stringify(pair[1][name]),vertices:pair[0][name].rows.length,triangles:pair[0][name].tri.length,attributeMaxSortedDelta:Object.fromEntries(pair[0][name].names.map(n=>[n,Math.max(...pair[0][name].attributes[n].map((x,i)=>Math.abs(x-pair[1][name].attributes[n][i])))]))}));results.push({suffix,meshes});
  }
  decoder.dispose();return results;
 });await fs.writeFile('evidence/atrium/cast-surfaces/hero-control-attribute-drift.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close()}
