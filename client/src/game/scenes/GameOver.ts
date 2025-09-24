import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
  private finalScore = 0;
  private survivalTime = 0;
  private sandwichesCollected = 0;
  private cansCollected = 0;
  private starsCollected = 0;
  private enemiesDefeated = 0;
  private selectedOption = 0; // 0 = Play Again, 1 = Main Menu
  private isNewHighScore = false;
  private playAgainText?: Phaser.GameObjects.Text;
  private mainMenuText?: Phaser.GameObjects.Text;
  private selector?: Phaser.GameObjects.Text;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private enterKey?: Phaser.Input.Keyboard.Key;

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

    // Check and show high score info
    this.checkHighScoreDisplay();

    // Show menu options immediately
    this.showMenuOptions();
    
// console.log(`[DEBUG GAME OVER] Score: ${this.finalScore}, Time: ${timeText}`);

    // Setup keyboard input
    this.setupInput();
  }

  async checkHighScoreDisplay() {
    // Show current high score
    try {
      const response = await fetch('/api/leaderboard/high-score');
      if (response.ok) {
        const { highScore } = await response.json();
        
        this.isNewHighScore = this.finalScore > highScore;
        
        if (this.isNewHighScore) {
          this.add.text(320, 685, 'NEW HIGH SCORE!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0.5);
        } else {
          this.add.text(320, 685, `HIGH SCORE: ${Math.floor(highScore)}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5);
        }
      } else {
        // Fallback to localStorage if API fails
        const highScore = this.getHighScore();
        this.isNewHighScore = this.finalScore > highScore;
        
        if (this.isNewHighScore) {
          this.setHighScore(this.finalScore);
          this.add.text(320, 685, 'NEW HIGH SCORE!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0.5);
        } else {
          this.add.text(320, 685, `HIGH SCORE: ${Math.floor(highScore)}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5);
        }
      }
    } catch (error) {
      console.error('Error checking high score:', error);
      // Fallback to localStorage
      const highScore = this.getHighScore();
      this.isNewHighScore = this.finalScore > highScore;
      if (this.isNewHighScore) {
        this.setHighScore(this.finalScore);
        this.add.text(320, 685, 'NEW HIGH SCORE!', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '22px',
          color: '#ffff00',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);
      } else {
        this.add.text(320, 685, `HIGH SCORE: ${Math.floor(highScore)}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '18px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5);
      }
    }
  }
  
  
  
  createMenuOptions() {
    // Initially hidden - will be shown after name input or high score check
  }
  
  showMenuOptions() {
    // Menu options - positioned higher since no name input
    this.playAgainText = this.add.text(320, 760, 'PLAY AGAIN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.mainMenuText = this.add.text(320, 800, 'MAIN MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Selection indicator
    this.selector = this.add.text(200, 760, '>', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.updateSelector();
    this.setupMenuInteraction();
  }
  
  updateSelector() {
    if (!this.selector || !this.playAgainText || !this.mainMenuText) return;
    
    if (this.selectedOption === 0) {
      this.selector.setY(760);
      this.playAgainText.setColor('#00ff00');
      this.mainMenuText.setColor('#ffffff');
    } else {
      this.selector.setY(800);
      this.playAgainText.setColor('#ffffff');
      this.mainMenuText.setColor('#00ff00');
    }
  }
  
  setupMenuInteraction() {
    // Touch/click handling for menu options
    if (this.playAgainText && this.mainMenuText) {
      this.playAgainText.setInteractive({ useHandCursor: true });
      this.mainMenuText.setInteractive({ useHandCursor: true });
      
      this.playAgainText.on('pointerdown', () => {
        this.scene.start('Game');
      });
      
      this.playAgainText.on('pointerover', () => {
        this.selectedOption = 0;
        this.updateSelector();
      });
      
      this.mainMenuText.on('pointerdown', () => {
        this.scene.start('MainMenu');
      });
      
      this.mainMenuText.on('pointerover', () => {
        this.selectedOption = 1;
        this.updateSelector();
      });
    }
  }
  
  setupInput() {
    // Input handling - keyboard (simplified - menu navigation only)
    this.upKey = this.input.keyboard?.addKey('UP');
    this.downKey = this.input.keyboard?.addKey('DOWN');
    this.spaceKey = this.input.keyboard?.addKey('SPACE');
    this.enterKey = this.input.keyboard?.addKey('ENTER');
    
    // Handle menu navigation
    this.input.keyboard?.on('keydown', (event: any) => {
      if (event.key === 'ArrowUp') {
        this.selectedOption = 0;
        this.updateSelector();
      } else if (event.key === 'ArrowDown') {
        this.selectedOption = 1;
        this.updateSelector();
      } else if (event.key === ' ' || event.key === 'Enter') {
        this.selectOption();
      }
    });
  }
  
  
  selectOption() {
    if (this.selectedOption === 0) {
      this.scene.start('Game');
    } else {
      this.scene.start('MainMenu');
    }
  }

  getHighScore(): number {
    return parseFloat(localStorage.getItem('zombieSkaterHighScore') || '0');
  }

  setHighScore(score: number): void {
    localStorage.setItem('zombieSkaterHighScore', score.toString());
  }
}