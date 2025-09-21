import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
  private finalScore = 0;
  private survivalTime = 0;

  constructor() {
    super('GameOver');
  }

  init(data: { score: number, time: number }) {
    this.finalScore = data.score || 0;
    this.survivalTime = data.time || 0;
  }

  create() {
    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, 640, 960);

    // Game Over text
    const gameOverText = this.add.text(320, 250, 'GAME OVER', {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '72px',
      color: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Final score
    const finalScoreText = this.add.text(320, 380, `FINAL SCORE: ${Math.floor(this.finalScore)}`, {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Survival time
    const minutes = Math.floor(this.survivalTime / 60000);
    const seconds = Math.floor((this.survivalTime % 60000) / 1000);
    const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    this.add.text(320, 480, `TIME SURVIVED: ${timeText}`, {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // High score (using localStorage)
    const highScore = this.getHighScore();
    let highScoreText;
    if (this.finalScore > highScore) {
      this.setHighScore(this.finalScore);
      highScoreText = this.add.text(320, 580, 'NEW HIGH SCORE!', {
        fontFamily: 'Courier, "Courier New", monospace',
        fontSize: '40px',
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
      highScoreText = this.add.text(320, 580, `HIGH SCORE: ${Math.floor(highScore)}`, {
        fontFamily: 'Courier, "Courier New", monospace',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    // Restart instructions
    const restartText = this.add.text(320, 720, 'PRESS SPACE TO RESTART', {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '32px',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.add.text(320, 800, 'PRESS ESC FOR MAIN MENU', {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '32px',
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
