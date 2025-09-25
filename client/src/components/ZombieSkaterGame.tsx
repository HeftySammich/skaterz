import { useEffect, useRef } from 'react';
import { createGame } from '../game/main';

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
        left: 0,
        paddingTop: 'env(safe-area-inset-top, 20px)'
      }}
    >
      <div
        id="game-container"
        ref={gameRef}
        style={{
          width: 'min(100vw, calc((100vh - env(safe-area-inset-top, 20px) - env(safe-area-inset-bottom, 40px)) * 640 / 960))',
          height: 'min(calc(100vh - env(safe-area-inset-top, 20px) - env(safe-area-inset-bottom, 40px)), calc(100vw * 960 / 640))',
          position: 'relative',
          backgroundColor: '#2c5f2d',
          marginTop: '10px'
        }}
      />
    </div>
  );
};

export default ZombieSkaterGame;
