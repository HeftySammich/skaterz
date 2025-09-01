export class Splash3 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash3' });
  }

  create() {
    // Third splash with copyright/warning
    this.cameras.main.setBackgroundColor('#274b8c');
    
    // Warning text (GBA screen is 240x160)
    this.add.text(120, 50, 'WARNING', {
      fontSize: '14px',
      color: '#ff6b6b',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(120, 75, 'SKATEBOARDING CAN BE', {
      fontSize: '9px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(120, 90, 'HAZARDOUS TO YOUR HEALTH', {
      fontSize: '9px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(120, 110, '(ESPECIALLY WHEN UNDEAD)', {
      fontSize: '7px',
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