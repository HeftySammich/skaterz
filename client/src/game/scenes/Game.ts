import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

export default class Game extends Phaser.Scene {
  // All game logic removed - clean slate for new assets and gameplay

  constructor() {
    super('Game');
  }

  create() {
    // Placeholder scene - all assets removed for replacement
    this.cameras.main.setBackgroundColor('#162b4d');
    
    this.add.text(120, 60, 'GAME SCENE', {
      fontSize: '20px',
      color: '#ffecb3',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(120, 90, 'ALL ASSETS REMOVED', {
      fontSize: '12px',
      color: '#b9c0cf',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(120, 110, 'READY FOR NEW ASSETS', {
      fontSize: '12px',
      color: '#e2e28e',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(120, 140, 'PRESS ESC TO RETURN TO MENU', {
      fontSize: '8px',
      color: '#646c7a',
      fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5);

    // ESC to return to main menu
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('MainMenu');
    });

    console.log('Game scene loaded - all assets removed, ready for replacement');
  }
}