// Sagittal two-bone solve in metres. Positive knee bends forward; the shoe
// counter-rotates to keep its sole horizontal. Unreachable targets are reported.
export function solveAtriumLeg(upper,lower,down,forward){
  const distance=Math.hypot(down,forward),reach=Math.min(upper+lower-.0001,Math.max(Math.abs(upper-lower)+.0001,distance));
  const knee=Math.acos(Math.max(-1,Math.min(1,(reach*reach-upper*upper-lower*lower)/(2*upper*lower))));
  const hip=-Math.atan2(forward,down)-Math.atan2(lower*Math.sin(knee),upper+lower*Math.cos(knee));
  return {hip,knee,foot:-hip-knee,unreachable:Math.abs(distance-reach)};
}
