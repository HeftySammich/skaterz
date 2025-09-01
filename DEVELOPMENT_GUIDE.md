# Development Guide - Zombie Skater

## 📋 Build Information for GitHub Upload

### Project Overview
- **Project Name**: Zombie Skater  
- **Type**: GBA-style endless runner game
- **Technology**: React + Phaser 3 + Express + TypeScript
- **Build System**: Vite + ESBuild

### Environment Requirements
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0", 
  "typescript": "5.6.3",
  "platform": "cross-platform (web-based)"
}
```

### Installation & Setup Commands
```bash
# Clone and install
npm install

# Development server (includes both frontend + backend)
npm run dev

# Production build
npm run build

# Start production
npm start

# Type checking
npm run check

# Database setup (optional)
npm run db:push
```

### Build Output Structure
```
dist/
├── public/           # Frontend static files (Vite build)
│   ├── index.html
│   ├── assets/       # Bundled JS/CSS with hashing
│   └── assets/       # Game assets (sprites, sounds)
└── index.js          # Backend server bundle (ESBuild)
```

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Frontend build configuration
- `tailwind.config.ts` - CSS framework setup
- `drizzle.config.ts` - Database ORM configuration

### Architecture
- **Frontend**: React SPA with Phaser 3 game embedded
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Drizzle ORM (optional, has memory fallback)
- **Build**: Separate frontend (Vite) and backend (ESBuild) builds
- **Deployment**: Single server hosts both static files and API

## 🔗 Blockchain Integration Status

### Current Status: CONFIGURED BUT NOT IMPLEMENTED

The project is **ready** for Hedera and wallet integration but the actual implementation is not yet added. Here's what needs to be implemented:

### Required Dependencies (Not Yet Added)
```bash
# Hedera SDK
npm install @hashgraph/sdk

# Wallet Connect for HashPack
npm install @hashconnect/hashconnect

# Additional crypto utilities
npm install @hashgraph/proto
```

### Integration Points Needed

1. **Hedera Network Connection**
   ```typescript
   // client/src/services/hedera.ts
   import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';
   
   export const hederaClient = Client.forTestnet();
   ```

2. **HashPack Wallet Connection**
   ```typescript
   // client/src/services/wallet.ts
   import { HashConnect } from '@hashconnect/hashconnect';
   
   export const hashConnect = new HashConnect();
   ```

3. **NFT Integration Points**
   - Character skins as NFTs
   - Achievement tokens
   - High score verification
   - In-game asset ownership

### Recommended Implementation Plan

1. **Phase 1**: Basic wallet connection
   - HashPack wallet connect/disconnect
   - Account balance display
   - Transaction signing

2. **Phase 2**: NFT character system
   - Mint character skins as NFTs
   - Load owned NFTs as playable characters
   - Metadata on IPFS

3. **Phase 3**: Game economy
   - Token rewards for high scores
   - NFT marketplace for character trades
   - Leaderboard verification on-chain

## 🗃 Complete Dependency List

### Production Dependencies (103 packages)
```json
{
  "core": {
    "react": "18.3.1",
    "react-dom": "18.3.1", 
    "phaser": "3.90.0",
    "express": "4.21.2",
    "typescript": "5.6.3"
  },
  "game": {
    "howler": "2.2.4",
    "matter-js": "0.20.0", 
    "gsap": "3.12.5",
    "three": "0.170.0"
  },
  "ui": {
    "@radix-ui/*": "Multiple UI primitives",
    "tailwindcss": "3.4.14",
    "framer-motion": "11.13.1",
    "lucide-react": "0.453.0"
  },
  "backend": {
    "drizzle-orm": "0.39.1",
    "@neondatabase/serverless": "0.10.4",
    "express-session": "1.18.1",
    "passport": "0.7.0"
  },
  "build": {
    "vite": "5.4.19",
    "esbuild": "0.25.0",
    "@vitejs/plugin-react": "4.3.2"
  }
}
```

### Development Dependencies (24 packages)
- TypeScript types for all major libraries
- Tailwind CSS typography plugin
- Replit-specific development tools
- Build and bundling tools

## 🚀 Deployment Recommendations

### For Your Expert Developer

1. **GitHub Repository Setup**
   - Include `.env.example` for environment variables
   - Add `.gitignore` for `node_modules`, `dist`, `.env`
   - Include this development guide
   - Tag releases for version management

2. **CI/CD Pipeline Suggestions**
   ```yaml
   # .github/workflows/build.yml
   name: Build and Test
   on: [push, pull_request]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm install
         - run: npm run check
         - run: npm run build
   ```

3. **Environment Management**
   - Development: Local with memory fallback
   - Staging: Full PostgreSQL + test blockchain
   - Production: Scaled PostgreSQL + mainnet blockchain

4. **Performance Considerations**
   - Game assets are optimized for 240x160 GBA resolution
   - Particle system is performance-tuned
   - Bundle size optimization through tree shaking
   - Memory management for infinite runner

### Next Steps for Blockchain Integration

1. Install Hedera and HashConnect dependencies
2. Implement wallet connection service
3. Add NFT contract interaction
4. Create token reward system
5. Build marketplace UI components

The codebase is well-structured and ready for your expert developer to extend with full blockchain functionality.