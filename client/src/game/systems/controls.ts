import Phaser from 'phaser';

export function setupControls(scene: Phaser.Scene) {
  const pointer = scene.input.activePointer;
  let lastTap = 0;
  let touchStartTime = 0;
  let isTouching = false;

  // Disable context menu
  scene.input.mouse?.disableContextMenu();

  // Setup pointer events with timing for tap vs hold
  scene.input.on('pointerdown', () => {
    touchStartTime = scene.time.now;
    isTouching = true;
    console.log('Touch started at:', touchStartTime);
  });

  scene.input.on('pointerup', () => {
    const touchDuration = scene.time.now - touchStartTime;
    console.log('Touch ended. Duration:', touchDuration + 'ms');
    
    // If it was a quick tap (less than 200ms), register as tap
    if (touchDuration < 200 && scene.time.now - lastTap > 300) {
      lastTap = scene.time.now;
      console.log('Quick tap detected for jump!');
    }
    
    isTouching = false;
  });

  return {
    justTapped: () => {
      const now = scene.time.now;
      
      // Keyboard input
      const spaceKey = scene.input.keyboard?.addKey('SPACE');
      const upKey = scene.input.keyboard?.addKey('UP');
      const keyPressed = Phaser.Input.Keyboard.JustDown(spaceKey!) || Phaser.Input.Keyboard.JustDown(upKey!);
      
      // Check if we recently had a quick tap
      const recentTap = now - lastTap < 100;
      
      if (keyPressed || recentTap) {
        console.log('Jump input detected - key:', keyPressed, 'tap:', recentTap);
        return true;
      }
      
      return false;
    },
    
    holding: () => {
      // Hold space or down arrow for grinding
      const spaceKey = scene.input.keyboard?.addKey('SPACE');
      const downKey = scene.input.keyboard?.addKey('DOWN');
      const keyHeld = spaceKey?.isDown || downKey?.isDown;
      
      // Touch held for more than 200ms for grinding
      const touchDuration = scene.time.now - touchStartTime;
      const touchHeld = isTouching && touchDuration > 200;
      
      const isCurrentlyHolding = keyHeld || touchHeld;
      if (isCurrentlyHolding) {
        console.log('Grinding hold detected - key:', keyHeld, 'touchHeld:', touchHeld, 'duration:', touchDuration);
      }
      
      return isCurrentlyHolding;
    }
  };
}
