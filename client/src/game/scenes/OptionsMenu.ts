export class OptionsMenu extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;
  private selectedOption = 0; // 0 = Leaderboard, 1 = Back
  private menuItems: Phaser.GameObjects.Text[] = [];

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

    // Menu options
    const leaderboardText = this.add.text(320, 350, 'LEADERBOARD', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const backText = this.add.text(320, 450, 'GO BACK', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Store menu items
    this.menuItems = [leaderboardText, backText];
    
    // Selection indicator
    const selector = this.add.text(150, 350, '>', {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Update selector position
    const updateSelector = () => {
      if (this.selectedOption === 0) {
        selector.setY(350);
        leaderboardText.setColor('#00ff00');
        backText.setColor('#ffffff');
      } else {
        selector.setY(450);
        leaderboardText.setColor('#ffffff');
        backText.setColor('#00ff00');
      }
    };
    
    updateSelector();
    
    // Make options interactive
    leaderboardText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('Leaderboard', { menuMusic: this.menuMusic });
      })
      .on('pointerover', () => {
        this.selectedOption = 0;
        updateSelector();
      });
      
    backText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MainMenu', { menuMusic: this.menuMusic });
      })
      .on('pointerover', () => {
        this.selectedOption = 1;
        updateSelector();
      });
    
    // Handle keyboard input
    const upKey = this.input.keyboard?.addKey('UP');
    const downKey = this.input.keyboard?.addKey('DOWN');
    const spaceKey = this.input.keyboard?.addKey('SPACE');
    const enterKey = this.input.keyboard?.addKey('ENTER');
    
    upKey?.on('down', () => {
      this.selectedOption = (this.selectedOption - 1 + this.menuItems.length) % this.menuItems.length;
      updateSelector();
    });
    
    downKey?.on('down', () => {
      this.selectedOption = (this.selectedOption + 1) % this.menuItems.length;
      updateSelector();
    });
    
    const selectOption = () => {
      if (this.selectedOption === 0) {
        this.scene.start('Leaderboard', { menuMusic: this.menuMusic });
      } else {
        this.scene.start('MainMenu', { menuMusic: this.menuMusic });
      }
    };
    
    spaceKey?.on('down', selectOption);
    enterKey?.on('down', selectOption);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  update() {
    // ESC to go back
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ESC'))) {
      this.scene.start('MainMenu', { menuMusic: this.menuMusic });
    }
  }
}