export class OptionsMenu extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;

  constructor() {
    super({ key: 'OptionsMenu' });
  }

  init(data: { menuMusic?: Phaser.Sound.BaseSound }) {
    // Receive menu music from MainMenu to keep it playing
    this.menuMusic = data.menuMusic || null;
  }

  create() {
    // Options background
    this.cameras.main.setBackgroundColor('#1f3d6e');
    
    // Title (GBA screen is 240x160)
    this.add.text(120, 35, 'OPTIONS', {
      fontSize: '12px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Placeholder content
    this.add.text(120, 70, 'OPTIONS MENU', {
      fontSize: '8px',
      color: '#b9c0cf',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(120, 90, '(COMING SOON)', {
      fontSize: '6px',
      color: '#646c7a',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Back instruction
    const backText = this.add.text(120, 125, 'PRESS ESC TO GO BACK', {
      fontSize: '6px',
      color: '#e2e28e',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Touch/click to go back
    this.input.on('pointerdown', () => {
      this.scene.start('MainMenu', { menuMusic: this.menuMusic });
    });
  }

  update() {
    // ESC to go back
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ESC'))) {
      this.scene.start('MainMenu', { menuMusic: this.menuMusic });
    }
  }
}