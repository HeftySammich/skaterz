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

    // Crisp pixel-perfect Game Over text
    const gameOverText = this.add.text(120, 50, 'GAME OVER', {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '18px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 0
    }).setOrigin(0.5);

    // Crisp Final score
    const finalScoreText = this.add.text(120, 75, `FINAL SCORE: ${Math.floor(this.finalScore)}`, {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 0
    }).setOrigin(0.5);

    // Crisp High score (using localStorage)
    const highScore = this.getHighScore();
    let highScoreText;
    if (this.finalScore > highScore) {
      this.setHighScore(this.finalScore);
      highScoreText = this.add.text(120, 90, 'NEW HIGH SCORE!', {
        fontFamily: 'Courier, "Courier New", monospace',
        fontSize: '10px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 0
      }).setOrigin(0.5);
    } else {
      highScoreText = this.add.text(120, 90, `HIGH SCORE: ${Math.floor(highScore)}`, {
        fontFamily: 'Courier, "Courier New", monospace',
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 0
      }).setOrigin(0.5);
    }

    // Crisp Restart instructions
    const restartText = this.add.text(120, 120, 'PRESS SPACE TO RESTART', {
      fontFamily: 'Courier, "Courier New", monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 0
    }).setOrigin(0.5);

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
