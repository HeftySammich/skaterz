// Renders a wide visual street/sidewalk strip, then rotates it slightly.
// Physics ground remains an invisible static rectangle at Y=160.
export function buildAngledStreet(scene: Phaser.Scene){
  const group = scene.add.container(0, 80); // draw area anchor
  group.angle = -7;                          // <- "angled like this"
  group.setScrollFactor(1);

  // Build simple asphalt layers (no frame indexing needed)
  const asphalt1 = scene.add.tileSprite(-40, 96, 800, 64, 'nyc32').setOrigin(0,0);
  const asphalt2 = scene.add.tileSprite(-40,128, 800, 32, 'nyc32').setOrigin(0,0);

  [asphalt1, asphalt2].forEach(s => { s.setScrollFactor(1); group.add(s); });

  // Update function to keep infinite scroll feeling
  const update = (scrollX:number)=>{
    const sp = scrollX;  // same speed as world
    [asphalt1, asphalt2].forEach(s => s.tilePositionX = sp);
  };

  return { group, update };
}