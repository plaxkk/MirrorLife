// Authored chair exits keep residents out of furniture while facing a visitor.
// The same state runs during play and review; no camera-specific repositioning.
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function updateAtriumSeatMotion(actor,talking,visitor,dt){
  const home=actor.definition.position,exit=actor.definition.standPosition;
  const p=actor.group.position,rest=actor.definition.yaw||0;
  const homeDistance=Math.hypot(p.x-home[0],p.z-home[2]);
  let facing=rest,seated=false,moving=0,blocked=false;
  const clear=homeDistance>.64&&actor.seatBlend<.15;
  if(talking&&clear)facing=Math.atan2(visitor.x-p.x,visitor.z-p.z);
  const turn=angle(facing,actor.group.rotation.y);
  // No broad body turn while hips are inside the chair's envelope.
  if((!talking||clear)&&actor.seatBlend<.15)actor.group.rotation.y+=turn*(1-Math.exp(-8*dt));
  const destination=talking?exit:home;
  const canMove=talking||Math.abs(turn)<.08;
  if(canMove){
    const dx=destination[0]-p.x,dz=destination[2]-p.z,distance=Math.hypot(dx,dz);
    const step=Math.min(distance,1.15*Math.min(dt,.05));
    if(distance>.001){
      const nx=p.x+dx/distance*step,nz=p.z+dz/distance*step;
      const separation=Math.hypot(nx-visitor.x,nz-visitor.z);
      const previous=Math.hypot(p.x-visitor.x,p.z-visitor.z);
      blocked=Math.abs(visitor.y-p.y)<1.5&&separation<.62&&separation<previous;
      if(!blocked){p.x=nx;p.z=nz;moving=step/Math.max(dt,.001);}
    }
  }
  const remaining=Math.hypot(p.x-home[0],p.z-home[2]);
  seated=(!talking&&remaining<.025&&Math.abs(turn)<.08)||(blocked&&remaining<.025);
  return {seated,moving,blocked,clearOfChair:remaining>.64};
}
