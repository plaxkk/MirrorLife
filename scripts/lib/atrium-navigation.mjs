// Binary camera-relative WASD needs a short correction horizon to stay inside
// narrow world-space aisles. A distant goal alone allows metre-scale drift.
export function atriumWalkKeys(dx,dz,yaw){
  const aimX=Math.max(-.45,Math.min(.45,dx)),aimZ=Math.max(-.45,Math.min(.45,dz));
  const x=aimX*Math.cos(yaw)-aimZ*Math.sin(yaw),z=aimX*Math.sin(yaw)+aimZ*Math.cos(yaw);
  const keys=new Set();
  if(Math.abs(x)>.09)keys.add(x>0?'KeyD':'KeyA');
  if(Math.abs(z)>.09)keys.add(z>0?'KeyS':'KeyW');
  return keys;
}
