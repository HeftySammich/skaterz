// HD 2D Bitmap Font Renderer for pixel-perfect text
export class BitmapText {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private x: number;
  private y: number;
  private text: string;
  private color: number;
  
  // 8x8 pixel font bitmap (simplified for HD clarity)
  private static readonly FONT_DATA: { [key: string]: number[][] } = {
    'A': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1]
    ],
    'B': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0]
    ],
    'C': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,0],
      [1,0,0,0,1],
      [0,1,1,1,0]
    ],
    'E': [
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,1,1,0,0],
      [1,0,0,0,0],
      [1,1,1,1,1]
    ],
    'O': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0]
    ],
    'R': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,1,0,0,0],
      [1,0,1,0,1]
    ],
    'S': [
      [0,1,1,1,1],
      [1,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [1,1,1,1,0]
    ],
    ':': [
      [0,0,0,0,0],
      [0,1,0,0,0],
      [0,0,0,0,0],
      [0,1,0,0,0],
      [0,0,0,0,0]
    ],
    ' ': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0]
    ],
    '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
    '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,1,1,0],[0,1,0,0,0],[1,1,1,1,1]],
    '3': [[0,1,1,1,0],[1,0,0,0,1],[0,0,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
    '4': [[1,0,0,1,0],[1,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0]],
    '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
    '6': [[0,1,1,1,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
    '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0]],
    '8': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
    '9': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,1,1,1,0]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'X': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
    'P': [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
    'J': [[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0]],
    'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]],
    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'H': [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
    'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
    'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
    'G': [[0,1,1,1,0],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[0,1,1,1,0]],
    'I': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]]
  };

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, color: number = 0xffffff) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);
    this.render();
  }

  setText(newText: string) {
    this.text = newText;
    this.render();
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.render();
  }

  private render() {
    this.graphics.clear();
    this.graphics.fillStyle(this.color);
    
    let currentX = this.x;
    const pixelSize = 1; // 1 pixel per font pixel for crisp rendering
    
    for (let i = 0; i < this.text.length; i++) {
      const char = this.text[i].toUpperCase();
      const charData = BitmapText.FONT_DATA[char];
      
      if (charData) {
        for (let row = 0; row < charData.length; row++) {
          for (let col = 0; col < charData[row].length; col++) {
            if (charData[row][col] === 1) {
              this.graphics.fillRect(
                currentX + col * pixelSize,
                this.y + row * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          }
        }
      }
      
      currentX += 6 * pixelSize; // Character width + spacing
    }
  }

  setScrollFactor(x: number, y?: number) {
    this.graphics.setScrollFactor(x, y);
  }

  destroy() {
    this.graphics.destroy();
  }
}