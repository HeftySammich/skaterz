import { buildNYCAtlas32 } from './tiles32';
import { buildParallax } from './parallax';
import { buildAngledStreet } from './angledStreet';

export function createWorld(scene: Phaser.Scene){
  buildNYCAtlas32(scene);
  const par = buildParallax(scene);
  const street = buildAngledStreet(scene);

  const rails = scene.physics.add.staticGroup();
  const obstacles = scene.physics.add.staticGroup();

  // Initial invisible physics floor — we'll recalibrate in Game.ts
  const ground = scene.physics.add.staticGroup();
  const slab = scene.add.rectangle(0, 160, 3000, 10, 0x000000, 0);
  scene.physics.add.existing(slab, true);
  ground.add(slab as any);

  const update = (cameraScrollX:number, time?:number)=>{
    const t = (time || 0) * 0.001;
    par.stars.tilePositionX = cameraScrollX * 0.05;
    par.skyline.tilePositionX = cameraScrollX * 0.2 + Math.sin(t*0.5)*2;
    par.fence.tilePositionX = cameraScrollX * 0.6;
    street.update(cameraScrollX);
  };

  return { ground, rails, obstacles, update, visualGroundYFor: street.visualGroundYFor };
}