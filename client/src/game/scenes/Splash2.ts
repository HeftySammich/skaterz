export class Splash2 extends Phaser.Scene {
  private skipTimer?: Phaser.Time.TimerEvent;
  
  constructor() {
    super({ key: 'Splash2' });
  }

  create() {
    // Warning skull splash (first time)
    this.cameras.main.setBackgroundColor('#000000');
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const warningSkull = this.add.image(centerX, centerY, 'warning_skull');
    warningSkull.setOrigin(0.5, 0.5);
    warningSkull.setDisplaySize(640, 960);

    // Auto-advance after 2 seconds
    this.skipTimer = this.time.delayedCall(2000, () => {
      this.scene.start('Splash3');
    });
    
    // Enable skip functionality - any key press
    this.input.keyboard?.on('keydown', () => {
      this.skipToNext();
    });
    
    // Enable skip functionality - screen tap/click
    this.input.on('pointerdown', () => {
      this.skipToNext();
    });
  }
  
  skipToNext() {
    // Cancel the auto-advance timer
    if (this.skipTimer) {
      this.skipTimer.destroy();
    }
    // Remove input listeners to prevent multiple triggers
    this.input.keyboard?.removeAllListeners();
    this.input.removeAllListeners();
    // Go to next scene
    this.scene.start('Splash3');
  }
}