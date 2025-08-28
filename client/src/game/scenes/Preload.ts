import Phaser from 'phaser';
import { cropAndMakeTexture, synthesizeLeanFrames } from '../../art/spriteFromImage';
import { makeNYCTiles, makeSkyline } from '../../art/generateNYC';

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

    // Load the zombie skater image
    this.load.image('zombie_full', 'assets/zombie_skater.png');
    
    // Try to load audio but don't fail if missing
    this.load.on('loaderror', () => {
      console.log('Some assets failed to load, using fallbacks');
    });
  }

  async create() {
    try {
      // Generate NYC background and tiles
      makeSkyline(this);
      makeNYCTiles(this);

      // 1) Crop & scale your zombie image to 48x48
      await cropAndMakeTexture(this, 'zombie_full', 'zombie_base', 48);
      
      // 2) Synthesize 6 animation frames with subtle lean/tilt
      synthesizeLeanFrames(this, 'zombie_base', 'zombie');

      // Create a small crown for NFT owners
      const crownCanvas = document.createElement('canvas');
      crownCanvas.width = 8;
      crownCanvas.height = 6;
      const ctx = crownCanvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#f7b51b';
      [[1,5],[2,2],[3,4],[4,1],[5,3],[6,5]].forEach(([x,y]) => ctx.fillRect(x,y,1,1));
      this.textures.addCanvas('crown8', crownCanvas);

      // Define animations
      const frameKeys = [];
      for (let i = 0; i < 6; i++) {
        frameKeys.push({ key: `zombie_${i}` });
      }
      
      this.anims.create({
        key: 'skate',
        frames: frameKeys,
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: 'trickspin',
        frames: frameKeys,
        frameRate: 20,
        repeat: 1
      });

      console.log('Zombie skater sprite loaded and animated successfully');
    } catch (error) {
      console.error('Error processing zombie sprite:', error);
      // Fallback to basic sprite if image processing fails
      this.createFallbackSprite();
    }
    
    this.scene.start('Game');
  }

  createFallbackSprite() {
    // Simple fallback if image loading fails
    const zombieTexture = this.add.graphics();
    zombieTexture.fillStyle(0x8fbc8f); // green zombie color
    zombieTexture.fillRect(0, 0, 48, 48);
    zombieTexture.fillStyle(0xff0000); // red eyes
    zombieTexture.fillRect(12, 12, 4, 4);
    zombieTexture.fillRect(32, 12, 4, 4);
    zombieTexture.generateTexture('zombie_base', 48, 48);
    zombieTexture.destroy();
    
    // Create single frame versions for fallback
    for (let i = 0; i < 6; i++) {
      this.textures.addCanvas(`zombie_${i}`, this.textures.get('zombie_base').getSourceImage() as HTMLCanvasElement);
    }
  }
}
