// Regression: ATRIUM-002 — furniture and a misplaced guard blocked the upper circuit.
// Found by input-driven QA, 2026-09-09. Evidence: evidence/atrium/walkthrough-failure.png.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createAtriumPhysics} from '../src/atrium-physics.js';
import {atriumWalkKeys} from '../scripts/lib/atrium-navigation.mjs';
import {cameraRelativeInput,updateMoveVelocity} from '../src/atrium-locomotion.js';
test('screen-relative input preserves cardinal directions, diagonal speed and immediate pause',()=>{
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const forward=cameraRelativeInput(0,-1,yaw),right=cameraRelativeInput(1,0,yaw);
    assert.ok(Math.abs(forward.x+Math.sin(yaw))<1e-6);
    assert.ok(Math.abs(forward.z+Math.cos(yaw))<1e-6);
    assert.ok(Math.abs(right.x-Math.cos(yaw))<1e-6);
    assert.ok(Math.abs(Math.hypot(...Object.values(cameraRelativeInput(1,1,yaw)))-1)<1e-6);
  }
  const velocity={x:0,z:0};updateMoveVelocity(velocity,{x:1,z:0},2.25,1/60);
  assert.ok(velocity.x>0&&velocity.x<2.25);updateMoveVelocity(velocity,{x:1,z:0},2.25,1/60,true);assert.equal(velocity.x,0);
});
test('missing furniture blocks walking and camera geometry never blocks locomotion',async()=>{
  const p=await createAtriumPhysics(JSON.parse(await fs.readFile(new URL('../public/assets/atrium/collision.json',import.meta.url),'utf8')));
  try{
    p.teleport([-5,0,.15]);for(let i=0;i<70;i++)p.move(.0375,0);
    assert.ok(p.feet().x<-4.2,JSON.stringify(p.feet()));
    assert.equal(p.canStandAt([-3.65,0,.15]),false,'old saves inside a chair must be rejected');
    p.teleport([-7.7,0,4.4]);for(let i=0;i<50;i++)p.move(0,-.0375);
    assert.ok(p.feet().z>3.7,'large planter is solid');
    p.addCameraMesh(new Float32Array([-5,0,5,-3,0,5,-3,3,5,-5,3,5]),new Uint32Array([0,1,2,0,2,3]));
    p.world.step();
    const safe=p.cameraDistance({x:-4,y:1.35,z:4},{x:0,y:0,z:1},2);
    assert.ok(safe>.6&&safe<.8,`visible wall sphere sweep: ${safe}`);
    p.teleport([-4,0,4]);for(let i=0;i<45;i++)p.move(0,.0375);
    assert.ok(p.feet().z>5.5,'camera-only mesh must not become an invisible gameplay barrier');
  }finally{p.dispose();}
});
test('recording navigation stays in the table aisle at oblique camera angles',async()=>{
  const p=await createAtriumPhysics(JSON.parse(await fs.readFile(new URL('../public/assets/atrium/collision.json',import.meta.url),'utf8')));
  try{
    for(const yaw of [1.236064453125,-.6279998779296876,Math.PI/4,-Math.PI/2]){
      p.teleport([3.1656,0,-3.3146]);let arrived=false;
      for(let i=0;i<100;i++){
        const a=p.feet(),dx=3.1-a.x,dz=5.65-a.z;
        if(Math.hypot(dx,dz)<.2){arrived=true;break;}
        const keys=atriumWalkKeys(dx,dz,yaw),x=Number(keys.has('KeyD'))-Number(keys.has('KeyA')),z=Number(keys.has('KeyS'))-Number(keys.has('KeyW')),n=Math.max(1,Math.hypot(x,z));
        for(let frame=0;frame<7;frame++)p.move((x*Math.cos(yaw)+z*Math.sin(yaw))/n*.0375,(-x*Math.sin(yaw)+z*Math.cos(yaw))/n*.0375);
      }
      assert.ok(arrived,JSON.stringify({yaw,position:p.feet()}));
    }
  }finally{p.dispose();}
});
test('complete architectural circuit including both galleries and west kitchen clearance',async()=>{
  const p=await createAtriumPhysics(JSON.parse(await fs.readFile(new URL('../public/assets/atrium/collision.json',import.meta.url),'utf8')));
  try{
    p.teleport([5.8,0,5.6]);
    for(const [x,z] of [[5.8,-5.65],[8.55,-5.65],[8.55,3.65],[9.35,5.85],[8.55,3.65],[8.55,-5.65],[-7.15,-5.65],[-7.15,.4],[-7.15,2.15],[-7.15,6.2],[-9.8,6.2],[-9.9,5.4],[-9.9,-4.6],[-8.65,-4.6],[-8.65,1.8],[-8.65,4.9],[-4.3,4.9]]){
      let arrived=false;
      for(let i=0;i<900;i++){
        const a=p.feet(),dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz);
        if(d<.08){arrived=true;break;}
        p.move(dx/d*.0375,dz/d*.0375);
      }
      assert.ok(arrived,JSON.stringify({goal:[x,z],actual:p.feet()}));
    }
    assert.ok(p.feet().y<.1);
  }finally{p.dispose();}
});
