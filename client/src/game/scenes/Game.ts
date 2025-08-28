import Phaser from 'phaser';
import { setupControls } from '../systems/controls';
import { Score } from '../systems/score';
import { ObstacleManager } from '../systems/obstacles';

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
  
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private instructionsText!: Phaser.GameObjects.Text;

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

    // Setup controls
    this.cursors = setupControls(this);

    // Create UI
    this.createUI();

    // Audio is optional for this demo

    console.log('Game scene created successfully');
  }

  createBackground() {
    // Simple gradient background for GBA feel
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x90ee90, 0x90ee90);
    bg.fillRect(0, 0, 240, 160);
    bg.setScrollFactor(0);
  }

  createGround() {
    this.ground = this.physics.add.staticGroup();
    
    // Create initial ground tiles
    for (let x = 0; x < 400; x += 16) {
      const tile = this.ground.create(x, 140, 'tiles');
      tile.setOrigin(0, 0);
      tile.refreshBody();
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
    // Rail post
    const post = this.add.rectangle(x, 110, 4, 20, 0x666666);
    this.physics.add.existing(post, true);
    
    // Rail bar
    const rail = this.add.rectangle(x, 100, 48, 4, 0xcccccc);
    rail.setOrigin(0.5, 0.5);
    this.physics.add.existing(rail, true);
    this.rails.add(rail as any);
    
    this.lastRailX = x;
  }

  createPlayer() {
    this.player = this.physics.add.sprite(40, 100, 'zombie');
    this.player.setCollideWorldBounds(false); // Remove world bounds constraint
    this.player.setDepth(10);
    this.player.body!.setSize(12, 20); // Smaller hitbox for forgiving gameplay
    
    // Auto-run
    this.player.setVelocityX(this.gameSpeed);
  }

  setupCollisions() {
    // Ground collision - maintain horizontal velocity
    this.physics.add.collider(this.player, this.ground, () => {
      if (this.didTrickThisJump && this.comboTimer > 0) {
        // Successful trick landing
        this.score.addTrick(50 * this.comboMultiplier);
        this.showTrickScore();
        this.didTrickThisJump = false;
      }
      // Ensure horizontal movement continues after landing
      this.player.setVelocityX(this.gameSpeed);
    });

    // Rail overlap for grinding
    this.physics.add.overlap(this.player, this.rails, () => {
      if (this.cursors.holding()) {
        this.startGrinding();
      } else {
        // Ensure horizontal movement continues when passing over rails
        this.player.setVelocityX(this.gameSpeed);
      }
    });

    // Obstacle collisions
    this.physics.add.overlap(this.player, this.obstacleManager.getObstacles(), () => {
      this.gameOver();
    });
  }

  createUI() {
    this.scoreText = this.add.text(8, 8, 'SCORE: 0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    this.comboText = this.add.text(8, 22, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.comboText.setScrollFactor(0);
    this.comboText.setDepth(100);

    this.instructionsText = this.add.text(120, 140, 'SPACE: Jump/Trick | HOLD: Grind', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.instructionsText.setOrigin(0.5);
    this.instructionsText.setScrollFactor(0);
    this.instructionsText.setDepth(100);
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
    const trickText = this.add.text(this.player.x, this.player.y - 20, `+${points}`, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 1
    });
    
    this.tweens.add({
      targets: trickText,
      y: trickText.y - 20,
      alpha: 0,
      duration: 1000,
      onComplete: () => trickText.destroy()
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
        
        // Visual trick effect
        this.tweens.add({
          targets: this.player,
          angle: '+=360',
          duration: 400,
          ease: 'Power2'
        });
        
        this.playSound('trick');
      }
    }

    // Maintain player auto-run speed - force it every frame
    this.player.setVelocityX(this.gameSpeed);
    
    // Debug: log player position and velocity if stopped
    if (Math.abs(this.player.body!.velocity.x) < 10) {
      console.log('Player stopped! Position:', this.player.x, 'Velocity:', this.player.body!.velocity.x);
    }

    // Continuous scoring
    this.score.addDistance(this.gameSpeed * delta / 1000);
    
    if (this.isOnRail) {
      this.score.addGrindTick();
    }

    // Update world (ground, rails, obstacles)
    this.updateWorld();

    // Update obstacle manager
    this.obstacleManager.update(delta);

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
    
    // Extend ground
    const rightmostGround = Math.max(...this.ground.children.entries.map(child => (child as any).x));
    if (rightmostGround < cameraX + 300) {
      for (let x = rightmostGround + 16; x < cameraX + 400; x += 16) {
        const tile = this.ground.create(x, 140, 'tiles');
        tile.setOrigin(0, 0);
        tile.refreshBody();
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

    // Camera follows player with less lag
    this.cameras.main.startFollow(this.player, true, 0.1, 0);
    this.cameras.main.setLerp(0.1, 0);
  }

  updateUI() {
    this.scoreText.setText(`SCORE: ${Math.floor(this.score.value)}`);
    
    if (this.comboMultiplier > 1) {
      this.comboText.setText(`COMBO x${this.comboMultiplier}`);
    } else {
      this.comboText.setText('');
    }
  }
}
