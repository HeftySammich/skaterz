import Phaser from 'phaser';

interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  createdAt: string;
}

export default class Leaderboard extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private menuMusic: Phaser.Sound.BaseSound | null = null;
  private leaderboardData: LeaderboardEntry[] = [];
  private isLoading = true;

  constructor() {
    super({ key: 'Leaderboard' });
  }

  init(data: { menuMusic?: Phaser.Sound.BaseSound }) {
    // Receive menu music from MainMenu to keep it playing
    this.menuMusic = data.menuMusic || null;
  }

  async create() {
    // Add graffiti background
    const bg = this.add.image(320, 480, 'graffiti_bg');
    bg.setDisplaySize(640, 960);
    
    // Add semi-transparent black rectangle for leaderboard area
    const leaderboardBg = this.add.graphics();
    leaderboardBg.fillStyle(0x000000, 0.6); // Black with 60% opacity
    leaderboardBg.fillRoundedRect(50, 170, 540, 620, 15);
    
    // Title
    const titleText = this.add.text(320, 120, 'LEADERBOARD', {
      fontSize: '28px',
      color: '#ffecb3',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    titleText.setShadow(3, 3, '#000000', 5, true, true);

    // Loading text (will be replaced)
    const loadingText = this.add.text(320, 350, 'LOADING...', {
      fontSize: '20px',
      color: '#b9c0cf',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    loadingText.setShadow(2, 2, '#000000', 3, true, true);

    // Back instruction
    const backText = this.add.text(320, 850, 'GO BACK', {
      fontSize: '22px',
      color: '#e2e28e',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    backText.setShadow(2, 2, '#000000', 3, true, true);

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Touch/click to go back
    this.input.on('pointerdown', () => {
      this.scene.start('MainMenu', { menuMusic: this.menuMusic });
    });

    // Fetch leaderboard data
    try {
      const response = await fetch('/api/leaderboard?limit=10');
      if (response.ok) {
        this.leaderboardData = await response.json();
        this.isLoading = false;
        
        // Remove loading text
        loadingText.destroy();
        
        // Display leaderboard
        this.displayLeaderboard();
      } else {
        throw new Error('Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      this.isLoading = false;
      
      // Show error message
      loadingText.setText('FAILED TO LOAD\nLEADERBOARD');
      loadingText.setColor('#ff0000');
    }
  }

  displayLeaderboard() {
    if (this.leaderboardData.length === 0) {
      const noScoresText = this.add.text(320, 350, 'NO SCORES YET!\nBE THE FIRST!', {
        fontSize: '18px',
        color: '#b9c0cf',
        fontFamily: '"Press Start 2P", monospace',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      noScoresText.setShadow(2, 2, '#000000', 3, true, true);
      return;
    }

    // Display top 10 scores
    let yPosition = 200;
    const lineHeight = 45;

    this.leaderboardData.forEach((entry, index) => {
      const rank = index + 1;
      let rankColor = '#ffffff';
      
      // Special colors for top 3
      if (rank === 1) rankColor = '#ffd700'; // Gold
      else if (rank === 2) rankColor = '#c0c0c0'; // Silver
      else if (rank === 3) rankColor = '#cd7f32'; // Bronze

      // Rank and player name
      const nameText = entry.playerName.length > 12 ? 
        entry.playerName.substring(0, 12) + '...' : 
        entry.playerName;

      const rankText = this.add.text(80, yPosition, `${rank}.`, {
        fontSize: '16px',
        color: rankColor,
        fontFamily: '"Press Start 2P", monospace',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 0.5);
      rankText.setShadow(2, 2, '#000000', 2, true, true);

      const nameTextEl = this.add.text(130, yPosition, nameText, {
        fontSize: '16px',
        color: rankColor,
        fontFamily: '"Press Start 2P", monospace',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 0.5);
      nameTextEl.setShadow(2, 2, '#000000', 2, true, true);

      // Score (right aligned)
      const scoreText = this.add.text(560, yPosition, Math.floor(entry.score).toString(), {
        fontSize: '16px',
        color: rankColor,
        fontFamily: '"Press Start 2P", monospace',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(1, 0.5);
      scoreText.setShadow(2, 2, '#000000', 2, true, true);

      yPosition += lineHeight;
    });
  }

  update() {
    // ESC to go back
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ESC'))) {
      this.scene.start('MainMenu', { menuMusic: this.menuMusic });
    }
  }
}