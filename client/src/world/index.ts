// src/world/index.ts
import { buildCityBack, buildStreetLayer, VisualGroundY } from './cityVisuals';

export function createWorld(scene: Phaser.Scene){
  // back layer (sky + buildings)
  const back = buildCityBack(scene);

  // fore layer (angled-looking street polygon)
  const street = buildStreetLayer(scene);

  // physics ground = invisible static body on the baseline
  const ground = scene.physics.add.staticGroup();
  const floorRect = scene.add.rectangle(0, VisualGroundY(), 5000, 10, 0x000000, 0);
  scene.physics.add.existing(floorRect, true);
  ground.add(floorRect as any);

  // groups for gameplay
  const rails = scene.physics.add.staticGroup();
  const obstacles = scene.physics.add.staticGroup();

  // depth sanity: back(1), street(3), rails(6), obstacles(7), player(10+)

  const update = (scrollX: number) => {
    const t = scene.time.now * 0.001;
    // keep back layer parallax subtle
    back.tilePositionX = scrollX * 0.25;
    street.tilePositionX = scrollX * 1.0;
  };

  function visualGroundYFor(_x: number){ return VisualGroundY(); }

  return { ground, rails, obstacles, update, visualGroundYFor };
}