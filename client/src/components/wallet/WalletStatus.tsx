/**
 * Simple Wallet Status Indicator
 * Shows connection status with a clean green light on menu screens only
 * Smaller size during active gameplay to avoid obstructing the game
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';

interface WalletStatusProps {
  className?: string;
}

export function WalletStatus({ className = '' }: WalletStatusProps) {
  const { isConnected, accountId, isLoading } = useWallet();
  const [currentScene, setCurrentScene] = useState<string>('MainMenu');

  // Listen for scene changes from Phaser
  useEffect(() => {
    const handleSceneChange = (event: CustomEvent) => {
      setCurrentScene(event.detail.scene);
    };

    window.addEventListener('sceneChanged', handleSceneChange as EventListener);
    return () => {
      window.removeEventListener('sceneChanged', handleSceneChange as EventListener);
    };
  }, []);

  // Determine if we're in active gameplay
  const isInGameplay = currentScene === 'Game';

  // Smaller styling for gameplay, normal for menus
  const styles = isInGameplay ? {
    position: 'fixed' as const,
    top: '10px',
    right: '10px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 6px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '6px',
    color: isLoading ? '#ffffff' : '#00ff00'
  } : {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: isLoading ? '2px solid #333' : '2px solid #00ff00',
    borderRadius: '4px',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '10px',
    color: isLoading ? '#ffffff' : '#00ff00'
  };

  const dotSize = isInGameplay ? 6 : 8;

  if (isLoading) {
    return (
      <div 
        className={`wallet-status-indicator ${className}`}
        style={styles}
      >
        <div 
          style={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            borderRadius: '50%',
            backgroundColor: '#ffff00',
            animation: 'pulse 1s infinite'
          }}
        />
        {!isInGameplay && <span>CONNECTING...</span>}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  if (!isConnected) {
    return null; // Don't show anything when not connected
  }

  const formatAccountId = (accountId: string) => {
    if (accountId.length > 12) {
      return `${accountId.slice(0, 6)}...${accountId.slice(-4)}`;
    }
    return accountId;
  };

  return (
    <div 
      className={`wallet-status-indicator ${className}`}
      style={styles}
    >
      <div 
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          borderRadius: '50%',
          backgroundColor: '#00ff00',
          boxShadow: '0 0 4px #00ff00'
        }}
      />
      {!isInGameplay && <span>CONNECTED</span>}
      {!isInGameplay && accountId && (
        <span style={{ color: '#ffffff', fontSize: '8px' }}>
          {formatAccountId(accountId)}
        </span>
      )}
    </div>
  );
}

export default WalletStatus;
