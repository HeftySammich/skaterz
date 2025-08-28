// src/world/angledStreet_mask.ts
// Draw a horizontal street and clip it with a slanted trapezoid mask.
// No rotation used. Physics stays axis-aligned.

// Tunables
const STREET_HEIGHT = 64;               // total visual band height (curb+asphalt)
const STREET_Y = 112;                   // top of band at x = origin
const TILT_DEG = -7;                    // visual slope (negative tilts down to the right)
const SLOPE = Math.tan(Phaser.Math.DegToRad(TILT_DEG)); // pixels of Y per pixel of X
const BAND_WIDTH = 1600;                // how wide we draw the repeating street

export function buildAngledStreet(scene: Phaser.Scene) {
  // Container that holds all street strips (no rotation)
  const group = scene.add.container(0, 0).setDepth(5).setScrollFactor(1);

  // Helper to make a horizontal TileSprite strip
  const makeStrip = (key: string, y: number, alpha = 1) =>
    scene.add.tileSprite(0, y, BAND_WIDTH, 32, key)
      .setOrigin(0, 0)
      .setAlpha(alpha)
      .setScrollFactor(1);

  // Horizontal strips stacked from top to bottom (32px each)
  const yTop = STREET_Y;              // visual top edge at x=0
  const sidewalk = makeStrip('tile_sidewalk', yTop + 0);
  const curb     = makeStrip('tile_curb',     yTop + 32);
  const asphalt1 = makeStrip('tile_asphalt',  yTop + 64 - 32);
  const asphalt2 = makeStrip('tile_asphalt',  yTop + 64);

  const lanes    = makeStrip('tile_lane',     yTop + 64 - 32, 0.70);
  const cross    = makeStrip('tile_cross',    yTop + 64 - 32, 0.25);
  const debris   = makeStrip('tile_debris',   yTop + 64,      0.70);
  const manhole  = makeStrip('tile_manhole',  yTop + 64 - 32, 0.90);

  [sidewalk, curb, asphalt1, asphalt2, lanes, cross, debris, manhole]
    .forEach(s => group.add(s));

  // --- Slanted mask (trapezoid) clipped onto the whole group ----------------
  // Top edge: y = yTop + SLOPE * x
  // Bottom edge: y + STREET_HEIGHT
  const makeMaskShape = () => {
    const g = scene.add.graphics().setScrollFactor(1).setDepth(4);
    g.clear().fillStyle(0xffffff, 1);

    // Build a polygon that spans camera view + margin with the slanted top
    const cam = scene.cameras.main;
    const x0 = cam.scrollX - 80;
    const x1 = x0 + cam.width + 200;

    const yTop0 = yTop + SLOPE * (x0 - 0);
    const yTop1 = yTop + SLOPE * (x1 - 0);

    // trapezoid points (clockwise)
    const pts = new Phaser.Geom.Polygon([
      x0, yTop0,
      x1, yTop1,
      x1, yTop1 + STREET_HEIGHT,
      x0, yTop0 + STREET_HEIGHT
    ]);
    g.fillPoints(pts.points, true);
    return g;
  };

  // Create and apply a BitmapMask
  let maskShape = makeMaskShape();
  group.setMask(maskShape.createBitmapMask());

  // Keep mask polygon aligned with camera as we move
  scene.events.on('postupdate', () => {
    const old = maskShape;
    maskShape = makeMaskShape();
    group.setMask(maskShape.createBitmapMask());
    old.destroy();
  });

  // Update function: scroll textures to follow camera
  const update = (scrollX: number) => {
    [sidewalk, curb, asphalt1, asphalt2, lanes, cross, debris, manhole]
      .forEach(s => s.tilePositionX = scrollX);
  };

  // Visual ground equation (place feet & obstacles on this)
  // Ground = bottom of band (asphalt baseline)
  function visualGroundYFor(worldX: number) {
    const yTopX = yTop + SLOPE * (worldX - 0);
    return yTopX + (STREET_HEIGHT - 4); // -4 so wheels don't sink
  }

  // Debug: press D to draw the ground line
  const dbg = scene.add.graphics().setDepth(9).setVisible(false);
  scene.input.keyboard?.on('keydown-D', () => dbg.setVisible(!dbg.visible));
  scene.events.on('postupdate', () => {
    if (!dbg.visible) return;
    dbg.clear().lineStyle(1, 0x3aa1ff, 0.9);
    const cam = scene.cameras.main;
    const x0 = cam.scrollX - 40;
    const x1 = x0 + cam.width + 120;
    dbg.beginPath();
    for (let x = x0; x <= x1; x += 8) {
      const y = visualGroundYFor(x);
      if (x === x0) dbg.moveTo(x, y); else dbg.lineTo(x, y);
    }
    dbg.strokePath();
  });

  return { group, update, visualGroundYFor };
}