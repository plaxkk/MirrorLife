// Keep the player's yaw; raise the boom only when the requested view is cramped.
// Every candidate is swept by the caller, including overhead obstacles.
export function clearancePitch(requested, distance, sweep) {
  const minimum=Math.min(1.4,distance);
  let best=requested,bestDistance=sweep(requested);
  if(bestDistance>=minimum)return best;
  for(let pitch=requested+.12;pitch<=1.15;pitch+=.12){
    const available=sweep(pitch);
    if(available>bestDistance+.04){best=pitch;bestDistance=available;}
    if(bestDistance>=minimum)break;
  }
  return best;
}
