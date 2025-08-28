import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
  private finalScore = 0;

  constructor() {
    super('GameOver');
  }

  init(data: { score: number }) {
    this.finalScore = data.score || 0;
  }

  create() {
    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 240, 160);

    // HD 2D Game Over text - pixel perfect
    const gameOverText = this.add.text(120, 50, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    gameOverText.setResolution(2);

    // HD 2D Final score
    const finalScoreText = this.add.text(120, 75, `FINAL SCORE: ${Math.floor(this.finalScore)}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    finalScoreText.setResolution(2);

    // HD 2D High score (using localStorage)
    const highScore = this.getHighScore();
    let highScoreText;
    if (this.finalScore > highScore) {
      this.setHighScore(this.finalScore);
      highScoreText = this.add.text(120, 90, 'NEW HIGH SCORE!', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    } else {
      highScoreText = this.add.text(120, 90, `HIGH SCORE: ${Math.floor(highScore)}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
    }
    highScoreText.setResolution(2);

    // HD 2D Restart instructions
    const restartText = this.add.text(120, 120, 'PRESS SPACE TO RESTART', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);
    restartText.setResolution(2);

    // Input handling
    this.input.keyboard?.addKey('SPACE').on('down', () => {
      this.scene.start('Game');
    });

    // Touch/click restart
    this.input.on('pointerdown', () => {
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
