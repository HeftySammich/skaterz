import Phaser from 'phaser';

export class PauseMenu extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'PauseMenu' });
  }

  create() {
    const cam = this.cameras.main;
    
    // Semi-transparent black background
    const overlay = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setDepth(0);

    // "PAUSED" title at top
    const pausedText = this.add.text(cam.width / 2, 200, 'PAUSED', {
      fontSize: '48px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    });
    pausedText.setOrigin(0.5);
    pausedText.setDepth(1);

    // Menu options
    const menuY = 400;
    const spacing = 80;

    const continueText = this.add.text(cam.width / 2, menuY, 'Continue', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    continueText.setOrigin(0.5);
    continueText.setDepth(1);
    continueText.setInteractive({ useHandCursor: true });

    const exitText = this.add.text(cam.width / 2, menuY + spacing, 'Exit to Main Menu', {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    exitText.setOrigin(0.5);
    exitText.setDepth(1);
    exitText.setInteractive({ useHandCursor: true });

    this.menuItems = [continueText, exitText];

    // Mouse/touch interactions
    continueText.on('pointerover', () => {
      this.selectedIndex = 0;
      this.updateSelection();
    });

    continueText.on('pointerdown', () => {
      this.continueGame();
    });

    exitText.on('pointerover', () => {
      this.selectedIndex = 1;
      this.updateSelection();
    });

    exitText.on('pointerdown', () => {
      this.showExitConfirmation();
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
      this.continueGame();
    } else {
      this.showExitConfirmation();
    }
  }

  private continueGame() {
    this.scene.stop('PauseMenu');
    this.scene.resume('Game');
  }

  private showExitConfirmation() {
    // Launch confirmation dialog
    this.scene.launch('ExitConfirmation');
  }
}

