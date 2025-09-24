export class HowToPlay extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;

  constructor() {
    super({ key: 'HowToPlay' });
  }

  init(data: { menuMusic?: Phaser.Sound.BaseSound }) {
    // Receive menu music from OptionsMenu to keep it playing
    this.menuMusic = data.menuMusic || null;
  }

  create() {
    // Add graffiti background
    const bg = this.add.image(320, 480, 'graffiti_bg');
    bg.setDisplaySize(640, 960);
    
    // Title
    this.add.text(320, 80, 'HOW TO PLAY', {
      fontSize: '28px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Game Goal
    this.add.text(320, 150, 'SURVIVE AS LONG AS POSSIBLE!\nCOLLECT STARS, AVOID OBSTACLES', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Collectibles Section with proper spacing from edges
    let yPos = 240;
    
    // Star (first item, using star counter icon)
    const star = this.add.image(120, yPos, 'star_counter_icon');
    star.setScale(0.12);
    this.add.text(200, yPos, 'STARS\nCOLLECT 100 FOR EXTRA LIFE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    yPos += 90;
    
    // Sandwich (second item)
    const sandwich = this.add.image(120, yPos, 'sandwich');
    sandwich.setScale(0.15);
    this.add.text(200, yPos, 'SANDWICH\nRESTORES HEALTH', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    yPos += 90;
    
    // Energy Drink (third item)
    const energyDrink = this.add.image(120, yPos, 'energy_drink');
    energyDrink.setScale(0.15);
    this.add.text(200, yPos, 'ENERGY DRINK\nSTAMINA BOOST + INVINCIBLE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);

    // Controls Section
    yPos += 120;
    this.add.text(320, yPos, 'CONTROLS', {
      fontSize: '20px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    yPos += 50;
    this.add.text(320, yPos, 'TAP/SPACE: JUMP\nSWIPE UP: TRICK (IN AIR)\nSTOMP ON ENEMIES TO DEFEAT', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Back Button
    const backText = this.add.text(320, 800, 'BACK TO OPTIONS', {
      fontSize: '20px',
      color: '#00ff00',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Make back button interactive
    backText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('OptionsMenu', { menuMusic: this.menuMusic });
      })
      .on('pointerover', () => {
        backText.setColor('#ffff00');
      })
      .on('pointerout', () => {
        backText.setColor('#00ff00');
      });
    
    // Handle keyboard input
    const spaceKey = this.input.keyboard?.addKey('SPACE');
    const enterKey = this.input.keyboard?.addKey('ENTER');
    const escKey = this.input.keyboard?.addKey('ESC');
    
    const goBack = () => {
      this.scene.start('OptionsMenu', { menuMusic: this.menuMusic });
    };
    
    spaceKey?.on('down', goBack);
    enterKey?.on('down', goBack);
    escKey?.on('down', goBack);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
  }
}