# Zombie Skater - GBA Style Runner

## Overview

This is a retro-style 2D endless runner game featuring skateboarding zombie characters. The game mimics classic 16-bit aesthetics with pixelated graphics and vibrant colors. Players dodge obstacles, crush enemies, and collect $STAR tokens to purchase customizations, new characters, game modes, and extra lives. The game features a comprehensive combo system, resource management mechanics, and progressive difficulty scaling. Built with modern web technologies, the project is architected for future blockchain integration through Hedera network features.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Complete Game Implementation (Jan 2025)
- **Dual Character System**: Play as Kev or Stacy with unique zombie sprites
- **Enemy Combat System**: Stomp on eyeball and robot enemies for points and combos
- **Resource Management**: Health system with sandwich pickups, stamina for double jumps
- **Power-Up System**: Energy drinks provide stamina boost and temporary invulnerability
- **Combo Mechanics**: Chain tricks and kills for x3-x10 star multipliers
- **Star Economy**: Collect $STAR tokens for lives (100, 200, 300) and future purchases
- **Progressive Difficulty**: Speed increases based on score thresholds
- **Obstacle Variety**: Multiple obstacle types (cones, trash, crashes, zombies, skulls)
- **Audio System**: Jump, combo, explosion, and star collection sound effects
- **Music System**: Alternating tracks ("Broken Code" and "Undead Empire") with on-screen credits
- **UI Systems**: Health/stamina bars, life counter, star display, combo notifications
- **Leaderboard**: PostgreSQL-backed high score system with automatic submission
- **Tutorial System**: In-game instructions and dedicated How to Play screen
- **Gesture Controls**: Swipe up for aerial tricks, tap for jumping

## System Architecture

### Frontend Architecture
- **Game Engine**: Phaser 3 for HTML5 canvas-based game rendering and physics
- **UI Framework**: React with TypeScript for game interface components
- **Styling**: Tailwind CSS with custom pixelated styling for GBA aesthetic
- **Build System**: Vite for fast development and optimized production builds
- **State Management**: Zustand stores for game state and audio management

### Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **Development Setup**: Hot module replacement with Vite integration in development
- **Storage Interface**: Abstracted storage layer with in-memory implementation (ready for database integration)
- **API Structure**: RESTful endpoints with /api prefix (currently minimal)

### Game Architecture
- **Scene Management**: Complete scene system (Splash screens 1-5, MainMenu, CharacterSelect, HowToPlay, Game, GameOver, Leaderboard)
- **Input System**: Unified controls with keyboard, mouse, tap, and swipe gesture support
- **Physics**: Arcade physics for collisions, enemy stomping, and item collection
- **Combat System**: Enemy spawning, collision detection, and stomping mechanics
- **Combo System**: Modular combo tracker with event-based architecture
- **Resource Systems**: Health management, stamina regeneration, life tracking
- **Item Systems**: Power-up spawning with warning indicators, collection effects
- **Audio Management**: Dynamic music switching, layered sound effects
- **UI Systems**: Responsive HUD, floating text notifications, particle effects
- **Scoring Engine**: Point accumulation, combo multipliers, star conversion

### Data Storage
- **Local Storage**: Browser localStorage for high scores and game settings
- **Database Ready**: Drizzle ORM configured for PostgreSQL with user schema
- **Session Management**: Express session setup with PostgreSQL store support

### Styling and Design
- **Retro Aesthetic**: 240x160 base resolution scaled up with nearest-neighbor filtering
- **Component Library**: Comprehensive Radix UI components with custom styling
- **Responsive Design**: Mobile-first approach with touch controls
- **Theme System**: CSS custom properties for consistent color schemes

## External Dependencies

### Core Game Dependencies
- **Phaser**: Game engine for 2D canvas rendering and physics simulation
- **React/React-DOM**: Component-based UI framework
- **TypeScript**: Type safety across frontend and backend

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for UI elements
- **Class Variance Authority**: Component variant management

### Backend Services
- **Express**: Web server framework
- **Drizzle ORM**: Type-safe database toolkit
- **Neon Database**: Serverless PostgreSQL (configured but not implemented)

### Development Tools
- **Vite**: Build tool and development server
- **ESBuild**: Fast JavaScript bundler for production
- **PostCSS**: CSS processing with Autoprefixer

### Blockchain Integration (Architecture Ready)
- **Hedera Network**: Infrastructure planned for NFT integration and decentralized features
- **HashPack Wallet**: Architecture prepared for wallet connection (requires implementation)
- **Status**: Dependencies not yet installed, integration points identified

### Audio and Media
- **Web Audio API**: Sound effects and background music support
- **GLSL Shader Support**: Enhanced visual effects capability

The application is structured as a full-stack TypeScript project with a clear separation between game logic, UI components, and server functionality. The modular architecture allows for easy extension with blockchain features, multiplayer capabilities, and enhanced graphics while maintaining the retro aesthetic.