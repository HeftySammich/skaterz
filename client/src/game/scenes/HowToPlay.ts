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
    const title = this.add.text(320, 60, 'HOW TO PLAY', {
      fontSize: '24px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    title.setShadow(3, 3, '#000000', 5, true, true);

    // Game Goal
    const goalText = this.add.text(320, 130, 'SURVIVE AS LONG AS POSSIBLE!\nCOLLECT STARS, AVOID OBSTACLES', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    goalText.setShadow(2, 2, '#000000', 4, true, true);

    // Collectibles Section with much more spacing
    let yPos = 220;
    
    // Star (first item, using star counter icon)
    const star = this.add.image(100, yPos, 'star_counter_icon');
    star.setScale(0.10);
    const starText = this.add.text(180, yPos, 'STARS\nCOLLECT 100 FOR EXTRA LIFE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
    starText.setShadow(2, 2, '#000000', 3, true, true);

    yPos += 110; // Increased spacing
    
    // Sandwich (second item)
    const sandwich = this.add.image(100, yPos, 'sandwich');
    sandwich.setScale(0.13);
    const sandwichText = this.add.text(180, yPos, 'SANDWICH\nRESTORES HEALTH', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
    sandwichText.setShadow(2, 2, '#000000', 3, true, true);

    yPos += 120; // Slightly more spacing before energy drink
    
    // Energy Drink (third item - lowered more)
    const energyDrink = this.add.image(100, yPos, 'energy_drink');
    energyDrink.setScale(0.13);
    const drinkText = this.add.text(180, yPos, 'ENERGY DRINK\nSTAMINA BOOST + INVINCIBLE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
    drinkText.setShadow(2, 2, '#000000', 3, true, true);

    // Controls Section
    yPos += 130; // More spacing before controls
    const controlsTitle = this.add.text(320, yPos, 'CONTROLS', {
      fontSize: '20px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    controlsTitle.setShadow(2, 2, '#000000', 4, true, true);

    yPos += 60;
    const controlsText = this.add.text(320, yPos, 'TAP/SPACE: JUMP\nSWIPE UP: TRICK (IN AIR)\nSTOMP ON ENEMIES TO DEFEAT', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    controlsText.setShadow(2, 2, '#000000', 3, true, true);
    
    // Add combo instruction in smaller font
    yPos += 70;
    const comboText = this.add.text(320, yPos, 'COMBINING TRICKS AND KILLS\nSTARTS COMBOS', {
      fontSize: '12px',
      color: '#ffff00',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    comboText.setShadow(2, 2, '#000000', 3, true, true);

    // Back Button
    const backText = this.add.text(320, 850, 'BACK TO OPTIONS', {
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