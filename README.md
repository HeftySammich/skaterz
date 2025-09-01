# Zombie Skater - GBA Style Endless Runner

A retro-styled 2D endless runner game featuring a skateboarding zombie character. Built with modern web technologies while maintaining authentic Game Boy Advance aesthetics.

## 🎮 Game Features

- **Retro GBA Aesthetic**: 240x160 resolution with pixelated graphics and authentic color palette
- **Infinite Runner**: Endless city street scrolling with seamless background tiling
- **Skateboarding Mechanics**: Jump and double jump with trick animations
- **Touch Controls**: Mobile-optimized tap controls alongside keyboard support
- **Particle Effects**: Dynamic visual effects for jumps, tricks, and ground interactions
- **Animation System**: Three-state sprite system (idle, jump, trick)

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

## 📁 Project Structure

```
zombie-skater/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── game/          # Phaser game scenes and logic
│   │   └── styles/        # Tailwind CSS styles
│   └── public/
│       └── assets/        # Game assets (sprites, sounds)
├── server/                # Express.js backend
├── shared/                # Shared TypeScript types
├── attached_assets/       # Development assets and notes
└── dist/                  # Build output directory
```

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
- **Space** or **↑ Arrow**: Jump / Double Jump
- **Mouse Click**: Jump / Double Jump

### Mobile
- **Tap Screen**: Jump / Double Jump

## 🎨 Game Mechanics

### Jump System
- **First Jump**: Regular jump with cyan sparkle particles and dust effects
- **Double Jump**: Trick jump with golden trail particles and reduced gravity float
- **Landing**: Automatic state reset with stable ground positioning

### Visual Effects
- **Dust Particles**: Brown particles burst from ground on takeoff
- **Jump Sparkles**: Cyan particles explode around player on first jump  
- **Trick Trail**: Golden particles continuously follow player during double jump
- **Infinite Scrolling**: Seamless city background with proper perspective

## 🚀 Deployment

### Build Process
```bash
# Build frontend and backend
npm run build

# Files are output to:
# - dist/public/     (frontend static files)
# - dist/index.js    (backend server bundle)
```

### Production Environment
- **Node.js**: 18+ required
- **Memory**: 512MB minimum recommended
- **Storage**: ~50MB for application files
- **Database**: PostgreSQL (optional with fallback to memory)

### Environment Variables
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db  # Optional
```

## 📦 Key Dependencies

### Core Framework
- `react@18.3.1` - UI framework
- `phaser@3.90.0` - Game engine
- `express@4.21.2` - Web server
- `typescript@5.6.3` - Type safety

### Game Libraries  
- `howler@2.2.4` - Audio management
- `matter-js@0.20.0` - Physics simulation
- `gsap@3.12.5` - Animations

### Development Tools
- `vite@5.4.19` - Build tool and dev server
- `tailwindcss@3.4.14` - CSS framework
- `drizzle-orm@0.39.1` - Database ORM

### Blockchain Integration (Ready)
- Hedera SDK integration points configured
- HashPack wallet connection infrastructure
- NFT and token integration capabilities

## 🔮 Future Features

- **Hedera Network Integration**: NFT character skins and achievements
- **Wallet Connect**: HashPack wallet integration for blockchain features
- **Multiplayer**: Real-time competitive skating sessions
- **Level System**: Procedurally generated obstacle courses
- **Sound System**: Retro chiptune soundtrack and sound effects
- **High Scores**: Blockchain-verified leaderboards

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ for the retro gaming community