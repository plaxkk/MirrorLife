// Regression: ATRIUM-002 — furniture and a misplaced guard blocked the upper circuit.
// Found by input-driven QA, 2026-09-09. Evidence: evidence/atrium/walkthrough-failure.png.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createAtriumPhysics} from '../src/atrium-physics.js';
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
