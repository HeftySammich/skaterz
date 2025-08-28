import { useEffect, useRef } from 'react';
import { createGame } from '../game/main';

const ZombieSkaterGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      // Create the Phaser game
      phaserGameRef.current = createGame(gameRef.current);
    }

    return () => {
      // Clean up Phaser game on component unmount
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
