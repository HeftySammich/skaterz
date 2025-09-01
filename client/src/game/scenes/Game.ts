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
  private jumpDebounce = false;
  
  // Physics constants
  private readonly JUMP_VELOCITY = -280;
  private readonly TRICK_JUMP_VELOCITY = -260; // Moderate second jump
  private readonly GRAVITY = 800; // Less floaty, more responsive
  private readonly FLOAT_GRAVITY = 600; // Less float during tricks

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
    
    // Add touch/click controls for mobile
    this.input.on('pointerdown', () => {
      this.performJump();
    });
    
    // Physics collisions with proper overlap detection
    this.physics.add.collider(this.player, this.world.ground, () => {
      // Process landing if not already grounded and player is actually touching ground
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (!this.isGrounded && body.touching.down) {
        console.log(`Collision detected: velocity.y=${body.velocity.y}, playerY=${this.player.y}, touching.down=${body.touching.down}`);
        this.handleLanding();
      }
    });

    // Remove camera bounds for infinite world
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 160);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -100, -10);
    
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
      
      const background = scene.add.tileSprite(0, 0, 2000, 160, 'seamless_bg')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1);

      // Physics ground - infinite collision surface at street level
      const ground = scene.physics.add.staticGroup();
      
      // Create multiple ground segments for reliable collision at street level
      for (let x = -2000; x <= 4000; x += 400) {
        const groundSegment = scene.add.rectangle(x, 150, 400, 20, 0x000000, 0);
        groundSegment.setVisible(false);
        scene.physics.add.existing(groundSegment, true);
        ground.add(groundSegment as any);
      }

      const update = (scrollX: number) => {
        // Infinite scrolling background
        background.tilePositionX = scrollX * 1.0;
      };

      return { ground, update };
    };

    return { createSeamlessWorld };
  }

  createPlayer() {
    // Create player sprite at tiny size for proper GBA scale
    this.player = this.physics.add.sprite(50, 142, 'skater_idle');
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Very small scale for authentic retro game look
    this.player.setScale(0.15);
    
    // Physics body setup - tiny collision box
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 16);
    body.setMaxVelocity(400, 600);
    body.setBounce(0); // No bouncing
    body.setOffset(0, 0); // Make sure offset is clean
    
    // Start skating animation
    this.player.play('skate');
    
    console.log(`Player created at y=${this.player.y} with body size ${body.width}x${body.height}, ground segments at y=150`);
  }

  handleLanding() {
    this.isGrounded = true;
    this.hasDoubleJumped = false;
    this.trickActive = false;
    this.jumpCount = 0;
    
    // Return to normal gravity and skating texture
    this.physics.world.gravity.y = this.GRAVITY;
    this.player.setTexture('skater_idle');
    
    // Clear any upward velocity to prevent bouncing
    if (this.player.body!.velocity.y < 0) {
      this.player.setVelocityY(0);
    }
    
    console.log('Player landed');
  }

  performJump() {
    console.log(`Jump attempt: grounded=${this.isGrounded}, jumpCount=${this.jumpCount}, hasDoubleJumped=${this.hasDoubleJumped}`);
    
    if (this.isGrounded) {
      // First jump - clear state and jump
      this.player.setVelocityY(this.JUMP_VELOCITY);
      this.player.setTexture('skater_jump');
      this.isGrounded = false;
      this.jumpCount = 1;
      this.hasDoubleJumped = false;
      console.log('First jump performed');
    } else if (this.jumpCount === 1 && !this.hasDoubleJumped) {
      // Second jump - trick jump
      this.player.setVelocityY(this.TRICK_JUMP_VELOCITY);
      this.player.setTexture('skater_trick');
      this.hasDoubleJumped = true;
      this.trickActive = true;
      this.jumpCount = 2;
      
      // Reduce gravity for float effect during trick
      this.physics.world.gravity.y = this.FLOAT_GRAVITY;
      
      // Return to normal gravity after trick animation
      this.time.delayedCall(600, () => {
        this.physics.world.gravity.y = this.GRAVITY;
        this.trickActive = false;
      });
      
      console.log('Double jump performed');
    } else {
      console.log('Jump blocked - already used both jumps');
    }
  }

  update() {
    // Continuous movement forward
    this.player.setVelocityX(120);
    
    // Debug player physics every few frames
    if (this.time.now % 500 < 16) { // Every ~500ms
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      console.log(`Player: y=${Math.round(this.player.y)}, velocity.y=${Math.round(body.velocity.y)}, grounded=${this.isGrounded}`);
    }
    
    // Handle jumping with simple state check
    if ((Phaser.Input.Keyboard.JustDown(this.cursors.space!) || 
         Phaser.Input.Keyboard.JustDown(this.cursors.up!))) {
      this.performJump();
    }
    
    // Update world scrolling for infinite background
    this.world.update(this.cameras.main.scrollX);
    
    // Check if player fell too far (infinite runner should never end)
    if (this.player.y > 200) {
      console.log('Player fell - restarting scene');
      this.scene.restart();
    }
    
    // Get physics body for ground checks
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    
    // Clean ground landing system
    if (this.player.y >= 142 && body.velocity.y > 0 && !this.isGrounded) {
      this.player.y = 142;
      this.player.setVelocityY(0);
      console.log('Landing on ground');
      this.handleLanding();
    }
    
    // Keep zombie stable on ground when grounded
    if (this.isGrounded) {
      if (this.player.y > 142) {
        this.player.y = 142;
      }
      if (body.velocity.y > 0) {
        this.player.setVelocityY(0);
      }
    }
  }
}