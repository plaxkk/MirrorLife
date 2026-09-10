import RAPIER from '@dimforge/rapier3d-compat';

export async function createAtriumPhysics(definitions) {
  await RAPIER.init();
  const world=new RAPIER.World({x:0,y:-18,z:0});
  const residents=new Map(),residentHandles=new Set(),surfaces=new Map();
  for(const d of definitions) {
    let desc;
    if(d.type==='box')desc=RAPIER.ColliderDesc.cuboid(...d.size.map(v=>v/2)).setTranslation(...d.position);
    if(d.type==='stairRail') {
      const run=d.z0-d.z1;const angle=Math.atan2(d.rise,Math.abs(run))*Math.sign(run);
      desc=RAPIER.ColliderDesc.cuboid(d.width/2,d.height/2,Math.hypot(run,d.rise)/2)
        .setTranslation(d.x,d.rise/2+d.height/2,(d.z0+d.z1)/2)
        .setRotation({x:Math.sin(angle/2),y:0,z:0,w:Math.cos(angle/2)});
    }
    if(desc){const c=world.createCollider(desc.setFriction(.65));surfaces.set(c.handle,d.name||d.type);}
  }
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(-4.3,.87,6.3));
  const collider=world.createCollider(RAPIER.ColliderDesc.capsule(.59,.25),body);
  const controller=world.createCharacterController(.02);
  controller.enableAutostep(.21,.15,true);
  controller.enableSnapToGround(.28);
  controller.setMaxSlopeClimbAngle(Math.PI/4);
  controller.setMinSlopeSlideAngle(Math.PI/3);
  world.step();
  let vy=0;
  const api={world,body,collider,controller,
    addResident(id,p){const b=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x,p.y+.8,p.z));const c=world.createCollider(RAPIER.ColliderDesc.capsule(.5,.28),b);residents.set(id,b);residentHandles.add(c.handle);},
    updateResident(id,p){residents.get(id)?.setNextKinematicTranslation({x:p.x,y:p.y+.8,z:p.z});},
    move(dx,dz,dt=1/60) {
      vy=controller.computedGrounded()?-1:Math.max(-12,vy-18*dt);
      controller.computeColliderMovement(collider,{x:dx,y:vy*dt,z:dz});
      const move=controller.computedMovement(),p=body.translation();
      body.setNextKinematicTranslation({x:p.x+move.x,y:p.y+move.y,z:p.z+move.z});
      world.timestep=dt;world.step();return api.feet();
    },
    feet(){const p=body.translation();return {x:p.x,y:p.y-.84,z:p.z};},
    floorAt(x,z,feetY){
      const origin={x,y:feetY+.45,z};
      const hit=world.castRayAndGetNormal(new RAPIER.Ray(origin,{x:0,y:-1,z:0}),1.05,true,undefined,undefined,collider,undefined,c=>!residentHandles.has(c.handle));
      if(!hit||hit.normal.y<.7)return null;
      const name=surfaces.get(hit.collider.handle);
      return {height:origin.y-hit.timeOfImpact,name,stair:/stair tread/i.test(name)};
    },
    teleport(p){body.setTranslation({x:p[0],y:p[1]+.87,z:p[2]},true);body.setNextKinematicTranslation({x:p[0],y:p[1]+.87,z:p[2]});vy=0;world.step();},
    cameraDistance(origin,direction,distance) {
      let result=distance;
      for(const [x,y,z]of [[0,0,0],[.16,0,0],[-.16,0,0],[0,.16,0],[0,-.16,0]]){
        const ray=new RAPIER.Ray({x:origin.x+x,y:origin.y+y,z:origin.z+z},direction);
        const hit=world.castRay(ray,distance,true,undefined,undefined,collider,undefined,c=>!residentHandles.has(c.handle));
        if(hit)result=Math.min(result,Math.max(.2,hit.timeOfImpact-.17));
      }
      return result;
    },
    sight(a,b){const d={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},len=Math.hypot(d.x,d.y,d.z);if(!len)return true;const hit=world.castRay(new RAPIER.Ray(a,{x:d.x/len,y:d.y/len,z:d.z/len}),len,true,undefined,undefined,collider,undefined,c=>!residentHandles.has(c.handle));return !hit;},
    dispose(){world.removeCharacterController(controller);world.free();},
  };
  return api;
}
