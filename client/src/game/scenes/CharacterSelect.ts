import Phaser from 'phaser';
import walletService from '../../services/wallet';

export default class CharacterSelect extends Phaser.Scene {
  private selectedIndex = 0;
  private characters: { container: Phaser.GameObjects.Container; image: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text; locked?: boolean }[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;
  private walletStatus: { hasStacyNft: boolean; hasStarToken: boolean } = { hasStacyNft: false, hasStarToken: false };

  constructor() {
    super('CharacterSelect');
  }

  init(data: { menuMusic?: Phaser.Sound.BaseSound }) {
    // Receive menu music from MainMenu to keep it playing
    this.menuMusic = data.menuMusic || null;
  }

  async create() {
    // Check wallet status for character unlocks FIRST
    console.log('🔍 Checking wallet status for character select...');
    try {
      const gameStatus = await walletService.getWalletGameStatus();
      this.walletStatus = {
        hasStacyNft: gameStatus.hasStacyNft,
        hasStarToken: gameStatus.hasStarToken
      };
      console.log('🎮 Character select wallet status:', this.walletStatus);
    } catch (error) {
      console.warn('⚠️ Could not check wallet status for character select:', error);
      // Default to locked if wallet check fails
      this.walletStatus = { hasStacyNft: false, hasStarToken: false };
    }

    // Now create the UI with the correct wallet status
    const cam = this.cameras.main;
    
    // Add graffiti background
    const bg = this.add.image(cam.centerX, cam.centerY, 'graffiti_bg');
    bg.setDisplaySize(cam.width, cam.height);
    
    // Title
    this.add.text(cam.centerX, 100, 'SELECT CHARACTER', {
      fontSize: '24px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace'
    }).setOrigin(0.5);
    
    // Character 1: Zombie Kev with red outline
    const zombieContainer = this.add.container(cam.centerX - 140, cam.centerY);
    const zombieBorder = this.add.graphics();
    zombieBorder.lineStyle(4, 0xff0000); // Red outline
    zombieBorder.strokeRect(-100, -100, 200, 200);
    const zombieImage = this.add.image(0, 0, 'zombie_character');
    zombieImage.setScale(0.25);
    zombieImage.setInteractive({ useHandCursor: true });
    zombieContainer.add([zombieBorder, zombieImage]);
    
    const zombieName = this.add.text(cam.centerX - 140, cam.centerY + 150, 'KEV', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace'
    }).setOrigin(0.5);
    
    // Character 2: Stacy with conditional lock/unlock
    const stacyContainer = this.add.container(cam.centerX + 140, cam.centerY);
    const stacyBorder = this.add.graphics();
    stacyBorder.lineStyle(4, 0xff0000); // Red outline
    stacyBorder.strokeRect(-100, -100, 200, 200);
    const stacyImage = this.add.image(0, 0, 'stacy_character');
    stacyImage.setScale(0.25);

    // Check if Stacy is unlocked
    const stacyUnlocked = this.walletStatus.hasStacyNft;
    let stacyName: Phaser.GameObjects.Text;
    let lockOverlay: Phaser.GameObjects.Graphics | null = null;
    let lockText: Phaser.GameObjects.Text | null = null;

    if (stacyUnlocked) {
      // Stacy is unlocked - normal interaction
      stacyImage.setInteractive({ useHandCursor: true });
      stacyImage.on('pointerdown', () => {
        this.selectedIndex = 1;
        this.confirmSelection();
      });
      stacyName = this.add.text(cam.centerX + 140, cam.centerY + 150, 'STACY', {
        fontSize: '22px',
        color: '#00ff00', // Green for unlocked
        fontFamily: '"Press Start 2P", monospace'
      }).setOrigin(0.5);
    } else {
      // Stacy is locked - add lock overlay
      stacyImage.setTint(0x666666); // Darken the image
      lockOverlay = this.add.graphics();
      lockOverlay.fillStyle(0x000000, 0.7);
      lockOverlay.fillRect(-100, -100, 200, 200);
      lockText = this.add.text(0, 0, '🔒', {
        fontSize: '48px',
        color: '#ffffff'
      }).setOrigin(0.5);
      stacyContainer.add([lockOverlay, lockText]);

      stacyName = this.add.text(cam.centerX + 140, cam.centerY + 150, 'STACY\n(LOCKED)', {
        fontSize: '18px',
        color: '#ff6666', // Red for locked
        fontFamily: '"Press Start 2P", monospace',
        align: 'center'
      }).setOrigin(0.5);

      // Add click handler to show unlock info
      stacyImage.setInteractive({ useHandCursor: true });
      stacyImage.on('pointerdown', () => {
        this.showUnlockInfo();
      });
    }

    stacyContainer.add([stacyBorder, stacyImage]);
    
    // Store characters for selection
    this.characters = [
      { container: zombieContainer, image: zombieImage, name: zombieName, locked: false },
      { container: stacyContainer, image: stacyImage, name: stacyName, locked: !stacyUnlocked }
    ];
    
    // Selection indicator
    const selectionIndicator = this.add.graphics();
    selectionIndicator.lineStyle(4, 0xffff00);
    
    // Input handling
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Mouse/touch input
    zombieImage.on('pointerdown', () => {
      this.selectedIndex = 0;
      this.confirmSelection();
    });

    // Stacy click handler is set above based on unlock status
    
    // Update initial selection
    this.updateSelection();
    
    // Main Menu button
    const mainMenuButton = this.add.text(cam.centerX, cam.height - 80, 'MAIN MENU', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    // Make it interactive
    mainMenuButton.setInteractive({ useHandCursor: true });
    
    mainMenuButton.on('pointerover', () => {
      mainMenuButton.setColor('#00ff00');
      mainMenuButton.setScale(1.1);
    });
    
    mainMenuButton.on('pointerout', () => {
      mainMenuButton.setColor('#ffffff');
      mainMenuButton.setScale(1);
    });
    
    mainMenuButton.on('pointerdown', () => {
      this.scene.start('MainMenu', { menuMusic: this.menuMusic });
    });
  }
  
  update() {
    // Navigation
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.selectedIndex = 0;
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.selectedIndex = 1;
      this.updateSelection();
    }
    
    // Confirmation
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) || 
        Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ENTER'))) {
      this.confirmSelection();
    }
    
    // Back to main menu
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ESC'))) {
      this.scene.start('MainMenu', { menuMusic: this.menuMusic });
    }
  }
  
  updateSelection() {
    // Update visual selection
    this.characters.forEach((char, index) => {
      if (index === this.selectedIndex) {
        char.name.setColor('#ffff00');
        char.name.setScale(1.2);
        
        // Add glow effect to selected character
        char.image.setTint(0xffffaa);
      } else {
        char.name.setColor('#ffffff');
        char.name.setScale(1);
        
        // Clear tint from unselected character
        char.image.clearTint();
      }
    });
  }
  
  confirmSelection() {
    const character = this.characters[this.selectedIndex];

    // Check if character is locked
    if (character.locked) {
      this.showUnlockInfo();
      return;
    }

    // Stop ALL sounds including menu music when game starts
    this.sound.stopAll();
    this.game.sound.stopAll();

    // Stop global menu music instance on window
    if ((window as any).menuMusicInstance) {
      try {
        (window as any).menuMusicInstance.stop();
        (window as any).menuMusicInstance.destroy();
      } catch (e) {
        // Music might already be destroyed
      }
      (window as any).menuMusicInstance = undefined;
      // CRITICAL: Reset the flag so menu music can restart when returning to menu
      (window as any).menuMusicStarted = false;
    }

    // Pass selected character to Game scene
    const selectedCharacter = this.selectedIndex === 0 ? 'kev' : 'stacy';
    this.scene.start('Game', { selectedCharacter });
  }

  showUnlockInfo() {
    // Create modal overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlay.setDepth(1000);

    // Create info box
    const boxWidth = 600;
    const boxHeight = 400;
    const boxX = this.cameras.main.centerX - boxWidth / 2;
    const boxY = this.cameras.main.centerY - boxHeight / 2;

    const infoBox = this.add.graphics();
    infoBox.fillStyle(0x333333);
    infoBox.fillRect(boxX, boxY, boxWidth, boxHeight);
    infoBox.lineStyle(4, 0xff6666);
    infoBox.strokeRect(boxX, boxY, boxWidth, boxHeight);
    infoBox.setDepth(1001);

    // Title
    const title = this.add.text(this.cameras.main.centerX, boxY + 60, 'STACY LOCKED', {
      fontSize: '24px',
      color: '#ff6666',
      fontFamily: '"Press Start 2P", monospace'
    }).setOrigin(0.5).setDepth(1002);

    // Info text
    const infoText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 20,
      'To unlock Stacy, you need to:\n\n' +
      '1. Connect your Hedera wallet\n' +
      '2. Hold Token ID: 0.0.9963841\n' +
      '3. Serial #1 or #2 required\n\n' +
      'Connect wallet in Options Menu!', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5).setDepth(1002);

    // Close button
    const closeButton = this.add.text(this.cameras.main.centerX, boxY + boxHeight - 60, 'CLOSE', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      backgroundColor: '#666666',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(1002);

    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => {
      overlay.destroy();
      infoBox.destroy();
      title.destroy();
      infoText.destroy();
      closeButton.destroy();
    });
  }
}