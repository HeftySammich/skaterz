import Phaser from 'phaser';
import { setupControls } from '../systems/controls';
import { Score } from '../systems/score';
import { ObstacleManager } from '../systems/obstacles';
import { BitmapText } from '../utils/BitmapText';

export default class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private rails!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: ReturnType<typeof setupControls>;
  private score!: Score;
  private obstacleManager!: ObstacleManager;
  
  private isOnRail = false;
  private didTrickThisJump = false;
  private gameSpeed = 120;
  private lastRailX = 0;
  private comboMultiplier = 1;
  private comboTimer = 0;
  
  private scoreText!: BitmapText;
  private comboText!: BitmapText;
  private instructionsText!: BitmapText;

  constructor() {
    super('Game');
  }

  create() {
    // Initialize systems
    this.score = new Score();
    this.obstacleManager = new ObstacleManager(this);

    // Create parallax background
    this.createBackground();

    // Create ground
    this.createGround();

    // Create rails
    this.createRails();

    // Create player
    this.createPlayer();

    // Setup physics collisions
    this.setupCollisions();
    
    // Setup camera to follow player immediately
    this.cameras.main.startFollow(this.player, true, 0.05, 0);

    // Setup controls
    this.cursors = setupControls(this);

    // Create UI
    this.createUI();

    // Audio is optional for this demo

    console.log('Game scene created successfully');
  }

  createBackground() {
    // HD NYC apocalypse skyline background
    const skyline = this.add.tileSprite(0, 20, 480, 80, 'skyline');
    skyline.setOrigin(0, 0);
    skyline.setScrollFactor(0.2); // Parallax effect
  }

  createGround() {
    this.ground = this.physics.add.staticGroup();
    
    // Use NYC tiles for HD street
    const streetHeight = 64; // Bottom 64 pixels for HD street
    const streetStartY = 160 - streetHeight; // Start street at Y=96
    
    // Create multiple rows of HD street tiles (32x32) to fill the bottom
    for (let x = 0; x < 400; x += 32) {
      for (let y = streetStartY; y < 160; y += 32) {
        const tileIndex = Math.floor(Math.random() * 8); // Random tile from sheet
        const tile = this.ground.create(x, y, 'nyc_tiles');
        tile.setOrigin(0, 0);
        tile.refreshBody();
      }
    }
  }

  createRails() {
    this.rails = this.physics.add.staticGroup();
    this.lastRailX = 180;
    
    // Create initial rails
    this.createRail(this.lastRailX);
    this.createRail(this.lastRailX + 200);
  }

  createRail(x: number) {
    // Use HD rail asset
    const rail = this.add.image(x, 100, 'rail');
    rail.setOrigin(0.5, 0.5);
    this.physics.add.existing(rail, true);
    this.rails.add(rail as any);
    
    this.lastRailX = x;
  }

  createPlayer() {
    // Use the first animated frame as the sprite
    this.player = this.physics.add.sprite(40, 85, 'zombie_0');
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Adjust size for the new 96x96 HD sprite  
    this.player.body!.setSize(64, 80); // Larger hitbox for 96x96 sprite
    this.player.setScale(0.6); // Scale down for mobile-friendly size
    
    // Configure physics for smooth movement - cast to correct type
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setDrag(0); // No air resistance
    body.setMaxVelocity(200, 600); // Allow high horizontal speeds
    body.immovable = false;
    
    // Start skating animation
    this.player.play('skate');
    
    // Auto-run with immediate velocity
    this.player.setVelocityX(this.gameSpeed);
    this.player.setCollideWorldBounds(false);
    
    console.log('Player created with velocity:', this.gameSpeed);
  }

  setupCollisions() {
    // DISABLE GROUND COLLISION TEMPORARILY TO TEST MOVEMENT
    // this.physics.add.collider(this.player, this.ground, () => {
    //   if (this.didTrickThisJump && this.comboTimer > 0) {
    //     // Successful trick landing
    //     this.score.addTrick(50 * this.comboMultiplier);
    //     this.showTrickScore();
    //     this.didTrickThisJump = false;
    //   }
    // });

    // Rail overlap for grinding
    this.physics.add.overlap(this.player, this.rails, () => {
      if (this.cursors.holding()) {
        this.startGrinding();
      }
    });
  }

  createUI() {
    // Create pixel-perfect bitmap text for HD 2D crisp rendering
    this.scoreText = new BitmapText(this, 8, 8, 'SCORE: 0', 0xffffff);
    this.scoreText.setScrollFactor(0);

    this.comboText = new BitmapText(this, 8, 18, '', 0xffff00);
    this.comboText.setScrollFactor(0);

    // Use bitmap text for instructions for crisp HD 2D rendering
    this.instructionsText = new BitmapText(this, 60, 140, 'SPACE JUMP HOLD GRIND', 0xffffff);
    this.instructionsText.setScrollFactor(0);
  }

  startGrinding() {
    if (!this.isOnRail) {
      this.isOnRail = true;
      this.player.setVelocityY(0);
      this.player.setGravityY(0);
      
      // Position player on rail
      const rail = this.physics.world.bodies.entries.find(body => 
        this.rails.contains(body.gameObject) && 
        Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(), (body.gameObject as any).getBounds())
      );
      
      if (rail) {
        this.player.y = (rail.gameObject as any).y - 12;
      }

      // Play grind sound
      this.playSound('grind');
      
      // Start combo if not already active
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1;
      }
      this.comboTimer = 3000; // 3 seconds
    }
  }

  stopGrinding() {
    this.isOnRail = false;
    this.player.setGravityY(800);
  }

  showTrickScore() {
    const points = 50 * this.comboMultiplier;
    
    // Create crisp trick score popup
    const trickText = this.add.text(this.player.x, this.player.y - 60, `+${points}`, {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '14px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 0
    });
    
    trickText.setDepth(150);
    
    // Animate the popup
    this.tweens.add({
      targets: trickText,
      y: trickText.y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        trickText.destroy();
      }
    });
  }

  playSound(key: string) {
    // Audio playback is optional for this demo
    try {
      if (this.sound.get(key)) {
        this.sound.play(key, { volume: 0.5 });
      }
    } catch (e) {
      console.log('Audio not available:', key);
    }
  }

  gameOver() {
    console.log('Game Over! Final Score:', this.score.value);
    this.scene.start('GameOver', { score: this.score.value });
  }

  update(time: number, delta: number) {
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1;
      }
    }

    // Stop grinding if not holding
    if (this.isOnRail && !this.cursors.holding()) {
      this.stopGrinding();
    }

    // Handle jump/trick input
    if (this.cursors.justTapped()) {
      if (this.player.body!.blocked.down || this.isOnRail) {
        // Jump
        this.stopGrinding();
        this.player.setVelocityY(-280);
        this.playSound('jump');
        this.didTrickThisJump = false;
      } else if (!this.didTrickThisJump) {
        // Trick in air
        this.didTrickThisJump = true;
        this.comboMultiplier = Math.min(this.comboMultiplier + 1, 5);
        this.comboTimer = 3000;
        
        // Visual trick effect - use the trickspin animation
        this.player.play('trickspin');
        
        // Also add rotation tween for extra effect
        this.tweens.add({
          targets: this.player,
          angle: '+=360',
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            // Return to skating animation after trick
            this.player.play('skate');
          }
        });
        
        this.playSound('trick');
      }
    }

    // Force player to maintain horizontal velocity every frame
    if (this.player && this.player.body) {
      this.player.setVelocityX(this.gameSpeed);
      
      // Reduce debug spam - only log occasionally
      if (Math.floor(time) % 1000 === 0) {
        console.log('Player velocity X:', this.player.body!.velocity.x, 'Position X:', this.player.x, 'GameSpeed:', this.gameSpeed, 'Camera X:', this.cameras.main.scrollX);
      }
      
      // Debug velocity if player stops moving
      if (Math.abs(this.player.body!.velocity.x) < 10) {
        console.log('Player stopped! Position:', this.player.x, 'Velocity:', this.player.body!.velocity.x, 'GameSpeed:', this.gameSpeed);
        // Force restart movement
        this.player.setVelocityX(this.gameSpeed * 1.5);
      }
    }

    // Continuous scoring
    this.score.addDistance(this.gameSpeed * delta / 1000);
    
    if (this.isOnRail) {
      this.score.addGrindTick();
    }

    // Update world (ground, rails, obstacles)
    this.updateWorld();

    // Obstacles disabled for cleaner experience
    // this.obstacleManager.update(delta);

    // Increase difficulty over time
    this.gameSpeed += delta * 0.001;

    // Fail condition
    if (this.player.y > 180) {
      this.gameOver();
    }

    // Update UI
    this.updateUI();
  }

  updateWorld() {
    const cameraX = this.cameras.main.scrollX;
    
    // Extend ground - create full street blocks
    const rightmostGround = Math.max(...this.ground.children.entries.map(child => (child as any).x));
    if (rightmostGround < cameraX + 300) {
      const streetHeight = 50;
      const streetStartY = 160 - streetHeight;
      
      for (let x = rightmostGround + 32; x < cameraX + 400; x += 32) {
        for (let y = streetStartY; y < 160; y += 32) {
          const tile = this.ground.create(x, y, 'nyc_tiles');
          tile.setOrigin(0, 0);
          tile.refreshBody();
        }
      }
    }

    // Add new rails
    if (this.lastRailX < cameraX + 300) {
      const newRailX = this.lastRailX + Phaser.Math.Between(180, 250);
      this.createRail(newRailX);
    }

    // Remove old ground tiles and rails
    this.ground.children.entries.forEach(child => {
      if ((child as any).x < cameraX - 100) {
        child.destroy();
      }
    });

    this.rails.children.entries.forEach(child => {
      if ((child as any).x < cameraX - 100) {
        child.destroy();
      }
    });

    // Camera follows player horizontally only
    this.cameras.main.startFollow(this.player, true, 0.05, 0);
    this.cameras.main.setLerp(0.05, 0);
  }

  updateUI() {
    this.scoreText.setText(`SCORE: ${Math.floor(this.score.value)}`);
    
    if (this.comboMultiplier > 1) {
      this.comboText.setText(`COMBO ${this.comboMultiplier}`);
    } else {
      this.comboText.setText('');
    }
  }
}
