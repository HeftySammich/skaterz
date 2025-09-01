export class MainMenu extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainMenu' });
  }

  create() {
    // Menu background
    this.cameras.main.setBackgroundColor('#162b4d');
    
    // Title
    this.add.text(240, 40, 'ZOMBIE SKATER', {
      fontSize: '28px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Menu options
    const startGame = this.add.text(240, 100, 'START GAME', {
      fontSize: '16px',
      color: '#b9c0cf',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    const options = this.add.text(240, 130, 'OPTIONS', {
      fontSize: '16px',
      color: '#b9c0cf',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.menuItems = [startGame, options];

    // Controls hint
    this.add.text(240, 150, 'USE ARROW KEYS + ENTER', {
      fontSize: '8px',
      color: '#646c7a',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Touch/click support
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const y = pointer.y;
      if (y >= 85 && y <= 115) {
        this.selectItem(0);
        this.confirmSelection();
      } else if (y >= 115 && y <= 145) {
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
        item.setColor('#ffecb3');
        item.setScale(1.1);
      } else {
        item.setColor('#b9c0cf');
        item.setScale(1.0);
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