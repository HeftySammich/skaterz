# Zombie Skater - GBA Style Endless Runner

A retro-styled 2D endless runner game featuring a skateboarding zombie character. Built with modern web technologies while maintaining authentic Game Boy Advance aesthetics.

## 🎮 Game Features

- **Retro GBA Aesthetic**: 640x960 resolution with pixelated graphics and authentic 16-bit style
- **Dual Character System**: Play as Kev or Stacy, each with unique zombie sprites
- **Infinite Runner**: Endless city street with progressive difficulty and speed increases
- **Combat System**: Crush enemies (eyeballs and robots) by stomping on them
- **Star Collection ($STAR)**: Collect stars to purchase customizations, new characters, game modes, and extra lives
- **Health & Stamina System**: Manage health with sandwich pickups and stamina for double jumps
- **Power-Ups**: Energy drinks provide temporary stamina boost and invulnerability
- **Combo System**: Chain tricks and enemy kills for multiplied star rewards
- **Life System**: Earn extra lives at 100, 200, and 300 stars (continuous accumulation)
- **Obstacle Dodging**: Avoid various obstacles including trash cans, cones, and zombies
- **Touch Controls**: Tap to jump, swipe up for aerial tricks
- **Leaderboard System**: Database-backed high score tracking with automatic submission
- **Dynamic Soundtrack**: Alternating background music tracks with on-screen artist credits

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.6.3
- **Game Engine**: Phaser 3.90.0 for HTML5 canvas rendering
- **Build Tool**: Vite 5.4.19 with hot module replacement
- **Styling**: Tailwind CSS 3.4.14 with custom GBA styling
- **UI Components**: Radix UI primitives with custom themes

### Backend
- **Runtime**: Node.js with Express 4.21.2
- **Database**: PostgreSQL with Drizzle ORM 0.39.1
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: TSX for TypeScript execution

### Game Technology
- **Physics**: Phaser Arcade Physics for collision detection
- **Graphics**: Canvas-based rendering with nearest-neighbor scaling
- **Audio**: Howler.js 2.2.4 for sound effects and music
- **Input**: Unified keyboard, mouse, and touch controls

### Blockchain Ready (Configured)
- **Hedera Network**: Ready for NFT integration and decentralized features
- **HashPack Wallet**: Wallet connection capability for future features

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- PostgreSQL database (optional, has fallback)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zombie-skater
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure database connection (optional)
   DATABASE_URL="postgresql://user:password@localhost:5432/zombie_skater"
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```
   Game runs at: `http://localhost:5000`

### Build Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Type checking
npm run check

# Database migrations
npm run db:push
```

## 🎯 Game Controls

### Desktop
- **Space** or **↑ Arrow**: Jump
- **Space/↑ Again (in air)**: Double Jump (costs stamina)
- **Mouse Click**: Jump
- **J Key (while airborne)**: Perform trick for combo points

### Mobile
- **Tap Screen**: Jump
- **Tap Again (in air)**: Double Jump (costs stamina)
- **Swipe Up (while airborne)**: Perform trick for combo points

## 🎨 Game Mechanics

### Core Gameplay
- **Objective**: Dodge obstacles, crush enemies, and collect $STAR tokens
- **Progressive Difficulty**: Game speed increases as you score more points
- **Survival Focus**: Manage health, stamina, and lives to achieve high scores

### Combat & Movement
- **Enemy Stomping**: Jump on enemies to defeat them and score points
- **Double Jump**: Use stamina to perform a second jump in mid-air
- **Aerial Tricks**: J key (desktop) or swipe up (mobile) while airborne to perform tricks
- **Combo System**: Combine tricks and enemy kills (3+ actions) for bonus stars

### Resource Management
- **Health Bar**: Take damage from obstacles and enemies, restore with sandwiches
- **Stamina Bar**: Required for double jumps and tricks, regenerates over time
- **Life Counter**: Start with 3 lives, earn more at star milestones
- **Star Economy**: Collect stars to unlock features and gain extra lives

### Power-Ups & Items
- **Sandwiches**: Restore 20 health points (with warning arrow indicator)
- **Energy Drinks**: Full stamina restore, temporary invulnerability, and speed boost
- **Single Stars**: Worth 1 star each with collection sound effect
- **Star Clusters**: Worth 10 stars each with special sound effect

### Scoring System
- **Base Points**: 10 points per second survived, 50 points per enemy defeated
- **Combo Multipliers**: x3 to x10 multiplier for successful combo chains
- **Star Bonuses**: Combos convert score points into bonus stars
- **Leaderboard**: Automatic score submission as "Player 1"

### Blockchain Integration (Ready)
- Hedera SDK integration points configured
- HashPack wallet connection infrastructure
- NFT and token integration capabilities

## 🔮 Current Features & Future Roadmap

### Fully Implemented
- ✅ Dual playable characters (Kev and Stacy)
- ✅ Complete enemy system with stomping mechanics
- ✅ Health and stamina systems with UI
- ✅ Power-up system (sandwiches and energy drinks)
- ✅ Star collection and life reward system
- ✅ Combo system with multipliers
- ✅ Progressive difficulty scaling
- ✅ Full sound effects and alternating music tracks
- ✅ PostgreSQL-backed leaderboard
- ✅ Tutorial and How to Play screens
- ✅ Character selection screen
- ✅ Splash screen sequence

### Future Features
- New character skins and customizations
- Additional game modes and levels
- Multiplayer Mode: Compete with other players in real-time
- Achievement System: Unlock rewards for gameplay milestones
- Expanded Enemy Types: More enemy varieties with unique behaviors
- Environmental Hazards: Additional obstacle types and patterns

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

Built by SLIME + Starfall V with 💚 for the Hedera gaming community
