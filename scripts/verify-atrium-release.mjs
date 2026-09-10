// Reproducible candidate evidence: one production build, sequential Chrome runs,
// no Blender or concurrent browser measurement, and a final fingerprint check.
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='evidence/atrium';
await fs.mkdir(`${out}/validation`,{recursive:true});
const port=process.env.ATRIUM_VERIFY_PORT||'4195';
const base=`http://127.0.0.1:${port}`;
const env={...process.env,MIRRORLIFE_BASE_URL:base,ATRIUM_HEADED:'1'};
const steps=[];
async function run(name,command,args,extra={}){
  console.log('START',name);
  const handle=await fs.open(`${out}/validation/${name}.log`,'w');
  const started=Date.now();
  try{
    await new Promise((resolve,reject)=>{
      const child=spawn(command,args,{env:{...env,...extra},stdio:['ignore',handle.fd,handle.fd]});
      child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error(`${name} exited ${code}; see validation/${name}.log`)));
    });
  }finally{await handle.close();}
  steps.push({name,seconds:(Date.now()-started)/1000});console.log('PASS',name);
}
let server;
try{
  await run('tests','npm',['test']);
  await run('build','npm',['run','build']);
  await run('assets',process.execPath,['scripts/report-atrium-assets.mjs']);
  const candidate=JSON.parse(await fs.readFile(`${out}/assets.json`,'utf8'));
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',port,'--strictPort'],{env,stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Preview start timeout')),15000);
    server.once('error',e=>{clearTimeout(timer);reject(e);});
    server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Preview exited ${code}`));});
    server.stdout.on('data',data=>{if(String(data).includes(base)){clearTimeout(timer);resolve();}});
    server.stderr.on('data',data=>process.stderr.write(data));
  });
  for(const mode of ['gallery','performance','mobile'])await run(mode,process.execPath,['scripts/verify-atrium-pilot.mjs',mode]);
  await run('contact',process.execPath,['scripts/verify-atrium-contact.mjs']);
  await run('seating',process.execPath,['scripts/verify-atrium-seating.mjs']);
  await run('stairs',process.execPath,['scripts/verify-atrium-stairs.mjs']);
  await run('resilience',process.execPath,['scripts/verify-atrium-resilience.mjs']);
  await run('walkthrough',process.execPath,['scripts/verify-atrium-pilot.mjs','walkthrough'],{ATRIUM_RECORD:'1'});
  await run('assets-after',process.execPath,['scripts/report-atrium-assets.mjs']);
  const final=JSON.parse(await fs.readFile(`${out}/assets.json`,'utf8'));
  assert.equal(final.runtimeFingerprint,candidate.runtimeFingerprint,'Assets/source changed during acceptance');
  const reports={};
  for(const mode of ['performance','mobile']){
    const report=JSON.parse(await fs.readFile(`${out}/${mode}-measurement.json`,'utf8'));
    assert.equal(report.runtimeFingerprint,candidate.runtimeFingerprint);
    const peak=report.measured.renderPeaks;
    reports[mode]={frameMs:report.measured.frameMs,renderPeaks:peak,
      budgetPassed:peak.calls<=180&&peak.triangles<=500000&&peak.geometries<=220,
      frameTargetPassed:report.measured.frameMs.p95<=(mode==='mobile'?1000/30:1000/60),
      note:mode==='mobile'?'Desktop GPU emulation; not phone certification':'Local visible Chrome production preview'};
  }
  await fs.writeFile(`${out}/acceptance.json`,JSON.stringify({capturedAt:new Date().toISOString(),runtimeFingerprint:candidate.runtimeFingerprint,base,steps,reports,
    scope:'Automated candidate verification. Visual quality, real phone hardware and human playability are separate gates.'},null,2));
  console.log('CANDIDATE_EVIDENCE_READY',JSON.stringify(reports));
}finally{server?.kill('SIGTERM');}
