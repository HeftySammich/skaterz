import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
  private finalScore = 0;
  private survivalTime = 0;
  private sandwichesCollected = 0;
  private cansCollected = 0;
  private starsCollected = 0;
  private enemiesDefeated = 0;
  private selectedOption = 0; // 0 = Play Again, 1 = Main Menu

  constructor() {
    super('GameOver');
  }

  init(data: { score: number, time: number, sandwiches?: number, cans?: number, stars?: number, enemies?: number }) {
    this.finalScore = data.score || 0;
    this.survivalTime = data.time || 0;
    this.sandwichesCollected = data.sandwiches || 0;
    this.cansCollected = data.cans || 0;
    this.starsCollected = data.stars || 0;
    this.enemiesDefeated = data.enemies || 0;
    this.selectedOption = 0; // Reset selection
  }

  create() {
    // Add game over background
    const bg = this.add.image(320, 480, 'game_over_bg');
    bg.setDisplaySize(640, 960);

    // Game Over text
    const gameOverText = this.add.text(320, 200, 'GAME OVER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '40px',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Results text
    this.add.text(320, 320, 'RESULTS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Stats in order: Score, Time, Enemies, Sandwiches, Energy Drinks, Stars
    
    // Final score
    const finalScoreText = this.add.text(320, 400, `SCORE: ${Math.floor(this.finalScore)}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Survival time
    const minutes = Math.floor(this.survivalTime / 60000);
    const seconds = Math.floor((this.survivalTime % 60000) / 1000);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    this.add.text(320, 450, `TIME: ${timeText}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Enemies defeated
    this.add.text(320, 495, `ENEMIES: ${this.enemiesDefeated}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ff6600',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Sandwiches collected - white font as requested
    this.add.text(320, 535, `SANDWICHES: ${this.sandwichesCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Energy drinks collected  
    this.add.text(320, 575, `ENERGY DRINKS: ${this.cansCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Stars collected - larger yellow font
    this.add.text(320, 625, `STARS: ${this.starsCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // High score (using localStorage)
    const highScore = this.getHighScore();
    let highScoreText;
    if (this.finalScore > highScore) {
      this.setHighScore(this.finalScore);
      highScoreText = this.add.text(320, 685, 'NEW HIGH SCORE!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '22px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      // Flash effect for new high score
      this.tweens.add({
        targets: highScoreText,
        alpha: 0.3,
        duration: 500,
        ease: 'Sine.inOut',
        yoyo: true,
        repeat: -1
      });
    } else {
      highScoreText = this.add.text(320, 685, `HIGH SCORE: ${Math.floor(highScore)}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    // Menu options
    const playAgainText = this.add.text(320, 780, 'PLAY AGAIN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    const mainMenuText = this.add.text(320, 830, 'MAIN MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Selection indicator
    const selector = this.add.text(200, 780, '>', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Update selector position
    const updateSelector = () => {
      if (this.selectedOption === 0) {
        selector.setY(780);
        playAgainText.setColor('#00ff00');
        mainMenuText.setColor('#ffffff');
      } else {
        selector.setY(830);
        playAgainText.setColor('#ffffff');
        mainMenuText.setColor('#00ff00');
      }
    };
    
    updateSelector();
    
// console.log(`[DEBUG GAME OVER] Score: ${this.finalScore}, Time: ${timeText}`);

    // Input handling - keyboard
    const upKey = this.input.keyboard?.addKey('UP');
    const downKey = this.input.keyboard?.addKey('DOWN');
    const spaceKey = this.input.keyboard?.addKey('SPACE');
    const enterKey = this.input.keyboard?.addKey('ENTER');
    
    upKey?.on('down', () => {
      this.selectedOption = 0;
      updateSelector();
    });
    
    downKey?.on('down', () => {
      this.selectedOption = 1;
      updateSelector();
    });
    
    const selectOption = () => {
      if (this.selectedOption === 0) {
// console.log('[DEBUG GAME OVER] Starting new game...');
        this.scene.start('Game');
      } else {
// console.log('[DEBUG GAME OVER] Returning to main menu...');
        this.scene.start('MainMenu');
      }
    };
    
    spaceKey?.on('down', selectOption);
    enterKey?.on('down', selectOption);
    
    // Touch/click handling for menu options
    playAgainText.setInteractive({ useHandCursor: true });
    mainMenuText.setInteractive({ useHandCursor: true });
    
    playAgainText.on('pointerdown', () => {
// console.log('[DEBUG GAME OVER] Play Again selected...');
      this.scene.start('Game');
    });
    
    playAgainText.on('pointerover', () => {
      this.selectedOption = 0;
      updateSelector();
    });
    
    mainMenuText.on('pointerdown', () => {
// console.log('[DEBUG GAME OVER] Main Menu selected...');
      this.scene.start('MainMenu');
    });
    
    mainMenuText.on('pointerover', () => {
      this.selectedOption = 1;
      updateSelector();
    });
  }

  getHighScore(): number {
    return parseFloat(localStorage.getItem('zombieSkaterHighScore') || '0');
  }

  setHighScore(score: number): void {
    localStorage.setItem('zombieSkaterHighScore', score.toString());
  }
}