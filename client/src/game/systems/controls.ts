import Phaser from 'phaser';

export function setupControls(scene: Phaser.Scene) {
  let lastInput = 0;
  let justTapped = false;

  // Disable context menu
  scene.input.mouse?.disableContextMenu();

  // Setup touch/click events
  scene.input.on('pointerdown', () => {
    const now = scene.time.now;
    if (now - lastInput > 200) { // Debounce
      justTapped = true;
      lastInput = now;
      console.log('Touch/click input detected');
    }
  });

  return {
    justTapped: () => {
      // Keyboard input
      const spaceKey = scene.input.keyboard?.addKey('SPACE');
      const upKey = scene.input.keyboard?.addKey('UP');
      const keyPressed = Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(upKey!);
      
      // Check for touch input or keyboard
      if (keyPressed || justTapped) {
        justTapped = false; // Reset tap flag
        console.log('Jump triggered - key:', keyPressed, 'touch:', !keyPressed);
        return true;
      }
      
      return false;
    },
    
    holding: () => false
  };
}
