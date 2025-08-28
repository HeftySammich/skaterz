import Phaser from 'phaser';
import { setupControls } from '../systems/controls';
import { Score } from '../systems/score';
import { ObstacleManager } from '../systems/obstacles';
import { BitmapText } from '../utils/BitmapText';
import { createWorld } from '../../world';
import { LevelDirector } from '../../world/spawner';

export default class Game extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private world!: ReturnType<typeof createWorld>;
  private levelDirector!: LevelDirector;
  private cursors!: ReturnType<typeof setupControls>;
  private score!: Score;
  private obstacleManager!: ObstacleManager;
  
  private isOnRail = false;
  private currentRail: any = null;
  private didTrickThisJump = false;
  private gameSpeed = 100;
  private comboMultiplier = 1;
  private comboTimer = 0;
  
  // Jump buffer and coyote time
  private coyoteTime = 0;
  private jumpBuffer = 0;
  private readonly COYOTE_MS = 90;
  private readonly BUFFER_MS = 120;
  
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

    // Create the complete world (replaces background, ground, rails)
    this.world = createWorld(this);
    this.levelDirector = new LevelDirector(this, this.world);

    // Create player
    this.createPlayer();

    // Setup proper physics ground that matches visual road
    this.setupProperGround();

    // Setup physics collisions
    this.setupCollisions();
    
    // Setup camera to follow player immediately
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -90, 0);

    // Setup controls
    this.cursors = setupControls(this);

    // Create UI
    this.createUI();

    // Setup physics tweaks for GBA feel
    this.setupGBAPhysics();

    console.log('Game scene created successfully with new world system');
  }

  setupProperGround() {
    // Put the physics floor to match what the camera sees at x=0
    const floorY = (this.world as any).visualGroundYFor(0) - 6; // tweak -6 so board wheels touch
    const groundRect = this.add.rectangle(0, floorY, 5000, 10, 0x00ff00, 0); // transparent
    this.physics.add.existing(groundRect, true);
    (this.world as any).ground.clear(true, true); // remove old one if you used createWorld()
    (this.world as any).ground.add(groundRect as any);
    
    console.log('Physics ground positioned at Y:', floorY, 'for visual ground at x=0');
  }

  setupGBAPhysics() {
    // Higher gravity for GBA runner feel
    this.physics.world.gravity.y = 950;
    
    // Setup coyote time and jump buffer
    this.time.addEvent({
      loop: true,
      delay: 16,
      callback: () => {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down) {
          this.coyoteTime = this.COYOTE_MS;
        } else {
          this.coyoteTime = Math.max(0, this.coyoteTime - 16);
        }
        this.jumpBuffer = Math.max(0, this.jumpBuffer - 16);
      }
    });
  }



  createPlayer() {
    // Use the first animated frame as the sprite - position lower for easier rail access
    this.player = this.physics.add.sprite(40, 85, 'zombie_0'); // Lowered from 50 to 85
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
    
    // Adjust size for the new 96x96 HD sprite  
    this.player.body!.setSize(32, 40); // Smaller hitbox to avoid getting stuck
    this.player.setScale(0.6); // Scale down for mobile-friendly size
    
    // Configure physics for smooth movement - cast to correct type
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setDrag(0); // No air resistance
    body.setMaxVelocity(300, 600); // Higher max velocity
    body.immovable = false;
    
    // Tighter collider for better ground contact
    this.player.setSize(20, 28).setOffset(14, 18); // hitbox smaller than 48x48 canvas
    this.player.setBounce(0); // no floaty landing
    
    // Start skating animation
    this.player.play('skate');
    
    // FORCE position update as well as velocity
    this.player.setVelocityX(this.gameSpeed);
    this.player.x += 1; // Force initial position change
    
    // Create contact shadow that follows the visual ground
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 18, 22, 6, 0x000000, 0.45)
      .setDepth(2);
    this.shadow.setScrollFactor(1);
    
    console.log('Player created at position:', this.player.x, 'Y:', this.player.y, 'with velocity:', this.gameSpeed);
  }

  setupCollisions() {
    // Ground collision with process callback to allow horizontal movement
    this.physics.add.collider(this.player, this.world.ground, (player: any, ground: any) => {
      if (this.didTrickThisJump && this.comboTimer > 0) {
        // Successful trick landing
        this.score.addTrick(50 * this.comboMultiplier);
        this.showTrickScore();
        this.didTrickThisJump = false;
      }
    }, (player: any, ground: any) => {
      // Process callback - return true to allow collision, but maintain horizontal velocity
      this.player.setVelocityX(this.gameSpeed);
      return true;
    });

    // Rail overlap for automatic grinding
    this.physics.add.overlap(this.player, this.world.rails, (player: any, rail: any) => {
      // Auto-grind when player first touches a rail
      if (!this.isOnRail) {
        console.log('Player touched rail - starting auto-grind! Rail Y:', rail.y, 'Player Y:', player.y);
        this.startGrinding(rail);
        this.currentRail = rail;
      }
    });

    // Obstacle collision
    this.physics.add.collider(this.player, this.world.obstacles, () => {
      console.log('Player hit obstacle - game over');
      this.gameOver();
    });
  }

  createUI() {
    // Create pixel-perfect bitmap text for HD 2D crisp rendering
    this.scoreText = new BitmapText(this, 8, 8, 'SCORE: 0', 0xffffff);
    this.scoreText.setScrollFactor(0);

    this.comboText = new BitmapText(this, 8, 18, '', 0xffff00);
    this.comboText.setScrollFactor(0);

    // Use bitmap text for instructions for crisp HD 2D rendering
    this.instructionsText = new BitmapText(this, 60, 140, 'TAP TO JUMP AUTO GRIND', 0xffffff);
    this.instructionsText.setScrollFactor(0);
  }

  startGrinding(railGameObject?: any) {
    if (!this.isOnRail) {
      console.log('Starting grind! Locking to rail');
      this.isOnRail = true;
      this.currentRail = railGameObject;
      
      if (railGameObject) {
        // Position player visibly on top of the rail and lock in place
        this.player.y = railGameObject.y - 25; // Position clearly above rail
        this.player.setVelocityY(0);
        this.player.setGravityY(0);
        console.log('Player locked on rail. Rail Y:', railGameObject.y, 'Player Y:', this.player.y);
      }

      // Play grind sound
      this.playSound('grind');
      
      // Start/continue combo (only increase once per rail)
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1;
      } else {
        this.comboMultiplier += 1;
      }
      this.comboTimer = 3000; // 3 seconds
      console.log('Grinding started! Combo:', this.comboMultiplier);
    }
  }

  stopGrinding() {
    if (this.isOnRail) {
      console.log('Stopping grind - restoring gravity');
      this.isOnRail = false;
      this.currentRail = null;
      this.player.setGravityY(600);
    }
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

    // Keep player locked to rail while grinding
    if (this.isOnRail && this.currentRail) {
      // Keep player locked to current rail position
      this.player.y = this.currentRail.y - 25;
      this.player.setVelocityY(0);
      
      // Check if player has moved past the current rail (simple X check)
      const playerX = this.player.x;
      const railX = this.currentRail.x;
      const railWidth = 32; // Each rail segment is 32px wide
      
      // If player moved significantly past this rail segment, check for next rail or stop grinding
      if (playerX > railX + railWidth + 50) { // Give some buffer
        // Check if there's another rail nearby
        const nextRail = this.physics.world.bodies.entries.find(body => {
          if (!this.world.rails.contains(body.gameObject)) return false;
          const rail = body.gameObject as any;
          return Math.abs(rail.x - playerX) < 100 && Math.abs(rail.y - this.currentRail.y) < 20;
        });
        
        if (nextRail) {
          // Switch to the next rail seamlessly
          this.currentRail = nextRail.gameObject;
        } else {
          // No more rails, stop grinding
          console.log('Player reached end of rail - stopping grind');
          this.stopGrinding();
        }
      }
    }

    // Handle jump input - any touch makes zombie jump
    if (this.cursors.justTapped()) {
      this.jumpBuffer = this.BUFFER_MS;
    }
    
    // Process jump buffer and coyote time
    if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
      this.jumpBuffer = 0;
      this.coyoteTime = 0;
      this.isOnRail = false;
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.allowGravity = true;
      this.player.setVelocityY(-280);
      this.didTrickThisJump = false;
      this.playSound('jump');
      console.log('Player jumped with velocity -280 from Y:', this.player.y);
    } else if (!this.didTrickThisJump && !this.isOnRail) {
      // Air trick - only when not on rail and not already doing a trick
      this.didTrickThisJump = true;
      this.comboMultiplier = Math.min(this.comboMultiplier + 1, 5);
      this.comboTimer = 3000;
      
      console.log('Air trick performed! Combo:', this.comboMultiplier);
      
      // Simple rotation without animation spam
      this.tweens.killTweensOf(this.player); // Stop any existing tweens
      this.player.setAngle(0); // Reset angle first
      
      this.tweens.add({
        targets: this.player,
        angle: 360,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          this.player.setAngle(0); // Reset angle after trick
          this.player.play('skate');
        }
      });
      
      this.playSound('trick');
    }

    // Update level director for procedural spawning
    this.levelDirector.update(this.cameras.main.scrollX);
    
    // Update game speed based on difficulty
    this.gameSpeed = this.levelDirector.getSpeed(this.cameras.main.scrollX);

    // Force player to maintain horizontal velocity every frame
    if (this.player && this.player.body) {
      this.player.setVelocityX(this.gameSpeed);
      this.player.x += this.gameSpeed * delta / 1000;
    }

    // Continuous scoring
    this.score.addDistance(this.gameSpeed * delta / 1000);
    
    if (this.isOnRail) {
      this.score.addGrindTick();
    }

    // Shadow tracking and rim light tinting
    const vx = this.player.x;
    const yVis = (this.world as any).visualGroundYFor(vx);
    this.shadow.setPosition(vx, yVis - 2); // tiny lift to avoid z-fighting
    this.shadow.scaleX = Phaser.Math.Clamp(1 - (this.player.y - (yVis - 14)) / 80, 0.6, 1.1);
    this.shadow.scaleY = Phaser.Math.Clamp(1 - (this.player.y - (yVis - 14)) / 80, 0.4, 1.0);

    // Rim light tint when airborne
    const onGround = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down || this.isOnRail;
    if (onGround) {
      this.player.clearTint();
      // Reset trick state when landing
      if (this.didTrickThisJump) {
        this.didTrickThisJump = false;
        this.tweens.killTweensOf(this.player);
        this.player.setAngle(0);
      }
      if (this.player.anims.currentAnim?.key !== 'skate') {
        this.player.play('skate');
      }
    } else {
      this.player.setTintFill(0x99ffcc); // faint mint rim when airborne
    }

    // Update the world (parallax, street scroll, dynamic content)
    this.world.update(this.cameras.main.scrollX, time);

    // Game speed is now handled by LevelDirector

    // Fail condition - moved down to give more room
    if (this.player.y > 200) {
      console.log('Game over - player fell too far. Y position:', this.player.y);
      this.gameOver();
    }

    // Update UI
    this.updateUI();
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
