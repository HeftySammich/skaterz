import Phaser from 'phaser';

export function setupControls(scene: Phaser.Scene) {
  const pointer = scene.input.activePointer;
  let lastTap = 0;

  // Disable context menu
  scene.input.mouse?.disableContextMenu();

  return {
    justTapped: () => {
      const now = scene.time.now;
      
      // Keyboard input
      const spaceKey = scene.input.keyboard?.addKey('SPACE');
      const upKey = scene.input.keyboard?.addKey('UP');
      const keyPressed = Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(upKey!);
      
      // Touch/click input
      const pointerPressed = scene.input.activePointer.isDown && now - scene.input.activePointer.downTime < 100;
      
      const inputDetected = keyPressed || pointerPressed;
      const validTiming = now - lastTap > 150; // Debounce
      
      if (inputDetected && validTiming) {
        lastTap = now;
        console.log('Jump/Trick input detected');
        return true;
      }
      
      return false;
    },
    
    holding: () => {
      // Hold space or down arrow for grinding
      const spaceKey = scene.input.keyboard?.addKey('SPACE');
      const downKey = scene.input.keyboard?.addKey('DOWN');
      const keyHeld = spaceKey?.isDown || downKey?.isDown;
      
      // Touch/click held for grinding - detect long press
      const pointerHeld = pointer.isDown && (scene.time.now - pointer.downTime > 150);
      
      const isCurrentlyHolding = keyHeld || pointerHeld;
      if (isCurrentlyHolding) {
        console.log('Grinding hold detected - key:', keyHeld, 'touch:', pointerHeld, 'downTime:', pointer.downTime);
      }
      
      return isCurrentlyHolding;
    }
  };
}
