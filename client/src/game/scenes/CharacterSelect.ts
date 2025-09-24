import Phaser from 'phaser';

export default class CharacterSelect extends Phaser.Scene {
  private selectedIndex = 0;
  private characters: { image: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text }[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;

  constructor() {
    super('CharacterSelect');
  }

  init(data: { menuMusic?: Phaser.Sound.BaseSound }) {
    // Receive menu music from MainMenu to keep it playing
    this.menuMusic = data.menuMusic || null;
  }

  create() {
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
    
    // Character 1: Kev
    const kevImage = this.add.image(cam.centerX - 200, cam.centerY, 'kev_character');
    kevImage.setScale(0.3);
    kevImage.setInteractive({ useHandCursor: true });
    
    const kevName = this.add.text(cam.centerX - 200, cam.centerY + 150, 'KEV', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace'
    }).setOrigin(0.5);
    
    // Character 2: Mystery character (black square)
    const mysteryGraphics = this.add.graphics();
    mysteryGraphics.fillStyle(0x000000, 1);
    mysteryGraphics.fillRect(cam.centerX + 100, cam.centerY - 100, 200, 200);
    
    const mysteryName = this.add.text(cam.centerX + 200, cam.centerY + 150, '???', {
      fontSize: '16px',
      color: '#666666',
      fontFamily: '"Press Start 2P", monospace'
    }).setOrigin(0.5);
    
    // Store characters for selection
    this.characters = [
      { image: kevImage, name: kevName },
      { image: mysteryGraphics as any, name: mysteryName }
    ];
    
    // Selection indicator
    const selectionIndicator = this.add.graphics();
    selectionIndicator.lineStyle(4, 0xffff00);
    
    // Input handling
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Mouse/touch input
    kevImage.on('pointerdown', () => {
      this.selectedIndex = 0;
      this.confirmSelection();
    });
    
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
        if (char.image.setTint) {
          char.image.setTint(0xffffaa);
        }
      } else {
        char.name.setColor(index === 0 ? '#ffffff' : '#666666');
        char.name.setScale(1);
        
        if (char.image.clearTint) {
          char.image.clearTint();
        }
      }
    });
  }
  
  confirmSelection() {
    if (this.selectedIndex === 0) {
      // Selected Kev - start the game
      // Stop menu music when game starts
      if (this.menuMusic && this.menuMusic.isPlaying) {
        this.menuMusic.stop();
      }
      this.scene.start('Game');
    } else {
      // Mystery character - show "coming soon" message
      const comingSoon = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 200, 'COMING SOON', {
        fontSize: '20px',
        color: '#ff0000',
        fontFamily: '"Press Start 2P", monospace'
      }).setOrigin(0.5);
      
      // Fade out the message
      this.tweens.add({
        targets: comingSoon,
        alpha: 0,
        duration: 2000,
        onComplete: () => comingSoon.destroy()
      });
    }
  }
}