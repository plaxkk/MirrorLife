import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';

const decoder=new DRACOLoader().setDecoderPath('/assets/atrium/draco/').setWorkerLimit(2);
const loader=new GLTFLoader().setDRACOLoader(decoder);
export const loadAtriumGLB=url=>loader.loadAsync(url);
export const disposeAtriumDecoder=()=>decoder.dispose();
