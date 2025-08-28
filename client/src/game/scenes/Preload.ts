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
    // Create zombie sprite (green rectangle)
    const zombieTexture = this.add.graphics();
    zombieTexture.fillStyle(0x4a7c4a);
    zombieTexture.fillRect(0, 0, 16, 24);
    zombieTexture.generateTexture('zombie', 16, 24);
    zombieTexture.destroy();

    // Create ground tiles (brown rectangles)
    const tilesTexture = this.add.graphics();
    tilesTexture.fillStyle(0x8b4513);
    tilesTexture.fillRect(0, 0, 16, 16);
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
