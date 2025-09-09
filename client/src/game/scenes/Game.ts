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
  
  // Obstacle system
  private obstacles!: Phaser.GameObjects.Group;
  private obstacleTypes = ['obstacle_cone', 'obstacle_trash', 'obstacle_crash', 'obstacle_zombie', 'obstacle_skulls'];
  private lastObstacleX = 0;
  private gameStartTime = 0;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private lastDifficulty = -1;
  
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
    
    // Create obstacle system
    this.createObstacleSystem();
    
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
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -100, 0);
    
    // ESC to return to main menu
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });

    // Initialize game timing
    this.gameStartTime = this.time.now;
    
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
      
      // Use the city background image instead of gradient
      // The city background will be loaded and used directly
      
      if (!scene.textures.exists('seamless_bg')) {
        scene.textures.addCanvas('seamless_bg', bgCanvas);
      }
      
      const background = scene.add.image(320, 960, 'city_background')
        .setOrigin(0.5, 1)
        .setScrollFactor(0.6)
        .setDepth(1)
        .setScale(1.1, 1.1); // Smaller scale while keeping bottom alignment

      // Add visible white floor line at ground level
      const floorLine = scene.add.graphics()
        .lineStyle(3, 0xffffff, 1)
        .lineTo(12000, 0)
        .setPosition(0, 920)
        .setScrollFactor(0)
        .setDepth(10);

      // Physics ground - infinite collision surface at street level
      const ground = scene.physics.add.staticGroup();
      
      // Create multiple ground segments for reliable collision at street level (where the road is)
      for (let x = -12000; x <= 24000; x += 2400) {
        const groundSegment = scene.add.rectangle(x, 920, 2400, 120, 0x000000, 0);
        groundSegment.setVisible(false);
        scene.physics.add.existing(groundSegment, true);
        ground.add(groundSegment as any);
      }

      const update = (scrollX: number) => {
        // Background automatically scrolls with scrollFactor
      };

      return { ground, update };
    };

    return { createSeamlessWorld };
  }

  createPlayer() {
    // Create player sprite positioned properly on ground
    this.player = this.physics.add.sprite(320, 920, 'skater_idle');
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Proper scale for visibility at new resolution - even smaller
    this.player.setScale(0.4);
    
    // Physics body setup - tiny collision box
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(72, 96);
    body.setMaxVelocity(2400, 3600);
    body.setBounce(0); // No bouncing
    body.setOffset(0, 0); // Make sure offset is clean
    
    // Start skating animation
    this.player.play('skate');
    
    console.log(`Player created at y=${this.player.y} with body size ${body.width}x${body.height}, ground segments at y=920`);
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

  createObstacleSystem() {
    // Create obstacle group - regular group, no physics
    this.obstacles = this.add.group();

    // Create score display
    this.scoreText = this.add.text(50, 50, 'Score: 0', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace'
    });
    this.scoreText.setDepth(100);
    this.scoreText.setScrollFactor(0); // Keep fixed on screen

    // Start spawning obstacles
    console.log('Setting up obstacle spawning timer');
    this.time.addEvent({
      delay: 2000, // Start after 2 seconds
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
    
    console.log('Obstacle system initialized');
  }

  spawnObstacle() {
    const gameTime = this.time.now - this.gameStartTime;
    const difficulty = this.getDifficulty(gameTime);
    
    console.log(`Spawning obstacle - gameTime: ${gameTime}ms, difficulty: ${difficulty}`);
    
    // Determine spawn distance based on difficulty - spawn closer so they're visible
    const minDistance = Math.max(400 - difficulty * 25, 150); // Much closer
    const maxDistance = Math.max(800 - difficulty * 50, 300); // Much closer
    const spawnDistance = Phaser.Math.Between(minDistance, maxDistance);
    
    const spawnX = this.player.x + spawnDistance;
    
    console.log(`Spawn location: playerX=${this.player.x}, spawnX=${spawnX}, distance=${spawnDistance}`);
    
    // Skip if too close to last obstacle
    if (spawnX - this.lastObstacleX < minDistance) {
      console.log(`Skipping spawn - too close to last obstacle`);
      return;
    }
    
    this.lastObstacleX = spawnX;
    
    // Choose obstacle type based on difficulty
    const obstacleType = this.chooseObstacleType(difficulty);
    
    console.log(`Creating obstacle: ${obstacleType} at x=${spawnX}`);
    
    // Spawn single obstacle or pattern based on difficulty
    if (difficulty > 3 && Math.random() < 0.3) {
      this.spawnObstaclePattern(spawnX, obstacleType);
    } else {
      this.createSingleObstacle(spawnX, obstacleType);
    }
    
    // Update spawn rate based on difficulty
    this.updateSpawnRate(difficulty);
  }

  getDifficulty(gameTime: number): number {
    // Difficulty increases every 60 seconds, maxes at level 10
    return Math.min(Math.floor(gameTime / 60000), 10);
  }

  chooseObstacleType(difficulty: number): string {
    // Early game: mostly cones and trash
    if (difficulty < 2) {
      return Phaser.Utils.Array.GetRandom(['obstacle_cone', 'obstacle_trash']);
    }
    // Mid game: add crashes and zombies
    else if (difficulty < 5) {
      return Phaser.Utils.Array.GetRandom(['obstacle_cone', 'obstacle_trash', 'obstacle_crash', 'obstacle_zombie']);
    }
    // Late game: all obstacles including skulls
    else {
      return Phaser.Utils.Array.GetRandom(this.obstacleTypes);
    }
  }

  createSingleObstacle(x: number, type: string) {
    // First check if the texture exists
    if (!this.textures.exists(type)) {
      console.error(`Texture ${type} does not exist!`);
      return;
    }
    
    // Create as simple image sitting on ground - NO PHYSICS
    const obstacle = this.add.image(x, 920, type);
    obstacle.setScale(0.15); // Even smaller
    obstacle.setDepth(15);
    obstacle.setOrigin(0.5, 1); // Bottom center origin so it sits ON the ground
    
    console.log(`Created ground obstacle: ${type} at (${x}, 920) sitting on ground`);
    
    this.obstacles.add(obstacle);
    
    console.log(`Total obstacles: ${this.obstacles.children.size}`);
  }

  spawnObstaclePattern(x: number, type: string) {
    // Create obstacle patterns for higher difficulty
    const patternType = Phaser.Math.Between(1, 3);
    
    switch (patternType) {
      case 1: // Double obstacle
        this.createSingleObstacle(x, type);
        this.createSingleObstacle(x + 200, type);
        break;
      case 2: // Triple spread
        this.createSingleObstacle(x, type);
        this.createSingleObstacle(x + 150, type);
        this.createSingleObstacle(x + 300, type);
        break;
      case 3: // Mixed types
        this.createSingleObstacle(x, type);
        const secondType = Phaser.Utils.Array.GetRandom(this.obstacleTypes);
        this.createSingleObstacle(x + 250, secondType);
        break;
    }
  }

  updateSpawnRate(difficulty: number) {
    // Don't recreate timer constantly - only when difficulty actually changes
    if (difficulty === this.lastDifficulty) return;
    this.lastDifficulty = difficulty;
    
    // Remove existing timer
    this.time.removeAllEvents();
    
    // Create new timer with adjusted delay
    const baseDelay = 3000;
    const difficultyReduction = difficulty * 200;
    const newDelay = Math.max(baseDelay - difficultyReduction, 800); // Min 0.8 seconds
    
    this.time.addEvent({
      delay: newDelay,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }

  gameOver() {
    console.log('Game Over! Final Score:', this.score);
    this.scene.restart();
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
    
    // Update score based on distance
    const currentScore = Math.floor((this.player.x - 320) / 100);
    if (currentScore > this.score) {
      this.score = currentScore;
      this.scoreText.setText(`Score: ${this.score}`);
    }
    
    // Manual collision detection with obstacles
    this.obstacles.children.entries.forEach((obstacle: any) => {
      // Check collision with player
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, obstacle.x, obstacle.y);
      if (distance < 50) { // Hit obstacle
        this.gameOver();
      }
      
      // Clean up off-screen obstacles
      if (obstacle.x < this.cameras.main.scrollX - 200) {
        this.obstacles.remove(obstacle);
        obstacle.destroy();
      }
    });
    
    // Check if player fell too far (infinite runner should never end)
    if (this.player.y > 1200) {
      console.log('Player fell - restarting scene');
      this.scene.restart();
    }
    
    // Get physics body for ground checks
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    
    // Clean ground landing system
    if (this.player.y >= 920 && body.velocity.y > 0 && !this.isGrounded) {
      this.player.y = 920;
      this.player.setVelocityY(0);
      console.log('Landing on ground');
      this.handleLanding();
    }
    
    // Keep zombie stable on ground when grounded
    if (this.isGrounded) {
      if (this.player.y > 920) {
        this.player.y = 920;
      }
      if (body.velocity.y > 0) {
        this.player.setVelocityY(0);
      }
    }
  }
}