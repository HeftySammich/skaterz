import Phaser from 'phaser';

export function setupControls(scene: Phaser.Scene) {
  const pointer = scene.input.activePointer;
  let lastTap = 0;
  let isHoldingForGrind = false;

  // Disable context menu
  scene.input.mouse?.disableContextMenu();

  // Setup pointer events for better hold detection
  scene.input.on('pointerdown', () => {
    console.log('Pointer down - potential grind hold started');
    isHoldingForGrind = true;
  });

  scene.input.on('pointerup', () => {
    console.log('Pointer up - grind hold ended');
    isHoldingForGrind = false;
  });

  return {
    justTapped: () => {
      const now = scene.time.now;
      
      // Keyboard input
      const spaceKey = scene.input.keyboard?.addKey('SPACE');
      const upKey = scene.input.keyboard?.addKey('UP');
      const keyPressed = Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(upKey!);
      
      // Touch/click input - quick tap detection
      const pointerPressed = scene.input.activePointer.justDown;
      
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
      
      // Use the event-based holding detection
      const isCurrentlyHolding = keyHeld || isHoldingForGrind;
      if (isCurrentlyHolding) {
        console.log('Grinding hold detected - key:', keyHeld, 'touch:', isHoldingForGrind);
      }
      
      return isCurrentlyHolding;
    }
  };
}
