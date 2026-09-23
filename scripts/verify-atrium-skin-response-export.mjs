import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {createHash} from 'node:crypto';
const rows=[];
for(const file of process.argv.slice(2)){
 const data=await fs.readFile(file),length=data.readUInt32LE(12),gltf=JSON.parse(data.subarray(20,20+length));
 const bin=data.subarray(28+length),head=gltf.nodes.find(n=>n.name==='Head');assert.ok(head);
 const primitive=gltf.meshes[head.mesh].primitives[0],material=gltf.materials[primitive.material];
 const texture=material.pbrMetallicRoughness.metallicRoughnessTexture;
 assert.equal(texture.texCoord,1);assert.ok(primitive.attributes.TEXCOORD_1!==undefined&&primitive.attributes.COLOR_0!==undefined);
 assert.equal(primitive.attributes.COLOR_1,undefined,'Unused FaceResponse colour was exported');
 assert.equal(material.pbrMetallicRoughness.baseColorTexture,undefined);assert.equal(material.normalTexture,undefined);
 const image=gltf.images[gltf.textures[texture.index].source],view=gltf.bufferViews[image.bufferView];
 const png=PNG.sync.read(bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength));
 assert.equal(png.width,256);assert.equal(png.height,1);
 let maxGreenError=0;for(let i=0;i<256;i++)maxGreenError=Math.max(maxGreenError,Math.abs(png.data[i*4+1]-i));
 assert.equal(maxGreenError,0,'Export changed the linear roughness response');
 rows.push({file,sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length,lookupBytes:view.byteLength,lookupSize:[png.width,png.height],maxGreenError,attributes:Object.keys(primitive.attributes)});
}
assert.ok(rows.length);console.log(JSON.stringify({passed:true,rows},null,2));
