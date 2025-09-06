import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

export default class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private world!: any;
  private jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trickParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  // Enhanced jumping mechanics
  private isGrounded = true;
  private hasDoubleJumped = false;
  private trickActive = false;
  private jumpCount = 0;
  private maxJumps = 2; // Regular jump + trick jump
  private jumpDebounce = false;
  
  // Physics constants
  private readonly JUMP_VELOCITY = -1680;
  private readonly TRICK_JUMP_VELOCITY = -1560; // Moderate second jump
  private readonly GRAVITY = 4800; // Less floaty, more responsive
  private readonly FLOAT_GRAVITY = 3600; // Less float during tricks

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
    
    // Create particle effects
    this.createParticleEffects();
    
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
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 960);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -600, -60);
    
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
    const GROUND_Y = 960;
    
    const createSeamlessWorld = (scene: Phaser.Scene) => {
      // Create placeholder background
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = 2880;
      bgCanvas.height = 960;
      const ctx = bgCanvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      
      // Simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, 960);
      gradient.addColorStop(0, '#274b8c');
      gradient.addColorStop(0.6, '#646c7a');
      gradient.addColorStop(1, '#2d303b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 2880, 960);
      
      // Street area
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(0, 720, 2880, 240);
      
      // Lane markings
      ctx.fillStyle = '#e2e28e';
      for (let x = 0; x < 2880; x += 360) {
        ctx.fillRect(x, 810, 180, 18);
      }
      
      if (!scene.textures.exists('seamless_bg')) {
        scene.textures.addCanvas('seamless_bg', bgCanvas);
      }
      
      const background = scene.add.tileSprite(0, 0, 12000, 960, 'seamless_bg')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1);

      // Physics ground - infinite collision surface at street level
      const ground = scene.physics.add.staticGroup();
      
      // Create multiple ground segments for reliable collision at street level
      for (let x = -12000; x <= 24000; x += 2400) {
        const groundSegment = scene.add.rectangle(x, 900, 2400, 120, 0x000000, 0);
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
    this.player = this.physics.add.sprite(300, 852, 'skater_idle');
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Very small scale for authentic retro game look
    this.player.setScale(0.15);
    
    // Physics body setup - tiny collision box
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(72, 96);
    body.setMaxVelocity(2400, 3600);
    body.setBounce(0); // No bouncing
    body.setOffset(0, 0); // Make sure offset is clean
    
    // Start skating animation
    this.player.play('skate');
    
    console.log(`Player created at y=${this.player.y} with body size ${body.width}x${body.height}, ground segments at y=900`);
  }

  createParticleEffects() {
    // Create simple colored particles using rectangles
    
    // Jump dust particles (when taking off)
    this.dustParticles = this.add.particles(0, 0, 'pixel', {
      speed: { min: 120, max: 360 },
      scale: { start: 1.8, end: 0 },
      lifespan: 300,
      quantity: 3,
      angle: { min: 225, max: 315 }, // Spread behind player
      alpha: { start: 0.8, end: 0 },
      tint: 0x8B4513, // Brown dust color
      emitting: false
    });

    // Jump particles (blue sparkles on first jump)
    this.jumpParticles = this.add.particles(0, 0, 'pixel', {
      speed: { min: 180, max: 480 },
      scale: { start: 2.4, end: 0 },
      lifespan: 400,
      quantity: 5,
      angle: { min: 0, max: 360 },
      alpha: { start: 1, end: 0 },
      tint: 0x00FFFF, // Cyan sparkles
      emitting: false
    });

    // Trick particles (golden trail during double jump)
    this.trickParticles = this.add.particles(0, 0, 'pixel', {
      speed: { min: 60, max: 240 },
      scale: { start: 3.0, end: 0.6 },
      lifespan: 600,
      quantity: 2,
      angle: { min: 0, max: 360 },
      alpha: { start: 1, end: 0 },
      tint: 0xFFD700, // Gold trail
      emitting: false
    });

    // Set particle depths
    this.dustParticles.setDepth(5);
    this.jumpParticles.setDepth(15);
    this.trickParticles.setDepth(15);
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
      
      // Trigger jump particles
      this.dustParticles.setPosition(this.player.x, this.player.y + 48);
      this.dustParticles.explode(3);
      this.jumpParticles.setPosition(this.player.x, this.player.y);
      this.jumpParticles.explode(5);
      
      console.log('First jump performed');
    } else if (this.jumpCount === 1 && !this.hasDoubleJumped) {
      // Second jump - trick jump
      this.player.setVelocityY(this.TRICK_JUMP_VELOCITY);
      this.player.setTexture('skater_trick');
      this.hasDoubleJumped = true;
      this.trickActive = true;
      this.jumpCount = 2;
      
      // Trigger trick particles - continuous golden trail
      this.trickParticles.setPosition(this.player.x, this.player.y);
      this.trickParticles.start();
      
      // Reduce gravity for float effect during trick
      this.physics.world.gravity.y = this.FLOAT_GRAVITY;
      
      // Return to normal gravity after trick animation
      this.time.delayedCall(600, () => {
        this.physics.world.gravity.y = this.GRAVITY;
        this.trickActive = false;
        this.trickParticles.stop(); // Stop trick particle trail
      });
      
      console.log('Double jump performed');
    } else {
      console.log('Jump blocked - already used both jumps');
    }
  }

  update() {
    // Continuous movement forward
    this.player.setVelocityX(720);
    
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
    
    // Update trick particles to follow player during tricks
    if (this.trickActive && this.trickParticles.emitting) {
      this.trickParticles.setPosition(this.player.x, this.player.y);
    }
    
    // Check if player fell too far (infinite runner should never end)
    if (this.player.y > 1200) {
      console.log('Player fell - restarting scene');
      this.scene.restart();
    }
    
    // Get physics body for ground checks
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    
    // Clean ground landing system
    if (this.player.y >= 852 && body.velocity.y > 0 && !this.isGrounded) {
      this.player.y = 852;
      this.player.setVelocityY(0);
      console.log('Landing on ground');
      this.handleLanding();
    }
    
    // Keep zombie stable on ground when grounded
    if (this.isGrounded) {
      if (this.player.y > 852) {
        this.player.y = 852;
      }
      if (body.velocity.y > 0) {
        this.player.setVelocityY(0);
      }
    }
  }
}