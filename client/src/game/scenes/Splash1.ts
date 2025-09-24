export class Splash1 extends Phaser.Scene {
  constructor() {
    super({ key: 'Splash1' });
  }

  create() {
    // Set black background
    this.cameras.main.setBackgroundColor('#000000');
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Display the Soul Arcade Advance logo - make it bigger
    const logo = this.add.image(centerX, centerY, 'soul_arcade_new_logo');
    logo.setOrigin(0.5, 0.5);
    
    // Make the logo bigger - use more of the screen
    const maxWidth = 1100;  // Much bigger
    const maxHeight = 900; // Much bigger
    const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height);
    logo.setScale(scale);
    
    // Wait 2 seconds then add shine effect
    this.time.delayedCall(2000, () => {
      // Create a duplicate of the logo for the shine effect
      const shineLogo = this.add.image(centerX, centerY, 'soul_arcade_new_logo');
      shineLogo.setOrigin(0.5, 0.5);
      shineLogo.setScale(scale);
      shineLogo.setAlpha(0); // Start invisible
      
      // Use additive blend mode so only the colored parts (letters) get brightened
      // Black stays black since black + anything = that color
      shineLogo.setBlendMode(Phaser.BlendModes.ADD);
      shineLogo.setTint(0xffffff); // White tint for shine
      
      // Create a gradient mask for the shine sweep
      const maskGraphics = this.make.graphics({});
      const shineWidth = 150;
      
      // Start position - off the left side
      let maskX = logo.x - logo.displayWidth/2 - shineWidth;
      
      // Create initial mask
      maskGraphics.fillStyle(0xffffff);
      maskGraphics.fillRect(maskX, logo.y - logo.displayHeight/2, shineWidth, logo.displayHeight);
      
      const mask = maskGraphics.createGeometryMask();
      shineLogo.setMask(mask);
      
      // Make the shine visible
      shineLogo.setAlpha(0.6);
      
      // Animate the mask moving across
      this.tweens.add({
        targets: { x: maskX },
        x: logo.x + logo.displayWidth/2 + shineWidth,
        duration: 800,
        ease: 'Power2',
        onUpdate: (tween) => {
          const value = tween.targets[0] as any;
          maskGraphics.clear();
          maskGraphics.fillStyle(0xffffff);
          // Create a gradient effect by drawing multiple rectangles with decreasing alpha
          const gradientWidth = shineWidth;
          const strips = 10;
          for (let i = 0; i < strips; i++) {
            const alpha = 1 - (i / strips);
            maskGraphics.fillStyle(0xffffff, alpha);
            maskGraphics.fillRect(
              value.x + (i * gradientWidth/strips), 
              logo.y - logo.displayHeight/2, 
              gradientWidth/strips, 
              logo.displayHeight
            );
          }
        },
        onComplete: () => {
          shineLogo.destroy();
          maskGraphics.destroy();
          
          // Transition to next splash screen after shine completes
          this.time.delayedCall(500, () => {
            this.scene.start('Splash2');
          });
        }
      });
    });
  }
}