import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(60, 70, 120, 20);

    const loadingText = this.make.text({
      x: 120,
      y: 60,
      text: 'Loading...',
      style: {
        font: '12px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(65, 75, 110 * value, 10);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Always create fallback sprites for this demo
    this.createFallbackSprites();
    
    // Try to load audio but don't fail if missing
    this.load.on('loaderror', () => {
      console.log('Some assets failed to load, using fallbacks');
    });
  }

  createFallbackSprites() {
    // Create blocky zombie skater sprite
    const zombieTexture = this.add.graphics();
    
    // Zombie skin (pale green)
    zombieTexture.fillStyle(0x7a9b7a);
    zombieTexture.fillRect(4, 2, 8, 6); // head
    zombieTexture.fillRect(5, 8, 6, 8); // body
    zombieTexture.fillRect(3, 16, 3, 6); // left arm
    zombieTexture.fillRect(10, 16, 3, 6); // right arm
    zombieTexture.fillRect(6, 16, 2, 6); // left leg
    zombieTexture.fillRect(8, 16, 2, 6); // right leg
    
    // Dark clothing/details
    zombieTexture.fillStyle(0x2d2d2d);
    zombieTexture.fillRect(5, 10, 6, 4); // shirt
    zombieTexture.fillRect(6, 18, 4, 2); // shorts
    
    // Skateboard
    zombieTexture.fillStyle(0x8b4513);
    zombieTexture.fillRect(2, 22, 12, 2); // board
    zombieTexture.fillStyle(0x444444);
    zombieTexture.fillRect(3, 23, 2, 1); // wheel
    zombieTexture.fillRect(11, 23, 2, 1); // wheel
    
    zombieTexture.generateTexture('zombie', 16, 24);
    zombieTexture.destroy();

    // Create city street tiles (asphalt with lines)
    const tilesTexture = this.add.graphics();
    
    // Dark asphalt base
    tilesTexture.fillStyle(0x2c2c2c);
    tilesTexture.fillRect(0, 0, 16, 16);
    
    // Street lines and texture
    tilesTexture.fillStyle(0x1a1a1a);
    tilesTexture.fillRect(0, 4, 16, 1); // crack line
    tilesTexture.fillRect(0, 12, 16, 1); // another crack
    
    // Small road markings
    tilesTexture.fillStyle(0x444444);
    tilesTexture.fillRect(2, 8, 2, 1);
    tilesTexture.fillRect(6, 8, 2, 1);
    tilesTexture.fillRect(10, 8, 2, 1);
    tilesTexture.fillRect(14, 8, 2, 1);
    
    tilesTexture.generateTexture('tiles', 16, 16);
    tilesTexture.destroy();

    // Create obstacles (red rectangles)
    const obstacleTexture = this.add.graphics();
    obstacleTexture.fillStyle(0xff0000);
    obstacleTexture.fillRect(0, 0, 16, 24);
    obstacleTexture.generateTexture('obstacles', 16, 24);
    obstacleTexture.destroy();
  }

  create() {
    // Ensure fallback sprites exist
    if (!this.textures.exists('zombie')) {
      this.createFallbackSprites();
    }
    
    this.scene.start('Game');
  }
}
