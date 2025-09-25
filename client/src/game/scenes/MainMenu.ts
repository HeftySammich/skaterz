// Global window variable for menu music with debugging
declare global {
  interface Window {
    menuMusicInstance?: Phaser.Sound.BaseSound;
    menuMusicStarted?: boolean; // Track if music has ever been started
    menuMusicDebug?: string[]; // Debug log
  }
}

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
    
    // Initialize debug log if not exists
    if (!window.menuMusicDebug) {
      window.menuMusicDebug = [];
    }
    
    const timestamp = new Date().toISOString();
    
    // CRITICAL: Check if music is already playing
    const allSounds = this.sound.getAllPlaying();
    const menuMusicAlreadyPlaying = allSounds.some((s: any) => s.key === 'menu_music');
    
    window.menuMusicDebug.push(`[${timestamp}] MainMenu.create() called`);
    window.menuMusicDebug.push(`[${timestamp}] Music already playing: ${menuMusicAlreadyPlaying}`);
    window.menuMusicDebug.push(`[${timestamp}] Global instance exists: ${!!window.menuMusicInstance}`);
    window.menuMusicDebug.push(`[${timestamp}] Music started flag: ${window.menuMusicStarted}`);
    
    // If menu music is already playing ANYWHERE, don't create new one
    if (menuMusicAlreadyPlaying) {
      window.menuMusicDebug.push(`[${timestamp}] SKIPPING: Menu music already playing`);
      // Find and reference the playing instance
      const playingMusic = allSounds.find((s: any) => s.key === 'menu_music');
      if (playingMusic) {
        this.menuMusic = playingMusic;
        window.menuMusicInstance = playingMusic;
      }
      return; // EXIT EARLY - don't create new music
    }
    
    // Check if music exists globally
    if (window.menuMusicInstance && window.menuMusicInstance.isPlaying) {
      window.menuMusicDebug.push(`[${timestamp}] Using existing global instance`);
      this.menuMusic = window.menuMusicInstance;
    } else if (!window.menuMusicStarted) {
      // This is the VERY FIRST time - create music ONCE
      window.menuMusicStarted = true;
      window.menuMusicDebug.push(`[${timestamp}] Creating menu music for FIRST TIME`);
      
      // Create menu music ONCE
      this.menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
      window.menuMusicInstance = this.menuMusic;
      this.menuMusic.play();
      console.log('Menu music started');
      window.menuMusicDebug.push(`[${timestamp}] Menu music STARTED`);
    } else {
      window.menuMusicDebug.push(`[${timestamp}] No action taken - music should already exist`);
    }
    
    // Log current state
    console.log('Menu Music Debug Log:', window.menuMusicDebug);
    
    // Add menu background image (responsive scaling to fill screen)
    const background = this.add.image(cam.centerX, cam.centerY, 'menu_background');
    const backgroundScale = Math.max(cam.width / background.width, cam.height / background.height);
    background.setScale(backgroundScale).setScrollFactor(0);
    
    // Calculate responsive button size (target 40% of screen width, but not larger than original)
    const targetButtonWidth = cam.width * 0.4;
    
    // Add button images - positioned responsively below the SKATERZ title
    const playButton = this.add.image(cam.centerX, cam.height * 0.82, 'play_button').setOrigin(0.5);
    const optionsButton = this.add.image(cam.centerX, cam.height * 0.92, 'options_button').setOrigin(0.5);

    // Calculate base scales for buttons to fit target size
    const playBaseScale = Math.min(targetButtonWidth / playButton.width, 0.8);
    const optionsBaseScale = Math.min(targetButtonWidth / optionsButton.width, 0.8);
    
    playButton.setScale(playBaseScale);
    optionsButton.setScale(optionsBaseScale);
    
    // Store base scales for selection highlighting
    this.buttonBaseScales = [playBaseScale, optionsBaseScale];
    
    this.menuItems = [playButton, optionsButton];

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
    }
  }
}