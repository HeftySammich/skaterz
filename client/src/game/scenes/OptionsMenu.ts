export class OptionsMenu extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'OptionsMenu' });
  }

  create() {
    // Options background
    this.cameras.main.setBackgroundColor('#1f3d6e');
    
    // Title
    this.add.text(240, 40, 'OPTIONS', {
      fontSize: '24px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Placeholder content
    this.add.text(240, 80, 'OPTIONS MENU', {
      fontSize: '16px',
      color: '#b9c0cf',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(240, 100, '(COMING SOON)', {
      fontSize: '12px',
      color: '#646c7a',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Back instruction
    const backText = this.add.text(240, 130, 'PRESS ESC TO GO BACK', {
      fontSize: '12px',
      color: '#e2e28e',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Touch/click to go back
    this.input.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }

  update() {
    // ESC to go back
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ESC'))) {
      this.scene.start('MainMenu');
    }
  }
}