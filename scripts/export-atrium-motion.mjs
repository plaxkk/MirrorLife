import fs from 'node:fs/promises';
import {sampleCivicAnimationPose} from '../src/civic-animation-clips.js';
const clips=[];
for(const [name,state,duration]of [['idle','idle',3.2],['walk','walk',.72],['listen','listen',3.2],['talk','gesture',4.4],['stairs','walk',1],['turn','idle',.8],['sit','idle',1.1],['stand','idle',1.1],['water','gesture',3]]){
  const frames=[];
  for(let i=0;i<=24;i++){
    const t=i/24,p=sampleCivicAnimationPose(state,t,'player');
    if(name==='sit'||name==='stand'){
      const u=name==='sit'?t:1-t,blend=u*u*(3-2*u);
      for(const key of ['leftLeg','rightLeg'])p[key]=[-Math.PI/2*blend,0,0];
      for(const key of ['leftKnee','rightKnee'])p[key]=[Math.PI/2*blend,0,0];
      for(const key of ['leftArm','rightArm'])p[key]=[-.35*blend,0,0];
      for(const key of ['leftElbow','rightElbow'])p[key]=[-.7*blend,0,0];
      p.rootY=(.53-.78)*blend;
    }
    if(name==='stairs'){p.leftKnee[0]+=.13;p.rightKnee[0]+=.13;}
    if(name==='turn')p.visual=[0,Math.PI/2*t,0];
    if(name==='water'){p.rightArm=[-.5,0,-.12];p.rightElbow=[-.7,0,0];p.rightHand=[0,0,.24*Math.sin(t*Math.PI)];}
    frames.push({time:t*duration,pose:p});
  }
  clips.push({name,duration,loop:!['sit','stand','turn'].includes(name),frames});
}
await fs.mkdir('models/atrium/animations',{recursive:true});
await fs.writeFile('models/atrium/animations/motion.json',JSON.stringify({source:'MirrorLife civic authored key poses, atrium transitions',fps:30,clips},null,2));
