import Phaser from 'phaser';

export interface ComboState {
  status: 'inactive' | 'pending' | 'active';
  airEventCount: number;
  multiplier: number;
  startScore: number;
  comboScorePoints: number;
  lastEventTime: number;
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
    lastEventTime: 0
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
      lastEventTime: 0
    };
  }

  registerTrick(currentScore: number, isGrounded: boolean): void {
    if (isGrounded) {
      console.log('[COMBO] Trick ignored - player is grounded');
      return;
    }

    this.registerAirEvent(currentScore);
    console.log(`[COMBO] Trick registered - airEventCount: ${this.state.airEventCount}`);
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
        // Activate combo - multiplier starts at 3 for the first 3 events
        this.state.status = 'active';
        this.state.multiplier = 3;
        console.log('[COMBO] COMBO ACTIVATED! Multiplier: 3');
        this.emit('comboActivated', { multiplier: this.state.multiplier });
      }
    } else if (this.state.status === 'active') {
      // Increment multiplier for each additional event
      this.state.multiplier++;
      this.state.lastEventTime = currentTime;
      console.log(`[COMBO] Combo updated - multiplier: ${this.state.multiplier}`);
      
      const scorePoints = currentScore - this.state.startScore;
      this.emit('comboUpdated', { multiplier: this.state.multiplier, scorePoints });
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
    if (this.state.status === 'inactive') {
      return 0;
    }

    let starsEarned = 0;
    
    if (this.state.status === 'active') {
      // Calculate stars: 10% of score points earned during combo, then apply multiplier
      this.state.comboScorePoints = currentScore - this.state.startScore;
      const baseStars = Math.floor(this.state.comboScorePoints * 0.1); // 10% of score points
      starsEarned = baseStars * this.state.multiplier;
      
      console.log(`[COMBO] COMBO COMPLETED! Score Points: ${this.state.comboScorePoints}, Base Stars (10%): ${baseStars}, Multiplier: ${this.state.multiplier}, Total Stars: ${starsEarned}`);
      
      this.emit('comboEnded', {
        multiplier: this.state.multiplier,
        scorePoints: this.state.comboScorePoints,
        starsEarned
      });
    } else {
      console.log('[COMBO] Landing ended pending combo (less than 3 events)');
    }

    this.resetCombo();
    return starsEarned;
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
}

export function createComboSystem(scene: Phaser.Scene): ComboTracker {
  return new ComboTracker(scene);
}