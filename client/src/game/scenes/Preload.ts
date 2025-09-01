import Phaser from 'phaser';
// All visual asset imports removed - clean slate for new assets

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Minimal loading for clean slate
    const loadingText = this.make.text({
      x: 120,
      y: 80,
      text: 'Ready for new assets...',
      style: {
        fontFamily: 'Courier, "Courier New", monospace',
        fontSize: '12px',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // No visual assets loaded - clean slate
  }

  create() {
    // All visual assets removed - clean slate for new assets
    console.log('Preload complete - all visual assets removed for replacement');
    
    // Start with splash screens
    this.scene.start('Splash1');
  }

  // Removed all asset creation methods - clean slate for new assets
}
