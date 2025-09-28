import { useEffect, useRef, useState } from 'react';
import { createGame } from '../game/main';
import { useWallet } from '../hooks/useWallet';
import WalletStatus from './wallet/WalletStatus';

// Global cleanup function
const cleanupGlobalAudio = () => {
  // Clean up any global menu music instance
  if ((window as any).menuMusicInstance) {
    try {
      (window as any).menuMusicInstance.stop();
      (window as any).menuMusicInstance.destroy();
    } catch (e) {
      console.log('Error cleaning up menu music:', e);
    }
    (window as any).menuMusicInstance = undefined;
    // Reset the flag so music can play again on next game load
    (window as any).menuMusicStarted = false;
  }
};

const ZombieSkaterGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const { connect, isConnected } = useWallet();
  const [currentScene, setCurrentScene] = useState<string>('MainMenu');

  useEffect(() => {
    if (gameRef.current) {
      // Clean up any existing game instance and global audio first
      cleanupGlobalAudio();

      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }

      // Create the Phaser game
      phaserGameRef.current = createGame(gameRef.current);

      // Listen for scene changes to show/hide wallet status
      const handleSceneChange = (event: CustomEvent) => {
        setCurrentScene(event.detail.scene);
      };

      window.addEventListener('sceneChanged', handleSceneChange as EventListener);

      return () => {
        window.removeEventListener('sceneChanged', handleSceneChange as EventListener);
      };
    }

    return () => {
      // Clean up Phaser game and global audio on component unmount
      cleanupGlobalAudio();

      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  // Listen for wallet connection events from Phaser game
  useEffect(() => {
    const handleWalletModalEvent = async (event: CustomEvent) => {
      console.log('🎮 Wallet connection event received from options menu');
      if (!isConnected) {
        try {
          console.log('🔗 Attempting wallet connection...');
          await connect();
          console.log('✅ Wallet connection successful!');
        } catch (error) {
          console.error('❌ Failed to connect wallet from options menu:', error);
        }
      } else {
        console.log('ℹ️ Wallet already connected');
      }
    };

    window.addEventListener('openWalletModal', handleWalletModalEvent as any);

    return () => {
      window.removeEventListener('openWalletModal', handleWalletModalEvent as any);
    };
  }, [connect, isConnected]);

  // Handle STAR token association events from game
  useEffect(() => {
    const handleAssociateStarEvent = async (event: any) => {
      console.log('🌟 STAR token association event received from options menu');

      if (!isConnected) {
        console.log('❌ Wallet not connected - cannot associate STAR token');
        return;
      }

      try {
        // Get wallet service instance
        const walletService = (window as any).walletService;
        if (!walletService) {
          console.log('❌ Wallet service not available');
          return;
        }

        // Check if already associated
        const hasStarToken = await walletService.checkStarTokenAssociation();
        if (hasStarToken) {
          console.log('✅ STAR token already associated!');
          // Could show a toast notification here
          return;
        }

        console.log('🔗 Attempting STAR token association...');
        const transactionId = await walletService.associateStarToken();
        console.log('✅ STAR token association successful!', transactionId);
        // Could show success notification here

      } catch (error) {
        console.error('❌ Failed to associate STAR token:', error);
        // Could show error notification here
      }
    };

    window.addEventListener('associateStarToken', handleAssociateStarEvent as any);

    return () => {
      window.removeEventListener('associateStarToken', handleAssociateStarEvent as any);
    };
  }, [isConnected]);

  // Only show wallet status on menu screens (not during gameplay)
  const isMenuScene = ['MainMenu', 'OptionsMenu', 'HowToPlay', 'Leaderboard', 'CharacterSelect'].includes(currentScene);

  return (
    <div
      id="game-wrapper"
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: '#000',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      <div
        id="game-container"
        ref={gameRef}
        style={{
          width: 'min(100vw, calc(100vh * 640 / 960))',
          height: 'min(100vh, calc(100vw * 960 / 640))',
          position: 'relative',
          backgroundColor: '#000'
        }}
      />

      {/* Show wallet status only on menu screens */}
      {isMenuScene && <WalletStatus />}
    </div>
  );
};

export default ZombieSkaterGame;
