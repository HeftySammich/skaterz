export class Splash3 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash3' });
  }

  create() {
    // Third splash with copyright/warning
    this.cameras.main.setBackgroundColor('#274b8c');
    
    // Warning text
    this.add.text(240, 60, 'WARNING', {
      fontSize: '16px',
      color: '#ff6b6b',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(240, 85, 'SKATEBOARDING CAN BE', {
      fontSize: '10px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(240, 100, 'HAZARDOUS TO YOUR HEALTH', {
      fontSize: '10px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(240, 120, '(ESPECIALLY WHEN UNDEAD)', {
      fontSize: '8px',
      color: '#e2e28e',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Auto-advance after 3 seconds
    this.time.delayedCall(3000, () => {
      this.scene.start('MainMenu');
    });
  }
}