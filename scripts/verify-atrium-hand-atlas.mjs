// Verify actual decoded runtime hand UVs and their texture filter footprint.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203';
const files=process.argv.slice(2);assert.ok(files.length);
const out=process.env.ATRIUM_HAND_ATLAS_REPORT;assert.ok(out);
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto(base+'/');const rows=[];
 for(const file of files){
  rows.push(await page.evaluate(async file=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {loadAtriumGLB}=await import('/src/atrium-assets.js');
   const gltf=await loadAtriumGLB('/'+file.replace(/^public\//,''));
   const mesh=gltf.scene.getObjectByName('SkinnedArticulationCore');
   const meta=JSON.parse(mesh.userData.atrium_hand_atlas),g=mesh.geometry,m=mesh.material;
   const uv=g.attributes.uv,indices=g.attributes.skinIndex,weights=g.attributes.skinWeight;
   const textures=[['color',m.map],['roughness',m.roughnessMap],['normal',m.normalMap]].map(([kind,tex])=>{
    const canvas=document.createElement('canvas');canvas.width=tex.image.width;canvas.height=tex.image.height;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(tex.image,0,0);
    return {kind,tex,width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};
   });
   const hands=[];let bodyUvViolations=0;const owner=[];
   for(let i=0;i<uv.count;i++){
    let side=null;
    for(let j=0;j<4;j++)if(weights[['getX','getY','getZ','getW'][j]](i)>.999){
     const name=mesh.skeleton.bones[indices[['getX','getY','getZ','getW'][j]](i)].name;
     if(name==='SkinLeftHand')side='Left';if(name==='SkinRightHand')side='Right';
    }
    owner.push(side);if(!side&&uv.getX(i)<.0799)bodyUvViolations++;
   }
   for(const tile of meta.tiles){
    let vertices=0,checkedTexels=0,maxError=0,uvViolations=0;const failures=[];
    for(let i=0;i<uv.count;i++)if(owner[i]===tile.side){
     vertices++;if(uv.getX(i)<.0159||uv.getX(i)>.0481)uvViolations++;
     for(const t of textures){
      const q=new THREE.Vector2(uv.getX(i),uv.getY(i));t.tex.transformUv(q);
      const x=q.x*t.width-.5,y=q.y*t.height-.5;
      const expected=t.kind==='color'?new THREE.Color(...tile.color).convertLinearToSRGB().toArray():t.kind==='roughness'?[tile.roughness,tile.roughness,tile.roughness]:[.5,.5,1];
      for(const px of [Math.floor(x),Math.ceil(x)])for(const py of [Math.floor(y),Math.ceil(y)]){
       const offset=(Math.max(0,Math.min(t.height-1,py))*t.width+Math.max(0,Math.min(t.width-1,px)))*4;
       const channels=t.kind==='roughness'?[1]:[0,1,2];
       const error=Math.max(...channels.map(c=>Math.abs(t.data[offset+c]/255-expected[c])));
       maxError=Math.max(maxError,error);checkedTexels++;
       if(error>.016&&failures.length<5)failures.push({i,kind:t.kind,error,pixel:[px,py],actual:[...t.data.slice(offset,offset+3)],expected});
      }
     }
    }
    hands.push({side:tile.side,vertices,checkedTexels,maxError,uvViolations,failures});
   }
   return {file,hands,bodyUvViolations,textures:textures.map(({kind,width,height})=>({kind,width,height}))};
  },file));
 }
 const passed=rows.every(r=>r.bodyUvViolations===0&&r.hands.every(h=>h.vertices>100&&h.maxError<=.016&&h.uvViolations===0));
 await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify({passed,rows,scope:'Actual GLTFLoader decoded hand vertices and 2x2 base-level texture footprints; source palette/color-space, roughness green and neutral normal. Does not prove distant mipmaps, anatomy, gameplay or performance.'},null,2));
 console.log(JSON.stringify(rows));assert.ok(passed,'Hand UV region or sampled atlas colors are invalid');
}finally{await browser.close();}
