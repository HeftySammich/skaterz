// Seamless single-image background system for continuous scrolling
// Street, curb, and buildings all in one tiling image

const GROUND_Y = 160; // Physics baseline - street surface

export function createSeamlessWorld(scene: Phaser.Scene) {
  // Create placeholder background until you provide AI-generated image
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = 480;
  bgCanvas.height = 160;
  const ctx = bgCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  
  // Placeholder showing where your AI image will go
  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, '#274b8c'); // sky
  gradient.addColorStop(0.6, '#646c7a'); // buildings/curb
  gradient.addColorStop(1, '#2d303b'); // street
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 480, 160);
  
  // Street area indication
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, 120, 480, 40); // Street area
  
  // Lane markings
  ctx.fillStyle = '#e2e28e';
  for (let x = 0; x < 480; x += 60) {
    ctx.fillRect(x, 135, 30, 3);
  }
  
  ctx.fillStyle = '#ffecb3';
  ctx.font = '10px monospace';
  ctx.fillText('SEAMLESS BACKGROUND PLACEHOLDER', 140, 80);
  ctx.fillText('Replace with your AI-generated image', 150, 95);
  
  if (!scene.textures.exists('seamless_bg')) {
    scene.textures.addCanvas('seamless_bg', bgCanvas);
  }
  
  const background = scene.add.tileSprite(0, 0, 480, 160, 'seamless_bg')
    .setOrigin(0, 0)
    .setScrollFactor(1) // Moves with camera for endless effect
    .setDepth(1);

  // Physics ground - invisible, matches street in image
  const ground = scene.physics.add.staticGroup();
  const streetSurface = scene.add.rectangle(0, GROUND_Y, 10000, 10, 0x000000, 0);
  scene.physics.add.existing(streetSurface, true);
  ground.add(streetSurface as any);

  // Groups for gameplay objects (these will be spawned separately on the street)
  const rails = scene.physics.add.staticGroup();
  const obstacles = scene.physics.add.staticGroup();

  // Update function - scrolls the seamless background
  const update = (scrollX: number) => {
    // Continuous horizontal tiling
    background.tilePositionX = scrollX * 1.0;
  };

  // Street surface Y position (constant since it's built into the image)
  function visualGroundYFor() { 
    return GROUND_Y; 
  }

  return { ground, rails, obstacles, update, visualGroundYFor, background };
}

// Function to load your AI-generated image when you have it
export function loadSeamlessBackground(scene: Phaser.Scene, imageKey: string) {
  // Call this after loading your AI-generated seamless background
  // scene.load.image('seamless_city', 'path/to/your/ai-image.png');
  
  return scene.add.tileSprite(0, 0, 480, 160, imageKey)
    .setOrigin(0, 0)
    .setScrollFactor(1)
    .setDepth(1);
}