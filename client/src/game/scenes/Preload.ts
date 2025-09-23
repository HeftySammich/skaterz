import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Load new character select and background images
    this.load.image('kev_character', 'assets/kev_character.png');
    this.load.image('red_sky_bg', 'assets/red_sky_bg.png');
    
    // Load zombie skater assets
    this.load.image('skater_idle', 'assets/skater_idle.png');
    this.load.image('skater_jump', 'assets/skater_idle.png'); // Use same image for now
    this.load.image('skater_trick', 'assets/skater_idle.png'); // Use same image for now
    
    // Load obstacle images
    this.load.image('obstacle_cone', 'assets/obstacle_cone.png');
    this.load.image('obstacle_trash', 'assets/obstacle_trash.png');
    this.load.image('obstacle_crash', 'assets/obstacle_crash.png');
    this.load.image('obstacle_zombie', 'assets/obstacle_zombie.png');
    this.load.image('obstacle_skulls', 'assets/obstacle_skulls.png');
    
    // Load enemy images
    this.load.image('enemy_eyeball', 'assets/enemy_eyeball.png');
    this.load.image('enemy_robot', 'assets/enemy_robot.png');
    this.load.image('explosion', 'assets/explosion.png');
    this.load.image('arrow_indicator', 'assets/arrow_indicator.png');
    
    // Load health pickup
    this.load.image('sandwich', 'assets/sandwich.png');
    
    // Load star assets
    this.load.image('star_icon', 'assets/star_icon.png');
    this.load.image('star_counter_icon', 'assets/star_counter_icon.png');
    this.load.image('star_single', 'assets/star_single.png');
    this.load.image('star_ten', 'assets/star_ten.png');
    this.load.image('sandwich_arrow', 'assets/sandwich_arrow.png');
    
    // Load city background
    this.load.image('city_background', 'assets/city_background.png');
    
    // Load splash screen image
    this.load.image('slime_splash', 'assets/slime_splash.png');
    
    // Load menu assets
    this.load.image('menu_background', 'assets/menu_background.png');
    this.load.image('play_button', 'assets/play_button.png');
    this.load.image('options_button', 'assets/options_button.png');
    
    // Load menu music
    this.load.audio('menu_music', 'assets/menu_music.m4a');
    
    const loadingText = this.make.text({
      x: 320,
      y: 480,
      text: 'Loading zombie skater...',
      style: {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '24px',
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
