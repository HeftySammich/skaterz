export class MainMenu extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private buttonBaseScales: number[] = [];
  private menuMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MainMenu' });
  }

  init(data: { menuMusic?: Phaser.Sound.BaseSound }) {
    // Receive menu music back from other scenes to keep it playing
    if (data.menuMusic) {
      this.menuMusic = data.menuMusic;
    }
  }

  create() {
    const cam = this.cameras.main;
    
    // Start menu music only if not already playing
    if (!this.menuMusic || !this.menuMusic.isPlaying) {
      this.menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
      this.menuMusic.play();
    }
    
    // Add menu background image (responsive scaling to fill screen)
    const background = this.add.image(cam.centerX, cam.centerY, 'menu_background');
    const backgroundScale = Math.max(cam.width / background.width, cam.height / background.height);
    background.setScale(backgroundScale).setScrollFactor(0);
    
    // Calculate responsive button size (target 40% of screen width, but not larger than original)
    const targetButtonWidth = cam.width * 0.4;
    
    // Add button images - positioned responsively below the SKATERZ title
    const playButton = this.add.image(cam.centerX, cam.height * 0.78, 'play_button').setOrigin(0.5);
    const optionsButton = this.add.image(cam.centerX, cam.height * 0.86, 'options_button').setOrigin(0.5);
    
    // Add text-based leaderboard button
    const leaderboardButton = this.add.text(cam.centerX, cam.height * 0.94, 'LEADERBOARD', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Calculate base scales for buttons to fit target size
    const playBaseScale = Math.min(targetButtonWidth / playButton.width, 0.8);
    const optionsBaseScale = Math.min(targetButtonWidth / optionsButton.width, 0.8);
    const leaderboardBaseScale = 1.0; // Text element, use scale 1.0
    
    playButton.setScale(playBaseScale);
    optionsButton.setScale(optionsBaseScale);
    leaderboardButton.setScale(leaderboardBaseScale);
    
    // Store base scales for selection highlighting
    this.buttonBaseScales = [playBaseScale, optionsBaseScale, leaderboardBaseScale];
    
    this.menuItems = [playButton, optionsButton, leaderboardButton];

    // Make buttons interactive
    playButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectItem(0);
        this.confirmSelection();
      });
      
    optionsButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectItem(1);
        this.confirmSelection();
      });
      
    leaderboardButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectItem(2);
        this.confirmSelection();
      });


    // Set up input (create keys once)
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Set initial selection
    this.updateSelection();
  }

  update() {
    // Handle input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) || 
               Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.confirmSelection();
    }
  }

  private selectItem(index: number) {
    this.selectedIndex = index;
    this.updateSelection();
  }

  private updateSelection() {
    this.menuItems.forEach((item, index) => {
      const baseScale = this.buttonBaseScales[index];
      if (index === this.selectedIndex) {
        // Highlight selected button with more visible scale increase and tint
        item.setScale(baseScale * 1.2);
        item.setTint(0xffff00); // Bright yellow tint for better visibility
      } else {
        // Normal button appearance with base scale
        item.setScale(baseScale);
        item.clearTint();
      }
    });
  }

  private confirmSelection() {
    if (this.selectedIndex === 0) {
      // Go to character select, keep music playing
      this.scene.start('CharacterSelect', { menuMusic: this.menuMusic });
    } else if (this.selectedIndex === 1) {
      // Go to options, keep music playing
      this.scene.start('OptionsMenu', { menuMusic: this.menuMusic });
    } else if (this.selectedIndex === 2) {
      // Go to leaderboard, keep music playing
      this.scene.start('Leaderboard', { menuMusic: this.menuMusic });
    }
  }
}