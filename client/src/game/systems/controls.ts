import Phaser from 'phaser';

export function setupControls(scene: Phaser.Scene) {
  let lastInput = 0;
  let justTapped = false;
  let justSwiped = false;
  
  // Swipe detection variables
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let isPointerDown = false;
  
  // Swipe detection thresholds
  const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe (pixels)
  const SWIPE_TIME_THRESHOLD = 300; // Maximum time for a swipe (ms)
  const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity (pixels/ms)

  // Disable context menu
  scene.input.mouse?.disableContextMenu();

  // Setup touch/click events with swipe detection
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    const now = scene.time.now;
    if (now - lastInput > 200) { // Debounce
      // Record start position for swipe detection
      startX = pointer.x;
      startY = pointer.y;
      startTime = now;
      isPointerDown = true;
      
      console.log('Pointer down at:', startX, startY);
    }
  });
  
  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (!isPointerDown) return;
    
    const now = scene.time.now;
    const deltaX = pointer.x - startX;
    const deltaY = startY - pointer.y; // Inverted for upward swipe
    const deltaTime = now - startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = deltaTime > 0 ? distance / deltaTime : 0;
    
    console.log(`Pointer up - deltaY: ${deltaY}, deltaTime: ${deltaTime}, distance: ${distance}, velocity: ${velocity}`);
    
    // Check if it's a swipe up
    if (deltaY > SWIPE_THRESHOLD && 
        deltaTime < SWIPE_TIME_THRESHOLD && 
        velocity > SWIPE_VELOCITY_THRESHOLD &&
        Math.abs(deltaX) < deltaY) { // Ensure it's more vertical than horizontal
      
      justSwiped = true;
      lastInput = now;
      console.log('SWIPE UP detected!');
      
    } else if (distance < 20 && deltaTime < 200) { 
      // It's a tap (minimal movement and quick)
      justTapped = true;
      lastInput = now;
      console.log('TAP detected');
    }
    
    isPointerDown = false;
  });
  
  // Cancel swipe detection if pointer moves out of bounds or is cancelled
  scene.input.on('pointerout', () => {
    isPointerDown = false;
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
        console.log('Jump triggered - key:', keyPressed, 'tap:', !keyPressed);
        return true;
      }
      
      return false;
    },
    
    justSwipedUp: () => {
      if (justSwiped) {
        justSwiped = false; // Reset swipe flag
        console.log('Trick triggered by swipe up!');
        return true;
      }
      return false;
    },
    
    holding: () => false
  };
}
