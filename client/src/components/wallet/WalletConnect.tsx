/**
 * Wallet Connection Component
 * Handles wallet connection UI and state display
 */

import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';

interface WalletConnectProps {
  className?: string;
  showBalance?: boolean;
  compact?: boolean;
}

export function WalletConnect({ 
  className = '', 
  showBalance = false, 
  compact = false 
}: WalletConnectProps) {
  const {
    isConnected,
    accountId,
    isLoading,
    error,
    connect,
    disconnect,
    getBalance,
    isInitialized
  } = useWallet();

  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setBalance(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const handleGetBalance = async () => {
    if (!isConnected) return;
    
    try {
      setBalanceLoading(true);
      const accountBalance = await getBalance();
      setBalance(accountBalance);
    } catch (error) {
      console.error('Failed to get balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Auto-fetch balance when connected and showBalance is true
  React.useEffect(() => {
    if (isConnected && showBalance && !balance) {
      handleGetBalance();
    }
  }, [isConnected, showBalance, balance]);

  const formatAccountId = (accountId: string) => {
    if (compact && accountId.length > 12) {
      return `${accountId.slice(0, 6)}...${accountId.slice(-6)}`;
    }
    return accountId;
  };

  if (!isInitialized) {
    return (
      <div className={`wallet-connect ${className}`}>
        <div className="wallet-status">
          <span className="status-text">Initializing wallet...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`wallet-connect error ${className}`}>
        <div className="wallet-status">
          <span className="status-text error">Wallet Error</span>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
        {!compact && (
          <div className="error-details">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (isConnected && accountId) {
    return (
      <div className={`wallet-connect connected ${className}`}>
        <div className="wallet-status">
          <div className="connection-indicator connected" />
          <span className="status-text">Connected</span>
        </div>
        
        <div className="account-info">
          <span className="account-id" title={accountId}>
            {formatAccountId(accountId)}
          </span>
          
          {showBalance && (
            <div className="balance-section">
              {balanceLoading ? (
                <span className="balance loading">Loading...</span>
              ) : balance ? (
                <span className="balance">{balance} HBAR</span>
              ) : (
                <button 
                  onClick={handleGetBalance}
                  className="balance-button"
                >
                  Show Balance
                </button>
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={handleDisconnect}
          className="disconnect-button"
          disabled={isLoading}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={`wallet-connect disconnected ${className}`}>
      <div className="wallet-status">
        <div className="connection-indicator disconnected" />
        <span className="status-text">Not Connected</span>
      </div>
      
      <button 
        onClick={handleConnect}
        className="connect-button"
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}

export default WalletConnect;
