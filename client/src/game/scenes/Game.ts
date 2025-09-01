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

    // Set camera to show full game area with smooth following
    this.cameras.main.setBounds(0, 0, 2000, 160);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -50, 0);
    
    // ESC to return to main menu
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });

    console.log('Game scene loaded with enhanced zombie skater mechanics');
  }

  createSeamlessWorld() {
    // Import and use the seamless background system
    import('../../world/seamlessBackground').then(module => {
      return module.createSeamlessWorld(this);
    });
    
    // For now, return a simple world until import resolves
    const { createSeamlessWorld } = this.loadSeamlessWorld();
    return createSeamlessWorld(this);
  }

  loadSeamlessWorld() {
    // Inline the seamless world creation to avoid import issues
    const GROUND_Y = 160;
    
    const createSeamlessWorld = (scene: Phaser.Scene) => {
      // Create placeholder background
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = 480;
      bgCanvas.height = 160;
      const ctx = bgCanvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      
      // Simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, 160);
      gradient.addColorStop(0, '#274b8c');
      gradient.addColorStop(0.6, '#646c7a');
      gradient.addColorStop(1, '#2d303b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 480, 160);
      
      // Street area
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(0, 120, 480, 40);
      
      // Lane markings
      ctx.fillStyle = '#e2e28e';
      for (let x = 0; x < 480; x += 60) {
        ctx.fillRect(x, 135, 30, 3);
      }
      
      if (!scene.textures.exists('seamless_bg')) {
        scene.textures.addCanvas('seamless_bg', bgCanvas);
      }
      
      const background = scene.add.tileSprite(0, 0, 960, 160, 'seamless_bg')
        .setOrigin(0, 0)
        .setScrollFactor(0.5)
        .setDepth(1);

      // Physics ground
      const ground = scene.physics.add.staticGroup();
      const streetSurface = scene.add.rectangle(0, 150, 10000, 20, 0x000000, 0);
      scene.physics.add.existing(streetSurface, true);
      ground.add(streetSurface as any);

      const update = (scrollX: number) => {
        background.tilePositionX = scrollX * 1.0;
      };

      return { ground, update };
    };

    return { createSeamlessWorld };
  }

  createPlayer() {
    // Create player sprite at appropriate size for GBA view
    this.player = this.physics.add.sprite(60, 130, 'skater_idle');
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Scale smaller for better view of background
    this.player.setScale(0.5);
    
    // Physics body setup
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 30);
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