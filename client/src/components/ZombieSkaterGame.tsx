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
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000); // Auto-hide after 4 seconds
  };

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
        // Get wallet service instance using singleton
        const { WalletService } = await import('../services/wallet');
        const walletService = WalletService.getInstance();

        // Ensure wallet service is properly initialized and connected
        const walletState = walletService.getState();
        console.log('🔍 Wallet service state:', walletState);

        if (!walletState.isConnected) {
          console.log('⚠️ Wallet service not connected, initializing and connecting...');

          // First ensure wallet service is initialized
          try {
            await walletService.initialize();
            console.log('✅ Wallet service initialized');
          } catch (initError) {
            console.warn('⚠️ Wallet service already initialized:', initError);
          }

          // Then connect
          await walletService.connect();
          console.log('✅ Wallet service connected');
        }

        // Check if already associated
        console.log('🔍 Checking if STAR token already associated...');
        const hasStarToken = await walletService.checkStarTokenAssociation();
        if (hasStarToken) {
          console.log('✅ STAR token already associated!');
          showNotification('STAR token already associated!', 'info');
          return;
        }

        console.log('🔗 Attempting STAR token association...');
        showNotification('Sending association request to wallet...', 'info');
        const transactionId = await walletService.associateStarToken();
        console.log('✅ STAR token association successful!', transactionId);
        showNotification('STAR token associated successfully!', 'success');

      } catch (error) {
        console.error('❌ Failed to associate STAR token:', error);
        showNotification('Failed to associate STAR token. Check wallet connection.', 'error');
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

      {/* Notification toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: notification.type === 'success' ? '#4CAF50' :
                           notification.type === 'error' ? '#f44336' : '#2196F3',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            zIndex: 10000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            maxWidth: '80vw',
            textAlign: 'center'
          }}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ZombieSkaterGame;
