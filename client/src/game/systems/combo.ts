import Phaser from 'phaser';

export interface ComboState {
  status: 'inactive' | 'pending' | 'active';
  airEventCount: number;
  multiplier: number;
  startX: number;
  comboDistance: number;
  lastEventTime: number;
}

export interface ComboEvents {
  comboActivated: { multiplier: number };
  comboUpdated: { multiplier: number; distance: number };
  comboEnded: { multiplier: number; distance: number; starsEarned: number };
}

export class ComboTracker extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private state: ComboState = {
    status: 'inactive',
    airEventCount: 0,
    multiplier: 0,
    startX: 0,
    comboDistance: 0,
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
      startX: 0,
      comboDistance: 0,
      lastEventTime: 0
    };
  }

  registerTrick(playerX: number, isGrounded: boolean): void {
    if (isGrounded) {
      console.log('[COMBO] Trick ignored - player is grounded');
      return;
    }

    this.registerAirEvent(playerX);
    console.log(`[COMBO] Trick registered - airEventCount: ${this.state.airEventCount}`);
  }

  registerEnemyKill(playerX: number, isGrounded: boolean): void {
    if (isGrounded) {
      console.log('[COMBO] Enemy kill ignored - player is grounded');
      return;
    }

    this.registerAirEvent(playerX);
    console.log(`[COMBO] Enemy kill registered - airEventCount: ${this.state.airEventCount}`);
  }

  private registerAirEvent(playerX: number): void {
    const currentTime = this.scene.time.now;
    
    if (this.state.status === 'inactive') {
      // Start pending combo
      this.state.status = 'pending';
      this.state.startX = playerX;
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
      
      const distance = Math.floor(playerX - this.state.startX);
      this.emit('comboUpdated', { multiplier: this.state.multiplier, distance });
    }
  }

  updateAirState(playerX: number, wasGrounded: boolean, isGrounded: boolean): number {
    // Only process landing if we were in air and now on ground
    if (!wasGrounded && isGrounded) {
      return this.handleLanding(playerX);
    }
    
    // Update distance if combo is active
    if (this.state.status === 'active') {
      this.state.comboDistance = Math.floor(playerX - this.state.startX);
      this.emit('comboUpdated', { 
        multiplier: this.state.multiplier, 
        distance: this.state.comboDistance 
      });
    }
    
    return 0;
  }

  private handleLanding(playerX: number): number {
    if (this.state.status === 'inactive') {
      return 0;
    }

    let starsEarned = 0;
    
    if (this.state.status === 'active') {
      // Calculate stars: distance * multiplier
      this.state.comboDistance = Math.floor(playerX - this.state.startX);
      starsEarned = this.state.comboDistance * this.state.multiplier;
      
      console.log(`[COMBO] COMBO COMPLETED! Distance: ${this.state.comboDistance}, Multiplier: ${this.state.multiplier}, Stars: ${starsEarned}`);
      
      this.emit('comboEnded', {
        multiplier: this.state.multiplier,
        distance: this.state.comboDistance,
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