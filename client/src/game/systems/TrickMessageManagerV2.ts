// TrickMessageManager V2 - Improved text display system with no font size changes
// Goals: Zero clipping, zero edge-to-edge text, loud/readable/orderly display

interface MessageBlock {
  id: string;
  titleBase: string;  // Base title like "Trash Nose Grab"
  repeatCount: number;  // For showing "×3"
  info?: string;  // Secondary line like "+4 STARS" or "Caution!"
  isSystemBadge: boolean;  // True for badges like "Caution!"
  createdAt: number;
  visibleUntil: number;
  modeHint: 'full' | 'titleOnly';  // Whether to show info line
  state: 'entering' | 'visible' | 'exiting';
  // Sprites
  container?: Phaser.GameObjects.Container;
  titleText?: Phaser.GameObjects.Text;
  infoText?: Phaser.GameObjects.Text;
}

interface TrickMessageConfig {
  maxVisible?: number;  // Will be overridden by density mode
  baseY?: number;
  slotHeight?: number;  // Will be overridden by density mode
  messageDuration?: number;
}

type DensityMode = 'normal' | 'compact' | 'emergency';

export class TrickMessageManagerV2 {
  private scene: Phaser.Scene;
  private blocks: MessageBlock[] = [];  // Newest at front
  private nextId: number = 1;
  private densityMode: DensityMode = 'normal';
  private comboVisible: boolean = false;
  private activeComboText?: Phaser.GameObjects.Text;
  private messageBaseY: number = 250;  // Store the actual baseY from config
  private priorityMessageActive: boolean = false;  // Blocks new messages during priority
  private activeTweens: Map<string, Phaser.Tweens.Tween> = new Map();  // Track active tweens
  
  // Safe zones and margins (as percentages and pixels)
  private readonly SAFE_MARGIN_X_PERCENT = 0.07;  // 7% of screen width
  private readonly GLYPH_PAD = 14;  // Inner padding
  private readonly LANE_GAP = 14;  // Vertical gap between lanes
  
  // Density mode settings
  private readonly NORMAL_MAX_BLOCKS = 2;  // Reduced from 4 to prevent overlap
  private readonly NORMAL_SPACING = 60;    // Reduced from 75 for tighter spacing
  private readonly COMPACT_MAX_BLOCKS = 2;  // Reduced from 3
  private readonly COMPACT_SPACING = 50;    // Reduced from 60
  private readonly EMERGENCY_MAX_BLOCKS = 1;  // Reduced from 2
  
  // Timing constants
  private readonly MERGE_MS = 500;  // Merge window for same tricks
  private readonly BLOCK_LIFETIME = 1500;  // Reduced from 2500 - messages disappear faster
  private readonly INFO_EARLY_FADE_START = 600;  // Reduced from 900
  private readonly INFO_EARLY_FADE_END = 900;  // Reduced from 1200
  private readonly FAST_FADE_MS = 100;  // Reduced from 250 - instant removal
  private readonly SYSTEM_BADGE_LIFETIME = 1200;  // Reduced from 1800
  
  // Fixed positions
  private readonly COMBO_Y = 250;  // Not used anymore - messages go here instead
  private readonly HUD_BOTTOM = 140;  // Bottom of health/stamina bars
  private readonly ROAD_Y = 550;  // Where the road starts
  
  // Abbreviation dictionary
  private readonly ABBREVIATIONS: Record<string, string> = {
    'Bonehead Move!': 'Bonehead!',
    'Trash Nose Grab': 'Trash N.G.',
    'Robo Nose Grab': 'Robo N.G.',
    'Caution!': 'Caution!',
    'Trash Nose Grab x Trash Nose Grab': 'Trash N.G. x2',
    'Robo Nose Grab x Robo Nose Grab': 'Robo N.G. x2'
  };
  
  constructor(scene: Phaser.Scene, config: TrickMessageConfig = {}) {
    this.scene = scene;
    this.messageBaseY = config.baseY || 250;  // Actually use the baseY from config!
  }
  
  // Helper method to clean up and store tweens
  private manageTween(key: string, tween: Phaser.Tweens.Tween | null): void {
    // Clean up existing tween for this key
    const existingTween = this.activeTweens.get(key);
    if (existingTween && existingTween.isPlaying()) {
      existingTween.stop();
      existingTween.remove();
    }
    
    // Store new tween if provided
    if (tween) {
      this.activeTweens.set(key, tween);
    } else {
      this.activeTweens.delete(key);
    }
  }
  
  // Calculate safe zones based on current screen dimensions
  private getSafeBounds(): { x: number, width: number, top: number, bottom: number } {
    const screenWidth = 640;  // Fixed game width
    const safeMarginX = screenWidth * this.SAFE_MARGIN_X_PERCENT;
    const safeCenterX = screenWidth / 2;
    const safeWidth = screenWidth - (2 * safeMarginX);
    
    // Calculate message lane bounds
    let top = this.HUD_BOTTOM + this.LANE_GAP;
    if (this.comboVisible) {
      // Position below combo display
      top = this.COMBO_Y + 60 + this.LANE_GAP;  // Combo takes ~60px height
    }
    
    const bottom = this.ROAD_Y - this.LANE_GAP;
    
    return {
      x: safeCenterX,
      width: safeWidth,
      top,
      bottom
    };
  }
  
  // Get current density settings
  private getDensitySettings(): { maxBlocks: number, spacing: number } {
    switch (this.densityMode) {
      case 'normal':
        return { maxBlocks: this.NORMAL_MAX_BLOCKS, spacing: this.NORMAL_SPACING };
      case 'compact':
        return { maxBlocks: this.COMPACT_MAX_BLOCKS, spacing: this.COMPACT_SPACING };
      case 'emergency':
        return { maxBlocks: this.EMERGENCY_MAX_BLOCKS, spacing: this.NORMAL_SPACING };
    }
  }
  
  // Check if text needs wrapping and apply smart breaks with 22 character limit
  private wrapText(text: string, maxWidth: number): string[] {
    const MAX_CHARS_PER_LINE = 22; // Hard character limit per line
    
    // If text is within character limit, return as single line
    if (text.length <= MAX_CHARS_PER_LINE) {
      return [text];
    }
    
    // Find wrap points (spaces and separators)
    const wrapPoints = [' ', '+', '!', '–', ':'];
    let bestBreakIndex = -1;
    
    // Find the last valid wrap point that would fit in first line
    for (let i = Math.min(text.length - 1, MAX_CHARS_PER_LINE); i > 0; i--) {
      if (wrapPoints.includes(text[i])) {
        bestBreakIndex = i;
        break;
      }
    }
    
    // If no wrap point found within limit, look for closest one before limit
    if (bestBreakIndex === -1) {
      for (let i = MAX_CHARS_PER_LINE - 1; i > 0; i--) {
        if (wrapPoints.includes(text[i])) {
          bestBreakIndex = i;
          break;
        }
      }
    }
    
    // If we found a break point, split there
    if (bestBreakIndex > 0) {
      const firstLine = text.substring(0, bestBreakIndex).trim();
      const secondLine = text.substring(bestBreakIndex).trim();
      
      // Ensure both lines respect the character limit
      if (firstLine.length <= MAX_CHARS_PER_LINE && secondLine.length <= MAX_CHARS_PER_LINE) {
        return [firstLine, secondLine];
      }
    }
    
    // If no natural break or lines too long, force break at character limit
    const firstLine = text.substring(0, MAX_CHARS_PER_LINE).trim();
    const secondLine = text.substring(MAX_CHARS_PER_LINE).trim();
    
    // If second line is still too long, truncate or abbreviate
    if (secondLine.length > MAX_CHARS_PER_LINE) {
      return [firstLine, secondLine.substring(0, MAX_CHARS_PER_LINE).trim()];
    }
    
    return [firstLine, secondLine];
  }
  
  // Apply abbreviation if text is still too wide
  private abbreviateText(text: string): string {
    // Check if we have a direct abbreviation
    if (this.ABBREVIATIONS[text]) {
      return this.ABBREVIATIONS[text];
    }
    
    // Apply pattern-based abbreviations
    if (text.includes(' Nose Grab')) {
      return text.replace(' Nose Grab', ' N.G.');
    }
    if (text.includes(' Move!')) {
      return text.replace(' Move!', '!');
    }
    
    return text;
  }
  
  // Check if we should merge with existing block
  private shouldMerge(title: string): MessageBlock | null {
    if (this.blocks.length === 0) return null;
    
    const latestBlock = this.blocks[0];
    const timeSinceCreated = this.scene.time.now - latestBlock.createdAt;
    
    // Check if within merge window and same base title
    if (timeSinceCreated <= this.MERGE_MS && latestBlock.titleBase === title) {
      return latestBlock;
    }
    
    return null;
  }
  
  // Update density mode based on available height
  private updateDensityMode(): void {
    const bounds = this.getSafeBounds();
    const availableHeight = bounds.bottom - bounds.top;
    
    // Try normal mode first
    const normalHeight = this.NORMAL_MAX_BLOCKS * this.NORMAL_SPACING;
    if (normalHeight <= availableHeight && !this.comboVisible) {
      this.densityMode = 'normal';
      return;
    }
    
    // Try compact mode
    const compactHeight = this.COMPACT_MAX_BLOCKS * this.COMPACT_SPACING;
    if (compactHeight <= availableHeight) {
      this.densityMode = 'compact';
      return;
    }
    
    // Emergency mode
    this.densityMode = 'emergency';
  }
  
  // Retire oldest blocks if we're over limit
  private retireOldestBlocks(): void {
    const settings = this.getDensitySettings();
    
    while (this.blocks.length > settings.maxBlocks) {
      const oldestBlock = this.blocks[this.blocks.length - 1];
      this.removeBlock(oldestBlock, true);  // Fast fade
    }
  }
  
  // Create text sprites for a block
  private createBlockSprites(block: MessageBlock): void {
    const bounds = this.getSafeBounds();
    const safeWidth = bounds.width - (2 * this.GLYPH_PAD);
    
    // Create container - USE messageBaseY instead of bounds.bottom!
    block.container = this.scene.add.container(bounds.x, this.messageBaseY);
    block.container.setScrollFactor(0);
    block.container.setDepth(150);
    
    // Process title text (with repeat count if needed) - use + for bonus, not ×
    let displayTitle = block.titleBase;
    if (block.repeatCount > 1) {
      displayTitle = `${block.titleBase} +${block.repeatCount}`;
    }
    
    // Apply wrapping and abbreviation if needed
    let wrappedTitle = this.wrapText(displayTitle, safeWidth);
    if (wrappedTitle.length > 1 || this.needsAbbreviation(displayTitle, safeWidth)) {
      // Try abbreviation for older blocks first
      const blockIndex = this.blocks.indexOf(block);
      if (blockIndex > 0) {  // Not the newest block
        displayTitle = this.abbreviateText(displayTitle);
        // Recalculate wrapping after abbreviation
        wrappedTitle = this.wrapText(displayTitle, safeWidth);
      }
    }
    
    // Check if title already contains line breaks (multi-obstacle tricks)
    let finalTitle: string;
    if (displayTitle.includes('\n')) {
      // Already multi-line, use as-is
      finalTitle = displayTitle;
    } else {
      // Always use wrapped title to enforce 22 char limit
      finalTitle = wrappedTitle.join('\n');
    }
    
    block.titleText = this.scene.make.text({
      x: 0,
      y: 0,
      text: finalTitle,
      style: {
        fontSize: '24px',  // Keep same font size
        fontFamily: '"Press Start 2P", monospace',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
        lineSpacing: 8  // Add line spacing for multi-line text
      }
    });
    block.titleText.setOrigin(0.5, 1);  // Bottom-center origin
    block.container.add(block.titleText);
    
    // Create info text if in full mode and info exists
    if (block.modeHint === 'full' && block.info) {
      block.infoText = this.scene.make.text({
        x: 0,
        y: 35,  // Below title
        text: block.info,
        style: {
          fontSize: '18px',
          fontFamily: '"Press Start 2P", monospace',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
          align: 'center'
        }
      });
      block.infoText.setOrigin(0.5, 1);
      block.container.add(block.infoText);
    }
    
    // Start with 0 alpha for fade-in
    block.container.setAlpha(0);
  }
  
  // Check if text needs abbreviation
  private needsAbbreviation(text: string, maxWidth: number): boolean {
    const testText = this.scene.add.text(0, 0, text, {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace'
    });
    testText.visible = false;
    
    const needsIt = testText.width > maxWidth * 0.9;
    testText.destroy();
    
    return needsIt;
  }
  
  // Layout all blocks with current density mode
  private layoutBlocks(): void {
    const bounds = this.getSafeBounds();
    const settings = this.getDensitySettings();
    
    // Define minimum Y position to prevent overlap with UI (challenges are around Y=230)
    const MIN_Y_POSITION = 150;  // Don't let messages go above this point
    
    // Track blocks to remove after iteration (to avoid concurrent modification)
    const blocksToRemove: MessageBlock[] = [];
    
    this.blocks.forEach((block, index) => {
      if (index >= settings.maxBlocks || !block.container) return;
      
      // Calculate target Y position
      const baseTargetY = this.messageBaseY - (index * settings.spacing);
      
      // If message would go too high, mark it for removal (don't remove during iteration)
      if (baseTargetY < MIN_Y_POSITION) {
        blocksToRemove.push(block);
        return;
      }
      
      // Update mode hint based on density mode and position
      if (this.densityMode === 'compact' || this.densityMode === 'emergency') {
        // Only newest shows info
        block.modeHint = index === 0 ? 'full' : 'titleOnly';
        
        // Hide info text for older blocks
        if (block.infoText && index > 0) {
          this.scene.tweens.add({
            targets: block.infoText,
            alpha: 0,
            duration: 300,
            ease: 'Power2.easeOut'
          });
        }
      } else {
        block.modeHint = 'full';
      }
      
      // Position blocks: newest at base, older ones move UP and fade
      const targetY = Math.max(MIN_Y_POSITION, baseTargetY);  // Enforce minimum Y
      
      if (index > 0) {
        // Older messages: fade out and disappear almost immediately
        const fadeTween = this.scene.tweens.add({
          targets: block.container,
          y: targetY,  // No extra upward movement
          alpha: 0,  // Fade to 0% opacity (completely invisible)
          duration: 150,  // Very fast fade (150ms)
          ease: 'Power2.easeOut',
          onComplete: () => {
            // Remove ALL old blocks immediately (not just index > 1)
            this.removeBlock(block, true);
            this.manageTween(`layout_${block.id}`, null);
          }
        });
        this.manageTween(`layout_${block.id}`, fadeTween);
      } else {
        // New message: appear at base position with full opacity
        const appearTween = this.scene.tweens.add({
          targets: block.container,
          y: targetY,
          alpha: 1,
          duration: 200,
          ease: 'Power2.easeInOut'
        });
        this.manageTween(`layout_${block.id}`, appearTween);
      }
    });
    
    // Now safely remove blocks that were too high (after iteration completes)
    blocksToRemove.forEach(block => {
      this.removeBlock(block, true);
    });
  }
  
  // Add a new message to the queue
  addMessage(title: string, stars?: number, flags?: { systemBadge?: boolean }): void {
    // Don't add messages while priority message is active
    if (this.priorityMessageActive) {
      return;
    }
    
    // Check if we should merge with existing block
    const mergeTarget = this.shouldMerge(title);
    
    if (mergeTarget) {
      // Update existing block
      mergeTarget.repeatCount++;
      if (stars) {
        mergeTarget.info = `+${stars * mergeTarget.repeatCount} STARS`;
      }
      
      // Pulse effect
      if (mergeTarget.container) {
        this.scene.tweens.add({
          targets: mergeTarget.container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          yoyo: true,
          ease: 'Power2.easeInOut'
        });
      }
      
      // Update display
      this.updateBlockDisplay(mergeTarget);
      return;
    }
    
    // Update density mode before adding
    this.updateDensityMode();
    
    // Create new block
    const id = `block_${this.nextId++}`;
    const info = stars ? `+${stars} STAR${stars > 1 ? 'S' : ''}` : undefined;
    
    const block: MessageBlock = {
      id,
      titleBase: title,
      repeatCount: 1,
      info: flags?.systemBadge ? title : info,  // System badges use title as info
      isSystemBadge: flags?.systemBadge || false,
      createdAt: this.scene.time.now,
      visibleUntil: this.scene.time.now + (flags?.systemBadge ? this.SYSTEM_BADGE_LIFETIME : this.BLOCK_LIFETIME),
      modeHint: 'full',
      state: 'entering'
    };
    
    // Add to front of queue
    this.blocks.unshift(block);
    
    // Retire oldest if needed
    this.retireOldestBlocks();
    
    // Create sprites
    this.createBlockSprites(block);
    
    // Layout all blocks
    this.layoutBlocks();
    
    // Animate entry
    this.animateBlockEntry(block);
    
    // Schedule removal
    this.scene.time.delayedCall(block.visibleUntil - block.createdAt, () => {
      this.removeBlock(block);
    });
  }
  
  // Update block display after merge
  private updateBlockDisplay(block: MessageBlock): void {
    if (!block.titleText || !block.container) return;
    
    // Update title with repeat count (use + for bonus, not ×)
    let displayTitle = block.titleBase;
    if (block.repeatCount > 1) {
      displayTitle = `${block.titleBase} +${block.repeatCount}`;
    }
    
    block.titleText.setText(displayTitle);
    
    // Update info if present
    if (block.infoText && block.info) {
      block.infoText.setText(block.info);
    }
  }
  
  // Animate block entry
  private animateBlockEntry(block: MessageBlock): void {
    if (!block.container) return;
    
    // Start slightly below and scale up
    block.container.y += 20;
    
    // Fade in and slide up
    const entryTween = this.scene.tweens.add({
      targets: block.container,
      alpha: 1,
      y: block.container.y - 20,
      scaleX: { from: 0.95, to: 1 },
      scaleY: { from: 0.95, to: 1 },
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => {
        block.state = 'visible';
        this.manageTween(`entry_${block.id}`, null);
        
        // Apply spotlight effect (dim older blocks)
        this.applySpotlightEffect();
      }
    });
    this.manageTween(`entry_${block.id}`, entryTween);
  }
  
  // Apply spotlight effect to newest block
  private applySpotlightEffect(): void {
    this.blocks.forEach((block, index) => {
      if (!block.container) return;
      
      const targetAlpha = index === 0 ? 1.0 : 0.75;
      
      const spotlightTween = this.scene.tweens.add({
        targets: block.container,
        alpha: targetAlpha,
        duration: 400,
        ease: 'Power2.easeInOut'
      });
      this.manageTween(`spotlight_${block.id}`, spotlightTween);
    });
  }
  
  // Remove a block with animation
  private removeBlock(block: MessageBlock, fastFade: boolean = false): void {
    if (block.state === 'exiting') return;
    
    block.state = 'exiting';
    const fadeDuration = fastFade ? this.FAST_FADE_MS : 500;
    
    if (block.container) {
      // Fade out and drift up slightly
      const removeTween = this.scene.tweens.add({
        targets: block.container,
        alpha: 0,
        y: block.container.y - 10,
        duration: fadeDuration,
        ease: 'Power2.easeIn',
        onComplete: () => {
          // Clean up all tweens for this block
          [`layout_${block.id}`, `entry_${block.id}`, `spotlight_${block.id}`, `remove_${block.id}`].forEach(key => {
            this.manageTween(key, null);
          });
          
          block.container?.destroy();
          
          // Remove from array
          const index = this.blocks.indexOf(block);
          if (index > -1) {
            this.blocks.splice(index, 1);
          }
          
          // Re-layout remaining blocks
          this.layoutBlocks();
        }
      });
      this.manageTween(`remove_${block.id}`, removeTween);
    }
  }
  
  // Show active combo display
  showActiveCombo(multiplier: number, starsToEarn: number): void {
    this.comboVisible = true;
    
    // Update density mode
    this.updateDensityMode();
    
    // Re-layout blocks to make room
    this.layoutBlocks();
    
    // Remove existing combo text if present
    if (this.activeComboText) {
      this.activeComboText.destroy();
      this.activeComboText = undefined;
    }
    
    // Create combo text at fixed position - same format as end message
    this.activeComboText = this.scene.add.text(320, this.COMBO_Y, 
      `COMBO!\n+${starsToEarn} STARS`, {
      fontSize: '24px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    this.activeComboText.setOrigin(0.5, 0.5);
    this.activeComboText.setDepth(151);
    this.activeComboText.setScrollFactor(0);
  }
  
  // Update active combo display
  updateActiveCombo(multiplier: number, starsToEarn: number): void {
    if (!this.activeComboText) return;
    
    // Keep it simple - just COMBO! with stars
    this.activeComboText.setText(`COMBO!\n+${starsToEarn} STARS`);
    
    // Small pulse effect
    this.scene.tweens.add({
      targets: this.activeComboText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      yoyo: true,
      ease: 'Power2.easeInOut'
    });
  }
  
  // Hide active combo and show summary
  hideActiveCombo(finalStars?: number): void {
    this.comboVisible = false;
    
    // Hide combo text
    if (this.activeComboText) {
      this.activeComboText.destroy();
      this.activeComboText = undefined;
    }
    
    // Show combo summary if stars earned
    if (finalStars && finalStars > 0) {
      this.addMessage('COMBO!', finalStars);
    }
    
    // Update density mode
    this.updateDensityMode();
    
    // Re-layout blocks
    this.layoutBlocks();
  }
  
  // Add a priority message that clears all others and persists longer
  addPriorityMessage(title: string, description: string, duration: number = 4000): void {
    console.log('[DEBUG PRIORITY MSG] Adding priority message:', title, description);
    console.log('[DEBUG PRIORITY MSG] Current blocks:', this.blocks.length);
    console.log('[DEBUG PRIORITY MSG] Active tweens before clear:', this.activeTweens.size);
    
    try {
      // Clear all existing messages immediately
      this.blocks.forEach(block => {
        if (block.container) {
          console.log('[DEBUG PRIORITY MSG] Destroying block container');
          block.container.destroy();
        }
      });
      this.blocks = [];
      
      console.log('[DEBUG PRIORITY MSG] Creating priority container');
      // Create the priority message at center
      const priorityContainer = this.scene.add.container(320, 300);
      priorityContainer.setScrollFactor(0);
      priorityContainer.setDepth(200);
      
      const titleText = this.scene.add.text(0, 0, title, {
        fontSize: '20px',
        color: '#4caf50',
        fontFamily: '"Press Start 2P", monospace',
        stroke: '#000000',
        strokeThickness: 4
      });
      titleText.setOrigin(0.5);
      
      const descText = this.scene.add.text(0, 30, description, {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: '"Press Start 2P", monospace',
        stroke: '#000000',
        strokeThickness: 3
      });
      descText.setOrigin(0.5);
      
      priorityContainer.add([titleText, descText]);
      
      // Animate entrance
      priorityContainer.setScale(0);
      this.scene.tweens.add({
        targets: priorityContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Fade out after duration
          this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
              targets: priorityContainer,
              alpha: 0,
              duration: 500,
              onComplete: () => priorityContainer.destroy()
            });
          });
        }
      });
      
      // Prevent new messages for the duration
      this.priorityMessageActive = true;
      this.scene.time.delayedCall(duration + 500, () => {
        this.priorityMessageActive = false;
      });
      
      console.log('[DEBUG PRIORITY MSG] Priority message created successfully');
    } catch (error) {
      console.error('[DEBUG PRIORITY MSG] Error creating priority message:', error);
      // Reset state to prevent stuck condition
      this.priorityMessageActive = false;
      this.blocks = [];
    }
  }
  
  // Handle window resize
  onResize(): void {
    // Recalculate safe zones
    this.updateDensityMode();
    this.layoutBlocks();
  }
  
  // Update method (called each frame)
  update(time: number, delta: number): void {
    const now = this.scene.time.now;
    
    // Check for expired blocks
    this.blocks.forEach(block => {
      // Handle info line early fade in compact/emergency modes
      if ((this.densityMode === 'compact' || this.densityMode === 'emergency') && 
          block.infoText && block.state === 'visible') {
        const age = now - block.createdAt;
        
        if (age >= this.INFO_EARLY_FADE_START && age <= this.INFO_EARLY_FADE_END) {
          // Calculate fade alpha
          const fadeProgress = (age - this.INFO_EARLY_FADE_START) / 
                             (this.INFO_EARLY_FADE_END - this.INFO_EARLY_FADE_START);
          block.infoText.setAlpha(1 - fadeProgress);
        } else if (age > this.INFO_EARLY_FADE_END) {
          block.infoText.setAlpha(0);
        }
      }
      
      // Check for block expiration
      if (now >= block.visibleUntil && block.state === 'visible') {
        this.removeBlock(block);
      }
    });
  }
  
  // Clear all messages
  clear(): void {
    // Stop and remove all active tweens first
    this.activeTweens.forEach((tween, key) => {
      if (tween && tween.isPlaying()) {
        tween.stop();
        tween.remove();
      }
    });
    this.activeTweens.clear();
    
    this.blocks.forEach(block => {
      block.container?.destroy();
    });
    this.blocks = [];
    
    if (this.activeComboText) {
      this.activeComboText.destroy();
      this.activeComboText = undefined;
    }
    
    this.comboVisible = false;
    this.densityMode = 'normal';
  }
  
  // Clean up all tweens and resources on shutdown
  cleanup(): void {
    this.clear();
  }
  
  // Legacy method compatibility - convert to new system
  addComboMessage(multiplier: number, starsEarned?: number): void {
    if (starsEarned && starsEarned > 0) {
      this.addMessage('COMBO!', starsEarned);
    }
  }
  
  // Legacy method for power-ups (treated as system badge)
  addPowerUpMessage(imageName: string): void {
    // Convert power-up name to display text
    let displayText = imageName;
    if (imageName === 'power_metal') displayText = 'Metal Boot!';
    if (imageName === 'power_fire') displayText = 'Fire Taco!';
    if (imageName === 'power_crystal') displayText = 'Crystal Magnet!';
    
    this.addMessage(displayText, undefined, { systemBadge: true });
  }
}