// Decode the delivered movie, rather than treating an encoder exit as proof.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const dir='evidence/atrium',file=`${dir}/playthrough.mp4`;
const [asset,recording]=await Promise.all([
  fs.readFile(`${dir}/assets.json`,'utf8').then(JSON.parse),
  fs.readFile(`${dir}/playthrough.json`,'utf8').then(JSON.parse),
]);
// Delivery compression is independent of the live recorder's 20-second stop
// deadline and runs after its browser has closed. Revalidation is idempotent.
if(!recording.deliveryEncoding){
  const delivery=`${dir}/playthrough.delivery.mp4`;
  const captureBytes=(await fs.stat(file)).size;
  execFileSync(process.env.FFMPEG_BINARY||'/Users/kk/.local/bin/ffmpeg',[
    '-v','error','-i',file,'-map','0:v:0','-an','-c:v','libx264','-preset','medium','-crf','22','-threads','2','-fps_mode','passthrough','-movflags','+faststart','-y',delivery,
  ],{timeout:120000});
  await fs.rename(delivery,file);
  Object.assign(recording,{captureBytes,bytes:(await fs.stat(file)).size,deliveryEncoding:'Post-capture H.264 medium CRF22; same frame timestamps and dimensions.'});
  await fs.writeFile(`${dir}/playthrough.json`,JSON.stringify(recording,null,2));
}
const bytes=await fs.readFile(file);
const output=execFileSync(process.env.FFMPEG_BINARY||'/Users/kk/.local/bin/ffmpeg',[
  '-v','error','-xerror','-i',file,'-progress','pipe:1','-nostats','-f','null','-',
],{encoding:'utf8',maxBuffer:1024*1024,timeout:120000});
const frames=Number([...output.matchAll(/^frame=(\d+)$/gm)].at(-1)?.[1]);
assert.ok(frames>0,'No decoded video frames');assert.equal(frames,recording.frames,'Decoded and declared frame counts differ');
const decodedDurationSeconds=Number([...output.matchAll(/^out_time_us=(\d+)$/gm)].at(-1)?.[1])/1e6;
assert.ok(Number.isFinite(decodedDurationSeconds)&&Math.abs(decodedDurationSeconds-recording.durationSeconds)<1/15+.005,'Decoded timeline changed');
assert.equal(bytes.length,recording.bytes);assert.ok(Math.abs(recording.durationSeconds-frames/15)<.001);
const report={verifiedAt:new Date().toISOString(),runtimeFingerprint:asset.runtimeFingerprint,
  sha256:crypto.createHash('sha256').update(bytes).digest('hex'),decodedFrames:frames,bytes:bytes.length,
  durationSeconds:recording.durationSeconds,decodedDurationSeconds,fullDecodeExitCode:0,
  scope:'Complete ffmpeg decode and frame/byte count agreement. Requires separate visual review for framing, content and continuity.'};
await fs.writeFile(`${dir}/video-validation.json`,JSON.stringify(report,null,2));
console.log('VIDEO_DECODE_PASS',frames,report.sha256);
