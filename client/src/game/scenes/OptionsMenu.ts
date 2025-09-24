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
    // Add graffiti background
    const bg = this.add.image(320, 480, 'graffiti_bg');
    bg.setDisplaySize(640, 960);
    
    // Title
    this.add.text(320, 200, 'OPTIONS', {
      fontSize: '32px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Placeholder content
    this.add.text(320, 350, 'OPTIONS MENU', {
      fontSize: '24px',
      color: '#b9c0cf',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(320, 450, '(COMING SOON)', {
      fontSize: '18px',
      color: '#646c7a',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Back instruction
    const backText = this.add.text(320, 700, 'GO BACK', {
      fontSize: '22px',
      color: '#e2e28e',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
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