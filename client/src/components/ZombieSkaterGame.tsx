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
      ref={gameRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} 
    />
  );
};

export default ZombieSkaterGame;
