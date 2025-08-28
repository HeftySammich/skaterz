import { buildNYCAtlas32 } from './tiles32';
import { buildParallax } from './parallax';
import { buildAngledStreet } from './angledStreet';

export function createWorld(scene: Phaser.Scene){
  buildNYCAtlas32(scene);
  const par = buildParallax(scene);
  const street = buildAngledStreet(scene);

  // Pretty rails and obstacles that match visuals but keep physics simple
  const rails = scene.physics.add.staticGroup();
  for (let x=140; x<2000; x+=220) {
    const rImg = scene.add.image(x, 110, 'rail32').setOrigin(0.5,1).setDepth(5);
    scene.physics.add.existing(rImg, true); rails.add(rImg as any);
  }

  const obstacles = scene.physics.add.staticGroup();
  // Start obstacles further away and make them less frequent
  for (let x=500; x<2000; x+=400) {
    const type = (x/400)%2 ? 'barricade32':'cone16x24';
    const img = scene.add.image(x, 160, type).setOrigin(0.5,1).setDepth(6);
    scene.physics.add.existing(img, true); obstacles.add(img as any);
  }

  // invisible physics ground - positioned to match visual street
  const ground = scene.physics.add.staticGroup();

  // expose an update hook
  const update = (cameraScrollX:number, time?:number)=>{
    // parallax drift with subtle motion
    const t = (time || 0) * 0.001;
    par.stars.tilePositionX = cameraScrollX * 0.06;
    par.skyline.tilePositionX = cameraScrollX * 0.22 + Math.sin(t*0.5)*2; // micro drift
    par.fence.tilePositionX = cameraScrollX * 0.55;
    // angled street scroll
    street.update(cameraScrollX);
  };

  return { ground, rails, obstacles, update, visualGroundYFor: street.visualGroundYFor };
}