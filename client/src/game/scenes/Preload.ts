import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(60, 70, 120, 20);

    const loadingText = this.make.text({
      x: 120,
      y: 60,
      text: 'Loading...',
      style: {
        font: '12px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(65, 75, 110 * value, 10);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Always create fallback sprites for this demo
    this.createFallbackSprites();
    
    // Try to load audio but don't fail if missing
    this.load.on('loaderror', () => {
      console.log('Some assets failed to load, using fallbacks');
    });
  }

  createFallbackSprites() {
    // Create detailed 32-bit style zombie skater sprite
    const zombieTexture = this.add.graphics();
    
    // Define 32-bit color palette
    const colors = {
      skin: 0x8fbc8f,
      darkSkin: 0x76a976,
      hair: 0x4a4a4a,
      shirt: 0x2d4a2d,
      pants: 0x1a1a2e,
      board: 0xd2691e,
      boardEdge: 0xa0522d,
      wheels: 0x404040,
      eyes: 0xff0000,
      outline: 0x000000
    };
    
    // Pixel-by-pixel zombie sprite (16x24)
    const zombiePixels = [
      [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0], // row 0
      [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0], // row 1
      [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // row 2
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // row 3
      [0,1,1,1,2,1,1,1,1,1,1,2,1,1,1,0], // row 4 - eyes
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // row 5
      [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // row 6
      [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0], // row 7
      [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0], // row 8 - shirt
      [0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0], // row 9
      [0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0], // row 10
      [0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0], // row 11
      [0,0,1,1,3,3,3,3,3,3,3,3,1,1,0,0], // row 12 - arms
      [0,0,1,1,3,3,3,3,3,3,3,3,1,1,0,0], // row 13
      [0,0,1,1,4,4,4,4,4,4,4,4,1,1,0,0], // row 14 - pants
      [0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0], // row 15
      [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0], // row 16 - legs
      [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0], // row 17
      [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0], // row 18
      [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0], // row 19
      [0,0,5,5,5,5,5,5,5,5,5,5,5,5,0,0], // row 20 - skateboard
      [0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,0], // row 21
      [0,6,5,5,5,5,5,5,5,5,5,5,5,5,6,0], // row 22
      [0,7,7,0,0,0,0,0,0,0,0,0,0,7,7,0]  // row 23 - wheels
    ];
    
    const colorMap = [colors.outline, colors.skin, colors.eyes, colors.shirt, colors.pants, colors.board, colors.boardEdge, colors.wheels];
    
    // Draw pixel by pixel
    for (let y = 0; y < zombiePixels.length; y++) {
      for (let x = 0; x < zombiePixels[y].length; x++) {
        const colorIndex = zombiePixels[y][x];
        if (colorIndex > 0) {
          zombieTexture.fillStyle(colorMap[colorIndex]);
          zombieTexture.fillRect(x, y, 1, 1);
        }
      }
    }
    
    zombieTexture.generateTexture('zombie', 16, 24);
    zombieTexture.destroy();

    // Create detailed 32-bit street tiles
    const tilesTexture = this.add.graphics();
    
    // 32-bit street color palette
    const streetColors = {
      asphalt1: 0x2a2a2a,
      asphalt2: 0x242424,
      asphalt3: 0x1e1e1e,
      crack: 0x181818,
      yellowLine: 0xffff00,
      white: 0xffffff,
      dirt: 0x4a3728
    };
    
    // Detailed 16x16 street tile pattern
    const streetPixels = [
      [1,1,2,1,1,2,1,1,1,2,1,1,2,1,1,1],
      [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,2],
      [2,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
      [1,1,2,1,1,1,2,1,1,1,2,1,1,2,1,1],
      [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3], // crack line
      [1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,1],
      [2,1,1,1,2,1,1,2,1,1,1,2,1,1,1,2],
      [1,1,1,2,1,1,2,1,1,1,2,1,1,1,2,1],
      [4,4,0,0,4,4,0,0,4,4,0,0,4,4,0,0], // yellow center line
      [1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1],
      [1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2],
      [2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
      [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3], // another crack
      [1,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1],
      [1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1],
      [2,1,1,1,1,2,1,1,2,1,1,1,2,1,1,1]
    ];
    
    const streetColorMap = [streetColors.asphalt1, streetColors.asphalt2, streetColors.asphalt3, streetColors.crack, streetColors.yellowLine, streetColors.white, streetColors.dirt];
    
    // Draw street pixel by pixel
    for (let y = 0; y < streetPixels.length; y++) {
      for (let x = 0; x < streetPixels[y].length; x++) {
        const colorIndex = streetPixels[y][x];
        tilesTexture.fillStyle(streetColorMap[colorIndex]);
        tilesTexture.fillRect(x, y, 1, 1);
      }
    }
    
    tilesTexture.generateTexture('tiles', 16, 16);
    tilesTexture.destroy();

    // Create obstacles (red rectangles)
    const obstacleTexture = this.add.graphics();
    obstacleTexture.fillStyle(0xff0000);
    obstacleTexture.fillRect(0, 0, 16, 24);
    obstacleTexture.generateTexture('obstacles', 16, 24);
    obstacleTexture.destroy();
  }

  create() {
    // Ensure fallback sprites exist
    if (!this.textures.exists('zombie')) {
      this.createFallbackSprites();
    }
    
    this.scene.start('Game');
  }
}
