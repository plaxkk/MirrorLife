// Shared lighting-space palette for the live scene, including both runtime LODs.
// Material responses stay PBR; no screen-space repaint or view-specific geometry.
export function applyAtriumArtDirection(root) {
  const finishes={
    Saffron:['#cda252',.49],Navy:['#293d46',.56],Mint:['#71988a',.57],
    Coral:['#b9755e',.67],Ceramic:['#e8ddc6',.31],
    Leaf:['#426447',.72],YoungLeaf:['#718256',.76],Brass:['#b5955f',.34],
  };
  const seen=new Set();
  root.traverse(node=>{
    if(!node.isMesh)return;
    for(const material of Array.isArray(node.material)?node.material:[node.material]){
      if(seen.has(material))continue;seen.add(material);
      const finish=finishes[material.name];
      if(finish){material.color.set(finish[0]);material.roughness=finish[1];}
    }
  });
}
