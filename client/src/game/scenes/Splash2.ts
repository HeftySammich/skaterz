export class Splash2 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash2' });
  }

  create() {
    // Second splash with BUILT BY SLIME image
    this.cameras.main.setBackgroundColor('#000000');
    
    // Add the BUILT BY SLIME image, properly centered on screen
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    const slimeImage = this.add.image(centerX, centerY, 'slime_splash');
    slimeImage.setOrigin(0.5, 0.5);
    
    // Scale the image to fit nicely on screen (adjust as needed)
    slimeImage.setScale(0.8);

    // Auto-advance after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.start('Splash3');
    });
  }
}