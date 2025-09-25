import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Load new character select and background images
    this.load.image('zombie_character', 'assets/zombie_character.png');
    this.load.image('stacy_character', '/images/stacy-select.png');
    this.load.image('red_sky_bg', 'assets/red_sky_bg.png');
    
    // Load zombie skater assets
    this.load.image('zombie_idle', '/images/zombie-idle.png');
    this.load.image('zombie_jump', '/sprites/jump_static.png');
    this.load.image('zombie_trick', '/sprites/trick_sprite.png');
    
    // Load Stacy skater assets
    this.load.image('stacy_idle', '/images/stacy-idle.png');
    this.load.image('stacy_jump', '/images/stacy-jump.png');
    this.load.image('stacy_trick', '/images/stacy-trick.png');
    
    // Keep old skater references for compatibility
    this.load.image('skater_idle', 'assets/skater_idle.png');
    this.load.image('skater_jump', 'assets/skater_idle.png'); // Use same image for now
    this.load.image('skater_trick', 'assets/skater_idle.png'); // Use same image for now
    
    // Load single jump sprite - no animation, just one image
    this.load.image('jump_static', 'sprites/jump_static.png');
    
    // Load trick sprite for swipe-up tricks
    this.load.image('trick_sprite', 'sprites/trick_sprite.png');
    
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
    
    // Load heart image for life system
    this.load.image('heart', 'assets/heart.png');
    this.load.image('life_icon', 'assets/life_icon.png');
    
    // Load health pickup
    this.load.image('sandwich', 'assets/sandwich.png');
    
    // Load energy drink power-up
    this.load.image('energy_drink', 'assets/energy_drink.png');
    this.load.image('energy_warning', 'assets/energy_warning.png');
    this.load.image('maximum_text', 'assets/maximum_text.png');
    
    // Load game over background
    this.load.image('game_over_bg', 'assets/game_over_bg.png');
    
    // Load star assets
    this.load.image('star_icon', 'assets/star_icon.png');
    this.load.image('star_counter_icon', 'assets/star_counter_icon.png');
    this.load.image('star_single', 'assets/star_single.png');
    this.load.image('star_ten', 'assets/star_ten.png');
    this.load.image('sandwich_arrow', 'assets/sandwich_arrow.png');
    
    // Load city background
    this.load.image('city_background', 'assets/city_background.png');
    
    // Load splash screen images
    this.load.image('slime_splash', 'assets/slime_splash.png');
    this.load.image('soul_arcade', 'assets/soul_arcade.png');
    this.load.image('soul_arcade_logo', 'soul_arcade_logo.png');
    this.load.image('soul_arcade_new_logo', 'assets/soul_arcade_new_logo.png');
    this.load.image('warning_skull', 'assets/warning_skull.png');
    this.load.image('starfall_presents', 'assets/starfall_presents.png');
    this.load.image('graffiti_bg', 'assets/graffiti_bg.png');
    
    // Load menu assets
    this.load.image('menu_background', 'assets/menu_background.png');
    this.load.image('play_button', 'assets/play_button.png');
    this.load.image('options_button', 'assets/options_button.png');
    
    // Load menu music
    this.load.audio('menu_music', 'assets/menu_music.m4a');
    
    // Load gameplay background music
    this.load.audio('broken_code', 'assets/broken_code.m4a');
    this.load.audio('undead_empire', 'assets/undead_empire.m4a');
    
    // Load sound effects
    this.load.audio('star_single_sfx', 'assets/star_single_sfx.wav');
    this.load.audio('star_cluster_sfx', 'assets/star_cluster_sfx.wav');
    this.load.audio('bite_sfx', 'assets/bite_sfx.m4a');
    this.load.audio('energy_drink_sfx', 'assets/energy_drink_sfx.wav');
    
    // Loading silently without text
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

// console.log('Zombie skater loaded with animations');
    
    // Start with splash screens
    this.scene.start('Splash1');
  }

  // Removed all asset creation methods - clean slate for new assets
}
