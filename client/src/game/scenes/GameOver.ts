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
  private playerName = '';
  private nameInputText?: Phaser.GameObjects.Text;
  private isEnteringName = false;
  private hasSavedScore = false;
  private namePromptText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;

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
    gameOverText.setShadow(3, 3, '#000000', 5, true, true);

    // Results text
    const resultsText = this.add.text(320, 320, 'RESULTS', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    resultsText.setShadow(2, 2, '#000000', 4, true, true);

    // Stats in order: Score, Time, Enemies, Sandwiches, Energy Drinks, Stars
    
    // Final score
    const finalScoreText = this.add.text(320, 400, `SCORE: ${Math.floor(this.finalScore)}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    finalScoreText.setShadow(2, 2, '#000000', 3, true, true);
    
    // Survival time
    const minutes = Math.floor(this.survivalTime / 60000);
    const seconds = Math.floor((this.survivalTime % 60000) / 1000);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const timeTextEl = this.add.text(320, 450, `TIME: ${timeText}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    timeTextEl.setShadow(2, 2, '#000000', 3, true, true);
    
    // Enemies defeated
    const enemiesText = this.add.text(320, 495, `ENEMIES: ${this.enemiesDefeated}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ff6600',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    enemiesText.setShadow(2, 2, '#000000', 3, true, true);
    
    // Sandwiches collected - white font as requested
    const sandwichesText = this.add.text(320, 535, `SANDWICHES: ${this.sandwichesCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    sandwichesText.setShadow(2, 2, '#000000', 3, true, true);
    
    // Energy drinks collected  
    const energyText = this.add.text(320, 575, `ENERGY DRINKS: ${this.cansCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    energyText.setShadow(2, 2, '#000000', 3, true, true);
    
    // Stars collected - larger yellow font
    const starsText = this.add.text(320, 625, `STARS: ${this.starsCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    starsText.setShadow(2, 2, '#000000', 3, true, true);

    // Check and show high score info
    this.checkHighScoreDisplay();

    // Ask for player name to save score
    this.showNameInput();
    
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
          const newHighScoreText = this.add.text(320, 685, 'NEW HIGH SCORE!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0.5);
          newHighScoreText.setShadow(2, 2, '#000000', 4, true, true);
        } else {
          const highScoreText = this.add.text(320, 685, `HIGH SCORE: ${Math.floor(highScore)}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5);
          highScoreText.setShadow(2, 2, '#000000', 3, true, true);
        }
      } else {
        // Fallback to localStorage if API fails
        const highScore = this.getHighScore();
        this.isNewHighScore = this.finalScore > highScore;
        
        if (this.isNewHighScore) {
          this.setHighScore(this.finalScore);
          const newHighScoreText = this.add.text(320, 685, 'NEW HIGH SCORE!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0.5);
          newHighScoreText.setShadow(2, 2, '#000000', 4, true, true);
        } else {
          const highScoreText = this.add.text(320, 685, `HIGH SCORE: ${Math.floor(highScore)}`, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5);
          highScoreText.setShadow(2, 2, '#000000', 3, true, true);
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
  
  showNameInput() {
    this.isEnteringName = true;
    
    // Name input prompt
    this.namePromptText = this.add.text(320, 720, 'ENTER YOUR NAME:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.namePromptText.setShadow(2, 2, '#000000', 3, true, true);
    
    // Name input field
    this.nameInputText = this.add.text(320, 760, 'PLAYER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.nameInputText.setShadow(2, 2, '#000000', 3, true, true);
    this.playerName = 'PLAYER';
    
    // Instructions
    this.instructionText = this.add.text(320, 810, 'TAP TO CONTINUE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#b9c0cf',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.instructionText.setShadow(1, 1, '#000000', 2, true, true);
    
    // Click/tap to submit
    this.input.once('pointerdown', () => {
      if (this.isEnteringName) {
        this.submitScore();
      }
    });
  }
  
  async submitScore() {
    if (this.hasSavedScore) return; // Prevent double submission
    this.hasSavedScore = true;
    this.isEnteringName = false;
    
    const finalName = this.playerName || 'PLAYER';
    
    try {
      // Submit score to database
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: finalName,
          score: Math.floor(this.finalScore)
        })
      });
      
      if (response.ok) {
        console.log('Score saved to leaderboard');
      } else {
        console.error('Failed to save score to leaderboard');
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
    
    // Clear the name input UI
    if (this.nameInputText) this.nameInputText.destroy();
    if (this.namePromptText) this.namePromptText.destroy();
    if (this.instructionText) this.instructionText.destroy();
    
    // Show menu options after name submission
    this.showMenuOptions();
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
    this.playAgainText.setShadow(2, 2, '#000000', 3, true, true);
    
    this.mainMenuText = this.add.text(320, 800, 'MAIN MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.mainMenuText.setShadow(2, 2, '#000000', 3, true, true);
    
    // Selection indicator
    this.selector = this.add.text(200, 760, '>', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.selector.setShadow(2, 2, '#000000', 3, true, true);
    
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