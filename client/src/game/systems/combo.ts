import Phaser from 'phaser';

export interface ComboState {
  status: 'inactive' | 'pending' | 'active';
  airEventCount: number;
  multiplier: number;
  startScore: number;
  comboScorePoints: number;
  lastEventTime: number;
  obstaclesClearedInTrick: number;
  starsCollectedDuringCombo: number;
  trickObstacles: string[];
}

export interface ComboEvents {
  comboActivated: { multiplier: number };
  comboUpdated: { multiplier: number; scorePoints: number };
  comboEnded: { multiplier: number; scorePoints: number; starsEarned: number };
}

export class ComboTracker extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private state: ComboState = {
    status: 'inactive',
    airEventCount: 0,
    multiplier: 0,
    startScore: 0,
    comboScorePoints: 0,
    lastEventTime: 0,
    obstaclesClearedInTrick: 0,
    starsCollectedDuringCombo: 0,
    trickObstacles: []
  };

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.resetCombo();
  }

  private resetCombo() {
    this.state = {
      status: 'inactive',
      airEventCount: 0,
      multiplier: 0,
      startScore: 0,
      comboScorePoints: 0,
      lastEventTime: 0,
      obstaclesClearedInTrick: 0,
      starsCollectedDuringCombo: 0,
      trickObstacles: []
    };
  }

  registerTrick(currentScore: number, isGrounded: boolean, obstacleName?: string): void {
    if (isGrounded) {
      console.log('[COMBO] Trick ignored - player is grounded');
      return;
    }

    // Track obstacles cleared in this trick
    if (obstacleName) {
      this.state.trickObstacles.push(obstacleName);
      this.state.obstaclesClearedInTrick++;
    }

    this.registerAirEvent(currentScore);
    console.log(`[COMBO] Trick registered - airEventCount: ${this.state.airEventCount}, obstacles: ${this.state.obstaclesClearedInTrick}`);
  }

  registerEnemyKill(currentScore: number, isGrounded: boolean): void {
    if (isGrounded) {
      console.log('[COMBO] Enemy kill ignored - player is grounded');
      return;
    }

    this.registerAirEvent(currentScore);
    console.log(`[COMBO] Enemy kill registered - airEventCount: ${this.state.airEventCount}`);
  }

  private registerAirEvent(currentScore: number): void {
    try {
      const currentTime = this.scene.time.now;
      
      if (this.state.status === 'inactive') {
        // Start pending combo
        this.state.status = 'pending';
        this.state.startScore = currentScore;
        this.state.airEventCount = 1;
        this.state.lastEventTime = currentTime;
        console.log('[COMBO] Started pending combo');
      } else if (this.state.status === 'pending') {
        this.state.airEventCount++;
        this.state.lastEventTime = currentTime;
        
        if (this.state.airEventCount >= 3) {
          // Activate combo - bonus starts at 3 for the first 3 events
          this.state.status = 'active';
          this.state.multiplier = 3;
          console.log('[COMBO] COMBO ACTIVATED! Bonus: +3');
          console.log('[DEBUG COMBO] Combo activated - state:', this.state);
          
          try {
            this.emit('comboActivated', { multiplier: this.state.multiplier });
            console.log('[DEBUG COMBO] Combo activated event emitted successfully');
          } catch (emitError) {
            console.error('[DEBUG COMBO] Error emitting comboActivated:', emitError);
          }
        }
      } else if (this.state.status === 'active') {
        // Add 2 bonus stars for each additional event
        this.state.multiplier += 2;
        this.state.lastEventTime = currentTime;
        console.log(`[COMBO] Combo updated - bonus: +${this.state.multiplier}`);
        
        const scorePoints = currentScore - this.state.startScore;
        try {
          this.emit('comboUpdated', { multiplier: this.state.multiplier, scorePoints });
          console.log('[DEBUG COMBO] Combo updated event emitted successfully');
        } catch (emitError) {
          console.error('[DEBUG COMBO] Error emitting comboUpdated:', emitError);
        }
      }
    } catch (error) {
      console.error('[DEBUG COMBO] Critical error in registerAirEvent:', error);
      // Reset to safe state to prevent freeze
      this.resetCombo();
    }
  }

  updateAirState(currentScore: number, wasGrounded: boolean, isGrounded: boolean): number {
    // Only process landing if we were in air and now on ground
    if (!wasGrounded && isGrounded) {
      return this.handleLanding(currentScore);
    }
    
    // Update score points if combo is active
    if (this.state.status === 'active') {
      this.state.comboScorePoints = currentScore - this.state.startScore;
      this.emit('comboUpdated', { 
        multiplier: this.state.multiplier, 
        scorePoints: this.state.comboScorePoints 
      });
    }
    
    return 0;
  }

  private handleLanding(currentScore: number): number {
    try {
      if (this.state.status === 'inactive') {
        return 0;
      }

      let starsEarned = 0;
      
      if (this.state.status === 'active') {
        // Calculate stars: add bonus stars to base stars (changed from multiplication)
        this.state.comboScorePoints = currentScore - this.state.startScore;
        const baseStars = this.state.starsCollectedDuringCombo; // Only actual stars collected, no score conversion
        const bonusStars = this.state.multiplier; // Now used as bonus stars instead of multiplier
        starsEarned = baseStars + bonusStars;
        
        console.log(`[COMBO] COMBO COMPLETED! Score Points: ${this.state.comboScorePoints}, Stars Collected: ${this.state.starsCollectedDuringCombo}, Base Stars: ${baseStars}, Bonus Stars: +${bonusStars}, Total Stars: ${starsEarned}`);
        console.log('[DEBUG COMBO] Combo ending - state before reset:', this.state);
        
        try {
          this.emit('comboEnded', {
            multiplier: this.state.multiplier,
            scorePoints: this.state.comboScorePoints,
            starsEarned
          });
          console.log('[DEBUG COMBO] Combo ended event emitted successfully');
        } catch (emitError) {
          console.error('[DEBUG COMBO] Error emitting comboEnded:', emitError);
        }
      } else {
        console.log('[COMBO] Landing ended pending combo (less than 3 events)');
      }

      this.resetCombo();
      return starsEarned;
    } catch (error) {
      console.error('[DEBUG COMBO] Critical error in handleLanding:', error);
      // Reset to safe state
      this.resetCombo();
      return 0;
    }
  }

  getComboState(): Readonly<ComboState> {
    return { ...this.state };
  }

  isActive(): boolean {
    return this.state.status === 'active';
  }

  isPending(): boolean {
    return this.state.status === 'pending';
  }

  hasCombo(): boolean {
    return this.state.status !== 'inactive';
  }

  // Track stars collected during an active combo
  addStarsToCombo(stars: number): void {
    if (this.state.status === 'active' || this.state.status === 'pending') {
      this.state.starsCollectedDuringCombo += stars;
      console.log(`[COMBO] Added ${stars} stars to combo. Total: ${this.state.starsCollectedDuringCombo}`);
    }
  }

  // Get the obstacles cleared in current trick for display
  getTrickObstacles(): string[] {
    return [...this.state.trickObstacles];
  }

  // Clear trick obstacles after displaying them
  clearTrickObstacles(): void {
    this.state.trickObstacles = [];
    this.state.obstaclesClearedInTrick = 0;
  }
}

export function createComboSystem(scene: Phaser.Scene): ComboTracker {
  return new ComboTracker(scene);
}