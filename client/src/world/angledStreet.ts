// Renders a wide visual street/sidewalk strip, then rotates it slightly.
// Physics ground remains an invisible static rectangle at Y=160.
export function buildAngledStreet(scene: Phaser.Scene){
  const group = scene.add.container(0, 80);
  group.angle = -7;                 // angled like the reference
  group.setScrollFactor(1);

  // Tile layers - use simple asphalt for now since frame indexing isn't working
  const addStrip = (y: number, alpha=1) => {
    const s = scene.add.tileSprite(-40, y, 800, 32, 'nyc32').setOrigin(0,0).setAlpha(alpha);
    s.setScrollFactor(1); group.add(s); return s;
  };

  const sidewalk = addStrip(32);
  const curb     = addStrip(64);
  const asphalt1 = addStrip(96);
  const asphalt2 = addStrip(128);

  const lanes  = addStrip(96, 0.7);
  const cross  = addStrip(96, 0.25);
  const debris = addStrip(128, 0.7);
  const holes  = addStrip(96, 0.9);

  const update = (scrollX:number)=>{
    [sidewalk, curb, asphalt1, asphalt2, lanes, cross, debris, holes]
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