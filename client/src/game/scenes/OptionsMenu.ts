export class OptionsMenu extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;
  private selectedOption = 0; // 0 = Connect Wallet, 1 = How to Play, 2 = Leaderboard, 3 = Back
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'OptionsMenu' });
  }

  init(data: { menuMusic?: Phaser.Sound.BaseSound }) {
    // Receive menu music from MainMenu to keep it playing
    this.menuMusic = data.menuMusic || null;
  }

  create() {
    // Emit scene change event for React components
    window.dispatchEvent(new CustomEvent('sceneChanged', {
      detail: { scene: 'OptionsMenu' }
    }));

    // Add graffiti background
    const bg = this.add.image(320, 480, 'graffiti_bg');
    bg.setDisplaySize(640, 960);
    
    // Title
    const titleText = this.add.text(320, 200, 'OPTIONS', {
      fontSize: '32px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    titleText.setShadow(3, 3, '#000000', 5, true, true);

    // Menu options
    const connectWalletText = this.add.text(320, 280, 'CONNECT TO HEDERA', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    connectWalletText.setShadow(2, 2, '#000000', 3, true, true);

    const associateStarText = this.add.text(320, 330, 'ASSOCIATE STAR', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    associateStarText.setShadow(2, 2, '#000000', 3, true, true);

    const howToPlayText = this.add.text(320, 430, 'HOW TO PLAY', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    howToPlayText.setShadow(2, 2, '#000000', 3, true, true);

    const leaderboardText = this.add.text(320, 490, 'LEADERBOARD', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    leaderboardText.setShadow(2, 2, '#000000', 3, true, true);

    const backText = this.add.text(320, 570, 'GO BACK', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    backText.setShadow(2, 2, '#000000', 3, true, true);

    // Store menu items
    this.menuItems = [connectWalletText, associateStarText, howToPlayText, leaderboardText, backText];
    
    // Selection indicator
    const selector = this.add.text(120, 300, '>', {
      fontSize: '24px',
      color: '#ffff00',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    selector.setShadow(2, 2, '#000000', 3, true, true);

    // Update selector position
    const updateSelector = () => {
      // Reset all colors with font preserved
      connectWalletText.setStyle({ color: '#ffffff', fontFamily: '"Press Start 2P", monospace' });
      associateStarText.setStyle({ color: '#ffffff', fontFamily: '"Press Start 2P", monospace' });
      howToPlayText.setStyle({ color: '#ffffff', fontFamily: '"Press Start 2P", monospace' });
      leaderboardText.setStyle({ color: '#ffffff', fontFamily: '"Press Start 2P", monospace' });
      backText.setStyle({ color: '#ffffff', fontFamily: '"Press Start 2P", monospace' });

      if (this.selectedOption === 0) {
        selector.setY(280);
        connectWalletText.setStyle({ color: '#00ff00', fontFamily: '"Press Start 2P", monospace' });
      } else if (this.selectedOption === 1) {
        selector.setY(330);
        associateStarText.setStyle({ color: '#00ff00', fontFamily: '"Press Start 2P", monospace' });
      } else if (this.selectedOption === 2) {
        selector.setY(430);
        howToPlayText.setStyle({ color: '#00ff00', fontFamily: '"Press Start 2P", monospace' });
      } else if (this.selectedOption === 3) {
        selector.setY(490);
        leaderboardText.setStyle({ color: '#00ff00', fontFamily: '"Press Start 2P", monospace' });
      } else if (this.selectedOption === 4) {
        selector.setY(570);
        backText.setStyle({ color: '#00ff00', fontFamily: '"Press Start 2P", monospace' });
      }
    };
    
    updateSelector();
    
    // Make options interactive
    connectWalletText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.connectWallet();
      })
      .on('pointerover', () => {
        this.selectedOption = 0;
        updateSelector();
      });

    associateStarText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.associateStarToken();
      })
      .on('pointerover', () => {
        this.selectedOption = 1;
        updateSelector();
      });

    howToPlayText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('HowToPlay', { menuMusic: this.menuMusic });
      })
      .on('pointerover', () => {
        this.selectedOption = 2;
        updateSelector();
      });

    leaderboardText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('Leaderboard', { menuMusic: this.menuMusic });
      })
      .on('pointerover', () => {
        this.selectedOption = 3;
        updateSelector();
      });

    backText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MainMenu', { menuMusic: this.menuMusic });
      })
      .on('pointerover', () => {
        this.selectedOption = 4;
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
        this.connectWallet();
      } else if (this.selectedOption === 1) {
        this.associateStarToken();
      } else if (this.selectedOption === 2) {
        this.scene.start('HowToPlay', { menuMusic: this.menuMusic });
      } else if (this.selectedOption === 3) {
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

  private connectWallet() {
    // Trigger wallet connection by dispatching a custom event
    // The React wallet component will listen for this event
    const walletEvent = new CustomEvent('openWalletModal', {
      detail: { source: 'options-menu' }
    });
    window.dispatchEvent(walletEvent);
  }

  private associateStarToken() {
    // Trigger STAR token association by dispatching a custom event
    // The React wallet component will listen for this event
    const associateEvent = new CustomEvent('associateStarToken', {
      detail: { source: 'options-menu' }
    });
    window.dispatchEvent(associateEvent);
  }
}