export class Splash5 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash5' });
  }

  create() {
    // Starfall V Presents splash
    this.cameras.main.setBackgroundColor('#000000');
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const starfallPresents = this.add.image(centerX, centerY, 'starfall_presents');
    starfallPresents.setOrigin(0.5, 0.5);
    starfallPresents.setScale(0.8);

    // Auto-advance after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('MainMenu');
    });
  }
}