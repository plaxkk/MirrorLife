// Decode actual geometry in the hand's local frame, independent of camera occlusion.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
const candidate=process.argv[2],out=process.argv[3];
if(!candidate||!out)throw new Error('candidate GLB and output directory required');
await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.setViewport({width:1000,height:800});
 await page.goto((process.env.MIRRORLIFE_BASE_URL||'http://127.0.0.1:4203')+'/');
 const report=await page.evaluate(async candidate=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {loadAtriumGLB}=await import('/src/atrium-assets.js');
  const {alignAtriumProp}=await import('/src/atrium-actors.js');
  const actor=(await loadAtriumGLB('/'+candidate)).scene;
  const props=(await loadAtriumGLB('/assets/atrium/life-props.glb')).scene;
  const root=new T.Group();root.add(actor,props);root.updateMatrixWorld(true);
  const hand=actor.getObjectByName('Hand_1'),anchor=actor.getObjectByName('HandGripAnchor_1');
  const core=actor.getObjectByName('SkinnedArticulationCore');
  const cup=props.getObjectByName('TeaCup'),grip=cup.getObjectByName('TeaCupGrip');grip.updateMatrix();
  alignAtriumProp(cup,grip,anchor,props);root.updateMatrixWorld(true);
  const inv=new T.Matrix4().makeRotationX(Math.PI/2).multiply(hand.matrixWorld.clone().invert());const g=core.geometry;
  const selected=new Set();
  for(let i=0;i<g.attributes.position.count;i++)for(let j=0;j<4;j++){
   const method=['getX','getY','getZ','getW'][j];
   if(g.attributes.skinWeight[method](i)>.999&&core.skeleton.bones[g.attributes.skinIndex[method](i)].name==='SkinRightHand')selected.add(i);
  }
  const scene=new T.Scene();scene.background=new T.Color('#30363d');
  scene.add(new T.HemisphereLight(0xffffff,0x5c5963,3));const light=new T.DirectionalLight(0xffffff,3);light.position.set(.2,-.3,.3);scene.add(light);
  const pts=[];const index=g.index;
  core.morphTargetInfluences[core.morphTargetDictionary.GripRight]=1;core.skeleton.update();
  for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(!ids.every(id=>selected.has(id)))continue;
   for(const id of ids){const p=new T.Vector3();core.getVertexPosition(id,p);p.applyMatrix4(core.matrixWorld).applyMatrix4(inv);pts.push(...p.toArray());}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pts,3));geometry.computeVertexNormals();
  scene.add(new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xdca978,roughness:.75,side:T.DoubleSide})));
  const parts=[],handleTriangles=[];cup.traverse(node=>{if(!node.isMesh)return;const copy=node.geometry.clone();copy.applyMatrix4(inv.clone().multiply(node.matrixWorld));scene.add(new T.Mesh(copy,new T.MeshStandardMaterial({color:node.name.includes('handle')?0xf4eeee:0x6d959f,transparent:true,opacity:node.name.includes('handle')?1:.25,side:T.DoubleSide})));copy.computeBoundingBox();parts.push({name:node.name,bounds:[copy.boundingBox.min.toArray(),copy.boundingBox.max.toArray()]});
   if(node.name.toLowerCase().includes('handle')){
    const positions=copy.attributes.position,indices=copy.index;
    for(let i=0;i<(indices?.count||positions.count);i+=3)handleTriangles.push(new T.Triangle(...[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(positions,indices?indices.getX(i+j):i+j))));
   }
  });
  if(!handleTriangles.length)throw new Error('No decoded cup-handle triangles');
  const distalDistances=[[],[],[],[]],closest=new T.Vector3();
  for(const id of selected){
   const neutral=new T.Vector3();core.morphTargetInfluences[core.morphTargetDictionary.GripRight]=0;core.getVertexPosition(id,neutral);neutral.applyMatrix4(core.matrixWorld).applyMatrix4(inv);
   if(neutral.z>-.070||neutral.x<-.047||neutral.x>.048)continue;
   const digit=Math.max(0,Math.min(3,Math.round((neutral.x+.033)/.022)));
   const closed=new T.Vector3();core.morphTargetInfluences[core.morphTargetDictionary.GripRight]=1;core.getVertexPosition(id,closed);closed.applyMatrix4(core.matrixWorld).applyMatrix4(inv);
   let distance=Infinity;for(const triangle of handleTriangles){triangle.closestPointToPoint(closed,closest);distance=Math.min(distance,closed.distanceTo(closest));}
   distalDistances[digit].push(distance);
  }
  const distal=distalDistances.map((values,digit)=>({digit:digit+1,samples:values.length,minMetres:values.length?Math.min(...values):null,within3mm:values.filter(x=>x<.003).length}));
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1000,800);document.body.replaceChildren(renderer.domElement);document.body.style.margin='0';
  const camera=new T.PerspectiveCamera(32,1.25,.001,10);
  window.drawGrip=(position)=>{camera.position.set(...position);camera.lookAt(0,-.035,-.035);renderer.render(scene,camera);};
  window.drawGrip([.2,-.28,.15]);
  geometry.computeBoundingBox();
  return {candidate,handBounds:[geometry.boundingBox.min.toArray(),geometry.boundingBox.max.toArray()],parts,distal,gripInHand:grip.getWorldPosition(new T.Vector3()).applyMatrix4(inv).toArray(),scope:'Decoded full-weight right-hand triangles at GripRight=1 and actual prop alignment in Blender hand-local coordinates. Distal vertices selected by neutral z<-70mm and x bins; unsigned nearest-triangle distance is not penetration/contact proof. Diagnostic opaque flat-normal hand/translucent vessel materials, not game rendering.'};
 },candidate);
 for(const [name,position]of [['oblique',[.2,-.28,.15]],['palm',[0,-.35,-.035]],['side',[.35,-.035,-.035]]]){await page.evaluate(p=>window.drawGrip(p),position);await page.screenshot({path:path.join(out,name+'.png')});}
 await fs.writeFile(path.join(out,'geometry.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
