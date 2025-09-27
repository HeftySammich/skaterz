/**
 * Simple Wallet Status Indicator
 * Shows connection status with a clean green light on menu screens only
 */

import React from 'react';
import { useWallet } from '../../hooks/useWallet';

interface WalletStatusProps {
  className?: string;
}

export function WalletStatus({ className = '' }: WalletStatusProps) {
  const { isConnected, accountId, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div 
        className={`wallet-status-indicator ${className}`}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #333',
          borderRadius: '4px',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '10px',
          color: '#ffffff'
        }}
      >
        <div 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ffff00',
            animation: 'pulse 1s infinite'
          }}
        />
        <span>CONNECTING...</span>
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
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #00ff00',
        borderRadius: '4px',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#00ff00'
      }}
    >
      <div 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#00ff00',
          boxShadow: '0 0 4px #00ff00'
        }}
      />
      <span>CONNECTED</span>
      {accountId && (
        <span style={{ color: '#ffffff', fontSize: '8px' }}>
          {formatAccountId(accountId)}
        </span>
      )}
    </div>
  );
}

export default WalletStatus;
