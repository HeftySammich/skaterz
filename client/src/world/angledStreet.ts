// Renders a wide visual street/sidewalk strip, then rotates it slightly.
// Physics ground remains an invisible static rectangle at Y=160.
export function buildAngledStreet(scene: Phaser.Scene){
  const group = scene.add.container(0, 80);
  group.angle = -7;
  group.setScrollFactor(1);
  group.setDepth(5); // street above parallax (which sits at depth 0–2)

  const addStrip = (texKey: string, y: number, alpha=1) => {
    const s = scene.add.tileSprite(-40, y, 800, 32, texKey).setOrigin(0,0).setAlpha(alpha);
    s.setScrollFactor(1); group.add(s); return s;
  };

  // swapped to the per-tile textures:
  const sidewalk = addStrip('tile_sidewalk', 32);
  const curb     = addStrip('tile_curb',     64);
  const asphalt1 = addStrip('tile_asphalt',  96);
  const asphalt2 = addStrip('tile_asphalt', 128);

  const lanes    = addStrip('tile_lane',     96, 0.7);
  const cross    = addStrip('tile_cross',    96, 0.25);
  const debris   = addStrip('tile_debris',  128, 0.7);
  const manhole  = addStrip('tile_manhole',  96, 0.9);

  const update = (scrollX:number)=>{
    [sidewalk, curb, asphalt1, asphalt2, lanes, cross, debris, manhole]
      .forEach(s => s.tilePositionX = scrollX);
  };

  // Visual asphalt baseline y=f(x)
  function visualGroundYFor(worldX: number){
    const theta = Phaser.Math.DegToRad(group.angle);
    const localY = 128; // lower asphalt strip Y inside the container
    const base = group.y + localY * Math.cos(theta);
    const delta = (worldX - group.x) * Math.sin(theta);
    return base + delta;
  }

  return { group, update, visualGroundYFor };
}