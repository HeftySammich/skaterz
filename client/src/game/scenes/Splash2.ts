export class Splash2 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash2' });
  }

  create() {
    // Second splash with development info
    this.cameras.main.setBackgroundColor('#1f3d6e');
    
    // Studio text
    this.add.text(240, 70, 'REPLIT STUDIOS', {
      fontSize: '20px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Presents text
    this.add.text(240, 100, 'PRESENTS', {
      fontSize: '12px',
      color: '#b9c0cf',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Auto-advance after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('Splash3');
    });
  }
}