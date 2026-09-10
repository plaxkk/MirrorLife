import * as THREE from 'three';

// The two atlas tiles were ray-baked from the editable static scene. Restrict
// them to upward-facing walking surfaces; walls/furniture sample a white border.
export function applyAtriumFloorContact(root, texture) {
  texture.colorSpace=THREE.NoColorSpace;
  texture.channel=1;
  root.updateWorldMatrix(true,true);
  const point=new THREE.Vector3(),normal=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  let surfaces=0;
  root.traverse(node=>{
    if(!node.isMesh)return;
    const geometry=node.geometry,positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal');
    if(!positions||!normals)return;
    const uv=new Float32Array(positions.count*2);let affected=0;
    normalMatrix.getNormalMatrix(node.matrixWorld);
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(node.matrixWorld);
      normal.fromBufferAttribute(normals,i).applyMatrix3(normalMatrix).normalize();
      const level=Math.abs(point.y)<.035?0:Math.abs(point.y-3.5)<.035?1:-1;
      if(level>=0&&normal.y>.8&&Math.abs(point.x)<11&&Math.abs(point.z)<8){
        uv[i*2]=(point.x+11.2)/22.4;
        uv[i*2+1]=((8.2-point.z)/16.4+level)/2;affected++;
      }else{uv[i*2]=.001;uv[i*2+1]=.001;}
    }
    if(!affected)return;
    geometry.setAttribute('uv1',new THREE.BufferAttribute(uv,2));
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
      material.aoMap=texture;material.aoMapIntensity=.85;material.needsUpdate=true;
    }
    surfaces+=affected;
  });
  return surfaces;
}
