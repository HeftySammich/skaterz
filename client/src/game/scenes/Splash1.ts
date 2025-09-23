export class Splash1 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash1' });
  }

  create() {
    // Soul Arcade Advance splash
    this.cameras.main.setBackgroundColor('#000000');
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const soulArcade = this.add.image(centerX, centerY, 'soul_arcade');
    soulArcade.setOrigin(0.5, 0.5);
    soulArcade.setScale(0.4);

    // Auto-advance after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('Splash2');
    });
  }
}