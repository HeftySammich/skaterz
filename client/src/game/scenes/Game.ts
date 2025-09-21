import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

// Define ground level constants - skater runs higher than obstacles sit
const PLAYER_GROUND_Y = 850;  // Original skater position
const OBSTACLE_GROUND_Y = 956;  // Where obstacles sit on the street

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
  private gameOverTriggered = false;
  private gameStartTime = 0;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private lastDifficulty = -1;
  private obstacleTimer: Phaser.Time.TimerEvent | null = null;
  
  // Enemy system
  private enemies!: Phaser.GameObjects.Group;
  private explosions!: Phaser.GameObjects.Group;
  private arrowIndicators!: Phaser.GameObjects.Group;
  private lastEnemyX = 0;
  private bounceVelocity = -800; // Bounce when landing on enemy
  
  // Stamina system
  private stamina = 100;  // Max stamina
  private maxStamina = 100;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private staminaBarBg!: Phaser.GameObjects.Graphics;
  private staminaCost = 33.33;  // Cost per jump (one third)
  private staminaRegen = 0.5;  // Regeneration per frame
  
  // Health system
  private health = 100;
  private maxHealth = 100;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private invulnerable = false;
  private invulnerableTime = 1500; // 1.5 seconds of invulnerability after hit
  
  // Sandwiches (health pickups)
  private sandwiches!: Phaser.GameObjects.Group;
  private sandwichTimer!: Phaser.Time.TimerEvent;
  
  // Background tiles for infinite scrolling
  private backgroundTiles: Phaser.GameObjects.Image[] = [];
  private backgroundWidth = 1408; // 1280 * 1.1
  
  // Physics constants
  private readonly JUMP_VELOCITY = -1600;  // Higher first jump
  private readonly TRICK_JUMP_VELOCITY = -1350; // Lower double jump
  private readonly GRAVITY = 4800; // Less floaty, more responsive
  private readonly FLOAT_GRAVITY = 3600; // Less float during tricks

  constructor() {
    super('Game');
  }

  create() {
    // Reset all game state variables
    console.log('[DEBUG GAME INIT] Starting game scene...');
    this.gameOverTriggered = false;
    this.health = 100; // Reset to full health
    this.stamina = 100; // Reset to full stamina
    this.invulnerable = false; // Reset invulnerability
    this.score = 0; // Reset score
    this.lastObstacleX = 0;
    this.lastEnemyX = 0;
    this.isGrounded = true;
    this.jumpCount = 0;
    this.hasDoubleJumped = false;
    this.trickActive = false;
    this.backgroundTiles = []; // Clear background tiles
    
    console.log(`[DEBUG GAME INIT] Health: ${this.health}, Stamina: ${this.stamina}, Invulnerable: ${this.invulnerable}`);
    
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
    
    // Create enemy system
    this.createEnemySystem();
    
    // Create sandwich system (health pickups)
    this.createSandwichSystem();
    
    // Setup controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Add touch/click controls for mobile
    this.input.on('pointerdown', () => {
      this.performJump();
    });
    
    // No ground collision - handle landing through position checks only to avoid invisible floors

    // Add collision detection for obstacles using overlap for guaranteed detection
    this.physics.add.overlap(this.player, this.obstacles, (player: any, obstacle: any) => {
      console.log(`[DEBUG COLLISION] Obstacle collision detected! Invulnerable: ${this.invulnerable}, GameOver: ${this.gameOverTriggered}, Health: ${this.health}`);
      if (!this.invulnerable && !this.gameOverTriggered) {
        console.log(`[DEBUG COLLISION] Taking damage from obstacle...`);
        this.takeDamage(25); // Take 25 damage from obstacles
        this.obstacles.remove(obstacle); // Remove from physics group first
        obstacle.destroy(); // Then destroy the sprite
      } else {
        console.log(`[DEBUG COLLISION] Damage blocked - Invulnerable: ${this.invulnerable}, GameOver: ${this.gameOverTriggered}`);
      }
    }, undefined, this);
    
    // Add collision detection for enemies - stomp them from above
    this.physics.add.overlap(this.player, this.enemies, (player: any, enemy: any) => {
      const playerBody = player.body as Phaser.Physics.Arcade.Body;
      console.log(`[DEBUG COLLISION] Enemy collision detected! Invulnerable: ${this.invulnerable}, GameOver: ${this.gameOverTriggered}`);
      
      // Check if player is falling and above the enemy (stomping)
      if (playerBody.velocity.y > 0 && player.y < enemy.y - 20) {
        console.log(`[DEBUG COLLISION] Stomping enemy!`);
        this.stompEnemy(enemy);
        this.bouncePlayer();
      } else if (!this.invulnerable && !this.gameOverTriggered) {
        // Hit enemy from side or below - take damage
        console.log(`[DEBUG COLLISION] Taking damage from enemy...`);
        this.takeDamage(35); // Take 35 damage from enemies
        this.enemies.remove(enemy); // Remove from physics group first
        enemy.destroy(); // Then destroy enemy
      } else {
        console.log(`[DEBUG COLLISION] Enemy damage blocked - Invulnerable: ${this.invulnerable}`);
      }
    }, undefined, this);
    
    // Add collision detection for sandwiches (health pickups)
    this.physics.add.overlap(this.player, this.sandwiches, (player: any, sandwich: any) => {
      this.collectSandwich(sandwich);
    }, undefined, this);
    
    console.log('Collision detection set up between player and obstacles/enemies');

    // No ground collision for obstacles - they're positioned at ground level

    // Remove camera bounds for infinite world
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 960);
    // Follow player directly without smoothing to keep obstacles and background in sync
    this.cameras.main.startFollow(this.player, true, 1.0, 1.0, -100, 0);
    
    // ESC to return to main menu
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });

    // Initialize game timing
    this.gameStartTime = this.time.now;
    
    // Add position tracking every second for debugging
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        console.log('=== POSITION TRACKER (1 SEC) ===');
        console.log(`Position: X=${Math.round(this.player.x)}, Y=${Math.round(this.player.y)}`);
        console.log(`Velocity: X=${Math.round(body.velocity.x)}, Y=${Math.round(body.velocity.y)}`);
        console.log(`State: Grounded=${this.isGrounded}, JumpCount=${this.jumpCount}`);
        console.log(`Physics: Gravity=${this.physics.world.gravity.y}, Touching.down=${body.touching.down}`);
        console.log(`Stamina: ${Math.round(this.stamina)}/${this.maxStamina}`);
        console.log('================================');
      },
      loop: true
    });
    
    console.log('Game scene loaded with enhanced zombie skater mechanics');
  }

  createSeamlessWorld() {
    // Create the seamless world directly
    const { createSeamlessWorld } = this.loadSeamlessWorld();
    return createSeamlessWorld(this);
  }

  loadSeamlessWorld() {
    // Inline the seamless world creation to avoid import issues
    
    const createSeamlessWorld = (scene: any) => {
      // Create initial background tiles directly without placeholder
      const startX = 320;
      for (let i = -2; i <= 5; i++) {
        const tile = scene.add.image(startX + (i * this.backgroundWidth), 960, 'city_background')
          .setOrigin(0.5, 1)
          .setScrollFactor(1.0)
          .setDepth(1)
          .setScale(1.1, 1.1);
        this.backgroundTiles.push(tile);
      }

      // Add visible white floor line at ground level
      const floorLine = scene.add.graphics()
        .lineStyle(3, 0xffffff, 1)
        .lineTo(12000, 0)
        .setPosition(0, PLAYER_GROUND_Y)
        .setScrollFactor(0)
        .setDepth(10);

      // Physics ground - infinite collision surface at street level
      const ground = scene.physics.add.staticGroup();
      
      // Don't create invisible ground segments - handle landing through position checks only
      // This prevents the player from landing on invisible floors

      const update = (scrollX: number) => {
        // Managed in main update now
      };

      return { ground, update };
    };

    return { createSeamlessWorld };
  }

  createPlayer() {
    // Create player sprite positioned properly on ground
    this.player = this.physics.add.sprite(320, PLAYER_GROUND_Y, 'skater_idle');
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Proper scale for visibility at new resolution - even smaller
    this.player.setScale(0.4);
    
    // Physics body setup - normal sized collision box (not extended)
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    // Set hitbox to match player visual without extension
    body.setSize(this.player.width * 0.8, this.player.height * 0.9);
    body.setOffset(this.player.width * 0.1, this.player.height * 0.05);
    body.setMaxVelocity(2400, 3600);
    body.setBounce(0); // No bouncing
    body.setOffset(0, 0); // Make sure offset is clean
    
    // Start skating animation
    this.player.play('skate');
    
    console.log(`Player created at y=${this.player.y} with body size ${body.width}x${body.height}, ground segments at y=${PLAYER_GROUND_Y}`);
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

  createEnemySystem() {
    console.log('[DEBUG ENEMY SYSTEM] Creating enemy system...');
    
    // Create physics groups for enemies and explosions
    this.enemies = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
    
    this.explosions = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
    
    // Create group for arrow indicators
    this.arrowIndicators = this.add.group();
    
    // Start spawning enemies with a delay to give player time
    this.time.delayedCall(5000, () => {
      console.log('[DEBUG ENEMY SYSTEM] Starting enemy spawning...');
      const enemyTimer = this.time.addEvent({
        delay: 2500, // Spawn enemies more frequently
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true
      });
      console.log('[DEBUG ENEMY SYSTEM] Enemy timer created with delay: 2500ms');
    });
    
    console.log('[DEBUG ENEMY SYSTEM] Enemy system initialized (spawning starts in 5s)');
  }
  
  spawnEnemy() {
    const gameTime = this.time.now - this.gameStartTime;
    const difficulty = this.getDifficulty(gameTime);
    
    console.log(`[DEBUG ENEMY SPAWN] Called at gameTime=${gameTime}ms`);
    
    // Don't spawn enemies in the first 3 seconds
    if (gameTime < 3000) {
      console.log(`[DEBUG ENEMY SPAWN] Too early, waiting...`);
      return;
    }
    
    // Spawn distance ahead of player (further out to account for warning time)
    const warningTime = 2000; // 2 seconds warning
    const playerSpeed = 5.5; // pixels per frame
    const warningDistance = (playerSpeed * 60 * warningTime) / 1000; // Distance player travels in warning time
    const spawnDistance = Phaser.Math.Between(600, 1000) + warningDistance;
    const spawnX = this.player.x + spawnDistance;
    
    // Skip if too close to last enemy
    if (spawnX - this.lastEnemyX < 400) {
      return;
    }
    
    this.lastEnemyX = spawnX;
    
    // Choose enemy type
    const enemyType = Math.random() < 0.5 ? 'enemy_eyeball' : 'enemy_robot';
    
    // Determine height based on difficulty and randomness
    let enemyY;
    const randomChoice = Math.random();
    
    if (randomChoice < 0.5) {
      // Low enemy - easily reachable with first jump
      enemyY = PLAYER_GROUND_Y - Phaser.Math.Between(120, 180);
    } else if (randomChoice < 0.85) {
      // Medium enemy - comfortable first jump height
      enemyY = PLAYER_GROUND_Y - Phaser.Math.Between(200, 260);
    } else {
      // High enemy - requires double jump but not too high
      enemyY = PLAYER_GROUND_Y - Phaser.Math.Between(320, 400);
    }
    
    // Create arrow indicator on right side of screen
    // Since arrow uses scrollFactor(0), we need viewport coordinates, not world coordinates
    const arrow = this.arrowIndicators.create(590, enemyY, 'arrow_indicator') as Phaser.GameObjects.Sprite;
    arrow.setScale(0.15);
    arrow.setDepth(102); // Above UI
    arrow.setScrollFactor(0); // Keep fixed on screen
    
    // Position arrow on right side of viewport with correct Y coordinate relative to viewport
    // Convert world Y to viewport Y (since we're using scrollFactor 0)
    arrow.x = 590; // Near right edge of 640px screen
    arrow.y = enemyY; // This is already the correct Y position in world coords
    
    // DEBUG: Log arrow creation details
    console.log(`[DEBUG ARROW] Created arrow at viewport position (${arrow.x}, ${arrow.y})`);
    console.log(`[DEBUG ARROW] Enemy will spawn at world Y=${enemyY}`);
    console.log(`[DEBUG ARROW] Arrow properties: scale=${arrow.scale}, depth=${arrow.depth}, scrollFactor=${arrow.scrollFactorX},${arrow.scrollFactorY}`);
    
    // Flash the arrow for visibility
    this.tweens.add({
      targets: arrow,
      alpha: { from: 1, to: 0.5 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });
    
    // Spawn enemy after warning delay
    this.time.delayedCall(warningTime, () => {
      // Calculate spawn position to be just off-screen when accounting for player movement
      const adjustedSpawnX = this.player.x + 660; // Spawn just off the right edge of screen
      
      // Create enemy
      const enemy = this.enemies.create(adjustedSpawnX, enemyY, enemyType) as Phaser.Physics.Arcade.Sprite;
      enemy.setScale(0.15); // Slightly bigger for visibility
      enemy.setDepth(14);
      enemy.setImmovable(true);
      enemy.setPushable(false);
      enemy.setVisible(true); // Ensure visible
      enemy.setAlpha(1); // Full opacity
      
      // DEBUG: Log enemy creation details
      console.log(`[DEBUG ENEMY] Created ${enemyType} at world position (${adjustedSpawnX}, ${enemyY})`);
      console.log(`[DEBUG ENEMY] Player position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`);
      console.log(`[DEBUG ENEMY] Distance from player: ${adjustedSpawnX - this.player.x}px`);
      console.log(`[DEBUG ENEMY] Enemy properties: scale=${enemy.scale}, depth=${enemy.depth}, visible=${enemy.visible}, alpha=${enemy.alpha}`);
      console.log(`[DEBUG ENEMY] Enemy texture: ${enemy.texture.key}, frame: ${enemy.frame.name}`);
      console.log(`[DEBUG ENEMY] Enemy dimensions: width=${enemy.width}, height=${enemy.height}`);
      console.log(`[DEBUG ENEMY] Camera scrollX: ${this.cameras.main.scrollX}`);
      const screenX = adjustedSpawnX - this.cameras.main.scrollX;
      console.log(`[DEBUG ENEMY] Enemy screen position: ${Math.round(screenX)}px from left edge`);
      
      // Store reference to arrow on enemy so we can remove it when enemy appears
      (enemy as any).arrow = arrow;
      
      // Set hitbox for enemy
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.setSize(enemy.width * 0.7, enemy.height * 0.7);
      
      // Set very slow horizontal movement speed (enemies move backwards relative to player)
      body.setVelocityX(-80); // Slightly faster to be visible on screen longer
      
      // Add floating animation
      this.tweens.add({
        targets: enemy,
        y: enemyY - 20,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      console.log(`[ENEMY] Spawned ${enemyType} at (${spawnX}, ${enemyY}) after warning`);
    });
    
    console.log(`[ARROW] Indicator shown at Y=${enemyY}, enemy will spawn at X=${spawnX} in 2 seconds`);
  }
  
  stompEnemy(enemy: Phaser.GameObjects.Sprite) {
    // Create explosion at enemy position
    const explosion = this.explosions.create(enemy.x, enemy.y, 'explosion') as Phaser.Physics.Arcade.Sprite;
    explosion.setScale(0.3);
    explosion.setDepth(15);
    
    // Animate explosion
    this.tweens.add({
      targets: explosion,
      scale: 0.5,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        explosion.destroy();
      }
    });
    
    // Remove enemy
    enemy.destroy();
    
    // Add score
    this.score += 50;
    this.scoreText.setText('Score: ' + this.score);
    
    // Play particle effect
    this.jumpParticles.setPosition(enemy.x, enemy.y);
    this.jumpParticles.explode(10);
    
    console.log('Enemy stomped!');
  }
  
  bouncePlayer() {
    // Give player a bounce
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocityY(this.bounceVelocity);
    
    // Reset jump count to allow another jump
    this.jumpCount = 1;
    this.hasDoubleJumped = false;
    
    // Restore stamina as reward
    this.stamina = Math.min(this.maxStamina, this.stamina + 20);
    this.updateStaminaBar();
    
    console.log('Player bounced off enemy!');
  }

  createObstacleSystem() {
    // Create physics group for obstacles with gravity disabled
    this.obstacles = this.physics.add.group({ 
      allowGravity: false, 
      immovable: true 
    });

    // Create score display
    this.scoreText = this.add.text(50, 50, 'Score: 0', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'monospace'
    });
    this.scoreText.setDepth(100);
    this.scoreText.setScrollFactor(0); // Keep fixed on screen
    
    // Create stamina bar
    this.staminaBarBg = this.add.graphics();
    this.staminaBarBg.fillStyle(0x000000, 0.5);
    this.staminaBarBg.fillRect(50, 110, 204, 24);
    this.staminaBarBg.setDepth(100);
    this.staminaBarBg.setScrollFactor(0);
    
    this.staminaBar = this.add.graphics();
    this.staminaBar.setDepth(101);
    this.staminaBar.setScrollFactor(0);
    this.updateStaminaBar();
    
    // Add stamina label
    this.add.text(50, 88, 'STAMINA', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(100).setScrollFactor(0)
    
    // Create health bar
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(50, 170, 204, 24);
    this.healthBarBg.setDepth(100);
    this.healthBarBg.setScrollFactor(0);
    
    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(101);
    this.healthBar.setScrollFactor(0);
    this.updateHealthBar();
    
    // Add health label
    this.healthText = this.add.text(50, 148, 'HEALTH', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(100).setScrollFactor(0);

    // Start spawning obstacles
    console.log('Setting up obstacle spawning timer');
    this.obstacleTimer = this.time.addEvent({
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
    
    // Add warning time for arrow indicator
    const warningTime = 1500; // 1.5 seconds warning for obstacles
    const playerSpeed = 5.5; // pixels per frame
    const warningDistance = (playerSpeed * 60 * warningTime) / 1000;
    
    // Determine spawn distance based on difficulty - spawn closer so they're visible
    const minDistance = Math.max(400 - difficulty * 25, 150) + warningDistance; 
    const maxDistance = Math.max(800 - difficulty * 50, 300) + warningDistance;
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
    
    // Create arrow indicator for ground obstacle
    const arrow = this.arrowIndicators.create(590, OBSTACLE_GROUND_Y - 50, 'arrow_indicator') as Phaser.GameObjects.Sprite;
    arrow.setScale(0.15);
    arrow.setDepth(102); // Above UI
    arrow.setScrollFactor(0); // Keep fixed on screen
    arrow.x = 590; // Near right edge of 640px screen
    arrow.y = OBSTACLE_GROUND_Y - 50; // Position arrow slightly above ground obstacle
    
    // Flash the arrow for visibility
    this.tweens.add({
      targets: arrow,
      alpha: { from: 1, to: 0.5 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });
    
    console.log(`[DEBUG ARROW] Created arrow for obstacle at viewport Y=${arrow.y}`);
    
    // Spawn obstacle after warning delay
    this.time.delayedCall(warningTime, () => {
      // Remove arrow
      arrow.destroy();
      
      // Recalculate spawn position based on current player position
      // The obstacle should appear just off-screen when the delay ends
      const adjustedSpawnX = this.player.x + 700; // Spawn just ahead of visible area
      
      console.log(`[DEBUG OBSTACLE] Spawning at adjusted position: ${adjustedSpawnX} (was ${spawnX})`);
      
      // Spawn single obstacle or pattern based on difficulty
      if (difficulty > 3 && Math.random() < 0.3) {
        this.spawnObstaclePattern(adjustedSpawnX, obstacleType);
      } else {
        this.createSingleObstacle(adjustedSpawnX, obstacleType);
      }
    });
    
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
    
    // Create obstacle through the physics group - this is the fix!
    const obstacle = this.obstacles.create(x, OBSTACLE_GROUND_Y, type) as Phaser.Physics.Arcade.Sprite;
    obstacle.setScale(0.15); // Even smaller
    obstacle.setDepth(15);
    obstacle.setOrigin(0.5, 1); // Bottom center origin so it sits ON the ground
    obstacle.setImmovable(true); // Make obstacle static
    obstacle.setPushable(false); // Can't be pushed by player
    
    // Set physics body to bridge height gap between player and obstacle
    const body = obstacle.body as Phaser.Physics.Arcade.Body;
    // Make hitbox taller to reach up to player level
    body.setSize(obstacle.width * 0.8, obstacle.height + 110);
    // Offset up to bridge the gap between player at 850 and obstacle at 956 (106px gap)
    body.setOffset(obstacle.width * 0.1, -110);
    
    console.log(`Created ground obstacle: ${type} at (${x}, ${OBSTACLE_GROUND_Y}) sitting on ground`);
    console.log(`Total obstacles: ${this.obstacles.children.size}`);
  }

  spawnObstaclePattern(x: number, type: string) {
    // Create obstacle patterns for higher difficulty
    const patternType = Phaser.Math.Between(1, 3);
    
    console.log(`[DEBUG OBSTACLE] Creating pattern type ${patternType} at x=${x}`);
    
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
    
    // Remove existing obstacle timer only
    if (this.obstacleTimer) {
      this.obstacleTimer.remove();
    }
    
    // Create new timer with adjusted delay
    const baseDelay = 3000;
    const difficultyReduction = difficulty * 200;
    const newDelay = Math.max(baseDelay - difficultyReduction, 800); // Min 0.8 seconds
    
    this.obstacleTimer = this.time.addEvent({
      delay: newDelay,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }

  gameOver() {
    const survivalTime = this.time.now - this.gameStartTime;
    console.log(`[DEBUG GAME OVER] Final Score: ${this.score}, Survival Time: ${survivalTime}ms`);
    console.log(`[DEBUG GAME OVER] Health at death: ${this.health}, Invulnerable: ${this.invulnerable}`);
    
    // Stop all timers to prevent them from running after game over
    if (this.obstacleTimer) this.obstacleTimer.remove();
    if (this.sandwichTimer) this.sandwichTimer.remove();
    
    // Transition to GameOver scene with score and time
    this.scene.start('GameOver', { score: this.score, time: survivalTime });
  }

  handleLanding() {
    this.isGrounded = true;
    this.hasDoubleJumped = false;
    this.trickActive = false;
    this.jumpCount = 0;
    
    // Return to normal gravity and skating texture
    this.physics.world.gravity.y = this.GRAVITY;
    this.player.setTexture('skater_idle');
    
    // Clear ALL vertical velocity to prevent bouncing
    this.player.setVelocityY(0);
    
    // Ensure player is exactly at ground level
    this.player.y = PLAYER_GROUND_Y;
    
    console.log('Player landed');
  }

  performJump() {
    console.log(`Jump attempt: grounded=${this.isGrounded}, jumpCount=${this.jumpCount}, hasDoubleJumped=${this.hasDoubleJumped}, stamina=${this.stamina}`);
    
    if (this.isGrounded && this.stamina >= this.staminaCost) {
      // First jump - clear state and jump
      this.player.setVelocityY(this.JUMP_VELOCITY);
      this.player.setTexture('skater_jump');
      this.isGrounded = false;
      this.jumpCount = 1;
      this.hasDoubleJumped = false;
      
      // Consume stamina
      this.stamina = Math.max(0, this.stamina - this.staminaCost);
      this.updateStaminaBar();
      
      // Trigger jump particles
      this.dustParticles.setPosition(this.player.x, this.player.y + 48);
      this.dustParticles.explode(3);
      this.jumpParticles.setPosition(this.player.x, this.player.y);
      this.jumpParticles.explode(5);
      
      console.log('First jump performed');
    } else if (this.jumpCount === 1 && !this.hasDoubleJumped && this.stamina >= this.staminaCost) {
      // Second jump - trick jump (requires stamina)
      this.player.setVelocityY(this.TRICK_JUMP_VELOCITY);
      this.player.setTexture('skater_trick');
      this.hasDoubleJumped = true;
      this.trickActive = true;
      this.jumpCount = 2;
      
      // Consume stamina
      this.stamina = Math.max(0, this.stamina - this.staminaCost);
      this.updateStaminaBar();
      
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
      if (this.stamina < this.staminaCost) {
        console.log('Jump blocked - not enough stamina');
      } else {
        console.log('Jump blocked - already used both jumps');
      }
    }
  }
  
  updateStaminaBar() {
    this.staminaBar.clear();
    
    // Choose color based on stamina level
    let color = 0x00ff00;  // Green
    if (this.stamina < 33.33) {
      color = 0xff0000;  // Red
    } else if (this.stamina < 66.66) {
      color = 0xffaa00;  // Orange
    }
    
    // Draw stamina bar
    this.staminaBar.fillStyle(color, 1);
    const barWidth = (this.stamina / this.maxStamina) * 200;
    this.staminaBar.fillRect(52, 112, barWidth, 20);
  }
  
  updateHealthBar() {
    this.healthBar.clear();
    
    // Choose color based on health level
    let color = 0x00ff00;  // Green
    if (this.health < 30) {
      color = 0xff0000;  // Red
    } else if (this.health < 60) {
      color = 0xffaa00;  // Orange
    }
    
    // Draw health bar
    this.healthBar.fillStyle(color, 1);
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.fillRect(52, 172, 200 * healthPercent, 20);
  }
  
  takeDamage(amount: number) {
    console.log(`[DEBUG DAMAGE] takeDamage called with amount: ${amount}, Current health: ${this.health}, Invulnerable: ${this.invulnerable}`);
    if (this.invulnerable) {
      console.log(`[DEBUG DAMAGE] Damage blocked - player is invulnerable`);
      return;
    }
    
    const newHealth = Math.max(0, this.health - amount);
    console.log(`[DEBUG DAMAGE] Taking ${amount} damage: ${this.health} -> ${newHealth}`);
    this.health = newHealth;
    this.updateHealthBar();
    
    // Flash the player red
    this.player.setTint(0xff0000);
    
    // Make invulnerable for a short time
    this.invulnerable = true;
    
    // Flash effect
    let flashCount = 0;
    const flashTimer = this.time.addEvent({
      delay: 150,
      callback: () => {
        flashCount++;
        if (flashCount % 2 === 0) {
          this.player.setTint(0xffffff);
        } else {
          this.player.setTint(0xff8888);
        }
        
        if (flashCount >= 8) {
          this.player.clearTint();
          this.invulnerable = false;
          flashTimer.remove();
        }
      },
      loop: true
    });
    
    // Check if dead
    if (this.health <= 0) {
      this.gameOverTriggered = true;
      this.gameOver();
    }
  }
  
  createSandwichSystem() {
    // Create physics group for sandwiches
    this.sandwiches = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
    
    // Start spawning sandwiches
    this.sandwichTimer = this.time.addEvent({
      delay: 8000, // Spawn every 8 seconds
      callback: this.spawnSandwich,
      callbackScope: this,
      loop: true
    });
    
    // Spawn first sandwich soon after start
    this.time.delayedCall(3000, () => {
      this.spawnSandwich();
    });
  }
  
  spawnSandwich() {
    const spawnX = this.player.x + Phaser.Math.Between(800, 1200);
    const spawnY = Phaser.Math.Between(400, 600); // Float in the sky
    
    const sandwich = this.sandwiches.create(spawnX, spawnY, 'sandwich');
    sandwich.setScale(0.12); // Scale down the sandwich
    sandwich.setDepth(10);
    
    // Add floating animation
    this.tweens.add({
      targets: sandwich,
      y: spawnY - 20,
      duration: 1500,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
    
    console.log(`Sandwich spawned at (${spawnX}, ${spawnY})`);
  }
  
  collectSandwich(sandwich: any) {
    // Heal player
    this.health = Math.min(this.maxHealth, this.health + 40);
    this.updateHealthBar();
    
    // Add score
    this.score += 25;
    this.scoreText.setText('Score: ' + this.score);
    
    // Play particle effect at sandwich location
    this.jumpParticles.setPosition(sandwich.x, sandwich.y);
    this.jumpParticles.explode(15);
    
    // Remove sandwich
    sandwich.destroy();
    
    console.log(`Sandwich collected! Health: ${this.health}/${this.maxHealth}`);
  }
  
  updateBackgroundTiles() {
    if (this.backgroundTiles.length === 0) return;
    
    const cameraX = this.cameras.main.scrollX;
    const screenWidth = 640;
    
    // Find the leftmost and rightmost tiles
    let leftmostTile = this.backgroundTiles[0];
    let rightmostTile = this.backgroundTiles[this.backgroundTiles.length - 1];
    
    // Remove tiles that are too far behind
    while (this.backgroundTiles.length > 0 && this.backgroundTiles[0].x < cameraX - screenWidth) {
      const tileToRemove = this.backgroundTiles.shift();
      if (tileToRemove) tileToRemove.destroy();
    }
    
    // Add new tiles ahead if needed
    if (this.backgroundTiles.length > 0) {
      rightmostTile = this.backgroundTiles[this.backgroundTiles.length - 1];
      
      while (rightmostTile.x < cameraX + screenWidth * 2) {
        const newX = rightmostTile.x + this.backgroundWidth;
        const newTile = this.add.image(newX, 960, 'city_background')
          .setOrigin(0.5, 1)
          .setScrollFactor(1.0)
          .setDepth(1)
          .setScale(1.1, 1.1);
        this.backgroundTiles.push(newTile);
        rightmostTile = newTile;
      }
    }
  }

  update() {
    // Debug logging for movement issues
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    console.log(`[DEBUG] Player X:${Math.round(this.player.x)}, Y:${Math.round(this.player.y)}, VelX:${Math.round(playerBody.velocity.x)}, VelY:${Math.round(playerBody.velocity.y)}, Grounded:${this.isGrounded}, Stamina:${Math.round(this.stamina)}`);
    
    // Manage infinite background scrolling
    this.updateBackgroundTiles();
    
    // Regenerate stamina slowly
    if (this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
      this.updateStaminaBar();
    }
    
    // Force movement by directly updating position since velocity isn't working
    this.player.x += 5.5; // Move 5.5 pixels per frame (330 pixels/sec at 60fps) - balanced speed for obstacle timing
    
    // Still set velocity for physics calculations
    this.player.setVelocityX(330);
    
    // Log if velocity is being blocked
    if (Math.abs(playerBody.velocity.x) < 100) {
      console.log('[WARNING] Player velocity blocked, using position-based movement');
    }
    
    // Debug collision and obstacle info
    if (this.time.now % 1000 < 16) { // Every second
      console.log(`[OBSTACLES] Count: ${this.obstacles.children.size}, Camera X: ${Math.round(this.cameras.main.scrollX)}`);
      this.obstacles.children.entries.forEach((obs: any, idx: number) => {
        if (idx === 0) { // Log first obstacle only
          const obsBody = obs.body as Phaser.Physics.Arcade.Body;
          console.log(`[OBSTACLE] X:${Math.round(obs.x)}, Y:${Math.round(obs.y)}, Width:${obsBody.width}, Height:${obsBody.height}`);
        }
      });
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
    
    // Clean up off-screen obstacles
    this.obstacles.children.entries.forEach((obstacle: any) => {
      if (obstacle.x < this.cameras.main.scrollX - 200) {
        this.obstacles.remove(obstacle);
        obstacle.destroy();
      }
    });
    
    // Clean up off-screen sandwiches
    this.sandwiches.children.entries.forEach((sandwich: any) => {
      if (sandwich.x < this.cameras.main.scrollX - 200) {
        this.sandwiches.remove(sandwich);
        sandwich.destroy();
      }
    });
    
    // Clean up off-screen enemies and manage arrow indicators
    this.enemies.children.entries.forEach((enemy: any, index: number) => {
      // Debug tracking for first enemy
      if (index === 0 && this.time.now % 1000 < 16) { // Log once per second
        console.log(`[DEBUG ENEMY TRACKING] Enemy at world position (${Math.round(enemy.x)}, ${Math.round(enemy.y)})`);
        console.log(`[DEBUG ENEMY TRACKING] Player at (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`);
        console.log(`[DEBUG ENEMY TRACKING] Distance from player: ${Math.round(enemy.x - this.player.x)}px`);
        console.log(`[DEBUG ENEMY TRACKING] Enemy visible: ${enemy.visible}, alpha: ${enemy.alpha}`);
        const screenX = enemy.x - this.cameras.main.scrollX;
        console.log(`[DEBUG ENEMY TRACKING] Enemy screen position: ${Math.round(screenX)}px from left edge`);
      }
      
      // Remove arrow when enemy is on screen (visible)
      if (enemy.arrow && enemy.x < this.player.x + 640) {
        console.log(`[DEBUG ARROW] Destroying arrow as enemy is on screen at X=${enemy.x}`);
        enemy.arrow.destroy();
        enemy.arrow = null;
      }
      
      // Clean up off-screen enemies
      if (enemy.x < this.cameras.main.scrollX - 200) {
        // Also remove arrow if still exists
        if (enemy.arrow) {
          enemy.arrow.destroy();
        }
        this.enemies.remove(enemy);
        enemy.destroy();
      }
    });
    
    // Check if player fell too far (infinite runner should never end)
    if (this.player.y > 1200) {
      console.log('Player fell - restarting scene');
      this.scene.restart();
    }
    
    // Get physics body for ground checks
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    
    // Disable gravity when on ground to prevent constant downward force
    if (this.isGrounded) {
      body.allowGravity = false;
    } else {
      body.allowGravity = true;
    }
    
    // Predict if player will land this frame and prevent overshooting
    if (!this.isGrounded && body.velocity.y > 0) {
      const nextY = this.player.y + (body.velocity.y * this.game.loop.delta / 1000);
      
      // If next position would be at or below ground, land NOW
      if (nextY >= PLAYER_GROUND_Y) {
        console.log(`*** SMOOTH LANDING ***`);
        console.log(`Predicted landing: currentY=${this.player.y}, nextY=${nextY}, VelY=${body.velocity.y}`);
        
        // Set to exact ground position before overshooting
        this.player.y = PLAYER_GROUND_Y;
        this.handleLanding();
        
        console.log(`After landing: Y=${this.player.y}, VelY=${body.velocity.y}`);
        console.log(`*********************`);
      }
    }
    
    // Track near-ground behavior for debugging
    if (!this.isGrounded && this.player.y > PLAYER_GROUND_Y - 50 && this.player.y < PLAYER_GROUND_Y + 10) {
      console.log(`[NEAR GROUND] Y=${Math.round(this.player.y)}, VelY=${Math.round(body.velocity.y)}, Distance to ground=${Math.round(PLAYER_GROUND_Y - this.player.y)}`);
    }
    
    // Keep zombie absolutely stable on ground when grounded
    if (this.isGrounded) {
      // Lock to exact ground position
      this.player.y = PLAYER_GROUND_Y;
      // Zero all Y velocity
      this.player.setVelocityY(0);
      body.velocity.y = 0;
    }
  }
}