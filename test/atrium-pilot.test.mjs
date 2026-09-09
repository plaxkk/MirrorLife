import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {freshState,normalizeState,applyDecision,canDecide,RESIDENTS,residentSpeech} from '../src/atrium-content.js';
import {createAtriumPhysics} from '../src/atrium-physics.js';
import {loadAtriumState,saveAtriumState} from '../src/atrium-persistence.js';

test('decision requires discoveries and residents, changes memories once',()=>{
  const s=freshState();assert.equal(applyDecision(s,'balanced'),false);
  s.talked=['lin','chen'];s.discovered=['records','tea'];assert.ok(canDecide(s));
  assert.ok(applyDecision(s,'balanced',100));assert.equal(s.relations.lin,2);
  assert.equal(applyDecision(s,'together',200),false);assert.equal(s.journal.length,1);
  assert.match(residentSpeech(RESIDENTS[0],s),/谢谢/);
});
test('corrupt and unknown state cannot unlock decisions or destroy the main save',()=>{
  const s=normalizeState({version:1,talked:['unknown','lin','lin'],discovered:['tea','tea'],relations:{lin:99},decision:'__proto__',position:[0,Infinity,0]});
  assert.deepEqual(s.talked,['lin']);assert.deepEqual(s.discovered,['tea']);assert.equal(s.decision,null);assert.equal(s.position,null);assert.equal(s.relations.lin,10);
  const store={getItem(){return '{'},setItem(){throw new Error('quota');}};
  assert.equal(loadAtriumState(store).state.version,1);assert.match(saveAtriumState(s,store),/quota/);
});
test('discoveries alter local dialogue',()=>{
  const s=freshState();const before=residentSpeech(RESIDENTS[0],s);s.discovered.push('records');assert.notEqual(residentSpeech(RESIDENTS[0],s),before);
});
test('wall camera probes contract while residents remain physical but do not obstruct the orbit ray',async()=>{
  const p=await createAtriumPhysics(JSON.parse(await fs.readFile(new URL('../public/assets/atrium/collision.json',import.meta.url),'utf8')));
  try{
    const distance=p.cameraDistance({x:10.4,y:1.3,z:2},{x:1,y:0,z:0},3.3);
    assert.ok(distance<.6&&distance>=.2,String(distance));
    p.addResident('test',{x:4,y:0,z:2.5});p.teleport([4,0,4]);
    assert.equal(p.cameraDistance({x:4,y:1.3,z:4},{x:0,y:0,z:-1},2),2);
    for(let i=0;i<100;i++)p.move(0,-.0375);
    assert.ok(p.feet().z>3,'resident capsule stops the player');
  }finally{p.dispose();}
});
test('both physical stair flights are traversable and land on the upper floor',async()=>{
  const p=await createAtriumPhysics(JSON.parse(await fs.readFile(new URL('../public/assets/atrium/collision.json',import.meta.url),'utf8')));
  const go=(x,z,steps)=>{for(let i=0;i<steps;i++)p.move(x,z);return p.feet();};
  try{
    p.teleport([5.8,0,5.5]);let pos=go(0,-2.25/60,390);assert.ok(pos.y>3.45,JSON.stringify({main:pos}));assert.ok(pos.z< -5.2);
    pos=go(0,2.25/60,390);assert.ok(pos.y<.1,JSON.stringify({mainDown:pos}));
    p.teleport([-9.9,0,-4.35]);pos=go(0,2.25/60,390);assert.ok(pos.y>3.45,JSON.stringify({returnUp:pos}));
    pos=go(0,-2.25/60,390);assert.ok(pos.y<.1,JSON.stringify({returnDown:pos}));
    p.teleport([0,0,3]);pos=go(0,-2.25/60,200);assert.ok(pos.z>1.75,'table is a real obstacle');
    p.teleport([9,3.5,5.5]);pos=go(-2.25/60,0,150);assert.ok(pos.x>7.75,'upper guard stops a fall');
  }finally{p.dispose();}
});
