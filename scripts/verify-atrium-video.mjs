// Decode the delivered movie, rather than treating an encoder exit as proof.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const dir='evidence/atrium',file=`${dir}/playthrough.mp4`;
const [asset,recording,bytes]=await Promise.all([
  fs.readFile(`${dir}/assets.json`,'utf8').then(JSON.parse),
  fs.readFile(`${dir}/playthrough.json`,'utf8').then(JSON.parse),fs.readFile(file),
]);
const output=execFileSync(process.env.FFMPEG_BINARY||'/Users/kk/.local/bin/ffmpeg',[
  '-v','error','-xerror','-i',file,'-progress','pipe:1','-nostats','-f','null','-',
],{encoding:'utf8',maxBuffer:1024*1024,timeout:120000});
const frames=Number([...output.matchAll(/^frame=(\d+)$/gm)].at(-1)?.[1]);
assert.ok(frames>0,'No decoded video frames');assert.equal(frames,recording.frames,'Decoded and declared frame counts differ');
assert.equal(bytes.length,recording.bytes);assert.ok(Math.abs(recording.durationSeconds-frames/15)<.001);
const report={verifiedAt:new Date().toISOString(),runtimeFingerprint:asset.runtimeFingerprint,
  sha256:crypto.createHash('sha256').update(bytes).digest('hex'),decodedFrames:frames,bytes:bytes.length,
  durationSeconds:recording.durationSeconds,fullDecodeExitCode:0,
  scope:'Complete ffmpeg decode and frame/byte count agreement. Requires separate visual review for framing, content and continuity.'};
await fs.writeFile(`${dir}/video-validation.json`,JSON.stringify(report,null,2));
console.log('VIDEO_DECODE_PASS',frames,report.sha256);
