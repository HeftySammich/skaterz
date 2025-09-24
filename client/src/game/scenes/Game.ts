import Phaser from 'phaser';
import { ComboTracker, createComboSystem } from '../systems/combo';
import { setupControls } from '../systems/controls';
// All visual asset imports removed - clean slate for new assets

// Define ground level constants - skater runs higher than obstacles sit
const PLAYER_GROUND_Y = 850;  // Original skater position
const OBSTACLE_GROUND_Y = 956;  // Where obstacles sit on the street

export default class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private controls!: ReturnType<typeof setupControls>;
  private world!: any;
  private jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trickParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  // Enhanced jumping mechanics
  private isGrounded = true;
  private hasDoubleJumped = false;
  private trickActive = false;
  private hasUsedTrick = false; // Track if trick was used after jump
  private jumpCount = 0;
  private maxJumps = 2; // Regular jump + trick jump
  private jumpDebounce = false;
  // Stomp feature removed
  
  // Jump sprite - no animation, just a single image when jumping
  private jumpScale = 0.4;
  
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
  private enemyTimer: Phaser.Time.TimerEvent | null = null;
  
  // Enemy system
  private enemies!: Phaser.GameObjects.Group;
  private explosions!: Phaser.GameObjects.Group;
  private arrowIndicators!: Phaser.GameObjects.Group;
  private lastEnemyX = 0;
  private lastEnemyY = 0;
  private lastEnemySpawnTime = 0;
  private lastSandwichY = 0;
  private lastSandwichSpawnTime = 0;
  private lastEnergyDrinkY = 0;
  private lastEnergyDrinkSpawnTime = 0;
  private bounceVelocity = -1200; // Stronger bounce when landing on enemy
  private speedMultiplier = 1.0; // Speed multiplier that increases over time
  
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
  private sandwichesCollected = 0;
  
  // Energy drinks (stamina power-ups)
  private energyDrinks!: Phaser.GameObjects.Group;
  private cansCollected = 0;
  private enemiesDefeated = 0; // Track defeated enemies
  private energyDrinkTimer!: Phaser.Time.TimerEvent;
  private staminaBoostActive = false;
  private staminaBoostTimer?: Phaser.Time.TimerEvent;
  
  // Combo system
  private comboTracker!: ComboTracker;
  private wasGrounded = true;
  private comboUI: Phaser.GameObjects.Text | null = null;
  
  // Star collection system
  private stars = 0;
  private starIcon!: Phaser.GameObjects.Image;
  private starText!: Phaser.GameObjects.Text;
  private starPickups!: Phaser.Physics.Arcade.Group;
  private lastStarPatternX = 0;
  private sandwichTimer!: Phaser.Time.TimerEvent;
  
  // Life system
  private lives = 3; // Start with 3 lives
  private lifeIcon!: Phaser.GameObjects.Image;
  private lifeText!: Phaser.GameObjects.Text;
  private starLifeThreshold = 100; // Stars needed for extra life
  
  // Distance tracking for scoring
  private lastDistanceScoreMilestone = 0; // Track the last distance milestone for scoring
  
  // Background tiles for infinite scrolling
  private backgroundTiles: Phaser.GameObjects.Image[] = [];
  private backgroundWidth = 1408; // 1280 * 1.1
  private redSkyBg: Phaser.GameObjects.TileSprite | null = null; // Red sky background reference
  
  // Physics constants
  private readonly JUMP_VELOCITY = -1750;  // Slightly higher first jump
  private readonly TRICK_JUMP_VELOCITY = -1450; // Slightly higher double jump
  private readonly SWIPE_TRICK_VELOCITY = -850; // Small jump for swipe trick
  // Stomp velocity removed - stomp feature no longer exists
  private readonly GRAVITY = 4200; // Slightly floatier
  private readonly FLOAT_GRAVITY = 3200; // More float during tricks

  constructor() {
    super('Game');
  }

  create() {
    // Reset all game state variables
// console.log('[DEBUG GAME INIT] Starting game scene...');
    this.gameOverTriggered = false;
    this.health = 100; // Reset to full health
    this.stamina = 100; // Reset to full stamina
    this.invulnerable = false; // Reset invulnerability
    this.score = 0; // Reset score
    this.lastObstacleX = 0;
    this.lastEnemyX = 0;
    this.lastEnemyY = 0;
    this.lastEnemySpawnTime = 0;
    this.lastSandwichY = 0;
    this.lastSandwichSpawnTime = 0;
    this.lastEnergyDrinkY = 0;
    this.lastEnergyDrinkSpawnTime = 0;
    this.speedMultiplier = 1.0; // Reset speed multiplier
    this.isGrounded = true;
    this.jumpCount = 0;
    this.hasDoubleJumped = false;
    this.trickActive = false;
    this.hasUsedTrick = false;
    this.isJumpAnimating = false;
    this.backgroundTiles = []; // Clear background tiles
    this.stars = 0; // Reset stars
    this.lives = 3; // Reset lives
    this.sandwichesCollected = 0; // Reset sandwich counter
    this.cansCollected = 0; // Reset can counter
    this.enemiesDefeated = 0; // Reset enemies defeated counter
    this.staminaBoostActive = false; // Reset stamina boost
    this.lastDistanceScoreMilestone = 0; // Reset distance tracking
    
// console.log(`[DEBUG GAME INIT] Health: ${this.health}, Stamina: ${this.stamina}, Invulnerable: ${this.invulnerable}`);
    
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
    
    // Create energy drink system (stamina power-ups)
    this.createEnergyDrinkSystem();
    
    // Create star collection system
    this.createStarSystem();
    
    // Setup controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.controls = setupControls(this);
    
    // No ground collision - handle landing through position checks only to avoid invisible floors

    // Add collision detection for obstacles using overlap for guaranteed detection
    this.physics.add.overlap(this.player, this.obstacles, (player: any, obstacle: any) => {
// console.log(`[DEBUG COLLISION] Obstacle collision detected! Invulnerable: ${this.invulnerable}, GameOver: ${this.gameOverTriggered}, Health: ${this.health}`);
      if (!this.invulnerable && !this.gameOverTriggered && !this.staminaBoostActive) {
// console.log(`[DEBUG COLLISION] Taking damage from obstacle...`);
        this.takeDamage(25); // Take 25 damage from obstacles (but not if energy drink is active)
        this.obstacles.remove(obstacle); // Remove from physics group first
        obstacle.destroy(); // Then destroy the sprite
      } else {
// console.log(`[DEBUG COLLISION] Damage blocked - Invulnerable: ${this.invulnerable}, GameOver: ${this.gameOverTriggered}`);
      }
    }, undefined, this);
    
    // Add collision detection for enemies - stomp them from above
    this.physics.add.overlap(this.player, this.enemies, (player: any, enemy: any) => {
      const playerBody = player.body as Phaser.Physics.Arcade.Body;
// console.log(`[DEBUG COLLISION] Enemy collision detected! Invulnerable: ${this.invulnerable}, GameOver: ${this.gameOverTriggered}`);
      
      // Check if player is falling and above the enemy (stomping)
      if (playerBody.velocity.y > 0 && player.y < enemy.y - 20) {
// console.log(`[DEBUG COLLISION] Stomping enemy!`);
        this.stompEnemy(enemy);
        this.bouncePlayer();
      } else if (!this.invulnerable && !this.gameOverTriggered && !this.staminaBoostActive) {
        // Hit enemy from side or below - take damage (but not if energy drink is active)
// console.log(`[DEBUG COLLISION] Taking damage from enemy...`);
        this.takeDamage(35); // Take 35 damage from enemies
        this.enemies.remove(enemy); // Remove from physics group first
        enemy.destroy(); // Then destroy enemy
      } else {
// console.log(`[DEBUG COLLISION] Enemy damage blocked - Invulnerable: ${this.invulnerable}`);
      }
    }, undefined, this);
    
    // Add collision detection for sandwiches (health pickups)
    this.physics.add.overlap(this.player, this.sandwiches, (player: any, sandwich: any) => {
      this.collectSandwich(sandwich);
    }, undefined, this);
    
    // Add collision detection for energy drinks (stamina power-ups)
    this.physics.add.overlap(this.player, this.energyDrinks, (player: any, energyDrink: any) => {
      this.collectEnergyDrink(energyDrink);
    }, undefined, this);
    
// console.log('Collision detection set up between player and obstacles/enemies');

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
    
    // Initialize combo system
    this.comboTracker = createComboSystem(this);
    this.wasGrounded = true;
    this.setupComboUI();
    
    // Setup combo event listeners
    this.comboTracker.on('comboActivated', (data: any) => {
      console.log('[COMBO] Combo activated with multiplier:', data.multiplier);
      this.updateComboUI();
    });
    
    this.comboTracker.on('comboUpdated', (data: any) => {
      this.updateComboUI();
    });
    
    this.comboTracker.on('comboEnded', (data: any) => {
      console.log(`[COMBO] Combo ended! Stars earned: ${data.starsEarned}`);
      this.collectStars(data.starsEarned);
      this.showComboEndEffect(data);
      this.updateComboUI();
    });
    
    // Create tutorial instructions in the middle of the screen
    const tutorialContainer = this.add.container(320, 480);
    tutorialContainer.setScrollFactor(0);
    tutorialContainer.setDepth(110);
    
    // Background for tutorial
    const tutorialBg = this.add.graphics();
    tutorialBg.fillStyle(0x000000, 0.8);
    tutorialBg.fillRoundedRect(-320, -70, 640, 140, 10);
    tutorialContainer.add(tutorialBg);
    
    // Tutorial text
    const line1 = this.add.text(0, -35, 'TAP TO JUMP', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    const line2 = this.add.text(0, 0, 'TAP AGAIN FOR DOUBLE JUMP', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#00ffff'
    }).setOrigin(0.5);
    
    const line3 = this.add.text(0, 35, 'SWIPE UP FOR TRICK', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    tutorialContainer.add([line1, line2, line3]);
    
    // Fade out the tutorial after 5 seconds
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: tutorialContainer,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          tutorialContainer.destroy();
        }
      });
    });
    
    // Add position tracking every second for debugging
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
// console.log('=== POSITION TRACKER (1 SEC) ===');
// console.log(`Position: X=${Math.round(this.player.x)}, Y=${Math.round(this.player.y)}`);
// console.log(`Velocity: X=${Math.round(body.velocity.x)}, Y=${Math.round(body.velocity.y)}`);
// console.log(`State: Grounded=${this.isGrounded}, JumpCount=${this.jumpCount}`);
// console.log(`Physics: Gravity=${this.physics.world.gravity.y}, Touching.down=${body.touching.down}`);
// console.log(`Stamina: ${Math.round(this.stamina)}/${this.maxStamina}`);
// console.log('================================');
      },
      loop: true
    });
    
// console.log('Game scene loaded with enhanced zombie skater mechanics');
  }

  createSeamlessWorld() {
    // Create the seamless world directly
    const { createSeamlessWorld } = this.loadSeamlessWorld();
    return createSeamlessWorld(this);
  }

  loadSeamlessWorld() {
    // Inline the seamless world creation to avoid import issues
    
    const createSeamlessWorld = (scene: any) => {
      // Add red sky background first (behind everything else)
      // Use the actual texture size for proper repeating
      this.redSkyBg = scene.add.tileSprite(0, 0, 1920, 960, 'red_sky_bg')
        .setOrigin(0, 0)
        .setScrollFactor(0) // Fixed to viewport
        .setDepth(0) // Behind everything
        .setScale(0.5, 0.5); // Scale down to make it smaller
      
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
    
    // Jump frames now use the same scale as idle sprite
    
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
    
// console.log(`Player created at y=${this.player.y} with body size ${body.width}x${body.height}, ground segments at y=${PLAYER_GROUND_Y}`);
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
// console.log('[DEBUG ENEMY SYSTEM] Creating enemy system...');
    
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
    
    // Start spawning enemies with a longer delay to give player time (easier start)
    this.time.delayedCall(12000, () => {
// console.log('[DEBUG ENEMY SYSTEM] Starting enemy spawning...');
      this.enemyTimer = this.time.addEvent({
        delay: 5000, // Start with enemies spawning every 5 seconds
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true
      });
// console.log('[DEBUG ENEMY SYSTEM] Enemy timer created with delay: 5000ms');
    });
    
    // Update enemy spawn rate based on difficulty every 30 seconds
    this.time.addEvent({
      delay: 30000,
      callback: () => {
        const gameTime = this.time.now - this.gameStartTime;
        const difficulty = this.getDifficulty(gameTime);
        this.updateEnemySpawnRate(difficulty);
        
        // Increase speed slightly every 30 seconds
        this.speedMultiplier += 0.1; // 10% faster each 30 seconds
// console.log(`[SPEED INCREASE] Speed multiplier now ${this.speedMultiplier.toFixed(1)}x at difficulty ${difficulty}`);
      },
      callbackScope: this,
      loop: true
    });
    
// console.log('[DEBUG ENEMY SYSTEM] Enemy system initialized (spawning starts in 5s)');
  }
  
  spawnEnemy() {
    const gameTime = this.time.now - this.gameStartTime;
    const difficulty = this.getDifficulty(gameTime);
    
// console.log(`[DEBUG ENEMY SPAWN] Called at gameTime=${gameTime}ms`);
    
    // Don't spawn enemies in the first 10 seconds (easier start)
    if (gameTime < 10000) {
// console.log(`[DEBUG ENEMY SPAWN] Too early, waiting...`);
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
    
    // Check if this Y position conflicts with recent sandwich or energy drink spawn (reduced to 3 seconds)
    const timeSinceLastSandwich = (this.time.now - this.lastSandwichSpawnTime) / 1000;
    const timeSinceLastEnergyDrink = (this.time.now - this.lastEnergyDrinkSpawnTime) / 1000;
    
    if (timeSinceLastSandwich < 3 && Math.abs(enemyY - this.lastSandwichY) < 100) {
// console.log(`[DEBUG ENEMY SPAWN] Skipping - too close to recent sandwich at Y=${this.lastSandwichY}`);
      return;
    }
    
    if (timeSinceLastEnergyDrink < 3 && Math.abs(enemyY - this.lastEnergyDrinkY) < 100) {
// console.log(`[DEBUG ENEMY SPAWN] Skipping - too close to recent energy drink at Y=${this.lastEnergyDrinkY}`);
      return;
    }
    
    // Store enemy spawn info
    this.lastEnemyY = enemyY;
    this.lastEnemySpawnTime = this.time.now;
    
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
// console.log(`[DEBUG ARROW] Created arrow at viewport position (${arrow.x}, ${arrow.y})`);
// console.log(`[DEBUG ARROW] Enemy will spawn at world Y=${enemyY}`);
// console.log(`[DEBUG ARROW] Arrow properties: scale=${arrow.scale}, depth=${arrow.depth}, scrollFactor=${arrow.scrollFactorX},${arrow.scrollFactorY}`);
    
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
// console.log(`[DEBUG ENEMY] Created ${enemyType} at world position (${adjustedSpawnX}, ${enemyY})`);
// console.log(`[DEBUG ENEMY] Player position: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`);
// console.log(`[DEBUG ENEMY] Distance from player: ${adjustedSpawnX - this.player.x}px`);
// console.log(`[DEBUG ENEMY] Enemy properties: scale=${enemy.scale}, depth=${enemy.depth}, visible=${enemy.visible}, alpha=${enemy.alpha}`);
// console.log(`[DEBUG ENEMY] Enemy texture: ${enemy.texture.key}, frame: ${enemy.frame.name}`);
// console.log(`[DEBUG ENEMY] Enemy dimensions: width=${enemy.width}, height=${enemy.height}`);
// console.log(`[DEBUG ENEMY] Camera scrollX: ${this.cameras.main.scrollX}`);
      const screenX = adjustedSpawnX - this.cameras.main.scrollX;
// console.log(`[DEBUG ENEMY] Enemy screen position: ${Math.round(screenX)}px from left edge`);
      
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
      
// console.log(`[ENEMY] Spawned ${enemyType} at (${spawnX}, ${enemyY}) after warning`);
    });
    
// console.log(`[ARROW] Indicator shown at Y=${enemyY}, enemy will spawn at X=${spawnX} in 2 seconds`);
  }
  
  stompEnemy(enemy: Phaser.GameObjects.Sprite) {
    // Increment enemies defeated counter
    this.enemiesDefeated++;
    
    // Register enemy kill with combo system
    if (this.comboTracker) {
      this.comboTracker.registerEnemyKill(this.score, this.isGrounded);
    }
    
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
    
// console.log('Enemy stomped!');
  }
  
  bouncePlayer() {
    // Give player a strong, satisfying bounce
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setVelocityY(this.bounceVelocity);
    
    // Add a little forward boost for extra momentum
    const currentVelX = playerBody.velocity.x;
    playerBody.setVelocityX(Math.min(currentVelX + 80, 450));
    
    // Reset jump state - player gets ONE more jump after stomping
    this.isGrounded = false; // Important: player is now airborne after bounce
    this.jumpCount = 1; // Set to 1 so they can only do ONE more jump (double jump)
    this.hasDoubleJumped = false;
    this.hasUsedTrick = false; // Reset trick ability after stomping enemy
    // Show jump sprite since player is bouncing up
    this.player.setTexture('jump_static');
    this.player.setScale(this.jumpScale);
    
    // Restore more stamina as reward for successful stomp
    this.stamina = Math.min(this.maxStamina, this.stamina + 35);
    this.updateStaminaBar();
    
    // Camera shake removed for smoother gameplay
    
    // Create extra particles for impact
    this.jumpParticles.setPosition(this.player.x, this.player.y);
    this.jumpParticles.explode(15);
    
    // Award stars for stomping enemies (90% chance of 1 star, 10% chance of 10 stars)
    const starReward = Math.random() < 0.9 ? 1 : 10;
    this.collectStars(starReward);
    
    // Visual feedback for star collection
    const starBurst = this.add.image(this.player.x, this.player.y - 50, starReward === 1 ? 'star_single' : 'star_ten');
    starBurst.setScale(0.15);
    starBurst.setDepth(16);
    this.tweens.add({
      targets: starBurst,
      y: starBurst.y - 100,
      alpha: 0,
      scale: 0.15,
      duration: 800,
      onComplete: () => starBurst.destroy()
    });
    
// console.log('Player bounced high off enemy!');
  }

  createObstacleSystem() {
    // Create physics group for obstacles with gravity disabled
    this.obstacles = this.physics.add.group({ 
      allowGravity: false, 
      immovable: true 
    });

    // Create score display
    this.scoreText = this.add.text(50, 50, 'Score: 0', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.scoreText.setDepth(100);
    this.scoreText.setScrollFactor(0); // Keep fixed on screen
    
    // Create stamina bar (now below health)
    this.staminaBarBg = this.add.graphics();
    this.staminaBarBg.fillStyle(0x000000, 0.5);
    this.staminaBarBg.fillRect(50, 170, 204, 24);
    this.staminaBarBg.setDepth(100);
    this.staminaBarBg.setScrollFactor(0);
    
    this.staminaBar = this.add.graphics();
    this.staminaBar.setDepth(101);
    this.staminaBar.setScrollFactor(0);
    this.updateStaminaBar();
    
    // Create health bar (now above stamina)
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(50, 110, 204, 24);
    this.healthBarBg.setDepth(100);
    this.healthBarBg.setScrollFactor(0);
    
    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(101);
    this.healthBar.setScrollFactor(0);
    this.updateHealthBar();
    
    // Add health label
    this.healthText = this.add.text(50, 88, 'HEALTH', {
      fontSize: '18px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(100).setScrollFactor(0);
    
    // Add stamina label (now below health)
    this.add.text(50, 148, 'STAMINA', {
      fontSize: '18px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(100).setScrollFactor(0)
    
    // Create life counter above star counter
    this.createLifeDisplay();
    
    // Create star counter UI further down to avoid overlap - positioned slightly more to the right
    this.starIcon = this.add.image(500, 145, 'star_counter_icon');
    this.starIcon.setScale(0.08); // Keep original size
    this.starIcon.setDepth(100);
    this.starIcon.setScrollFactor(0);
    
    this.starText = this.add.text(540, 145, '0', {
      fontSize: '22px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.starText.setDepth(100);
    this.starText.setScrollFactor(0);
    this.starText.setOrigin(0, 0.5);

    // Start spawning obstacles
// console.log('Setting up obstacle spawning timer');
    this.obstacleTimer = this.time.addEvent({
      delay: 2000, // Start after 2 seconds
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
    
// console.log('Obstacle system initialized');
  }

  spawnObstacle() {
    const gameTime = this.time.now - this.gameStartTime;
    const difficulty = this.getDifficulty(gameTime);
    
// console.log(`Spawning obstacle - gameTime: ${gameTime}ms, difficulty: ${difficulty}`);
    
    // Add warning time for arrow indicator
    const warningTime = 2000; // 2 seconds warning for obstacles (same as enemies/pickups)
    const playerSpeed = 5.5; // pixels per frame
    const warningDistance = (playerSpeed * 60 * warningTime) / 1000;
    
    // Determine spawn distance based on difficulty - spawn closer so they're visible
    const minDistance = Math.max(400 - difficulty * 25, 150) + warningDistance; 
    const maxDistance = Math.max(800 - difficulty * 50, 300) + warningDistance;
    const spawnDistance = Phaser.Math.Between(minDistance, maxDistance);
    
    const spawnX = this.player.x + spawnDistance;
    
// console.log(`Spawn location: playerX=${this.player.x}, spawnX=${spawnX}, distance=${spawnDistance}`);
    
    // Skip if too close to last obstacle
    if (spawnX - this.lastObstacleX < minDistance) {
// console.log(`Skipping spawn - too close to last obstacle`);
      return;
    }
    
    this.lastObstacleX = spawnX;
    
    // Choose obstacle type based on difficulty
    const obstacleType = this.chooseObstacleType(difficulty);
    
// console.log(`Creating obstacle: ${obstacleType} at x=${spawnX}`);
    
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
    
// console.log(`[DEBUG ARROW] Created arrow for obstacle at viewport Y=${arrow.y}`);
    
    // Spawn obstacle after warning delay
    this.time.delayedCall(warningTime, () => {
      // Remove arrow
      arrow.destroy();
      
      // Recalculate spawn position based on current player position
      // The obstacle should appear just off-screen when the delay ends
      const adjustedSpawnX = this.player.x + 700; // Spawn just ahead of visible area
      
// console.log(`[DEBUG OBSTACLE] Spawning at adjusted position: ${adjustedSpawnX} (was ${spawnX})`);
      
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
    // Difficulty increases every 30 seconds, maxes at level 10
    const level = Math.min(Math.floor(gameTime / 30000), 10);
// console.log(`[DIFFICULTY] Level ${level} at ${Math.floor(gameTime/1000)}s`);
    return level;
  }

  chooseObstacleType(difficulty: number): string {
    // Pattern-based obstacle selection for better gameplay flow
    const patterns = [
      // Level 0-1: Easy obstacles only
      ['obstacle_cone', 'obstacle_trash'],
      // Level 2-3: Add crashes
      ['obstacle_cone', 'obstacle_trash', 'obstacle_crash'],
      // Level 4-5: Add zombies for variety
      ['obstacle_trash', 'obstacle_crash', 'obstacle_zombie'],
      // Level 6-7: Mix of harder obstacles
      ['obstacle_crash', 'obstacle_zombie', 'obstacle_skull'],
      // Level 8+: All obstacles with focus on danger
      this.obstacleTypes
    ];
    
    // Select pattern based on difficulty level
    const patternIndex = Math.min(Math.floor(difficulty / 2), patterns.length - 1);
    const availableTypes = patterns[patternIndex];
    
    // Add some structure to spawning - not pure random
    if (difficulty >= 3 && Math.random() < 0.3) {
      // 30% chance to spawn harder obstacle at higher difficulties
      const harderTypes = availableTypes.filter(type => 
        type.includes('zombie') || type.includes('skull') || type.includes('crash')
      );
      if (harderTypes.length > 0) {
        return Phaser.Utils.Array.GetRandom(harderTypes);
      }
    }
    
    return Phaser.Utils.Array.GetRandom(availableTypes);
  }

  createSingleObstacle(x: number, type: string) {
    // First check if the texture exists
    if (!this.textures.exists(type)) {
      console.error(`Texture ${type} does not exist!`);
      return;
    }
    
    // Create obstacle through the physics group - this is the fix!
    const obstacle = this.obstacles.create(x, OBSTACLE_GROUND_Y, type) as Phaser.Physics.Arcade.Sprite;
    // Make zombie obstacle slightly bigger than others
    const scale = type === 'obstacle_zombie' ? 0.17 : 0.15;
    obstacle.setScale(scale);
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
    
// console.log(`Created ground obstacle: ${type} at (${x}, ${OBSTACLE_GROUND_Y}) sitting on ground`);
// console.log(`Total obstacles: ${this.obstacles.children.size}`);
  }

  spawnObstaclePattern(x: number, type: string) {
    // Create obstacle patterns for higher difficulty
    const patternType = Phaser.Math.Between(1, 3);
    
// console.log(`[DEBUG OBSTACLE] Creating pattern type ${patternType} at x=${x}`);
    
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
    
    // Create new timer with adjusted delay - start easier and gradually increase
    const baseDelay = 4500; // Start easier with 4.5 seconds
    const difficultyReduction = difficulty * 250; // Increase rate more gradually
    const newDelay = Math.max(baseDelay - difficultyReduction, 1200); // Min 1.2 seconds (not as intense)
    
    this.obstacleTimer = this.time.addEvent({
      delay: newDelay,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }
  
  updateEnemySpawnRate(difficulty: number) {
    // Update enemy spawn rate based on difficulty
    if (this.enemyTimer) {
      this.enemyTimer.remove();
    }
    
    // Start with 5 second delay, reduce by 300ms per difficulty level
    const baseDelay = 5000;
    const difficultyReduction = difficulty * 300;
    const newDelay = Math.max(baseDelay - difficultyReduction, 2000); // Min 2 seconds
    
    this.enemyTimer = this.time.addEvent({
      delay: newDelay,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });
    
// console.log(`[DEBUG ENEMY SYSTEM] Updated enemy spawn rate to ${newDelay}ms for difficulty ${difficulty}`);
  }

  gameOver() {
    const survivalTime = this.time.now - this.gameStartTime;
// console.log(`[DEBUG GAME OVER] Final Score: ${this.score}, Survival Time: ${survivalTime}ms`);
// console.log(`[DEBUG GAME OVER] Health at death: ${this.health}, Lives remaining: ${this.lives}`);
    
    // Check if player has lives left
    if (this.lives > 0) {
      // Use a life and respawn
      this.lives--;
      this.updateLifeDisplay();
      this.respawnPlayer();
// console.log(`[RESPAWN] Using life, ${this.lives} lives remaining`);
    } else {
      // No lives left - actual game over
// console.log('[GAME OVER] No lives remaining - ending game');
      
      // Stop all timers to prevent them from running after game over
      if (this.obstacleTimer) this.obstacleTimer.remove();
      if (this.sandwichTimer) this.sandwichTimer.remove();
      if (this.enemyTimer) this.enemyTimer.remove();
      
      // Transition to GameOver scene with score, time, and collectibles
      this.scene.start('GameOver', { 
        score: this.score, 
        time: survivalTime,
        sandwiches: this.sandwichesCollected,
        cans: this.cansCollected,
        stars: this.stars, // Add stars collected
        enemies: this.enemiesDefeated // Add enemies defeated
      });
    }
  }

  // calculateJumpFrameScales removed - all frames now use same scale

  // No animation needed - just show jump sprite immediately

  handleLanding() {
    this.isGrounded = true;
    this.hasDoubleJumped = false;
    this.trickActive = false;
    this.hasUsedTrick = false; // Reset trick when landing
    this.jumpCount = 0;
    // Stomp feature removed
    
    // Return to normal gravity and ALWAYS go back to idle sprite when landing
    this.physics.world.gravity.y = this.GRAVITY;
    console.log('[DEBUG] handleLanding() - Setting back to idle sprite');
    this.player.setTexture('skater_idle'); // This is when we return to idle
    this.player.setScale(0.4); // Ensure consistent scaling
    
    // Clear ALL vertical velocity to prevent bouncing
    this.player.setVelocityY(0);
    
    // Ensure player is exactly at ground level
    this.player.y = PLAYER_GROUND_Y;
    
// console.log('Player landed');
  }

  performJump() {
// console.log(`Jump attempt: grounded=${this.isGrounded}, jumpCount=${this.jumpCount}, hasDoubleJumped=${this.hasDoubleJumped}, stamina=${this.stamina}`);
    
    // Allow jump if grounded OR if we have reset jump count (from enemy stomp)
    if ((this.isGrounded || this.jumpCount === 0) && this.stamina >= this.staminaCost && !this.hasDoubleJumped) {
      // First jump - clear state and jump
      this.player.setVelocityY(this.JUMP_VELOCITY);
      // Show jump sprite - it stays until landing
      console.log('[DEBUG] Setting jump sprite for first jump');
      this.player.setTexture('jump_static');
      this.player.setScale(this.jumpScale);
      this.isGrounded = false;
      this.jumpCount = 1;
      this.hasDoubleJumped = false;
      
      // Consume stamina (unless boost is active)
      if (!this.staminaBoostActive) {
        this.stamina = Math.max(0, this.stamina - this.staminaCost);
      }
      this.updateStaminaBar();
      
      // Trigger jump particles
      this.dustParticles.setPosition(this.player.x, this.player.y + 48);
      this.dustParticles.explode(3);
      this.jumpParticles.setPosition(this.player.x, this.player.y);
      this.jumpParticles.explode(5);
      
// console.log('First jump performed');
    } else if (this.jumpCount === 1 && !this.hasDoubleJumped && this.stamina >= this.staminaCost) {
      // Second jump - trick jump (requires stamina)
      this.player.setVelocityY(this.TRICK_JUMP_VELOCITY);
      // Keep jump sprite for double jump
      console.log('[DEBUG] Setting jump sprite for double jump');
      this.player.setTexture('jump_static');
      this.player.setScale(this.jumpScale);
      this.hasDoubleJumped = true;
      this.trickActive = true;
      this.jumpCount = 2;
      
      // Consume stamina (unless boost is active)
      if (!this.staminaBoostActive) {
        this.stamina = Math.max(0, this.stamina - this.staminaCost);
      }
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
      
// console.log('Double jump performed');
    } else {
      if (this.stamina < this.staminaCost) {
// console.log('Jump blocked - not enough stamina');
      } else {
// console.log('Jump blocked - already used both jumps');
      }
    }
  }
  
  performTrick() {
// console.log(`Trick attempt: grounded=${this.isGrounded}, jumpCount=${this.jumpCount}, hasDoubleJumped=${this.hasDoubleJumped}, hasUsedTrick=${this.hasUsedTrick}, stamina=${this.stamina}`);
    
    // Can perform trick if not on ground, hasn't used trick yet, and has stamina
    if (!this.isGrounded && !this.hasUsedTrick && this.stamina >= 15) {
      // Apply small upward boost
      this.player.setVelocityY(this.SWIPE_TRICK_VELOCITY);
      
      // ISSUE: This changes texture to trick sprite while airborne!
      console.log('[DEBUG] performTrick() - Setting to trick texture (this might be the problem!)');
      this.player.setTexture('skater_trick');
      this.trickActive = true;
      
      // Register trick with combo system
      if (this.comboTracker) {
        this.comboTracker.registerTrick(this.score, this.isGrounded);
      }
      this.hasUsedTrick = true; // Mark trick as used
      
      // Consume less stamina for tricks (unless boost is active)
      if (!this.staminaBoostActive) {
        this.stamina = Math.max(0, this.stamina - 15);
      }
      this.updateStaminaBar();
      
      // Add score for performing trick
      this.score += 10;
      this.scoreText.setText('Score: ' + this.score);
      
      // Trigger golden trick particles
      this.trickParticles.setPosition(this.player.x, this.player.y);
      this.trickParticles.start();
      
      // Slightly reduce gravity for a moment
      this.physics.world.gravity.y = this.FLOAT_GRAVITY;
      
      // Return to normal gravity after trick
      this.time.delayedCall(400, () => {
        this.physics.world.gravity.y = this.GRAVITY;
        this.trickActive = false;
        this.trickParticles.stop();
        // Check if we should restore jump sprite if still airborne
        if (!this.isGrounded) {
          console.log('[DEBUG] Trick ended but still airborne - restoring jump sprite');
          this.player.setTexture('jump_static');
          this.player.setScale(this.jumpScale);
        }
      });
      
// console.log('Swipe trick performed!');
    } else {
      if (this.isGrounded) {
// console.log('Trick blocked - must be in air');
      } else if (this.hasUsedTrick) {
// console.log('Trick blocked - already used trick this jump');
      } else if (this.stamina < 15) {
// console.log('Trick blocked - not enough stamina');
      }
    }
  }
  
  // performStomp removed - stomp feature no longer exists
  
  updateStaminaBar() {
    this.staminaBar.clear();
    
    let color = 0x00ff00;  // Default green
    let flashAlpha = 1;
    
    // If stamina boost is active, flash between neon blue and magenta
    if (this.staminaBoostActive) {
      // Use time to determine which color to show
      const time = this.time.now;
      const flashSpeed = 200; // Flash every 200ms
      const isBlue = Math.floor(time / flashSpeed) % 2 === 0;
      color = isBlue ? 0x00ffff : 0xff00ff; // Neon blue or magenta
      this.stamina = this.maxStamina; // Keep stamina at max during boost
      
      // Also make the skater flash the same colors as the power up bar
      if (!this.invulnerable) {
        this.player.setTint(color);
      }
    } else {
      // Normal color based on stamina level
      if (this.stamina < 33.33) {
        color = 0xff0000;  // Red
      } else if (this.stamina < 66.66) {
        color = 0xffaa00;  // Orange
      }
      
      // Clear skater color effect when not boosting (and not taking damage)
      if (!this.invulnerable) {
        this.player.clearTint();
      }
    }
    
    // Draw stamina bar (now at y=172)
    this.staminaBar.fillStyle(color, flashAlpha);
    const barWidth = (this.stamina / this.maxStamina) * 200;
    this.staminaBar.fillRect(52, 172, barWidth, 20);
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
    
    // Draw health bar (now at y=112)
    this.healthBar.fillStyle(color, 1);
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.fillRect(52, 112, 200 * healthPercent, 20);
  }
  
  takeDamage(amount: number) {
// console.log(`[DEBUG DAMAGE] takeDamage called with amount: ${amount}, Current health: ${this.health}, Invulnerable: ${this.invulnerable}`);
    if (this.invulnerable) {
// console.log(`[DEBUG DAMAGE] Damage blocked - player is invulnerable`);
      return;
    }
    
    const newHealth = Math.max(0, this.health - amount);
// console.log(`[DEBUG DAMAGE] Taking ${amount} damage: ${this.health} -> ${newHealth}`);
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
    
    // Start spawning sandwiches much less frequently
    this.sandwichTimer = this.time.addEvent({
      delay: 20000, // Spawn every 20 seconds (much rarer)
      callback: this.spawnSandwich,
      callbackScope: this,
      loop: true
    });
    
    // Spawn first sandwich after 15 seconds
    this.time.delayedCall(15000, () => {
      this.spawnSandwich();
    });
  }
  
  spawnSandwich() {
    // Calculate initial spawn distance
    const spawnDistance = Phaser.Math.Between(800, 1200);
    const spawnY = Phaser.Math.Between(400, 600); // Float in the sky
    
    // Check if this Y position conflicts with recent enemy or energy drink spawn (reduced to 3 seconds)
    const timeSinceLastEnemy = (this.time.now - this.lastEnemySpawnTime) / 1000;
    const timeSinceLastEnergyDrink = (this.time.now - this.lastEnergyDrinkSpawnTime) / 1000;
    
    if (timeSinceLastEnemy < 3 && Math.abs(spawnY - this.lastEnemyY) < 100) {
// console.log(`[DEBUG SANDWICH SPAWN] Skipping - too close to recent enemy at Y=${this.lastEnemyY}`);
      return;
    }
    
    if (timeSinceLastEnergyDrink < 3 && Math.abs(spawnY - this.lastEnergyDrinkY) < 100) {
// console.log(`[DEBUG SANDWICH SPAWN] Skipping - too close to recent energy drink at Y=${this.lastEnergyDrinkY}`);
      return;
    }
    
    // Store sandwich spawn info
    this.lastSandwichY = spawnY;
    this.lastSandwichSpawnTime = this.time.now;
    
    // Create arrow warning indicator for sandwich using custom sandwich arrow
    // Move arrow slightly left (from 590 to 580)
    const arrow = this.arrowIndicators.create(580, spawnY, 'sandwich_arrow') as Phaser.GameObjects.Sprite;
    arrow.setScale(0.15);
    arrow.setDepth(102); // Above UI
    arrow.setScrollFactor(0); // Keep fixed on screen
    
    // Flash the arrow for visibility
    this.tweens.add({
      targets: arrow,
      alpha: { from: 1, to: 0.5 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });
    
// console.log(`[DEBUG SANDWICH] Arrow indicator shown at Y=${spawnY}, sandwich will spawn in 2 seconds`);
    
    // Spawn sandwich after 2 second warning
    this.time.delayedCall(2000, () => {
      arrow.destroy();
      
      // Recalculate spawn position based on current player position
      // Account for the 2 second delay - player moves at 380 pixels/second
      const adjustedSpawnX = this.player.x + spawnDistance;
      
      const sandwich = this.sandwiches.create(adjustedSpawnX, spawnY, 'sandwich');
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
      
// console.log(`Sandwich spawned at (${adjustedSpawnX}, ${spawnY}) - player at ${this.player.x}`);  
    });
  }
  
  createEnergyDrinkSystem() {
    // Create physics group for energy drinks
    this.energyDrinks = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });
    
    // Random energy drink spawning with minimum 30 second cooldown
    // Check every 5 seconds if we should spawn
    this.energyDrinkTimer = this.time.addEvent({
      delay: 5000, // Check every 5 seconds
      callback: () => {
        // Only try to spawn if 30+ seconds have passed and random chance
        const timeSinceLastCan = (this.time.now - this.lastEnergyDrinkSpawnTime) / 1000;
        if (timeSinceLastCan >= 30 && Math.random() < 0.3) { // 30% chance each check after cooldown
          this.spawnEnergyDrink();
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // First potential spawn after 35-45 seconds
    this.time.delayedCall(Phaser.Math.Between(35000, 45000), () => {
      this.spawnEnergyDrink();
    });
  }
  
  spawnEnergyDrink() {
    // Double-check cooldown (in case called directly)
    const timeSinceLastCan = (this.time.now - this.lastEnergyDrinkSpawnTime) / 1000;
    if (timeSinceLastCan < 30) {
// console.log(`[DEBUG ENERGY DRINK] Cooldown active - ${Math.floor(30 - timeSinceLastCan)}s remaining`);
      return;
    }
    
    // Calculate initial spawn distance
    const spawnDistance = Phaser.Math.Between(900, 1300);
    const spawnY = Phaser.Math.Between(450, 650); // Float in the sky
    
    // Check if this Y position conflicts with recent spawns (sandwich or enemy) within 3 seconds (reduced from 5)
    const timeSinceLastSandwich = (this.time.now - this.lastSandwichSpawnTime) / 1000;
    const timeSinceLastEnemy = (this.time.now - this.lastEnemySpawnTime) / 1000;
    
    if (timeSinceLastSandwich < 3 && Math.abs(spawnY - this.lastSandwichY) < 100) {
// console.log(`[DEBUG ENERGY DRINK] Skipping - too close to recent sandwich at Y=${this.lastSandwichY}`);
      return;
    }
    
    if (timeSinceLastEnemy < 3 && Math.abs(spawnY - this.lastEnemyY) < 100) {
// console.log(`[DEBUG ENERGY DRINK] Skipping - too close to recent enemy at Y=${this.lastEnemyY}`);
      return;
    }
    
    // Store energy drink spawn info
    this.lastEnergyDrinkY = spawnY;
    this.lastEnergyDrinkSpawnTime = this.time.now;
    
    // Create arrow warning indicator for energy drink
    const arrow = this.arrowIndicators.create(580, spawnY, 'energy_warning') as Phaser.GameObjects.Sprite;
    arrow.setScale(0.15);
    arrow.setDepth(102); // Above UI
    arrow.setScrollFactor(0); // Keep fixed on screen
    
    // Flash the arrow for visibility
    this.tweens.add({
      targets: arrow,
      alpha: { from: 1, to: 0.5 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });
    
// console.log(`[DEBUG ENERGY DRINK] Arrow indicator shown at Y=${spawnY}, drink will spawn in 2 seconds`);
    
    // Spawn energy drink after 2 second warning
    this.time.delayedCall(2000, () => {
      arrow.destroy();
      
      // Recalculate spawn position to match obstacle timing - spawn just off-screen
      const adjustedSpawnX = this.player.x + 700; // Same as obstacles
      
      const energyDrink = this.energyDrinks.create(adjustedSpawnX, spawnY, 'energy_drink');
      energyDrink.setScale(0.12); // Scale down the energy drink
      energyDrink.setDepth(10);
      
      // Add floating animation with shimmer effect
      this.tweens.add({
        targets: energyDrink,
        y: spawnY - 20,
        duration: 1500,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
      
      // Add shimmer effect
      this.tweens.add({
        targets: energyDrink,
        alpha: { from: 0.8, to: 1 },
        duration: 300,
        yoyo: true,
        repeat: -1
      });
      
// console.log(`Energy drink spawned at (${adjustedSpawnX}, ${spawnY}) - player at ${this.player.x}`);
    });
  }
  
  collectEnergyDrink(energyDrink: any) {
    // Increment can counter
    this.cansCollected++;
    
    // Show MAXIMUM! text at screen center - NO VFX, just appear and slide
    const maximumText = this.add.image(320, 480, 'maximum_text');
    maximumText.setScale(0.45); // Slightly smaller
    maximumText.setDepth(150);
    maximumText.setScrollFactor(0); // Keep fixed on screen
    
    // Keep on screen for 1.5 seconds, then slide left EXTREMELY fast
    this.time.delayedCall(1500, () => {
      // Slide to the left extremely fast
      this.tweens.add({
        targets: maximumText,
        x: -300,
        duration: 100, // VERY fast - only 100ms
        ease: 'Power3.easeIn',
        onComplete: () => {
          maximumText.destroy();
        }
      });
    });
    
    // Activate stamina boost
    this.staminaBoostActive = true;
    this.stamina = this.maxStamina; // Fill stamina to max
    
    // Cancel any existing boost timer
    if (this.staminaBoostTimer) {
      this.staminaBoostTimer.remove();
    }
    
    // Set timer to deactivate boost after 10 seconds
    this.staminaBoostTimer = this.time.delayedCall(10000, () => {
      this.staminaBoostActive = false;
      // Clear the skater color effect when boost expires
      if (!this.invulnerable) {
        this.player.clearTint();
      }
// console.log('[ENERGY DRINK] Stamina boost expired');
    });
    
    // Add score
    this.score += 50;
    this.scoreText.setText('Score: ' + this.score);
    
    // Play particle effect at drink location
    this.jumpParticles.setPosition(energyDrink.x, energyDrink.y);
    this.jumpParticles.explode(25);
    
    // Remove energy drink
    energyDrink.destroy();
    
// console.log(`Energy drink collected! Stamina boost active for 10 seconds, Total: ${this.cansCollected}`);
  }
  
  collectSandwich(sandwich: any) {
    // Increment sandwich counter
    this.sandwichesCollected++;
    
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
    
// console.log(`Sandwich collected! Health: ${this.health}/${this.maxHealth}, Total: ${this.sandwichesCollected}`);
  }
  
  createStarSystem() {
    // Create physics group for star pickups
    this.starPickups = this.physics.add.group({
      allowGravity: false
    });
    
    // Start spawning star patterns
    this.time.addEvent({
      delay: 30000, // Spawn star patterns every 30 seconds  
      callback: this.spawnStarPattern,
      callbackScope: this,
      loop: true
    });
    
    // First star pattern after 20 seconds
    this.time.delayedCall(20000, () => {
      this.spawnStarPattern();
    });
    
    // Add collision for star collection
    this.physics.add.overlap(this.player, this.starPickups, (player: any, star: any) => {
      const value = (star as any).value || 1;
      this.collectStars(value);
      star.destroy();
    }, undefined, this);
  }
  
  spawnStarPattern() {
    const baseX = this.player.x + Phaser.Math.Between(800, 1200);
    const baseY = Phaser.Math.Between(600, 750); // Can be ground or air level
    
    // Spawn a line of 3-5 single stars
    const starCount = Phaser.Math.Between(3, 5);
    for (let i = 0; i < starCount; i++) {
      const star = this.starPickups.create(baseX + (i * 80), baseY, 'star_single');
      star.setScale(0.12);
      star.setDepth(9);
      (star as any).value = 1;
      
      // Add subtle floating animation
      this.tweens.add({
        targets: star,
        y: star.y - 10,
        duration: 1000,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
    
    // 30% chance to add a 10-star at the end of the line
    if (Math.random() < 0.3) {
      const bigStar = this.starPickups.create(baseX + (starCount * 80), baseY, 'star_ten');
      bigStar.setScale(0.15);
      bigStar.setDepth(9);
      (bigStar as any).value = 10;
      
      // Add more prominent animation for the big star
      this.tweens.add({
        targets: bigStar,
        y: bigStar.y - 15,
        scale: 0.12,
        duration: 800,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
    
// console.log(`Star pattern spawned at (${baseX}, ${baseY})`);
  }
  
  collectStars(amount: number) {
    this.stars += amount;
    this.starText.setText(this.stars.toString());
    
    // Check if player earned an extra life (every 100 stars)
    if (this.stars >= this.starLifeThreshold) {
      this.stars -= this.starLifeThreshold; // Reset star counter
      this.starText.setText(this.stars.toString());
      this.lives++; // Add extra life
      this.updateLifeDisplay();
      
      // Show "1UP" message
      const oneUpText = this.add.text(this.player.x, this.player.y - 100, '1UP!', {
        fontSize: '32px',
        fontFamily: '"Press Start 2P", monospace',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 4
      });
      oneUpText.setDepth(20);
      
      this.tweens.add({
        targets: oneUpText,
        y: oneUpText.y - 80,
        alpha: 0,
        duration: 1500,
        onComplete: () => oneUpText.destroy()
      });
      
// console.log('[EXTRA LIFE] Earned 1UP! Lives: ' + this.lives);
    }
    
    // Add a shine effect to the star counter instead of scaling
    const shineEffect = this.add.graphics();
    shineEffect.x = this.starIcon.x;
    shineEffect.y = this.starIcon.y;
    shineEffect.setDepth(101);
    shineEffect.setScrollFactor(0);
    
    // Create a white shine overlay
    shineEffect.fillStyle(0xffffff, 0.7);
    shineEffect.fillCircle(0, 0, 25);
    
    // Animate the shine effect
    this.tweens.add({
      targets: shineEffect,
      alpha: { from: 0.7, to: 0 },
      scale: { from: 0.5, to: 1.5 },
      duration: 500,
      ease: 'Cubic.out',
      onComplete: () => {
        shineEffect.destroy();
      }
    });
    
    // Also add a subtle glow to the text
    this.tweens.add({
      targets: this.starText,
      alpha: { from: 1, to: 0.5 },
      duration: 200,
      yoyo: true,
      ease: 'Sine.inOut'
    });
    
// console.log(`Collected ${amount} stars! Total: ${this.stars}`);
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

  createLifeDisplay() {
    // Create life icon and text - positioned slightly more to the right
    this.lifeIcon = this.add.image(500, 62, 'life_icon');
    this.lifeIcon.setScale(0.12); // Keep larger size
    this.lifeIcon.setDepth(102); // Higher depth than star (100)
    this.lifeIcon.setScrollFactor(0);
    
    this.lifeText = this.add.text(540, 62, this.lives.toString(), {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.lifeText.setOrigin(0, 0.5);
    this.lifeText.setDepth(100);
    this.lifeText.setScrollFactor(0);
  }
  
  updateLifeDisplay() {
    // Update the life counter text
    if (this.lifeText) {
      this.lifeText.setText(this.lives.toString());
    }
  }
  
  respawnPlayer() {
    // Reset player health and position
    this.health = 100;
    this.updateHealthBar();
    this.stamina = 100;
    this.updateStaminaBar();
    
    // Reset player state
    this.gameOverTriggered = false;
    this.invulnerable = true; // Give temporary invulnerability after respawn
    this.player.clearTint();
    this.player.y = PLAYER_GROUND_Y;
    this.isGrounded = true;
    this.jumpCount = 0;
    this.hasDoubleJumped = false;
    this.trickActive = false;
    
    // Clear nearby obstacles for safe respawn
    const clearRadius = 800;
    this.obstacles.children.entries.forEach((obstacle: any) => {
      if (Math.abs(obstacle.x - this.player.x) < clearRadius) {
        obstacle.destroy();
      }
    });
    
    // Clear nearby enemies
    this.enemies.children.entries.forEach((enemy: any) => {
      if (Math.abs(enemy.x - this.player.x) < clearRadius) {
        enemy.destroy();
      }
    });
    
    // Flash effect to indicate respawn
    let flashCount = 0;
    const flashTimer = this.time.addEvent({
      delay: 150,
      callback: () => {
        flashCount++;
        if (flashCount % 2 === 0) {
          this.player.setAlpha(1);
        } else {
          this.player.setAlpha(0.5);
        }
        
        if (flashCount >= 12) {
          this.player.setAlpha(1);
          this.invulnerable = false;
          flashTimer.remove();
        }
      },
      loop: true
    });
    
// console.log('[RESPAWN] Player respawned with full health');
  }

  shutdown() {
    // Clean up all arrow indicators when scene shuts down
    if (this.arrowIndicators) {
      this.arrowIndicators.clear(true, true); // Remove and destroy all arrows
    }
    
    // Clean up any remaining arrows attached to enemies
    if (this.enemies) {
      this.enemies.children.entries.forEach((enemy: any) => {
        if (enemy.arrow) {
          enemy.arrow.destroy();
          enemy.arrow = null;
        }
      });
    }
    
    // Clean up any remaining arrows attached to obstacles
    if (this.obstacles) {
      this.obstacles.children.entries.forEach((obstacle: any) => {
        if (obstacle.arrow) {
          obstacle.arrow.destroy();
          obstacle.arrow = null;
        }
      });
    }
    
    // Clean up any remaining arrows attached to sandwiches or energy drinks
    if (this.sandwiches) {
      this.sandwiches.children.entries.forEach((item: any) => {
        if (item.arrow) {
          item.arrow.destroy();
          item.arrow = null;
        }
      });
    }
    
    if (this.energyDrinks) {
      this.energyDrinks.children.entries.forEach((item: any) => {
        if (item.arrow) {
          item.arrow.destroy();
          item.arrow = null;
        }
      });
    }
  }

  update() {
    // Get player body for velocity checks
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    
    // Update red sky background scrolling for parallax effect
    if (this.redSkyBg) {
      // Scroll the tile position based on camera position for infinite repeating
      this.redSkyBg.tilePositionX = this.cameras.main.scrollX * 0.3; // Slower scrolling for parallax
    }
    
    // Manage infinite background scrolling
    this.updateBackgroundTiles();
    
    // Regenerate stamina slowly (unless boost is active)
    if (!this.staminaBoostActive && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
    }
    this.updateStaminaBar(); // Always update to handle flashing during boost
    
    // Force movement by directly updating position since velocity isn't working
    // Apply speed multiplier for progressive difficulty
    const baseSpeed = 6.3; // Base movement speed
    const currentSpeed = baseSpeed * this.speedMultiplier;
    this.player.x += currentSpeed; // Move with increasing speed over time
    
    // Still set velocity for physics calculations
    this.player.setVelocityX(380 * this.speedMultiplier);
    
    // Removed velocity logging for performance
    
    // Removed debug logging for performance
    
    // Handle jumping with simple state check
    if ((Phaser.Input.Keyboard.JustDown(this.cursors.space!) || 
         Phaser.Input.Keyboard.JustDown(this.cursors.up!)) || 
         this.controls.justTapped()) {
      this.performJump();
    }
    
    // Handle swipe-up for tricks
    if (this.controls.justSwipedUp()) {
      this.performTrick();
    }
    
    // Swipe down does nothing now - stomp feature removed
    
    // Update world scrolling for infinite background
    this.world.update(this.cameras.main.scrollX);
    
    // Update trick particles to follow player during tricks
    if (this.trickActive && this.trickParticles.emitting) {
      this.trickParticles.setPosition(this.player.x, this.player.y);
    }
    
    // Update score based on distance traveled (incremental)
    const currentDistanceMilestone = Math.floor((this.player.x - 320) / 100);
    if (currentDistanceMilestone > this.lastDistanceScoreMilestone) {
      // Add 10 points for each new milestone reached
      const milestonesGained = currentDistanceMilestone - this.lastDistanceScoreMilestone;
      this.score += (milestonesGained * 10);
      this.lastDistanceScoreMilestone = currentDistanceMilestone;
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
    
    // Clean up off-screen stars
    this.starPickups.children.entries.forEach((star: any) => {
      if (star.x < this.cameras.main.scrollX - 200) {
        this.starPickups.remove(star);
        star.destroy();
      }
    });
    
    // Clean up off-screen enemies and manage arrow indicators
    this.enemies.children.entries.forEach((enemy: any, index: number) => {
      // Removed enemy tracking debug for performance
      
      // Remove arrow when enemy is on screen (visible)
      if (enemy.arrow && enemy.x < this.player.x + 640) {
// console.log(`[DEBUG ARROW] Destroying arrow as enemy is on screen at X=${enemy.x}`);
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
// console.log('Player fell - restarting scene');
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
        // Set to exact ground position before overshooting
        this.player.y = PLAYER_GROUND_Y;
        this.handleLanding();
      }
    }
    
    // Track near-ground behavior for debugging
    if (!this.isGrounded && this.player.y > PLAYER_GROUND_Y - 50 && this.player.y < PLAYER_GROUND_Y + 10) {
// console.log(`[NEAR GROUND] Y=${Math.round(this.player.y)}, VelY=${Math.round(body.velocity.y)}, Distance to ground=${Math.round(PLAYER_GROUND_Y - this.player.y)}`);
    }
    
    // Keep zombie absolutely stable on ground when grounded
    if (this.isGrounded) {
      // Lock to exact ground position
      this.player.y = PLAYER_GROUND_Y;
      // Zero all Y velocity
      this.player.setVelocityY(0);
      body.velocity.y = 0;
    }
    
    // Update combo system with ground state
    if (this.comboTracker) {
      const starsEarned = this.comboTracker.updateAirState(this.score, this.wasGrounded, this.isGrounded);
      this.wasGrounded = this.isGrounded;
    }
  }
  
  setupComboUI() {
    // Create combo UI text (initially hidden) - positioned much lower and larger font
    this.comboUI = this.add.text(320, 300, '', {
      fontSize: '26px',
      color: '#ffff00',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this.comboUI.setVisible(false);
  }
  
  updateComboUI() {
    if (!this.comboUI || !this.comboTracker) return;
    
    const state = this.comboTracker.getComboState();
    
    if (state.status === 'inactive') {
      this.comboUI.setVisible(false);
    } else if (state.status === 'pending') {
      this.comboUI.setVisible(true);
      this.comboUI.setText(`${state.airEventCount}/3 EVENTS`);
      this.comboUI.setColor('#ffffff');
    } else if (state.status === 'active') {
      this.comboUI.setVisible(true);
      this.comboUI.setText(`COMBO x${state.multiplier}\nSCORE: ${state.comboScorePoints}`);
      this.comboUI.setColor('#00ff00');
    }
  }
  
  showComboEndEffect(data: any) {
    if (!data.starsEarned || data.starsEarned <= 0) return;
    
    // Show simple combo end effect with stars earned - no floating VFX
    const comboEndText = this.add.text(320, 360, `COMBO!\n+${data.starsEarned} STARS`, {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    
    // Show for 2.5 seconds then remove
    this.time.delayedCall(2500, () => {
      comboEndText.destroy();
    });
  }
}