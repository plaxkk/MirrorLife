// Texture alpha describes a cutout silhouette; opacity describes camera fade.
// Hashing their product makes otherwise solid hair edges permanently speckled.
export function configureAtriumPlayerFade(material){
  material.alphaHash=true;
  if(!(material.alphaTest>0))return;
  material.alphaToCoverage=false;
  const previous=material.onBeforeCompile;
  const previousKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    previous.call(this,shader,renderer);
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
      float atriumCutoutAlpha = diffuseColor.a;
      diffuseColor.a = opacity > 0.0 ? diffuseColor.a / opacity : 0.0;
      #include <alphatest_fragment>
      diffuseColor.a = opacity;
    `).replace('#include <alphahash_fragment>',`
      #include <alphahash_fragment>
      diffuseColor.a = atriumCutoutAlpha;
    `);
  };
  material.customProgramCacheKey=()=>previousKey+'|atrium-cutout-fade-v1';
  material.needsUpdate=true;
}
