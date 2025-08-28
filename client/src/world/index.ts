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

  // invisible physics ground
  const ground = scene.physics.add.staticGroup();
  const slab = scene.add.rectangle(0, 160, 3000, 10, 0x000000, 0);
  scene.physics.add.existing(slab, true);
  ground.add(slab as any);

  // expose an update hook
  const update = (cameraScrollX:number)=>{
    // parallax drift
    par.stars.tilePositionX = cameraScrollX * 0.08;
    par.skyline.tilePositionX = cameraScrollX * 0.25;
    par.fence.tilePositionX = cameraScrollX * 0.6;
    // angled street scroll
    street.update(cameraScrollX);
  };

  return { ground, rails, obstacles, update };
}