import Phaser from 'phaser';

export default class CharacterSelect extends Phaser.Scene {
  private selectedIndex = 0;
  private characters: { container: Phaser.GameObjects.Container; image: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text }[] = [];
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
    
    // Character 2: Stacy with red outline
    const stacyContainer = this.add.container(cam.centerX + 140, cam.centerY);
    const stacyBorder = this.add.graphics();
    stacyBorder.lineStyle(4, 0xff0000); // Red outline
    stacyBorder.strokeRect(-100, -100, 200, 200);
    const stacyImage = this.add.image(0, 0, 'stacy_character');
    stacyImage.setScale(0.25);
    stacyImage.setInteractive({ useHandCursor: true });
    stacyContainer.add([stacyBorder, stacyImage]);
    
    const stacyName = this.add.text(cam.centerX + 140, cam.centerY + 150, 'STACY', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace'
    }).setOrigin(0.5);
    
    // Store characters for selection
    this.characters = [
      { container: zombieContainer, image: zombieImage, name: zombieName },
      { container: stacyContainer, image: stacyImage, name: stacyName }
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
    
    stacyImage.on('pointerdown', () => {
      this.selectedIndex = 1;
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
    }
    
    // Pass selected character to Game scene
    const selectedCharacter = this.selectedIndex === 0 ? 'kev' : 'stacy';
    this.scene.start('Game', { selectedCharacter });
  }
}