import Phaser from 'phaser';

interface TrickMessage {
  id: string;
  text: string;
  starText?: string;
  createdAt: number;
  duration: number;
  textSprite: Phaser.GameObjects.Text;
  starSprite?: Phaser.GameObjects.Text;
  state: 'entering' | 'visible' | 'exiting' | 'destroyed';
  targetY?: number;
  currentTween?: Phaser.Tweens.Tween;
}

export class TrickMessageManager {
  private scene: Phaser.Scene;
  private messages: TrickMessage[] = [];
  private maxVisible: number = 4; // Maximum messages visible at once
  private baseY: number = 400; // Starting Y position for newest message (bottom)
  private slotHeight: number = 75; // Vertical spacing between messages (increased for star text)
  private messageDuration: number = 2500; // How long each message stays visible
  private nextId: number = 0;
  private activeComboText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, options?: {
    maxVisible?: number;
    baseY?: number;
    slotHeight?: number;
    messageDuration?: number;
  }) {
    this.scene = scene;
    if (options?.maxVisible) this.maxVisible = options.maxVisible;
    if (options?.baseY) this.baseY = options.baseY;
    if (options?.slotHeight) this.slotHeight = options.slotHeight;
    if (options?.messageDuration) this.messageDuration = options.messageDuration;
  }

  addMessage(text: string, starAmount?: number): void {
    // Generate unique ID
    const id = `msg_${this.nextId++}`;
    
    // Create the main text sprite - start at base position
    const textSprite = this.scene.add.text(320, this.baseY + 50, text, {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    });
    textSprite.setOrigin(0.5, 0.5);
    textSprite.setDepth(150);
    textSprite.setScrollFactor(0);
    textSprite.setAlpha(0); // Start invisible for fade-in
    
    // Create star text if provided - position it below the main text
    let starSprite: Phaser.GameObjects.Text | undefined;
    if (starAmount !== undefined && starAmount > 0) {
      starSprite = this.scene.add.text(320, this.baseY + 50 + 35, `+${starAmount} STAR`, {
        fontSize: '18px',
        fontFamily: '"Press Start 2P", monospace',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      });
      starSprite.setOrigin(0.5, 0.5);
      starSprite.setDepth(150);
      starSprite.setScrollFactor(0);
      starSprite.setAlpha(0);
    }
    
    // Create message object
    const message: TrickMessage = {
      id,
      text,
      starText: starAmount ? `+${starAmount} STAR` : undefined,
      createdAt: this.scene.time.now,
      duration: this.messageDuration,
      textSprite,
      starSprite,
      state: 'entering'
    };
    
    // Check if we need to remove oldest message
    if (this.messages.length >= this.maxVisible) {
      const oldest = this.messages[this.messages.length - 1];
      this.removeMessage(oldest, true); // Force immediate removal
    }
    
    // Add to front of queue
    this.messages.unshift(message);
    
    // Recalculate all positions
    this.layoutMessages();
    
    // Animate entry
    this.animateEntry(message);
  }

  private animateEntry(message: TrickMessage): void {
    // Fade in and slide up from below
    const targets = [];
    targets.push(message.textSprite);
    
    // Animate main text
    message.currentTween = this.scene.tweens.add({
      targets: message.textSprite,
      alpha: 1,
      y: message.targetY || this.baseY,
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        message.state = 'visible';
        message.currentTween = undefined;
        
        // Schedule automatic removal
        this.scene.time.delayedCall(message.duration, () => {
          if (message.state === 'visible') {
            this.removeMessage(message);
          }
        });
      }
    });
    
    // Animate star text separately to maintain proper spacing
    if (message.starSprite) {
      this.scene.tweens.add({
        targets: message.starSprite,
        alpha: 1,
        y: (message.targetY || this.baseY) + 35,
        duration: 300,
        ease: 'Power2.easeOut'
      });
    }
  }

  private removeMessage(message: TrickMessage, immediate: boolean = false): void {
    if (message.state === 'exiting' || message.state === 'destroyed') return;
    
    message.state = 'exiting';
    
    // Stop any current tween
    if (message.currentTween) {
      message.currentTween.stop();
    }
    
    if (immediate) {
      // Immediate removal for overflow
      message.textSprite.destroy();
      if (message.starSprite) message.starSprite.destroy();
      message.state = 'destroyed';
      
      // Remove from array
      const index = this.messages.indexOf(message);
      if (index > -1) {
        this.messages.splice(index, 1);
      }
      
      // Recalculate positions
      this.layoutMessages();
    } else {
      // Animated removal
      message.currentTween = this.scene.tweens.add({
        targets: [message.textSprite, message.starSprite].filter(Boolean),
        alpha: 0,
        y: '-=30',
        duration: 500,
        ease: 'Power2.easeIn',
        onComplete: () => {
          message.textSprite.destroy();
          if (message.starSprite) message.starSprite.destroy();
          message.state = 'destroyed';
          
          // Remove from array
          const index = this.messages.indexOf(message);
          if (index > -1) {
            this.messages.splice(index, 1);
          }
          
          // Recalculate positions
          this.layoutMessages();
        }
      });
    }
  }

  private layoutMessages(): void {
    // Recalculate positions for all messages - stack upward
    this.messages.forEach((message, index) => {
      if (message.state === 'destroyed') return;
      
      // Stack upward: newest at bottom (index 0), older messages move up
      const targetY = this.baseY - (index * this.slotHeight);
      message.targetY = targetY;
      
      // If message is already visible, smoothly transition to new position
      if (message.state === 'visible') {
        // Stop any current position tween
        if (message.currentTween) {
          message.currentTween.stop();
          message.currentTween = undefined;
        }
        
        // Animate to new position
        this.scene.tweens.add({
          targets: message.textSprite,
          y: targetY,
          duration: 200,
          ease: 'Power2.easeInOut'
        });
        
        if (message.starSprite) {
          this.scene.tweens.add({
            targets: message.starSprite,
            y: targetY + 35,  // Properly space star text below trick name
            duration: 200,
            ease: 'Power2.easeInOut'
          });
        }
      }
    });
  }

  update(time: number): void {
    // Check for expired messages
    const now = this.scene.time.now;
    const toRemove: TrickMessage[] = [];
    
    this.messages.forEach(message => {
      if (message.state === 'visible') {
        const age = now - message.createdAt;
        if (age >= message.duration) {
          toRemove.push(message);
        }
      }
    });
    
    // Remove expired messages
    toRemove.forEach(message => this.removeMessage(message));
  }

  clear(): void {
    // Clear all messages immediately
    this.messages.forEach(message => {
      if (message.currentTween) {
        message.currentTween.stop();
      }
      message.textSprite.destroy();
      if (message.starSprite) message.starSprite.destroy();
    });
    this.messages = [];
  }

  // Show active combo multiplier (stays at top, doesn't go in queue)
  showActiveCombo(multiplier: number, score: number): void {
    // Remove existing active combo text if present
    if (this.activeComboText) {
      this.activeComboText.destroy();
      this.activeComboText = null;
    }
    
    // Create new combo text at fixed position above message queue
    this.activeComboText = this.scene.add.text(320, 250, `COMBO x${multiplier}\nSCORE: ${score}`, {
      fontSize: '26px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    });
    this.activeComboText.setOrigin(0.5, 0.5);
    this.activeComboText.setDepth(151);
    this.activeComboText.setScrollFactor(0);
  }
  
  // Hide active combo display
  hideActiveCombo(): void {
    if (this.activeComboText) {
      this.activeComboText.destroy();
      this.activeComboText = null;
    }
  }
  
  // Add combo end message with different styling
  addComboMessage(multiplier: number, starsEarned?: number): void {
    const text = starsEarned ? `COMBO!\n+${starsEarned} STARS` : `COMBO x${multiplier}`;
    
    // Hide active combo display when showing end message
    this.hideActiveCombo();
    
    // Generate unique ID
    const id = `combo_${this.nextId++}`;
    
    // Create combo text with different color - start below screen
    const textSprite = this.scene.add.text(320, this.baseY + 50, text, {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#00ff00', // Green for combos
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    textSprite.setOrigin(0.5, 0.5);
    textSprite.setDepth(151); // Slightly higher depth for combos
    textSprite.setScrollFactor(0);
    textSprite.setAlpha(0);
    
    // Create message object
    const message: TrickMessage = {
      id,
      text,
      createdAt: this.scene.time.now,
      duration: this.messageDuration,
      textSprite,
      state: 'entering'
    };
    
    // Check if we need to remove oldest message
    if (this.messages.length >= this.maxVisible) {
      const oldest = this.messages[this.messages.length - 1];
      this.removeMessage(oldest, true);
    }
    
    // Add to front of queue
    this.messages.unshift(message);
    
    // Recalculate all positions
    this.layoutMessages();
    
    // Animate entry
    this.animateEntry(message);
  }

  // Add power-up message with image support
  addPowerUpMessage(imageName: string): void {
    // For power-ups, we'll use the existing image system but manage its position
    // This is a placeholder for integration - actual implementation will be in Game.ts
    // since it needs to create image objects instead of text
  }
}