// Decode the shipped compressed attributes with Three's bundled JS decoder.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
let decoderPromise;
export function loadDracoDecoder(){
 return decoderPromise??=(async()=>{
  const filename=fileURLToPath(new URL('../../node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js',import.meta.url));
  const module={exports:{}};
  vm.runInNewContext(await fs.readFile(filename,'utf8'),{module,exports:module.exports,require:createRequire(import.meta.url),__dirname:path.dirname(filename),__filename:filename,process,console,Buffer,setTimeout,clearTimeout,TextDecoder,TextEncoder},{filename});
  return module.exports({});
 })();
}
export function decodeDracoAttribute(draco,gltf,binary,primitive,semantic){
 const extension=primitive.extensions?.KHR_draco_mesh_compression;assert.ok(extension);
 const view=gltf.bufferViews[extension.bufferView],bytes=binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
 const decoder=new draco.Decoder(),buffer=new draco.DecoderBuffer(),mesh=new draco.Mesh(),array=new draco.DracoFloat32Array();
 let status;
 try{
  buffer.Init(new Int8Array(bytes),bytes.length);status=decoder.DecodeBufferToMesh(buffer,mesh);assert.ok(status.ok());
  const attribute=decoder.GetAttributeByUniqueId(mesh,extension.attributes[semantic]);assert.ok(attribute?.ptr);
  assert.ok(decoder.GetAttributeFloatForAllPoints(mesh,attribute,array));
  const components=attribute.num_components(),values=Float32Array.from({length:mesh.num_points()*components},(_,i)=>array.GetValue(i));
  return {components,values};
 }finally{for(const object of [status,array,mesh,buffer,decoder])if(object)draco.destroy(object);}
}
