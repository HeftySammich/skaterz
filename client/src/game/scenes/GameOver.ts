import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
  private finalScore = 0;
  private survivalTime = 0;
  private sandwichesCollected = 0;
  private cansCollected = 0;
  private starsCollected = 0;

  constructor() {
    super('GameOver');
  }

  init(data: { score: number, time: number, sandwiches?: number, cans?: number, stars?: number }) {
    this.finalScore = data.score || 0;
    this.survivalTime = data.time || 0;
    this.sandwichesCollected = data.sandwiches || 0;
    this.cansCollected = data.cans || 0;
    this.starsCollected = data.stars || 0;
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
    
    this.add.text(320, 460, `TIME: ${timeText}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Stars collected - most important stat!
    this.add.text(320, 520, `STARS: ${this.starsCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Sandwiches collected
    this.add.text(320, 570, `SANDWICHES: ${this.sandwichesCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Energy drinks collected  
    this.add.text(320, 620, `ENERGY DRINKS: ${this.cansCollected}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // High score (using localStorage)
    const highScore = this.getHighScore();
    let highScoreText;
    if (this.finalScore > highScore) {
      this.setHighScore(this.finalScore);
      highScoreText = this.add.text(320, 650, 'NEW HIGH SCORE!', {
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
      highScoreText = this.add.text(320, 650, `HIGH SCORE: ${Math.floor(highScore)}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    // Restart instructions
    const restartText = this.add.text(320, 750, 'PRESS SPACE TO RESTART', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.add.text(320, 820, 'PRESS ESC FOR MAIN MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Flash restart text
    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1
    });
    
    console.log(`[DEBUG GAME OVER] Score: ${this.finalScore}, Time: ${timeText}`);

    // Input handling
    this.input.keyboard?.addKey('SPACE').on('down', () => {
      console.log('[DEBUG GAME OVER] Restarting game...');
      this.scene.start('Game');
    });
    
    this.input.keyboard?.addKey('ESC').on('down', () => {
      console.log('[DEBUG GAME OVER] Returning to main menu...');
      this.scene.start('MainMenu');
    });

    // Touch/click restart
    this.input.on('pointerdown', () => {
      console.log('[DEBUG GAME OVER] Touch restart...');
      this.scene.start('Game');
    });
  }

  getHighScore(): number {
    return parseFloat(localStorage.getItem('zombieSkaterHighScore') || '0');
  }

  setHighScore(score: number): void {
    localStorage.setItem('zombieSkaterHighScore', score.toString());
  }
}
