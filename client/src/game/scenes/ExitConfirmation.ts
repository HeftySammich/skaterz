import Phaser from 'phaser';

export class ExitConfirmation extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'ExitConfirmation' });
  }

  create() {
    const cam = this.cameras.main;
    
    // Semi-transparent black background (darker than pause menu)
    const overlay = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.85);
    overlay.setOrigin(0, 0);
    overlay.setDepth(0);

    // Warning message
    const warningText = this.add.text(cam.width / 2, 250, 
      'Exiting will return you to the\nMain Menu and you will forfeit\nany rewards.\n\nWould you like to continue?', {
      fontSize: '20px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 10
    });
    warningText.setOrigin(0.5);
    warningText.setDepth(1);

    // Menu options
    const menuY = 500;
    const spacing = 80;

    const returnText = this.add.text(cam.width / 2, menuY, 'Return to Game', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    returnText.setOrigin(0.5);
    returnText.setDepth(1);
    returnText.setInteractive({ useHandCursor: true });

    const exitText = this.add.text(cam.width / 2, menuY + spacing, 'Exit', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    exitText.setOrigin(0.5);
    exitText.setDepth(1);
    exitText.setInteractive({ useHandCursor: true });

    this.menuItems = [returnText, exitText];

    // Mouse/touch interactions
    returnText.on('pointerover', () => {
      this.selectedIndex = 0;
      this.updateSelection();
    });

    returnText.on('pointerdown', () => {
      this.returnToGame();
    });

    exitText.on('pointerover', () => {
      this.selectedIndex = 1;
      this.updateSelection();
    });

    exitText.on('pointerdown', () => {
      this.exitToMainMenu();
    });

    // Keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    const spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    spaceKey.on('down', () => this.confirmSelection());
    enterKey.on('down', () => this.confirmSelection());

    // Set initial selection
    this.updateSelection();
  }

  update() {
    // Handle keyboard navigation
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this.updateSelection();
    }
  }

  private updateSelection() {
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.setColor('#ffff00'); // Yellow for selected
        item.setScale(1.1);
      } else {
        item.setColor('#ffffff'); // White for unselected
        item.setScale(1.0);
      }
    });
  }

  private confirmSelection() {
    if (this.selectedIndex === 0) {
      this.returnToGame();
    } else {
      this.exitToMainMenu();
    }
  }

  private returnToGame() {
    // Close confirmation dialog, return to pause menu
    this.scene.stop('ExitConfirmation');
  }

  private exitToMainMenu() {
    console.log('🚪 Player exiting to main menu - forfeiting rewards');
    
    // Stop all game-related scenes
    this.scene.stop('ExitConfirmation');
    this.scene.stop('PauseMenu');
    this.scene.stop('Game');
    
    // Go to main menu
    this.scene.start('MainMenu');
  }
}

