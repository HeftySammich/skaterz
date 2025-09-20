export class MainMenu extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Image[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    // Add menu background image (contains SKATERZ title)
    this.add.image(320, 480, 'menu_background').setOrigin(0.5);
    
    // Add button images - smaller and positioned below the SKATERZ title
    const playButton = this.add.image(320, 650, 'play_button').setOrigin(0.5).setScale(0.6);
    const optionsButton = this.add.image(320, 720, 'options_button').setOrigin(0.5).setScale(0.6);

    this.menuItems = [playButton, optionsButton];

    // Controls hint
    this.add.text(320, 750, 'ARROW KEYS + ENTER', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Touch/click support (adjusted for new button positions)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const y = pointer.y;
      if (y >= 620 && y <= 680) { // Play button area
        this.selectItem(0);
        this.confirmSelection();
      } else if (y >= 690 && y <= 750) { // Options button area
        this.selectItem(1);
        this.confirmSelection();
      }
    });

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
               Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ENTER'))) {
      this.confirmSelection();
    }
  }

  private selectItem(index: number) {
    this.selectedIndex = index;
    this.updateSelection();
  }

  private updateSelection() {
    this.menuItems.forEach((item, index) => {
      if (index === this.selectedIndex) {
        // Highlight selected button with scale and tint
        item.setScale(1.1);
        item.setTint(0xffff88); // Light yellow tint
      } else {
        // Normal button appearance
        item.setScale(1.0);
        item.clearTint();
      }
    });
  }

  private confirmSelection() {
    if (this.selectedIndex === 0) {
      // Start game
      this.scene.start('Game');
    } else if (this.selectedIndex === 1) {
      // Options (placeholder for now)
      this.scene.start('OptionsMenu');
    }
  }
}