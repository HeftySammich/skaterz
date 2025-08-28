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

    // HD Game Over text
    this.add.text(120, 50, 'GAME OVER', {
      fontFamily: '"Courier New", monospace',
      fontSize: '32px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // HD Final score
    this.add.text(120, 75, `FINAL SCORE: ${Math.floor(this.finalScore)}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // HD High score (using localStorage)
    const highScore = this.getHighScore();
    if (this.finalScore > highScore) {
      this.setHighScore(this.finalScore);
      this.add.text(120, 90, 'NEW HIGH SCORE!', {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
    } else {
      this.add.text(120, 90, `HIGH SCORE: ${Math.floor(highScore)}`, {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    // HD Restart instructions
    this.add.text(120, 120, 'PRESS SPACE TO RESTART', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
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
