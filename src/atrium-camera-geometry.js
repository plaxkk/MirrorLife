import {Vector3} from 'three';

// Reuse the decoded visible LOD. Rapier builds a spatial index once; no per-frame
// scan of render triangles, extra downloads, or changes to render geometry.
export function addAtriumCameraGeometry(scene,physics){
  scene.updateMatrixWorld(true);const point=new Vector3();let triangles=0;
  scene.traverse(node=>{
    if(!node.isMesh||/Leaf|Soil/i.test(node.material?.name||''))return;
    const position=node.geometry.getAttribute('position');
    const vertices=new Float32Array(position.count*3);
    for(let i=0;i<position.count;i++){
      point.fromBufferAttribute(position,i).applyMatrix4(node.matrixWorld);point.toArray(vertices,i*3);
    }
    const source=node.geometry.index;
    const indices=source?Uint32Array.from(source.array):Uint32Array.from({length:position.count},(_,i)=>i);
    physics.addCameraMesh(vertices,indices);triangles+=indices.length/3;
  });
  physics.world.step();return triangles;
}
