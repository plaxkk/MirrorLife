// Regression: ATRIUM-002 — furniture and a misplaced guard blocked the upper circuit.
// Found by input-driven QA, 2026-09-09. Evidence: evidence/atrium/walkthrough-failure.png.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createAtriumPhysics} from '../src/atrium-physics.js';
import {atriumWalkKeys} from '../scripts/lib/atrium-navigation.mjs';
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
