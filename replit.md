# Zombie Skater - GBA Style Runner

## Overview

This is a retro-style 2D endless runner game inspired by skateboarding, featuring a zombie character. The game mimics the Game Boy Advance aesthetic with pixelated graphics and a limited color palette. Players control a skateboarding zombie through an endless level, performing tricks, grinding rails, and avoiding obstacles while accumulating points. The project uses modern web technologies to create a nostalgic gaming experience with potential for blockchain integration through Hedera network features.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Enhanced Zombie Skater Implementation (Jan 2025)
- **Implemented three-state animation system**: Static idle PNG for skating, animated jump GIF, and trick GIF for midair stunts
- **Added enhanced double-jump mechanics**: First jump performs regular leap, second jump triggers trick animation with float effect
- **Reduced gravity physics**: Overall gravity reduced from 800 to 600, with special trick float at 400 gravity for extended air time
- **Seamless background integration**: Placeholder gradient background with proper physics ground collision detection
- **Functional gameplay loop**: Working jump controls (Space/Up), landing detection, ability reset system, and scene restart on falling

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
- **Scene Management**: Phaser scene system (Preload, Game, GameOver)
- **Input System**: Unified control system supporting keyboard, mouse, and touch inputs
- **Physics**: Arcade physics for collision detection and movement
- **Component Systems**: Modular systems for obstacles, scoring, and audio management

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

### Blockchain Integration (Configured)
- **Hedera Network**: Ready for NFT integration and decentralized features
- **HashPack Wallet**: Wallet connection capability for future features

### Audio and Media
- **Web Audio API**: Sound effects and background music support
- **GLSL Shader Support**: Enhanced visual effects capability

The application is structured as a full-stack TypeScript project with a clear separation between game logic, UI components, and server functionality. The modular architecture allows for easy extension with blockchain features, multiplayer capabilities, and enhanced graphics while maintaining the retro aesthetic.