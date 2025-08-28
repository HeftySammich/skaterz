import Phaser from 'phaser';

export function setupControls(scene: Phaser.Scene) {
  const pointer = scene.input.activePointer;
  let lastInput = 0;

  // Disable context menu
  scene.input.mouse?.disableContextMenu();

  return {
    justTapped: () => {
      const now = scene.time.now;
      
      // Keyboard input
      const spaceKey = scene.input.keyboard?.addKey('SPACE');
      const upKey = scene.input.keyboard?.addKey('UP');
      const keyPressed = Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(upKey!);
      
      // Any touch input (tap or start of hold) triggers jump
      const touchPressed = pointer.justDown;
      
      const inputDetected = keyPressed || touchPressed;
      const validTiming = now - lastInput > 200; // Debounce
      
      if (inputDetected && validTiming) {
        lastInput = now;
        console.log('Jump input detected - key:', keyPressed, 'touch:', touchPressed);
        return true;
      }
      
      return false;
    },
    
    // Not needed anymore since we auto-grind
    holding: () => false
  };
}
