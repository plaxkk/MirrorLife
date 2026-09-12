import * as THREE from 'three';
import {loadAtriumGLB,disposeAtriumDecoder} from './atrium-assets.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createAtriumPhysics} from './atrium-physics.js';
import {addAtriumCameraGeometry} from './atrium-camera-geometry.js';
import {cameraRelativeInput,updateMoveVelocity,wrapAngle} from './atrium-locomotion.js';
import {loadAtriumActor} from './atrium-actors.js';
import {applyAtriumFloorContact} from './atrium-floor-contact.js';
import {updateAtriumSeatMotion} from './atrium-seat-motion.js';
import {createAtriumGpuTiming} from './atrium-gpu-timing.js';
import {RESIDENTS,DISCOVERIES,SHARED_TABLE,SEATS,canDecide,applyDecision,residentSpeech,DECISIONS} from './atrium-content.js';
import {loadAtriumState,saveAtriumState,appendAtriumMemory,flushAtriumMemories} from './atrium-persistence.js';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const mobile=params.get('quality')==='mobile'||(!params.has('quality')&&innerWidth<=720);
const profile=mobile?'mobile':'desktop';
const loaded=loadAtriumState();const state=loaded.state;
const startedAt=performance.now();let readyAt=null,enteredAt=null,firstActiveFrameAt=null;
let renderer,scene,camera,composer,physics,player,environment,animationId,resizeTimer,gpuTiming;
let active=false,disposed=false,dialogTarget=null,nearest=null,seated=null,careUntil=0,careItem=null,lifeProps=null;
let orbitYaw=.0,orbitPitch=.21,orbitDistance=3.35,referenceView=false;
let requestedYaw=0,requestedPitch=.21,cameraBoom=3.35,cameraInitialized=false;
let playerFade=1;
let clearanceAngle=.21;
let cameraGeometry=null;
const playerMaterials=[];
const moveVelocity={x:0,z:0};
const followTarget=new THREE.Vector3();
const physicsPrevious=new THREE.Vector3(),physicsCurrent=new THREE.Vector3();
const physicalMotion=new THREE.Vector2();
let renderPositionReady=false;
let last=0,accumulator=0,elapsed=0,stepDistance=0,lastSave=0,lastHud=0,toastTimer;
let moving=0,gestureX=0,gestureY=0,pointer=null,stickPointer=null;
let sound=null,soundEnabled=false;
const keys=new Set(),actors=[],labels=[],frameTimes=[],errors=[];
const cpuTimes=[];
const renderPeaks={calls:0,triangles:0,geometries:0};
const target=new THREE.Vector3(),desired=new THREE.Vector3(),direction=new THREE.Vector3();
const REFERENCE_CAMERA={position:[-3.4,2.65,6.8],target:[1,2.8,-2],fov:62,aspect:16/9};
const tooltipList=[...DISCOVERIES,SHARED_TABLE,...SEATS,...RESIDENTS.map(r=>({...r,kind:'person'})),{id:'exit',name:'返回城市',position:[-4.4,0,7.45],kind:'exit'}];
const visitedPositions=[];

function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4800);}
function persist(){
  if(physics&&!seated){const p=physics.feet();state.position=[p.x,p.y,p.z];}
  const error=saveAtriumState(state);if(error)toast('当前进度暂时无法写入，保持页面打开可继续探索。');
}
async function remember(id,text,personId='avatar'){
  const entry={id,text,ts:Date.now()};state.journal.push(entry);persist();updateHud();
  try{await appendAtriumMemory(entry,personId);}catch(error){errors.push({type:'memory',message:String(error)});toast('探索已保留在本机；记忆档案写入失败，下次会重试。');}
}
function chime(){if(!soundEnabled||!sound)return;const o=sound.createOscillator(),g=sound.createGain();o.type='sine';o.frequency.setValueAtTime(523.25,sound.currentTime);o.frequency.exponentialRampToValueAtTime(783.99,sound.currentTime+.16);g.gain.setValueAtTime(.055,sound.currentTime);g.gain.exponentialRampToValueAtTime(.001,sound.currentTime+.5);o.connect(g);g.connect(sound.destination);o.start();o.stop(sound.currentTime+.5);}
function toggleSound(){
  try{if(!sound)sound=new AudioContext();soundEnabled=!soundEnabled;if(soundEnabled)sound.resume().catch(()=>{});toast(soundEnabled?'提示音已开启':'提示音已关闭');chime();}
  catch{soundEnabled=false;toast('当前设备暂时不能播放提示音，其他操作不受影响。');}
}
function updateHud(){
  $('talk-progress').textContent=`结识 ${Math.min(2,state.talked.length)} / 2`;
  $('find-progress').textContent=`发现 ${Math.min(2,state.discovered.length)} / 2`;
  $('journal-count').textContent=state.journal.length;
  $('objective-title').textContent=state.decision?'这个夜晚，有了安排':'一起安排一个夜晚';
  $('objective-text').textContent=state.decision?'决定已经记下。继续走走，听听大家的回应。':canDecide(state)?'回到中央共享桌，把大家的想法放在一起。':'先和两位居民聊聊，再去屋子里走走。';
  const height=physics?.feet().y||0;
  $('location').textContent=`天井生活馆 · ${height>2.8?'二层回廊':height>.3?'楼梯':'一层'}`;
}
function closeDialogue(){
  if(careItem){careItem=null;careUntil=0;toast('动作已取消，没有改变探索记录。');}
  if(dialogTarget?.kind==='person'){
    const a=actors.find(x=>x.id===dialogTarget.id);if(a)a.facingYaw=a.definition.yaw||0;
  }
  dialogTarget=null;$('dialogue').hidden=true;keys.clear();$('world').focus();
}
function showDialogue(title,meta,text,choices=[],targetInfo=null){
  keys.clear();gestureX=gestureY=0;dialogTarget=targetInfo;
  $('dialogue-title').textContent=title;$('dialogue-meta').textContent=meta;$('dialogue-text').textContent=text;
  $('speaker-avatar').textContent=title.charAt(0);$('dialogue-choices').replaceChildren();
  for(const c of choices){const b=document.createElement('button');b.textContent=c.label;b.disabled=!!c.disabled;b.addEventListener('click',()=>c.action());$('dialogue-choices').append(b);}
  $('dialogue').hidden=false;$('interaction').hidden=true;$('dialogue-close').focus();
}
function startInteraction(item=nearest){
  if(!active||!item||!$('dialogue').hidden||!$('drawer').hidden)return;
  if(seated){stand();return;}
  const p=physics.feet();const ip=item.kind==='person'?actors.find(a=>a.id===item.id)?.group.position:null;
  const pos=ip||new THREE.Vector3(...item.position);
  if(Math.hypot(pos.x-p.x,pos.z-p.z)>2.15||Math.abs(pos.y-p.y)>.9){toast('再靠近一点，就能交流。');return;}
  if(item.kind==='exit'){persist();location.href='/game.html';return;}
  if(item.kind==='seat'){
    seated={item,returnPosition:[p.x,p.y,p.z]};player.group.rotation.y=item.yaw;
    player.group.position.set(item.seatedPosition[0],item.position[1],item.seatedPosition[2]);
    toast('在这里坐一会儿。按 E 或移动键起身。');return;
  }
  if(item.kind==='person'){
    const actor=actors.find(x=>x.id===item.id);
    if(!actor){toast('这位居民还在路上，稍后再来。');return;}
    if(actor.busy){toast(`${item.name}正在收好手里的东西，稍等片刻再聊。`);return;}
    actor.facingYaw=Math.atan2(p.x-actor.group.position.x,p.z-actor.group.position.z);
    player.group.rotation.y=Math.atan2(actor.group.position.x-p.x,actor.group.position.z-p.z);
    if(!state.talked.includes(item.id)){
      state.talked.push(item.id);state.relations[item.id]=(state.relations[item.id]||0)+1;
      remember(`meet-${item.id}`,`和${item.name}交流：${item.hint}`,item.id);chime();
    }
    showDialogue(item.name,`${item.mbti} · 住在这里的人`,residentSpeech(item,state),[
      {label:'你希望今晚是什么样？',action:()=>{$('dialogue-text').textContent=item.need==='quiet'?'“可以参与，也可以安静地待一会儿。如果大家都能找到舒服的位置，就很好。”':item.need==='care'?'“有人照顾植物，也有人照顾人的心情。一起把屋子打理好，就是很好的开始。”':'“想听听每个人最近发生的小事。认识久了，也总有新的发现。”';}},
      {label:'我再去走走',action:closeDialogue}
    ],item);return;
  }
  if(item.kind==='decision'){
    if(state.decision){showDialogue('今晚的安排','共同决定 · 已保存',DECISIONS[state.decision].text,[{label:'继续探索',action:closeDialogue}],item);return;}
    if(!canDecide(state)){showDialogue('一起安排一个夜晚','中央共享桌','先听听两位居民的想法，再去屋子里发现至少两条线索。大家想要的夜晚，也许不太一样。',[{label:'先去听听大家',action:closeDialogue}],item);return;}
    showDialogue('把想法放在一起','中央共享桌 · 共同决定','楼下有人期待热闹，楼上有人需要安静。你想怎样安排今晚？',Object.entries(DECISIONS).map(([key,value])=>({label:value.label,action:()=>{
      if(!applyDecision(state,key))return;persist();updateHud();chime();
      appendAtriumMemory(state.journal.at(-1)).catch(e=>{errors.push({type:'memory',message:String(e)});toast('决定已在本机保存；记忆档案将在重入时重试同步。');});
      closeDialogue();showDialogue('我们的第一个夜晚','决定已经保留',value.text,[{label:'去听听大家的回应',action:closeDialogue}],item);
    }})),item);return;
  }
  if(item.kind==='care'){
    careItem=item;careUntil=elapsed+3;
    player.group.rotation.y=Math.atan2(pos.x-p.x,pos.z-p.z);
    if(lifeProps){lifeProps.getObjectByName('WateringCan').visible=item.id==='plant';lifeProps.getObjectByName('TeaCup').visible=item.id==='tea';}
    showDialogue(item.name,'生活里的小动作',item.id==='plant'?'轻轻提起水壶，让水慢慢浸入土里…':'把温茶倒进杯里，留一点时间让茶叶舒展…',[{label:'正在完成…',disabled:true,action:()=>{}}],item);
    return;
  }
  finishDiscovery(item);
  showDialogue(item.name,`${state.discovered.length} / ${DISCOVERIES.length} 个生活片刻`,item.text,[{label:'收进手记',action:closeDialogue}],item);
}
function finishDiscovery(item){
  if(!state.discovered.includes(item.id)){
    state.discovered.push(item.id);
    if(item.id==='plant')state.relations.xu=Math.min(10,(state.relations.xu||0)+1);
    remember(item.id,item.text);chime();toast(item.result);
  }
}
function stand(){if(!seated)return;const returnPosition=seated.returnPosition;seated=null;physics.teleport(returnPosition);player.group.position.set(...returnPosition);}
function openDrawer(type){
  closeDialogue();keys.clear();$('drawer').hidden=false;$('drawer-body').replaceChildren();
  $('drawer-title').textContent=type==='journal'?'探索手记':'在这里，慢慢走';
  if(type==='journal'){
    if(!state.journal.length){const p=document.createElement('p');p.textContent='有些发现，藏在一次交谈、一杯茶和窗边的停留里。';$('drawer-body').append(p);}
    for(const entry of [...state.journal].reverse()){
      const article=document.createElement('article');article.className='journal-entry';article.textContent=entry.text;
      const time=document.createElement('time');time.textContent=new Date(entry.ts).toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});article.append(time);$('drawer-body').append(article);
    }
  }else{
    const p=document.createElement('p');p.textContent='WASD / 方向键行走，Shift 快走。按住鼠标或手指拖动环顾，滚轮调整距离。E 交谈、使用或起身，Esc 结束对话。触屏左侧摇杆移动，右侧拖动看向别处。';$('drawer-body').append(p);
    for(const [text,action]of [['桌面精细画质',()=>location.href='/atrium.html?quality=desktop'],['移动轻量画质',()=>location.href='/atrium.html?quality=mobile'],['查看参考构图',()=>{referenceView=true;closeDrawer();}],['回到人物视角',()=>{referenceView=false;closeDrawer();}],['提示音 开 / 关（默认关闭）',toggleSound]]){const b=document.createElement('button');b.textContent=text;b.onclick=action;$('drawer-body').append(b);}
  }
  $('drawer-close').focus();
}
function closeDrawer(){$('drawer').hidden=true;$('world').focus();}

function bindInput(){
  window.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.code==='Tab'){
      const modal=!$('dialogue').hidden?$('dialogue'):!$('drawer').hidden?$('drawer'):null;
      if(modal){const buttons=[...modal.querySelectorAll('button:not([disabled]),a[href]')];const index=buttons.indexOf(document.activeElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();return;}
    }
    if(event.code==='Escape'){closeDialogue();closeDrawer();return;}
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)&&event.target.tagName!=='BUTTON')event.preventDefault();
    if(event.code==='KeyE'&&!event.repeat){if(seated)stand();else startInteraction();return;}
    if(event.code==='KeyJ'&&!event.repeat){openDrawer('journal');return;}
    if(!$('dialogue').hidden||!$('drawer').hidden||!active)return;
    keys.add(event.code);
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',()=>{keys.clear();gestureX=gestureY=0;pointer=null;stickPointer=null;$('joystick').firstElementChild.style.transform='';persist();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();persist();}last=performance.now();accumulator=0;});
  $('world').addEventListener('pointerdown',e=>{if(!active||!$('dialogue').hidden||!$('drawer').hidden)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};$('world').setPointerCapture(e.pointerId);});
  $('world').addEventListener('pointermove',e=>{if(pointer?.id!==e.pointerId)return;referenceView=false;requestedYaw-=(e.clientX-pointer.x)*.005;requestedPitch=THREE.MathUtils.clamp(requestedPitch+(e.clientY-pointer.y)*.004,.06,.9);pointer.x=e.clientX;pointer.y=e.clientY;});
  const clearPointer=()=>{pointer=null;};$('world').addEventListener('pointerup',clearPointer);$('world').addEventListener('pointercancel',clearPointer);
  $('world').addEventListener('wheel',e=>{e.preventDefault();referenceView=false;orbitDistance=THREE.MathUtils.clamp(orbitDistance+e.deltaY*.003,1.5,5);},{passive:false});
  $('world').addEventListener('contextmenu',e=>e.preventDefault());
  $('interaction').onclick=()=>startInteraction();$('mobile-interact').onclick=()=>seated?stand():startInteraction();
  $('dialogue-close').onclick=closeDialogue;$('journal-button').onclick=()=>openDrawer('journal');$('settings-button').onclick=()=>openDrawer('settings');$('drawer-close').onclick=closeDrawer;
  const updateStick=e=>{const r=$('joystick').getBoundingClientRect(),radius=Math.min(r.width,r.height)*.33;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const l=Math.hypot(x,y);if(l>radius){x*=radius/l;y*=radius/l;}gestureX=x/radius;gestureY=y/radius;$('joystick').firstElementChild.style.transform=`translate(${x}px,${y}px)`;};
  $('joystick').addEventListener('pointerdown',e=>{if(stickPointer!==null)return;stickPointer=e.pointerId;$('joystick').setPointerCapture(e.pointerId);updateStick(e);});
  $('joystick').addEventListener('pointermove',e=>{if(e.pointerId!==stickPointer)return;updateStick(e);});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(ev,()=>{stickPointer=null;gestureX=gestureY=0;$('joystick').firstElementChild.style.transform='';});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,80);});
  window.addEventListener('pagehide',()=>{persist();dispose();},{once:true});
  $('world').addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;$('loading').hidden=false;$('loading-text').textContent='画面连接中断，进度已保留。请重新加载。';$('retry').hidden=false;$('enter').hidden=true;persist();});
}

function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer?.setSize(innerWidth,innerHeight);}
async function checkedJSON(url){const response=await fetch(url);if(!response.ok)throw new Error(`${url}: ${response.status}`);return response.json();}
function loadProgress(value,text){$('loading-progress').value=value;$('loading-text').textContent=text;}
async function boot(){
  document.body.dataset.ready='false';
  renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
  gpuTiming=createAtriumGpuTiming(renderer.getContext());
  renderer.setPixelRatio(mobile?Math.min(devicePixelRatio,1.25):Math.min(devicePixelRatio,1.5));
  renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=.85;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;
  scene=new THREE.Scene();scene.background=new THREE.Color('#c6dce3');scene.fog=new THREE.Fog('#dce4df',38,100);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.075,130);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environment=pmrem.fromScene(room,.04).texture;scene.environment=environment;scene.environmentIntensity=.35;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e9f3f1','#b6a28b',.42));
  const sun=new THREE.DirectionalLight('#fff0d4',2.3);sun.position.set(-7,16,6);sun.target.position.set(0,0,-1);sun.castShadow=true;
  sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);sun.shadow.camera.left=-16;sun.shadow.camera.right=16;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.camera.near=.5;sun.shadow.camera.far=50;sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#dcece9',.16);fill.position.set(3,4,-12);scene.add(fill);
  const bounce=new THREE.PointLight('#ffe3a7',12,22,2);bounce.position.set(0,4.8,0);scene.add(bounce);
  // Broad warm return from the west window/cream reveal. This is an authored
  // indirect-light approximation; the skylight remains the shadow-casting key.
  const windowBounce=new THREE.PointLight('#ffe4ba',8,14,2);windowBounce.position.set(-6,3.2,3);scene.add(windowBounce);
  loadProgress(8,'正在打开建筑与楼梯…');
  const [model,definitions]=await Promise.all([loadAtriumGLB(`/assets/atrium/atrium-${profile}.glb`),checkedJSON('/assets/atrium/collision.json')]);
  model.scene.traverse(node=>{if(!node.isMesh)return;node.castShadow=node.material.name!=='Window glass';node.receiveShadow=true;node.material.side=THREE.DoubleSide;if(node.material.map){node.material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());} });
  scene.add(model.scene);physics=await createAtriumPhysics(definitions);
  const cameraGeometryStarted=performance.now();
  const cameraTriangles=addAtriumCameraGeometry(model.scene,physics);
  cameraGeometry={triangles:cameraTriangles,buildMs:performance.now()-cameraGeometryStarted};
  // Optional baked contact improves static grounding. A failed texture must not
  // strand the player on the loading screen; live shadows remain available.
  try{
    const contact=await new THREE.TextureLoader().loadAsync('/assets/atrium/floor-contact.png');
    applyAtriumFloorContact(model.scene,contact);
  }catch(error){errors.push({type:'optional-contact-texture',message:String(error)});}
  camera.position.set(...REFERENCE_CAMERA.position);camera.lookAt(...REFERENCE_CAMERA.target);
  // Static architecture shadow is rendered once from the full model. Moving residents
  // use a separate live shadow pass, so neither stale silhouettes nor repeated static
  // geometry are charged every frame. Both maps light the same playable scene.
  renderer.render(scene,camera);sun.shadow.autoUpdate=false;
  model.scene.traverse(node=>{if(node.isMesh)node.castShadow=false;});
  const actorLight=new THREE.DirectionalLight('#fff2dd',.55);actorLight.position.copy(sun.position);actorLight.target.position.copy(sun.target.position);actorLight.castShadow=true;
  Object.assign(actorLight.shadow.camera,{left:-13,right:13,top:11,bottom:-11,near:.5,far:50});actorLight.shadow.mapSize.set(1024,1024);actorLight.shadow.normalBias=.025;actorLight.shadow.bias=-.0001;scene.add(actorLight,actorLight.target);
  loadProgress(38,'正在准备你的分身…');
  player=await loadAtriumActor('you',{role:'player',position:[-4.3,0,6.3],yaw:Math.PI},mobile);scene.add(player.group);
  const uniquePlayerMaterials=new Set();player.group.traverse(node=>{if(node.isMesh)for(const material of Array.isArray(node.material)?node.material:[node.material])uniquePlayerMaterials.add(material);});
  for(const material of uniquePlayerMaterials){material.alphaHash=true;playerMaterials.push({material,opacity:material.opacity});}
  const handAssets=await loadAtriumGLB('/assets/atrium/life-props.glb');lifeProps=handAssets.scene;player.attachLifeProp(lifeProps);
  const oldPosition=state.position;
  if(oldPosition&&Math.abs(oldPosition[0])<10.5&&Math.abs(oldPosition[2])<7.6&&oldPosition[1]>=-.1&&oldPosition[1]<4&&physics.canStandAt(oldPosition))physics.teleport(oldPosition);
  loadProgress(48,'居民正在回到生活馆…');
  // Bounded two-at-a-time loading avoids a burst of seven decoder/skin allocations.
  for(let i=0;i<RESIDENTS.length;i+=2){
    const batch=await Promise.all(RESIDENTS.slice(i,i+2).map(r=>loadAtriumActor(r.id,r,mobile)));
    for(const actor of batch){
      actors.push(actor);scene.add(actor.group);physics.addResident(actor.id,actor.group.position);
      if(actor.id==='xu'||actor.id==='he'){const prop=handAssets.scene.clone(true);prop.getObjectByName('WateringCan').visible=actor.id==='xu';prop.getObjectByName('TeaCup').visible=actor.id==='he';actor.attachLifeProp(prop);}
      const name=document.createElement('span');name.className='resident-name';name.textContent=actor.definition.name;$('resident-labels').append(name);labels.push({actor,element:name});
    }
    loadProgress(48+(i+2)/RESIDENTS.length*38,`正在准备居民与生活物件 ${Math.min(i+2,RESIDENTS.length)} / ${RESIDENTS.length}`);
  }
  // A readable card is a real object on the record table, not a HUD-only outcome.
  const notice=document.createElement('canvas');notice.width=512;notice.height=288;const ink=notice.getContext('2d');
  ink.fillStyle='#f4e8cc';ink.fillRect(0,0,512,288);ink.strokeStyle='#c99743';ink.lineWidth=9;ink.strokeRect(14,14,484,260);
  ink.textAlign='center';ink.fillStyle='#273c46';ink.font='600 67px "PingFang SC", sans-serif';ink.fillText('安静角',256,145);
  ink.fillStyle='#6c958d';ink.font='22px sans-serif';ink.fillText('QUIET CORNER',256,207);
  const print=new THREE.CanvasTexture(notice);print.colorSpace=THREE.SRGBColorSpace;
  const edge=new THREE.MeshStandardMaterial({color:'#bf955a',roughness:.8}),front=new THREE.MeshStandardMaterial({map:print,roughness:.92});
  const marker=new THREE.Mesh(new THREE.BoxGeometry(.44,.248,.026),[edge,edge,edge,edge,front,edge]);marker.name='Quiet-corner notice';marker.position.set(-8.2,4.415,1.29);scene.add(marker);
  window.__atrium={
    getGripDiagnostics:()=>[player,...actors].map(a=>({id:a.id,grips:a.gripDiagnostics()})),
    getFootDiagnostics:()=>[player,...actors].map(a=>({id:a.id,seatBlend:a.seatBlend,feet:a.footDiagnostics()})),
    getState:()=>JSON.parse(JSON.stringify(state)),
    getStats:()=>stats(),
    beginMeasurement:()=>{frameTimes.length=0;cpuTimes.length=0;gpuTiming.reset();renderPeaks.calls=renderPeaks.triangles=renderPeaks.geometries=0;},
    getPosition:()=>physics.feet(),
    isPositionClear:()=>{const p=physics.feet();return physics.canStandAt([p.x,p.y,p.z]);},
    getInteractionState:()=>({seated:seated?.item.id||null,care:careItem?.id||null,dialogue:dialogTarget?.id||null,residents:actors.map(a=>({id:a.id,busy:!!a.busy,position:a.group.position.toArray(),yaw:a.group.rotation.y,seatBlend:a.seatBlend,seatMotion:a.seatMotion}))}),
    calibration:REFERENCE_CAMERA,
    getHeading:()=>orbitYaw,
    getCameraDiagnostics:()=>({heading:orbitYaw,requestedHeading:requestedYaw,pitch:orbitPitch,clearancePitch:clearanceAngle,lookPitch:-Math.asin(camera.getWorldDirection(new THREE.Vector3()).y),boom:cameraBoom,fade:playerFade,playerYaw:player.group.rotation.y,velocity:{...moveVelocity}}),
    // Review helpers are separate from the input-driven playthrough used for acceptance.
    setReviewCamera:(pos,look)=>{referenceView={position:pos,target:look};},
    followCamera:()=>{referenceView=false;},
    setReviewPosition:pos=>{stand();closeDialogue();physics.teleport(pos);player.group.position.set(...pos);},
    setHeading:yaw=>{referenceView=false;orbitYaw=requestedYaw=yaw;cameraInitialized=false;},
    setCapture:enabled=>document.body.classList.toggle('capture',enabled),
    targets:tooltipList,
  };
  updateHud();bindInput();resize();loadProgress(94,'正在准备日光、阴影与人物动作…');
  camera.position.set(...REFERENCE_CAMERA.position);camera.lookAt(...REFERENCE_CAMERA.target);
  await renderer.compileAsync(scene,camera);renderer.info.reset();if(composer)composer.render();else renderer.render(scene,camera);
  readyAt=performance.now();loadProgress(100,'窗边有阳光，桌边有人。慢慢走进去吧。');$('enter').hidden=false;
  $('enter').onclick=()=>{if(active)return;active=true;enteredAt=performance.now();$('loading').hidden=true;document.body.dataset.ready='true';$('world').focus();
    flushAtriumMemories().catch(()=>toast('本机探索可继续，记忆档案稍后再同步。'));
    // Opening the OS audio device can block input on some desktop hosts.
    // Optional chimes are enabled explicitly in settings, outside the entry path.
    if(loaded.error)toast('未能恢复上次进度，已开始新的生活馆记录。');
  };
  const tick=now=>{
    const cpuStarted=performance.now();
    if(disposed)return;animationId=requestAnimationFrame(tick);
    const raw=last?now-last:16.67;last=now;if(document.hidden)return;
    const dt=Math.min(raw/1000,.05);elapsed+=raw/1000;
    if(careItem&&elapsed>=careUntil){const item=careItem;careItem=null;finishDiscovery(item);showDialogue(item.name,'生活小动作 · 已完成',item.text,[{label:'做完了，继续走走',action:closeDialogue}],item);}
    if(active){if(firstActiveFrameAt===null)firstActiveFrameAt=performance.now();frameTimes.push(raw);if(frameTimes.length>18000)frameTimes.shift();}
    moving=0;
    const paused=!active||!$('dialogue').hidden||!$('drawer').hidden;
    let ix=paused?0:(Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+gestureX);
    let iz=paused?0:(Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+gestureY);
    if(Math.hypot(ix,iz)>.08){referenceView=false;if(seated)stand();const norm=Math.max(1,Math.hypot(ix,iz));ix/=norm;iz/=norm;}
    const speed=keys.has('ShiftLeft')?3.65:2.25;
    const input=cameraRelativeInput(ix,iz,orbitYaw);
    const velocity=updateMoveVelocity(moveVelocity,input,speed,dt,paused||!!seated);
    const dx=velocity.x,dz=velocity.z;
    const before=physics.feet();accumulator+=Math.min(raw/1000,.1);
    if(!seated){
      if(!renderPositionReady||Math.hypot(before.x-physicsCurrent.x,before.y-physicsCurrent.y,before.z-physicsCurrent.z)>.1){physicsCurrent.set(before.x,before.y,before.z);physicsPrevious.copy(physicsCurrent);physicalMotion.set(0,0);renderPositionReady=true;}
      while(accumulator>=1/60){physicsPrevious.copy(physicsCurrent);const step=physics.move(dx/60,dz/60);physicalMotion.set(step.x-physicsCurrent.x,step.z-physicsCurrent.z);physicsCurrent.set(step.x,step.y,step.z);accumulator-=1/60;}
      const pos=physics.feet();player.group.position.lerpVectors(physicsPrevious,physicsCurrent,accumulator*60);moving=paused?0:physicalMotion.length()*60;
      // Render frames without a physics step retain the last physical heading;
      // otherwise high-refresh displays alternate walk/idle and turn toward 0.
      if(moving>.08){const heading=Math.atan2(physicalMotion.x,physicalMotion.y);player.group.rotation.y+=wrapAngle(heading-player.group.rotation.y)*(1-Math.exp(-16*dt));stepDistance+=moving*dt;}
      if(pos.y<-.6||Math.abs(pos.x)>11.1||Math.abs(pos.z)>8.4){physics.teleport([-4.3,0,6.3]);toast('已回到入口，探索记录仍然保留。');}
    }else {accumulator=0;renderPositionReady=false;}
    player.update(elapsed,dt,{moving,seated:!!seated,seatHeight:seated?seated.item.seatedPosition[1]-seated.item.position[1]:.53,listening:dialogTarget?.kind==='person',floorAt:physics.floorAt,care:!!careItem});
    for(const actor of actors){
      let walking=0;const talking=dialogTarget?.id===actor.id;
      if(actor.definition.route&&!talking){
        const [a,b]=actor.definition.route;const previous=actor.group.position.clone();
        const yielding=Math.abs(previous.x-player.group.position.x)<1.6&&Math.abs(player.group.position.y-3.5)<.6;
        if(!yielding){actor.routeTime=(actor.routeTime||0)+dt;const phase=(actor.routeTime*.09)%2;actor.group.position.x=THREE.MathUtils.lerp(a[0],b[0],phase<=1?phase:2-phase);actor.facingYaw=phase<1?-Math.PI/2:Math.PI/2;}
        actor.group.position.z=THREE.MathUtils.damp(previous.z,yielding?-6.5:a[1],7,dt);
        walking=actor.group.position.distanceTo(previous)/Math.max(.001,dt);
      }
      const facing=actor.facingYaw??actor.definition.yaw??0;
      const turnDelta=Math.atan2(Math.sin(facing-actor.group.rotation.y),Math.cos(facing-actor.group.rotation.y));
      // Stand before turning toward someone behind a chair; turn back before sitting.
      let shouldSit=!!actor.definition.seated&&!talking&&Math.abs(turnDelta)<.08;
      if(actor.definition.standPosition){
        actor.seatMotion=updateAtriumSeatMotion(actor,talking,player.group.position,dt);
        shouldSit=actor.seatMotion.seated;walking=actor.seatMotion.moving;
      }else if(actor.seatBlend<.15)actor.group.rotation.y+=turnDelta*(1-Math.exp(-8*dt));
      actor.busy=!talking&&((actor.id==='xu'&&elapsed%18<3)||(actor.id==='he'&&elapsed%23<2.5));
      actor.update(elapsed,dt,{moving:walking,talking,seated:shouldSit,care:actor.busy,lookingAt:talking?player.group.position:null});
      physics.updateResident(actor.id,actor.group.position);
    }
    marker.visible=state.decision==='balanced'||state.decision==='quiet';
    updateCamera(dt);
    if(elapsed-lastHud>.13){updateNearby();updateHud();lastHud=elapsed;}
    updateLabels();
    if(active&&elapsed-lastSave>8){persist();lastSave=elapsed;visitedPositions.push({...physics.feet(),t:elapsed});}
    const renderStarted=performance.now();renderer.info.reset();gpuTiming.begin();if(composer)composer.render();else renderer.render(scene,camera);gpuTiming.end();
    if(active){cpuTimes.push({script:renderStarted-cpuStarted,render:performance.now()-renderStarted});if(cpuTimes.length>18000)cpuTimes.shift();}
    if(active){renderPeaks.calls=Math.max(renderPeaks.calls,renderer.info.render.calls);renderPeaks.triangles=Math.max(renderPeaks.triangles,renderer.info.render.triangles);renderPeaks.geometries=Math.max(renderPeaks.geometries,renderer.info.memory.geometries);}
  };
  animationId=requestAnimationFrame(tick);
}

function updateCamera(dt){
  if(referenceView){const v=referenceView===true?REFERENCE_CAMERA:referenceView;camera.position.set(...v.position);camera.lookAt(...v.target);cameraInitialized=false;applyPlayerFade(1);return;}
  orbitYaw+=wrapAngle(requestedYaw-orbitYaw)*(1-Math.exp(-24*dt));
  orbitPitch=THREE.MathUtils.damp(orbitPitch,requestedPitch,24,dt);
  target.copy(player.group.position);target.y+=seated ? 1.1 : 1.35;
  if(!cameraInitialized||followTarget.distanceTo(target)>2){followTarget.copy(target);cameraInitialized=true;}
  else{followTarget.x=THREE.MathUtils.damp(followTarget.x,target.x,22,dt);followTarget.z=THREE.MathUtils.damp(followTarget.z,target.z,22,dt);followTarget.y=THREE.MathUtils.damp(followTarget.y,target.y,12,dt);}
  // The player's pitch is authoritative. Per-frame automatic pitch selection
  // caused mode-like view changes while walking past window reveals.
  clearanceAngle=orbitPitch;
  direction.set(Math.sin(orbitYaw)*Math.cos(clearanceAngle),Math.sin(clearanceAngle),Math.cos(orbitYaw)*Math.cos(clearanceAngle)).normalize();
  const safe=physics.cameraDistance(followTarget,direction,orbitDistance);
  cameraBoom=safe<cameraBoom?safe:THREE.MathUtils.damp(cameraBoom,safe,5,dt);
  desired.copy(followTarget).addScaledVector(direction,cameraBoom);camera.position.copy(desired);
  // Also validate the interpolated ray while rounding a corner, not only the final orbit ray.
  direction.copy(camera.position).sub(target);const actualDistance=direction.length();
  if(actualDistance>.01){direction.divideScalar(actualDistance);const sweptSafe=physics.cameraDistance(target,direction,actualDistance);if(sweptSafe<actualDistance)camera.position.copy(target).addScaledVector(direction,sweptSafe);}
  // Position and look target use the same smoothed anchor; a raw stair step in
  // the look target otherwise produces a visible angular kick every tread.
  camera.lookAt(followTarget);
  // When a wall forces the camera into the avatar, reveal the navigable scene
  // through the avatar instead of filling the screen with its head/back.
  const fade=THREE.MathUtils.smoothstep(camera.position.distanceTo(target),.85,1.25);
  playerFade=fade<playerFade?fade:THREE.MathUtils.damp(playerFade,fade,12,dt);
  applyPlayerFade(playerFade);
}
function applyPlayerFade(alpha){
  player.group.visible=true;
  for(const entry of playerMaterials){
    entry.material.opacity=entry.opacity*alpha;
  }
}
function updateNearby(){
  if(!active||!$('dialogue').hidden||!$('drawer').hidden){$('interaction').hidden=true;return;}
  if(seated){$('interaction').hidden=false;$('interaction-text').textContent='起身，继续走走';nearest=seated.item;return;}
  const p=physics.feet();let best=2.05;nearest=null;
  for(const item of tooltipList){
    const pos=item.kind==='person'?actors.find(a=>a.id===item.id)?.group.position:new THREE.Vector3(...item.position);if(!pos)continue;
    const d=Math.hypot(p.x-pos.x,p.z-pos.z);if(d>=best||Math.abs(p.y-pos.y)>.8)continue;
    if(!physics.sight({x:p.x,y:p.y+1.35,z:p.z},{x:pos.x,y:pos.y+1.3,z:pos.z}))continue;
    best=d;nearest=item;
  }
  $('interaction').hidden=!nearest;$('interaction-text').textContent=nearest?(nearest.kind==='person'?`和${nearest.name}聊聊`:nearest.name):'';
  $('mobile-interact').textContent=nearest?(nearest.kind==='person'?'交谈':'查看'):'走近';
}
const labelV=new THREE.Vector3();
function updateLabels(){for(const {actor,element}of labels){const dist=actor.group.position.distanceTo(player.group.position);labelV.copy(actor.group.position);labelV.y+=actor.definition.seated?1.2:1.96;const unobstructed=dist<6.5&&physics.sight(camera.position,labelV);labelV.project(camera);const visible=active&&unobstructed&&labelV.z<1&&Math.abs(labelV.x)<.95&&Math.abs(labelV.y)<.95;element.hidden=!visible;if(visible){element.style.left=`${(labelV.x*.5+.5)*innerWidth}px`;element.style.top=`${(-labelV.y*.5+.5)*innerHeight}px`;}}}
function stats(){
  const sorted=[...frameTimes].sort((a,b)=>a-b),pct=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]||0;
  const gl=renderer?.getContext(),ext=gl?.getExtension('WEBGL_debug_renderer_info');
  const resources=performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin===location.origin);
  const cpu={};for(const kind of ['script','render']){const values=cpuTimes.map(x=>x[kind]).sort((a,b)=>a-b);cpu[kind]={p50:values[Math.floor(values.length*.5)]||0,p95:values[Math.floor(values.length*.95)]||0};}
  return {ready:!!readyAt,active,profile,
    device:{userAgent:navigator.userAgent,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?.getParameter(gl.RENDERER),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,renderPixelRatio:renderer?.getPixelRatio()},
    loadingMs:readyAt?readyAt-startedAt:null,navigationToReadyMs:readyAt,enterToActiveMs:firstActiveFrameAt!==null?Math.max(0,firstActiveFrameAt-enteredAt):null,sessionMs:enteredAt?performance.now()-enteredAt:null,
    frames:frameTimes.length,frameMs:{p50:pct(.5),p95:pct(.95),p99:pct(.99)},cpuMs:cpu,gpuMs:gpuTiming?.stats(),render:{...renderer?.info.render},renderPeaks:{...renderPeaks},
    memory:{...renderer?.info.memory,jsHeapBytes:performance.memory?.usedJSHeapSize??null},
    resources:resources.map(r=>({url:new URL(r.name).pathname,transferBytes:r.transferSize,decodedBytes:r.decodedBodySize,durationMs:r.duration})),
    actors:actors.length+1,bindings:actors.map(a=>({id:a.id,count:a.bindings.length})),position:physics?.feet(),camera:camera?.position.toArray(),cameraGeometry,distanceWalked:stepDistance,visitedPositions,errors};
}
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(animationId);gpuTiming?.dispose();clearTimeout(resizeTimer);clearTimeout(toastTimer);physics?.dispose();disposeAtriumDecoder();const geometries=new Set(),materials=new Set(),textures=new Set();scene?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.skeleton?.boneTexture)textures.add(o.skeleton.boneTexture);o.shadow?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());environment?.dispose();composer?.dispose();renderer?.dispose();sound?.close().catch(()=>{});}
$('retry').onclick=()=>location.reload();
boot().catch(error=>{console.error(error);errors.push({type:'boot',message:String(error)});$('loading-text').textContent=`生活馆暂时未能打开：${error.message}。可重新尝试或返回城市。`;$('retry').hidden=false;$('enter').hidden=true;});
