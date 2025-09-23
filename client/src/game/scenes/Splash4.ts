export class Splash4 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash4' });
  }

  create() {
    // Built by slime splash
    this.cameras.main.setBackgroundColor('#000000');
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const slimeImage = this.add.image(centerX, centerY, 'slime_splash');
    slimeImage.setOrigin(0.5, 0.5);
    slimeImage.setScale(0.5);

    // Auto-advance after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('Splash5');
    });
  }
}