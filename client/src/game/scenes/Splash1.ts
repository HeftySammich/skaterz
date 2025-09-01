export class Splash1 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash1' });
  }

  create() {
    // Simple GBA-style splash screen with retro colors
    this.cameras.main.setBackgroundColor('#162b4d');
    
    // Title text (GBA screen is 240x160)
    const title = this.add.text(120, 60, 'ZOMBIE SKATER', {
      fontSize: '20px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(120, 85, 'GBA STYLE', {
      fontSize: '10px',
      color: '#e2e28e',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Auto-advance after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('Splash2');
    });
  }
}