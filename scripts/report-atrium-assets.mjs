import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

async function list(directory){const entries=await fs.readdir(directory,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?list(path.join(directory,e.name)):[path.join(directory,e.name)]))).flat();}
const files=[...await list('public/assets/atrium'),...await list('models/atrium')];
const assets=[];
for(const file of files){
  const buffer=await fs.readFile(file);const row={file,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')};
  if(file.endsWith('.glb')){
    assert.equal(buffer.toString('ascii',0,4),'glTF',file);assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);
    const json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
    row.meshes=json.meshes?.length||0;row.materials=json.materials?.length||0;row.skins=json.skins?.length||0;
    row.triangles=(json.meshes||[]).reduce((sum,m)=>sum+m.primitives.reduce((s,p)=>s+(p.indices!==undefined?json.accessors[p.indices].count:json.accessors[p.attributes.POSITION].count)/3,0),0);
    row.animations=(json.animations||[]).map(a=>({name:a.name,channels:a.channels.length}));
    for(const accessor of json.accessors||[]){assert.ok(Number.isInteger(accessor.count)&&accessor.count>=0,file);for(const bound of [accessor.min,accessor.max])if(bound)assert.ok(bound.every(Number.isFinite),file);}
  }
  assets.push(row);
}
assert.equal(assets.filter(x=>/residents\/[^/]+\.blend$/.test(x.file)).length,7);
assert.equal(assets.find(x=>x.file==='public/assets/atrium/animations/you-motion.glb').animations.length,9);
assert.equal(assets.filter(x=>/^public\/assets\/atrium\/kit\/.*\.glb$/.test(x.file)).length,9);
const sourceFiles=['atrium.html','src/atrium-main.js','src/atrium-actors.js','src/atrium-floor-contact.js','src/atrium-seat-motion.js','src/atrium-gpu-timing.js','src/atrium-assets.js','src/atrium-content.js','src/atrium-physics.js','src/atrium-persistence.js','src/atrium.css','src/civic-animation-clips.js','src/reference-fidelity-runtime-contract.js','public/storage.js'];
const fingerprint=crypto.createHash('sha256');for(const file of sourceFiles)fingerprint.update(file).update(await fs.readFile(file));for(const asset of assets.filter(a=>a.file.startsWith('public/')))fingerprint.update(asset.file).update(asset.sha256);
const result={generatedAt:new Date().toISOString(),runtimeFingerprint:fingerprint.digest('hex'),validation:'GLB header, accessor bounds, declared topology counts, required rig/action/module inventories. Does not substitute for decoded topology, visual or animation-contact review.',totalSourceBytes:assets.filter(x=>x.file.startsWith('models/')).reduce((s,x)=>s+x.bytes,0),totalPublicBytes:assets.filter(x=>x.file.startsWith('public/')).reduce((s,x)=>s+x.bytes,0),assets};
await fs.mkdir('evidence/atrium',{recursive:true});await fs.writeFile('evidence/atrium/assets.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,assets:assets.length},null,2));
