import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

export default class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private world!: any;
  
  // Enhanced jumping mechanics
  private isGrounded = true;
  private hasDoubleJumped = false;
  private trickActive = false;
  private jumpCount = 0;
  private maxJumps = 2; // Regular jump + trick jump
  
  // Physics constants
  private readonly JUMP_VELOCITY = -350;
  private readonly TRICK_JUMP_VELOCITY = -280;
  private readonly GRAVITY = 600; // Reduced from default 800
  private readonly FLOAT_GRAVITY = 400; // Even lighter during tricks

  constructor() {
    super('Game');
  }

  create() {
    // Create seamless background world
    this.world = this.createSeamlessWorld();
    
    // Reduce gravity for floatier feel
    this.physics.world.gravity.y = this.GRAVITY;
    
    // Create player
    this.createPlayer();
    
    // Setup controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Physics collisions
    this.physics.add.collider(this.player, this.world.ground, () => {
      this.handleLanding();
    });

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -60, 0);
    
    // ESC to return to main menu
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });

    console.log('Game scene loaded with enhanced zombie skater mechanics');
  }

  createSeamlessWorld() {
    // Import and use the seamless background system
    const { createSeamlessWorld } = require('../../world/seamlessBackground');
    return createSeamlessWorld(this);
  }

  createPlayer() {
    // Create player sprite at appropriate size
    this.player = this.physics.add.sprite(60, 100, 'skater_idle');
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Scale appropriately for GBA style
    this.player.setScale(0.8);
    
    // Physics body setup
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(32, 40);
    body.setMaxVelocity(400, 600);
    
    // Start skating animation
    this.player.play('skate');
    
    console.log('Player created with enhanced physics');
  }

  handleLanding() {
    if (!this.isGrounded) {
      this.isGrounded = true;
      this.hasDoubleJumped = false;
      this.trickActive = false;
      this.jumpCount = 0;
      
      // Return to normal gravity and skating animation
      this.physics.world.gravity.y = this.GRAVITY;
      this.player.play('skate');
      
      console.log('Player landed - jump abilities reset');
    }
  }

  performJump() {
    if (this.jumpCount < this.maxJumps) {
      if (this.jumpCount === 0) {
        // First jump - regular jump
        this.player.setVelocityY(this.JUMP_VELOCITY);
        this.player.play('jump');
        this.isGrounded = false;
        console.log('Regular jump performed');
      } else if (this.jumpCount === 1 && !this.hasDoubleJumped) {
        // Second jump - trick with float
        this.player.setVelocityY(this.TRICK_JUMP_VELOCITY);
        this.player.play('trick');
        this.hasDoubleJumped = true;
        this.trickActive = true;
        
        // Reduce gravity for float effect during trick
        this.physics.world.gravity.y = this.FLOAT_GRAVITY;
        
        // Return to normal gravity after trick animation
        this.time.delayedCall(800, () => {
          this.physics.world.gravity.y = this.GRAVITY;
          this.trickActive = false;
        });
        
        console.log('Trick jump performed with float effect');
      }
      
      this.jumpCount++;
    }
  }

  update() {
    // Continuous movement forward
    this.player.setVelocityX(120);
    
    // Handle jumping
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) || 
        Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.performJump();
    }
    
    // Update world scrolling
    this.world.update(this.cameras.main.scrollX);
    
    // Check if player fell too far
    if (this.player.y > 220) {
      console.log('Player fell - restarting scene');
      this.scene.restart();
    }
  }
}