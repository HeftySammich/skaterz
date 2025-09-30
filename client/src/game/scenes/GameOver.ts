import Phaser from 'phaser';
import walletService from '../../services/wallet';

export default class GameOver extends Phaser.Scene {
  private finalScore = 0;
  private survivalTime = 0;
  private sandwichesCollected = 0;
  private cansCollected = 0;
  private starsCollected = 0;
  private enemiesDefeated = 0;
  private selectedOption = 0; // 0 = Claim STAR (if stars > 0), 1 = Play Again, 2 = Main Menu
  private isNewHighScore = false;
  private claimStarText?: Phaser.GameObjects.Text;
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
  private isClaimingReward = false;
  private hasClaimedReward = false;

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
    
    // CRITICAL: Reset these flags for every new game over
    this.hasSavedScore = false;
    this.isNewHighScore = false;
    this.isEnteringName = false;
    this.playerName = '';
    
    // Reset UI references
    this.playAgainText = undefined;
    this.mainMenuText = undefined;
    this.selector = undefined;
    this.nameInputText = undefined;
    this.namePromptText = undefined;
    this.instructionText = undefined;
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

    // Automatically save score with "Player 1" and show menu options
    this.autoSubmitScore();
    
    // ALWAYS show menu options after a delay, even if score submission fails
    this.time.delayedCall(500, () => {
      // Safety check - if menu options aren't shown yet, show them now
      if (!this.playAgainText && !this.mainMenuText) {
        this.showMenuOptions();
      }
    });
    
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
  
  async autoSubmitScore() {
    if (this.hasSavedScore) return;
    this.hasSavedScore = true;
    
    // Automatically use "Player 1" as the name
    const finalName = 'Player 1';
    
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
    } finally {
      // ALWAYS show menu options, even if score submission fails
      this.showMenuOptions();
    }
  }
  
  // Keep for compatibility but won't be used
  showNameInput() {
    // This function is no longer used but kept for compatibility
    this.autoSubmitScore();
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
    // Don't create duplicate menu options
    if (this.playAgainText || this.mainMenuText) {
      return;
    }

    let currentY = 720;

    // Show "CLAIM STAR" option only if stars were collected
    if (this.starsCollected > 0) {
      this.claimStarText = this.add.text(320, currentY, 'CLAIM STAR', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.claimStarText.setShadow(2, 2, '#000000', 3, true, true);
      currentY += 40;
    }

    // Menu options
    this.playAgainText = this.add.text(320, currentY, 'PLAY AGAIN', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: this.starsCollected > 0 ? '#ffffff' : '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.playAgainText.setShadow(2, 2, '#000000', 3, true, true);
    currentY += 40;

    this.mainMenuText = this.add.text(320, currentY, 'MAIN MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.mainMenuText.setShadow(2, 2, '#000000', 3, true, true);

    // Selection indicator
    const selectorY = this.starsCollected > 0 ? 720 : 720;
    this.selector = this.add.text(200, selectorY, '>', {
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

    const hasClaimOption = this.starsCollected > 0 && this.claimStarText;

    if (hasClaimOption) {
      // With CLAIM STAR option: 0 = Claim, 1 = Play Again, 2 = Main Menu
      if (this.selectedOption === 0) {
        this.selector.setY(720);
        this.claimStarText!.setColor('#00ff00');
        this.playAgainText.setColor('#ffffff');
        this.mainMenuText.setColor('#ffffff');
      } else if (this.selectedOption === 1) {
        this.selector.setY(760);
        this.claimStarText!.setColor('#ffff00');
        this.playAgainText.setColor('#00ff00');
        this.mainMenuText.setColor('#ffffff');
      } else {
        this.selector.setY(800);
        this.claimStarText!.setColor('#ffff00');
        this.playAgainText.setColor('#ffffff');
        this.mainMenuText.setColor('#00ff00');
      }
    } else {
      // Without CLAIM STAR option: 0 = Play Again, 1 = Main Menu
      if (this.selectedOption === 0) {
        this.selector.setY(720);
        this.playAgainText.setColor('#00ff00');
        this.mainMenuText.setColor('#ffffff');
      } else {
        this.selector.setY(760);
        this.playAgainText.setColor('#ffffff');
        this.mainMenuText.setColor('#00ff00');
      }
    }
  }
  
  setupMenuInteraction() {
    // Touch/click handling for CLAIM STAR option
    if (this.claimStarText) {
      this.claimStarText.setInteractive({ useHandCursor: true });

      this.claimStarText.on('pointerdown', () => {
        this.claimStarRewards();
      });

      this.claimStarText.on('pointerover', () => {
        this.selectedOption = 0;
        this.updateSelector();
      });
    }

    // Touch/click handling for menu options
    if (this.playAgainText && this.mainMenuText) {
      this.playAgainText.setInteractive({ useHandCursor: true });
      this.mainMenuText.setInteractive({ useHandCursor: true });

      const playAgainOption = this.starsCollected > 0 ? 1 : 0;
      const mainMenuOption = this.starsCollected > 0 ? 2 : 1;

      this.playAgainText.on('pointerdown', () => {
        this.scene.start('Game');
      });

      this.playAgainText.on('pointerover', () => {
        this.selectedOption = playAgainOption;
        this.updateSelector();
      });

      this.mainMenuText.on('pointerdown', () => {
        this.scene.start('MainMenu');
      });

      this.mainMenuText.on('pointerover', () => {
        this.selectedOption = mainMenuOption;
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

    const maxOption = this.starsCollected > 0 ? 2 : 1;

    // Handle menu navigation
    this.input.keyboard?.on('keydown', (event: any) => {
      if (event.key === 'ArrowUp') {
        this.selectedOption = Math.max(0, this.selectedOption - 1);
        this.updateSelector();
      } else if (event.key === 'ArrowDown') {
        this.selectedOption = Math.min(maxOption, this.selectedOption + 1);
        this.updateSelector();
      } else if (event.key === ' ' || event.key === 'Enter') {
        this.selectOption();
      }
    });
  }


  selectOption() {
    const hasClaimOption = this.starsCollected > 0;

    if (hasClaimOption) {
      // With CLAIM STAR: 0 = Claim, 1 = Play Again, 2 = Main Menu
      if (this.selectedOption === 0) {
        this.claimStarRewards();
      } else if (this.selectedOption === 1) {
        this.scene.start('Game');
      } else {
        this.scene.start('MainMenu');
      }
    } else {
      // Without CLAIM STAR: 0 = Play Again, 1 = Main Menu
      if (this.selectedOption === 0) {
        this.scene.start('Game');
      } else {
        this.scene.start('MainMenu');
      }
    }
  }

  getHighScore(): number {
    return parseFloat(localStorage.getItem('zombieSkaterHighScore') || '0');
  }

  setHighScore(score: number): void {
    localStorage.setItem('zombieSkaterHighScore', score.toString());
  }

  /**
   * Claim STAR token rewards
   * Handles token association if needed, then sends tokens from treasury
   */
  async claimStarRewards() {
    if (this.isClaimingReward || this.hasClaimedReward) {
      console.log('⚠️ Already claiming or claimed rewards');
      return;
    }

    if (this.starsCollected <= 0) {
      console.log('⚠️ No stars to claim');
      return;
    }

    this.isClaimingReward = true;

    try {
      // Step 1: Check wallet connection
      const walletState = walletService.getState();
      if (!walletState.isConnected || !walletState.accountId) {
        this.showMessage('❌ Connect wallet in Options Menu first!', '#ff6666');
        this.isClaimingReward = false;
        return;
      }

      const accountId = walletState.accountId;

      // Step 2: Check STAR token association
      this.showMessage('🔍 Checking STAR token association...', '#ffff00');
      const hasStarToken = await walletService.checkStarTokenAssociation();

      if (!hasStarToken) {
        // Step 3a: Not associated - prompt association
        this.showMessage('🔗 Associating STAR token...', '#ffff00');

        try {
          await walletService.associateStarToken();
          this.showMessage('✅ STAR token associated!', '#00ff00');

          // Wait a moment for association to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('❌ Failed to associate STAR token:', error);
          this.showMessage('❌ Token association failed. Try again.', '#ff6666');
          this.isClaimingReward = false;
          return;
        }
      }

      // Step 3b: Send tokens from treasury via backend API
      this.showMessage(`💫 Sending ${this.starsCollected} STAR tokens...`, '#ffff00');

      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accountId,
          amount: this.starsCollected
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim rewards');
      }

      const result = await response.json();
      console.log('✅ STAR tokens claimed!', result);

      this.showMessage(`✅ ${this.starsCollected} STAR tokens claimed!`, '#00ff00');
      this.hasClaimedReward = true;

      // Hide the CLAIM STAR option after successful claim
      if (this.claimStarText) {
        this.claimStarText.destroy();
        this.claimStarText = undefined;
        this.selectedOption = 0; // Reset to Play Again
        this.updateSelector();
      }

    } catch (error) {
      console.error('❌ Failed to claim STAR rewards:', error);
      this.showMessage('❌ Failed to claim rewards. Try again.', '#ff6666');
    } finally {
      this.isClaimingReward = false;
    }
  }

  /**
   * Show a temporary message to the user
   */
  private showMessage(message: string, color: string) {
    // Remove any existing message
    const existingMessage = this.children.getByName('claimMessage') as Phaser.GameObjects.Text;
    if (existingMessage) {
      existingMessage.destroy();
    }

    // Create new message
    const messageText = this.add.text(320, 680, message, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setName('claimMessage');
    messageText.setShadow(2, 2, '#000000', 3, true, true);
  }
}