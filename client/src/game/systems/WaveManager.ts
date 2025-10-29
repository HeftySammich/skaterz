export interface WaveConfig {
  waveNumber: number;
  unlockedObstacles: string[];
  unlockedPowerUps: string[];
  unlockedEnemies: string[];
  speedIncreases: number; // How many speed increases have happened in this wave
  challengesCompleted: number;
  totalChallenges: number;
  isTransitioning: boolean;
  isComplete: boolean;
}

export class WaveManager {
  private scene: Phaser.Scene;
  private currentWave: number = 1;
  private speedIncreases: number = 0; // Track speed increases in current wave
  private lastSpeedIncreaseTime: number = 0;
  private waveStartTime: number = 0;
  private challengesCompleted: number = 0;
  private isTransitioning: boolean = false;
  private onWaveChange?: (wave: number) => void;
  private onSpeedIncrease?: (multiplier: number) => void;
  private baseSpeed: number = 1.0;
  private speedMultiplier: number = 1.0;
  
  // Wave configurations
  private waveConfigs: { [key: number]: Partial<WaveConfig> } = {
    1: {
      unlockedObstacles: ['obstacle_trash'], // Only trash bins in wave 1
      unlockedPowerUps: [], // No power-ups in wave 1, just energy drinks
      unlockedEnemies: ['enemy_robot'], // Robot enemies in wave 1
      totalChallenges: 3 // Require all 3 challenges to be completed
    },
    2: {
      unlockedObstacles: ['obstacle_trash', 'obstacle_cone'], // Add traffic cones
      unlockedPowerUps: ['fire_taco'], // Unlock fire taco
      unlockedEnemies: ['enemy_robot', 'enemy_eyeball', 'enemy_robot2'], // Add flying enemy and robot2 in Wave 2
      totalChallenges: 3 // Require all 3 challenges to be completed
    },
    3: {
      unlockedObstacles: ['obstacle_trash', 'obstacle_cone', 'obstacle_skulls'], // Add skulls
      unlockedPowerUps: ['fire_taco', 'metal_skateboard', 'crystal_magnet'], // All power-ups
      unlockedEnemies: ['enemy_robot', 'enemy_eyeball', 'enemy_robot2', 'enemy_robot3'], // All enemies
      totalChallenges: 3 // Require all 3 challenges to be completed
    }
  };
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.reset();
  }
  
  reset() {
    this.currentWave = 1;
    this.speedIncreases = 0;
    this.challengesCompleted = 0;
    this.waveStartTime = Date.now();
    this.lastSpeedIncreaseTime = Date.now();
    this.speedMultiplier = this.baseSpeed;
    this.isTransitioning = false;
  }
  
  update(deltaTime: number) {
    if (this.isTransitioning) return;
    
    // Speed increases are now handled by challenge completion only
    // No automatic speed increases based on time
  }
  
  private increaseSpeed() {
    this.speedIncreases++;
    this.lastSpeedIncreaseTime = Date.now();
    
    // Increase speed by 15% each time
    this.speedMultiplier += 0.15;
    
    if (this.onSpeedIncrease) {
      this.onSpeedIncrease(this.speedMultiplier);
    }
    
    // Don't show speed increase notification - removed per user request
  }
  
  completeChallenge() {
    console.log('[DEBUG WAVE] CompleteChallenge called - All challenges for wave complete!');
    console.log('[DEBUG WAVE] Current state:', {
      wave: this.currentWave,
      challengesCompleted: this.challengesCompleted,
      speedMultiplier: this.speedMultiplier,
      isTransitioning: this.isTransitioning
    });
    
    // When this is called from ChallengeManager's onAllChallengesComplete,
    // it means ALL 3 challenges are done, so we should advance immediately
    this.challengesCompleted = 3; // Set to 3 since all challenges are complete
    
    try {
      console.log('[DEBUG WAVE] Increasing speed...');
      // Increase speed when challenges are completed
      this.increaseSpeed();
    } catch (error) {
      console.error('[DEBUG WAVE] Error during speed increase:', error);
    }
    
    // Always advance wave when this is called (all challenges are complete)
    try {
      console.log('[DEBUG WAVE] All challenges complete, advancing to next wave');
      this.advanceWave();
    } catch (error) {
      console.error('[DEBUG WAVE] Error advancing wave:', error);
    }
  }
  
  private advanceWave() {
    if (this.currentWave >= 3) {
      // Completed all 3 waves - trigger victory
      this.triggerVictory();
    } else {
      this.isTransitioning = true;
      this.currentWave++;
      this.speedIncreases = 0; // Reset speed increases for new wave
      this.challengesCompleted = 0;
      this.waveStartTime = Date.now();
      this.lastSpeedIncreaseTime = Date.now();
      
      // Keep speed from previous wave and add a small boost
      this.speedMultiplier += 0.1;
      
      if (this.onWaveChange) {
        this.onWaveChange(this.currentWave);
      }
      
      // Show wave transition
      this.showWaveTransition();
    }
  }
  
  private triggerVictory() {
    this.isTransitioning = true;
    
    // Trigger victory in the Game scene
    const gameScene = this.scene as any;
    if (gameScene.showVictoryScreen) {
      gameScene.showVictoryScreen();
    }
  }
  
  public triggerEndGame() {
    this.isTransitioning = true;
    
    // Slow down to normal speed
    this.speedMultiplier = this.baseSpeed;
    if (this.onSpeedIncrease) {
      this.onSpeedIncrease(this.speedMultiplier);
    }
    
    // Trigger results screen
    // This will be handled by the Game scene
  }
  
  private showNotification(text: string) {
    const notification = this.scene.add.text(320, 200, text, {
      fontSize: '24px',
      color: '#ffeb3b',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(200);
    
    this.scene.tweens.add({
      targets: notification,
      y: 150,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notification.destroy()
    });
  }
  
  private showWaveTransition() {
    const waveLabel = this.currentWave === 3 ? 'FINAL WAVE' : `WAVE ${this.currentWave}`;
    const waveText = this.scene.add.text(320, 480, waveLabel, {
      fontSize: '48px',
      color: '#ff6b6b',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    waveText.setScrollFactor(0);
    waveText.setDepth(250);
    waveText.setScale(0);
    
    // Animate wave text
    this.scene.tweens.add({
      targets: waveText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(1500, () => {
          this.scene.tweens.add({
            targets: waveText,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              waveText.destroy();
              this.isTransitioning = false;
            }
          });
        });
      }
    });
    
    // Show what's unlocked
    this.showUnlockedItems();
  }
  
  private showUnlockedItems() {
    const config = this.getCurrentWaveConfig();
    let yOffset = 540;
    
    if (this.currentWave === 2) {
      this.showUnlockText('GET READY FOR CARNAGE', yOffset);
    } else if (this.currentWave === 3) {
      this.showUnlockText('SURVIVE TO WIN!', yOffset);
    }
  }
  
  private showUnlockText(text: string, y: number) {
    const unlockText = this.scene.add.text(320, y, text, {
      fontSize: '16px',
      color: '#4caf50',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    unlockText.setScrollFactor(0);
    unlockText.setDepth(240);
    unlockText.setAlpha(0);
    
    this.scene.tweens.add({
      targets: unlockText,
      alpha: 1,
      duration: 300,
      delay: 500,
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: unlockText,
            alpha: 0,
            duration: 300,
            onComplete: () => unlockText.destroy()
          });
        });
      }
    });
  }
  
  getCurrentWaveConfig(): WaveConfig {
    const baseConfig = this.waveConfigs[this.currentWave] || this.waveConfigs[1];
    return {
      waveNumber: this.currentWave,
      speedIncreases: this.speedIncreases,
      challengesCompleted: this.challengesCompleted,
      isTransitioning: this.isTransitioning,
      isComplete: this.currentWave > 3,
      ...baseConfig
    } as WaveConfig;
  }
  
  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
  
  isObstacleUnlocked(obstacleType: string): boolean {
    const config = this.getCurrentWaveConfig();
    return config.unlockedObstacles.includes(obstacleType);
  }
  
  isPowerUpUnlocked(powerUpType: string): boolean {
    const config = this.getCurrentWaveConfig();
    return config.unlockedPowerUps.includes(powerUpType);
  }
  
  isEnemyUnlocked(enemyType: string): boolean {
    const config = this.getCurrentWaveConfig();
    return config.unlockedEnemies.includes(enemyType);
  }
  
  setOnWaveChange(callback: (wave: number) => void) {
    this.onWaveChange = callback;
  }
  
  setOnSpeedIncrease(callback: (multiplier: number) => void) {
    this.onSpeedIncrease = callback;
  }
  
  isWaveComplete(): boolean {
    return this.currentWave > 3;
  }
  
  getCurrentWave(): number {
    return this.currentWave;
  }
}