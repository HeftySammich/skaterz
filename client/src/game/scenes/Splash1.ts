export class Splash1 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash1' });
  }

  create() {
    // Set black background
    this.cameras.main.setBackgroundColor('#000000');
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Display the Soul Arcade Advance logo
    const logo = this.add.image(centerX, centerY, 'soul_arcade_logo');
    logo.setOrigin(0.5, 0.5);
    
    // Scale the logo to fit nicely on screen
    const maxWidth = 500;
    const maxHeight = 400;
    const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height);
    logo.setScale(scale);
    
    // Wait 2 seconds then add shine effect
    this.time.delayedCall(2000, () => {
      // Create a white rectangle for shine effect
      const shine = this.add.graphics();
      shine.fillStyle(0xffffff, 0.8);
      
      // Create a diagonal shine bar
      const shineWidth = 100;
      const shineHeight = logo.displayHeight * 1.5;
      shine.fillRect(0, -shineHeight/2, shineWidth, shineHeight);
      
      // Position shine off-screen to the left initially
      shine.x = logo.x - logo.displayWidth/2 - shineWidth;
      shine.y = logo.y;
      shine.rotation = -0.3; // Slight diagonal angle
      
      // Create a mask so shine only appears over the logo
      const maskShape = this.make.graphics({});
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(
        logo.x - logo.displayWidth/2, 
        logo.y - logo.displayHeight/2, 
        logo.displayWidth, 
        logo.displayHeight
      );
      
      const mask = maskShape.createGeometryMask();
      shine.setMask(mask);
      
      // Animate the shine moving across the logo
      this.tweens.add({
        targets: shine,
        x: logo.x + logo.displayWidth/2 + shineWidth,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          shine.destroy();
          maskShape.destroy();
          
          // Transition to next splash screen after shine completes
          this.time.delayedCall(500, () => {
            this.scene.start('Splash2');
          });
        }
      });
    });
  }
}