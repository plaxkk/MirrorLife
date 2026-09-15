// Atrium player stance: relaxed arms and palms facing the body. Shared by the
// runtime and portable animation export; seated and interaction poses blend out.
export function relaxAtriumPose(pose,state,amount=1){
  if(state!=='idle'&&state!=='walk')return pose;
  const result={...pose};
  for(const side of ['left','right']){
    if(state==='idle')for(const part of ['Arm','Elbow']){
      const key=side+part;const v=[...(pose[key]||[0,0,0])];v[0]*=1-.7*amount;
      if(part==='Arm')v[2]=v[2]*(1-amount)+(side==='left'?-.10:.10)*amount;
      if(part==='Elbow')v[2]*=1-amount;
      result[key]=v;
    }
    const key=side+'Hand';const v=[...(pose[key]||[0,0,0])];
    v[1]+=(side==='left'?.75:-.75)*amount;result[key]=v;
  }
  return result;
}
