export class Splash1 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash1' });
  }

  create() {
    // Simple GBA-style splash screen with retro colors
    this.cameras.main.setBackgroundColor('#162b4d');
    
    // Title text
    const title = this.add.text(240, 60, 'ZOMBIE SKATER', {
      fontSize: '24px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(240, 90, 'GBA STYLE', {
      fontSize: '12px',
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