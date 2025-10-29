export class HowToPlay extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;
  private currentPage: number = 1;
  private totalPages: number = 3;
  private page1Container!: Phaser.GameObjects.Container;
  private page2Container!: Phaser.GameObjects.Container;
  private page3Container!: Phaser.GameObjects.Container;
  private pageText!: Phaser.GameObjects.Text;
  private leftArrow!: Phaser.GameObjects.Text;
  private rightArrow!: Phaser.GameObjects.Text;

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
    
    // Title (always visible)
    const title = this.add.text(320, 60, 'HOW TO PLAY', {
      fontSize: '24px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    title.setShadow(3, 3, '#000000', 5, true, true);

    // Create containers for pages
    this.page1Container = this.add.container(0, 0);
    this.page2Container = this.add.container(0, 0);
    this.page3Container = this.add.container(0, 0);

    // PAGE 1 CONTENT
    // Add semi-transparent black background for page 1 content
    const page1Bg = this.add.graphics();
    page1Bg.fillStyle(0x000000, 0.6); // Black with 60% opacity
    page1Bg.fillRoundedRect(40, 110, 560, 630, 15);
    this.page1Container.add(page1Bg);
    
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
    this.page1Container.add(goalText);

    // Collectibles Section with much more spacing
    let yPos = 220;
    
    // Star (first item, using star counter icon)
    const star = this.add.image(100, yPos, 'star_counter_icon');
    star.setScale(0.10);
    this.page1Container.add(star);
    const starText = this.add.text(180, yPos, 'STARS\nCOLLECT 100 FOR EXTRA LIFE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
    starText.setShadow(2, 2, '#000000', 3, true, true);
    this.page1Container.add(starText);

    yPos += 110; // Increased spacing
    
    // Sandwich (second item)
    const sandwich = this.add.image(100, yPos, 'sandwich');
    sandwich.setScale(0.13);
    this.page1Container.add(sandwich);
    const sandwichText = this.add.text(180, yPos, 'SANDWICH\nRESTORES HEALTH', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
    sandwichText.setShadow(2, 2, '#000000', 3, true, true);
    this.page1Container.add(sandwichText);

    yPos += 120; // Slightly more spacing before energy drink
    
    // Energy Drink (third item - lowered more)
    const energyDrink = this.add.image(100, yPos, 'energy_drink');
    energyDrink.setScale(0.13);
    this.page1Container.add(energyDrink);
    const drinkText = this.add.text(180, yPos, 'ENERGY DRINK\nSTAMINA BOOST + INVINCIBLE', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0, 0.5);
    drinkText.setShadow(2, 2, '#000000', 3, true, true);
    this.page1Container.add(drinkText);

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
    this.page1Container.add(controlsTitle);

    yPos += 60;
    const controlsText = this.add.text(320, yPos, 'TAP/SPACE: JUMP\nSWIPE UP/J KEY: TRICK (IN AIR)\nSTOMP ON ENEMIES TO DEFEAT', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    controlsText.setShadow(2, 2, '#000000', 3, true, true);
    this.page1Container.add(controlsText);
    
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
    this.page1Container.add(comboText);

    // PAGE 2 CONTENT - POWER-UPS
    // Add semi-transparent black background for page 2 content
    const page2Bg = this.add.graphics();
    page2Bg.fillStyle(0x000000, 0.6); // Black with 60% opacity
    page2Bg.fillRoundedRect(40, 110, 560, 630, 15);
    this.page2Container.add(page2Bg);
    
    // Power-Ups Title
    const powerUpsTitle = this.add.text(320, 130, 'POWER-UPS', {
      fontSize: '20px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    powerUpsTitle.setShadow(2, 2, '#000000', 4, true, true);
    this.page2Container.add(powerUpsTitle);

    // Power-ups with more spacing
    yPos = 220;
    
    // Star Magnet
    const crystal = this.add.image(100, yPos, 'crystal_magnet');
    crystal.setScale(0.12);
    this.page2Container.add(crystal);
    const crystalText = this.add.text(180, yPos, 'STAR MAGNET\nATTRACTS NEARBY STARS', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2,
      lineSpacing: 5
    }).setOrigin(0, 0.5);
    crystalText.setShadow(2, 2, '#000000', 3, true, true);
    this.page2Container.add(crystalText);

    yPos += 150; // Increased spacing between power-ups
    
    // Metal Gear (moved slightly right to fit better in box)
    const metalBoard = this.add.image(115, yPos, 'metal_skateboard');
    metalBoard.setScale(0.20);
    this.page2Container.add(metalBoard);
    const metalText = this.add.text(180, yPos, 'METAL GEAR\nINVINCIBLE TO DAMAGE FROM\nALL FLOOR OBSTACLES', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2,
      lineSpacing: 5
    }).setOrigin(0, 0.5);
    metalText.setShadow(2, 2, '#000000', 3, true, true);
    this.page2Container.add(metalText);

    yPos += 150; // Increased spacing between power-ups
    
    // Flaming Taco
    const fireTaco = this.add.image(100, yPos, 'fire_taco');
    fireTaco.setScale(0.12);
    this.page2Container.add(fireTaco);
    const fireText = this.add.text(180, yPos, 'FLAMING TACO\nBURN ENEMIES ON TOUCH\nTHANKS TO ROOSTER\nCARTEL MANGA\nHABANERO SALSA', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'left',
      stroke: '#000000',
      strokeThickness: 2,
      lineSpacing: 5
    }).setOrigin(0, 0.5);
    fireText.setShadow(2, 2, '#000000', 3, true, true);
    this.page2Container.add(fireText);

    // Add note about power-ups
    const noteText = this.add.text(320, 670, 'POWER-UPS SPAWN RANDOMLY\nWATCH FOR WARNING SIGNS!', {
      fontSize: '16px',
      color: '#ffff00',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    noteText.setShadow(2, 2, '#000000', 3, true, true);
    this.page2Container.add(noteText);

    // Hide page 2 initially
    this.page2Container.setVisible(false);

    // PAGE 3 CONTENT - WAVE SYSTEM
    // Add semi-transparent black background for page 3 content
    const page3Bg = this.add.graphics();
    page3Bg.fillStyle(0x000000, 0.6); // Black with 60% opacity
    page3Bg.fillRoundedRect(40, 110, 560, 630, 15);
    this.page3Container.add(page3Bg);
    
    // Wave System Title
    const waveTitle = this.add.text(320, 130, 'WAVE SYSTEM', {
      fontSize: '20px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    waveTitle.setShadow(2, 2, '#000000', 4, true, true);
    this.page3Container.add(waveTitle);

    // Fun intro text
    yPos = 190;
    const introText = this.add.text(320, yPos, 'READY TO CONQUER THE STREETS?', {
      fontSize: '12px',
      color: '#ff00ff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    introText.setShadow(2, 2, '#000000', 3, true, true);
    this.page3Container.add(introText);
    
    yPos += 60;
    
    // How waves work
    const howItWorksTitle = this.add.text(320, yPos, 'HOW IT WORKS', {
      fontSize: '18px',
      color: '#00ff00',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    howItWorksTitle.setShadow(2, 2, '#000000', 3, true, true);
    this.page3Container.add(howItWorksTitle);
    
    yPos += 50;
    const howItWorksText = this.add.text(320, yPos, 'EACH WAVE IS DIFFERENT!', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
      lineSpacing: 8
    }).setOrigin(0.5);
    howItWorksText.setShadow(2, 2, '#000000', 3, true, true);
    this.page3Container.add(howItWorksText);
    
    yPos += 80;
    
    // How to advance section
    const challengesText = this.add.text(320, yPos, 'DO COOL STUFF TO\nADVANCE TO NEXT WAVE\n\nEXAMPLES:\nSTOMP ENEMIES! COLLECT STARS!\nDO TRICKS! SURVIVE!', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
      lineSpacing: 8
    }).setOrigin(0.5);
    challengesText.setShadow(2, 2, '#000000', 3, true, true);
    this.page3Container.add(challengesText);
    
    yPos += 140;
    
    // Difficulty progression
    const difficultyTitle = this.add.text(320, yPos, 'SHRED & SURVIVE!', {
      fontSize: '18px',
      color: '#ff0000',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    difficultyTitle.setShadow(2, 2, '#000000', 3, true, true);
    this.page3Container.add(difficultyTitle);
    
    yPos += 50;
    const difficultyText = this.add.text(320, yPos, 'EACH WAVE GETS FASTER\nMORE ENEMIES SPAWN\nUNLOCK POWER-UPS!', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2,
      lineSpacing: 8
    }).setOrigin(0.5);
    difficultyText.setShadow(2, 2, '#000000', 3, true, true);
    this.page3Container.add(difficultyText);
    
    // Victory note
    yPos += 85;
    const victoryText = this.add.text(320, yPos, 'BEAT ALL 3 WAVES\nTO CLAIM DESTINY!', {
      fontSize: '18px',
      color: '#ff00ff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
      lineSpacing: 8
    }).setOrigin(0.5);
    victoryText.setShadow(3, 3, '#000000', 4, true, true);
    this.page3Container.add(victoryText);
    
    // Hide page 3 initially
    this.page3Container.setVisible(false);

    // Add page navigation
    // Page indicator
    this.pageText = this.add.text(320, 800, 'Page 1/3', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.pageText.setShadow(2, 2, '#000000', 3, true, true);

    // Left Arrow
    this.leftArrow = this.add.text(200, 800, '<', {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.leftArrow.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.previousPage())
      .on('pointerover', () => this.leftArrow.setColor('#ffff00'))
      .on('pointerout', () => this.leftArrow.setColor(this.currentPage === 1 ? '#808080' : '#00ff00'));
    this.leftArrow.setColor('#808080'); // Disabled initially

    // Right Arrow
    this.rightArrow = this.add.text(440, 800, '>', {
      fontSize: '24px',
      color: '#00ff00',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.rightArrow.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.nextPage())
      .on('pointerover', () => this.rightArrow.setColor('#ffff00'))
      .on('pointerout', () => this.rightArrow.setColor(this.currentPage === this.totalPages ? '#808080' : '#00ff00'));

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
    
    // Add left/right key navigation
    const leftKey = this.input.keyboard?.addKey('LEFT');
    const rightKey = this.input.keyboard?.addKey('RIGHT');
    
    leftKey?.on('down', () => this.previousPage());
    rightKey?.on('down', () => this.nextPage());
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePage();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePage();
    }
  }
  
  updatePage() {
    // Update page visibility
    this.page1Container.setVisible(this.currentPage === 1);
    this.page2Container.setVisible(this.currentPage === 2);
    this.page3Container.setVisible(this.currentPage === 3);
    
    // Update page indicator
    this.pageText.setText(`Page ${this.currentPage}/${this.totalPages}`);
    
    // Update arrow colors
    this.leftArrow.setColor(this.currentPage === 1 ? '#808080' : '#00ff00');
    this.rightArrow.setColor(this.currentPage === this.totalPages ? '#808080' : '#00ff00');
  }
}