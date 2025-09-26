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
    console.log('[MENU DEBUG] MainMenu init called with data:', {
      hasMusicParam: !!data.menuMusic,
      globalStarted: window.menuMusicStarted,
      globalExists: !!window.menuMusicInstance
    });
    
    // Receive menu music back from other scenes to keep it playing
    if (data.menuMusic) {
      this.menuMusic = data.menuMusic;
      // Also make sure global instance is updated
      window.menuMusicInstance = data.menuMusic;
      console.log('[MENU DEBUG] Received music from previous scene');
    }
  }

  create() {
    const cam = this.cameras.main;
    
    console.log('[MENU DEBUG] Create started - menuMusic exists:', !!this.menuMusic);
    
    // Only stop sounds if we're NOT coming from another menu scene with music
    if (!this.menuMusic) {
      console.log('[MENU DEBUG] No music passed - stopping all sounds');
      // CRITICAL: Stop ALL sounds first to prevent duplicates
      this.sound.stopAll();
      this.game.sound.stopAll();
      
      // Stop any playing menu music from ANY scene
      const allSounds = this.game.sound.getAllPlaying();
      allSounds.forEach((sound: any) => {
        if (sound.key === 'menu_music') {
          sound.stop();
          sound.destroy();
        }
      });
      
      // Check if we have a global instance that exists and is valid
      if (window.menuMusicInstance) {
        // If instance exists but isn't in our sound manager, it's orphaned - destroy it
        if (!this.sound.get('menu_music')) {
          try {
            window.menuMusicInstance.stop();
            window.menuMusicInstance.destroy();
          } catch (e) {
            // Instance might be invalid
          }
          window.menuMusicInstance = undefined;
          window.menuMusicStarted = false;
        }
      }
    }
    
    // Now create or reference the menu music
    if (!this.menuMusic) {
      console.log('[MENU DEBUG] Need to create/reference music. Started:', window.menuMusicStarted, 'Instance:', !!window.menuMusicInstance);
      
      // Check if the global instance exists but is destroyed/invalid
      let needNewInstance = false;
      if (window.menuMusicInstance) {
        try {
          // Check if the instance is still valid
          const isPlaying = window.menuMusicInstance.isPlaying;
          console.log('[MENU DEBUG] Instance appears valid, isPlaying:', isPlaying);
        } catch (e) {
          console.log('[MENU DEBUG] Instance is invalid/destroyed - need new one');
          needNewInstance = true;
          window.menuMusicInstance = undefined;
        }
      }
      
      if (!window.menuMusicStarted) {
        // First time - create ONE instance
        window.menuMusicStarted = true;
        this.menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
        window.menuMusicInstance = this.menuMusic;
        this.menuMusic.play();
        console.log('[MENU DEBUG] Menu music started - FIRST AND ONLY TIME');
      } else if (window.menuMusicInstance && !needNewInstance) {
        // Music was created before - just reference it
        console.log('[MENU DEBUG] Referencing existing instance. Is playing:', window.menuMusicInstance.isPlaying);
        this.menuMusic = window.menuMusicInstance;
        // Make sure it's playing
        if (!this.menuMusic.isPlaying) {
          console.log('[MENU DEBUG] Music not playing - starting it');
          this.menuMusic.play();
        }
      } else {
        // Flag was set but no instance exists or instance was destroyed - create new one
        console.log('[MENU DEBUG] Creating new music instance (returning from gameplay)');
        this.menuMusic = this.sound.add('menu_music', { loop: true, volume: 0.5 });
        window.menuMusicInstance = this.menuMusic;
        this.menuMusic.play();
        console.log('[MENU DEBUG] Menu music restarted after gameplay');
      }
    } else {
      console.log('[MENU DEBUG] Music already set from init, ensuring it plays');
      // Make sure the music from init is playing
      if (!this.menuMusic.isPlaying) {
        this.menuMusic.play();
      }
    }
    
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