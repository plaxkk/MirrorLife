import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs/promises';

// Capture the actual page at a bounded resolution. Unlike the default PNG
// screencast, JPEG avoids transferring/decoding megabytes for every source frame.
// CDP timestamps determine duplication on the output grid: no time compression.
export async function startAtriumRecording(page,output){
  const fps=15,client=await page.createCDPSession();
  await client.send('Page.enable');
  const viewport=page.viewport();
  // CDP capture sessions otherwise use the native window surface, which can
  // clip an emulated 1080p page on a smaller laptop window (including dialogue).
  await client.send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:viewport.deviceScaleFactor||1,mobile:!!viewport.isMobile,viewport:{x:0,y:0,width:viewport.width,height:viewport.height,scale:1}});
  const encoder=spawn('/Users/kk/.local/bin/ffmpeg',['-loglevel','error','-probesize','32','-analyzeduration','0','-fpsprobesize','0','-framerate',String(fps),'-f','image2pipe','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','ultrafast','-crf','26','-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart','-y',output],{stdio:['pipe','ignore','pipe']});
  let failure=null,stderr='',first=null,previous=null,lastReceived=0,emitted=0,received=0,queue=Promise.resolve(),stopped=false;
  let resolveFirst;const firstFrame=new Promise(resolve=>{resolveFirst=resolve;});
  encoder.on('error',e=>{failure=e;});encoder.stdin.on('error',e=>{failure=e;});
  encoder.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-3000);});
  encoder.on('close',code=>{if(code!==0)failure=new Error(`Recording encoder exit ${code}: ${stderr}`);});
  const closed=once(encoder,'close');
  async function writeUntil(timestamp){
    const required=Math.floor((timestamp-first)*fps);
    while(emitted<required){
      if(failure)throw failure;
      await new Promise((resolve,reject)=>encoder.stdin.write(previous.buffer,e=>e?reject(e):resolve()));
      emitted++;
    }
  }
  const onFrame=event=>{
    client.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(e=>{if(!stopped)failure=e;});
    if(stopped||event.metadata.timestamp===undefined)return;
    const frame={timestamp:event.metadata.timestamp,buffer:Buffer.from(event.data,'base64')};
    lastReceived=performance.now();received++;
    resolveFirst();
    queue=queue.then(async()=>{
      if(first===null)first=frame.timestamp;
      if(previous)await writeUntil(frame.timestamp);
      previous=frame;
    }).catch(e=>{failure=e;});
  };
  client.on('Page.screencastFrame',onFrame);
  await client.send('Page.startScreencast',{format:'jpeg',quality:78,maxWidth:1280,maxHeight:720,everyNthFrame:2});
  let firstFrameTimer;
  try{await Promise.race([firstFrame,new Promise((_,reject)=>{firstFrameTimer=setTimeout(()=>reject(new Error('No browser capture frame within 5 seconds')),5000);})]);}
  catch(error){stopped=true;encoder.kill('SIGTERM');await client.detach().catch(()=>{});throw error;}
  finally{clearTimeout(firstFrameTimer);}
  return {async stop(){
    if(stopped)return;stopped=true;
    try{
      await client.send('Page.stopScreencast');client.off('Page.screencastFrame',onFrame);await queue;
      if(!previous)throw new Error('No browser frames received');
      await writeUntil(previous.timestamp+Math.max(0,performance.now()-lastReceived)/1000);
      encoder.stdin.end();const [code]=await closed;
      if(failure)throw failure;if(code!==0)throw new Error(`Recording encoder exit ${code}: ${stderr}`);
      await fs.writeFile(output.replace(/\.mp4$/,'.json'),JSON.stringify({method:'Continuous CDP JPEG browser capture, constant 15fps output aligned to source timestamps; repeated frames preserve real elapsed time. No cuts, teleportation or playback acceleration.',frames:emitted,receivedFrames:received,durationSeconds:emitted/fps,bytes:(await fs.stat(output)).size},null,2));
    }finally{client.off('Page.screencastFrame',onFrame);if(encoder.exitCode===null)encoder.kill('SIGTERM');await client.detach().catch(()=>{});}
  }};
}
