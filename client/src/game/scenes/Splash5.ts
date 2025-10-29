export class Splash5 extends Phaser.Scene {
  private skipTimer?: Phaser.Time.TimerEvent;
  
  constructor() {
    super({ key: 'Splash5' });
  }

  create() {
    // Starfall V Presents splash
    this.cameras.main.setBackgroundColor('#000000');
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const starfallPresents = this.add.image(centerX, centerY, 'starfall_presents');
    starfallPresents.setOrigin(0.5, 0.5);
    starfallPresents.setDisplaySize(640, 960);

    // Auto-advance after 2 seconds
    this.skipTimer = this.time.delayedCall(2000, () => {
      this.scene.start('MainMenu');
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
    this.scene.start('MainMenu');
  }
}