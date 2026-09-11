export const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function cameraRelativeInput(x,z,yaw){
  const length=Math.hypot(x,z);
  if(length<.12)return {x:0,z:0};
  const magnitude=Math.min(1,(length-.12)/.88),scale=magnitude/length;
  return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))*scale,z:(-x*Math.sin(yaw)+z*Math.cos(yaw))*scale};
}
export function updateMoveVelocity(current,input,speed,dt,paused=false){
  if(paused){current.x=current.z=0;return current;}
  const rate=Math.hypot(input.x,input.z)>.01?18:26,t=1-Math.exp(-rate*dt);
  current.x+=(input.x*speed-current.x)*t;current.z+=(input.z*speed-current.z)*t;
  if(Math.hypot(current.x,current.z)<.015)current.x=current.z=0;
  return current;
}
