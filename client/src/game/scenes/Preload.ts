import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Load zombie skater assets
    this.load.image('skater_idle', 'assets/skater_idle.png');
    this.load.image('skater_jump', 'assets/skater_idle.png'); // Use same image for now
    this.load.image('skater_trick', 'assets/skater_idle.png'); // Use same image for now
    
    // Load splash screen image
    this.load.image('slime_splash', 'assets/slime_splash.png');
    
    const loadingText = this.make.text({
      x: 320,
      y: 480,
      text: 'Loading zombie skater...',
      style: {
        fontFamily: 'Courier, "Courier New", monospace',
        fontSize: '36px',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
  }

  create() {
    // Create a simple white pixel texture for particles
    const pixelGraphics = this.add.graphics();
    pixelGraphics.fillStyle(0xFFFFFF);
    pixelGraphics.fillRect(0, 0, 4, 4);
    pixelGraphics.generateTexture('pixel', 4, 4);
    pixelGraphics.destroy();

    // Images are now loaded from files instead of generated

    // Create skater animations
    this.anims.create({
      key: 'skate',
      frames: [{ key: 'skater_idle' }],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'jump',
      frames: [{ key: 'skater_jump' }],
      frameRate: 8,
      repeat: 0
    });

    this.anims.create({
      key: 'trick',
      frames: [{ key: 'skater_trick' }],
      frameRate: 8,
      repeat: 0
    });

    console.log('Zombie skater loaded with animations');
    
    // Start with splash screens
    this.scene.start('Splash1');
  }

  // Removed all asset creation methods - clean slate for new assets
}
