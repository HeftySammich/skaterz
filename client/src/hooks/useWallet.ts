/**
 * React hook for wallet state management
 * Provides wallet connection, state, and blockchain operations
 */

import { useState, useEffect, useCallback } from 'react';
import { walletService, type WalletState } from '../services/wallet';
import { BLOCKCHAIN_CONFIG } from '../config/blockchain';

export interface UseWalletReturn extends WalletState {
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Blockchain queries
  getBalance: () => Promise<string>;
  checkNFTOwnership: (tokenId: string, serialNumber: number) => Promise<boolean>;
  checkTokenAssociation: (tokenId: string) => Promise<boolean>;
  associateToken: (tokenId: string) => Promise<void>;
  
  // Convenience methods for game-specific tokens
  checkStacyUnlock: () => Promise<boolean>;
  checkStarTokenAssociation: () => Promise<boolean>;
  associateStarToken: () => Promise<void>;
  
  // Initialization
  initialize: () => Promise<void>;
  isInitialized: boolean;
}

export function useWallet(): UseWalletReturn {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState());
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Subscribe to wallet state changes
  useEffect(() => {
    const unsubscribe = walletService.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  // Initialize wallet service
  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      await walletService.initialize();
      setIsInitialized(true);
      setInitError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize wallet';
      setInitError(errorMessage);
      console.error('Wallet initialization failed:', error);
    }
  }, [isInitialized]);

  // Auto-initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Connection methods
  const connect = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Wallet service not initialized');
    }
    await walletService.connect();
  }, [isInitialized]);

  const disconnect = useCallback(async () => {
    await walletService.disconnect();
  }, []);

  // Blockchain query methods
  const getBalance = useCallback(async () => {
    return await walletService.getAccountBalance();
  }, []);

  const checkNFTOwnership = useCallback(async (tokenId: string, serialNumber: number) => {
    return await walletService.checkNFTOwnership(tokenId, serialNumber);
  }, []);

  const checkTokenAssociation = useCallback(async (tokenId: string) => {
    return await walletService.checkTokenAssociation(tokenId);
  }, []);

  const associateToken = useCallback(async (tokenId: string) => {
    await walletService.associateToken(tokenId);
  }, []);

  // Game-specific convenience methods
  const checkStacyUnlock = useCallback(async () => {
    return await walletService.checkMultipleNFTOwnership(
      BLOCKCHAIN_CONFIG.UNLOCK_NFT_TOKEN_ID,
      BLOCKCHAIN_CONFIG.UNLOCK_SERIAL_NUMBERS
    );
  }, []);

  const checkStarTokenAssociation = useCallback(async () => {
    return await walletService.checkTokenAssociation(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID);
  }, []);

  const associateStarToken = useCallback(async () => {
    await walletService.associateToken(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID);
  }, []);

  return {
    // Wallet state
    ...walletState,
    error: walletState.error || initError,
    
    // Connection methods
    connect,
    disconnect,
    
    // Blockchain queries
    getBalance,
    checkNFTOwnership,
    checkTokenAssociation,
    associateToken,
    
    // Game-specific methods
    checkStacyUnlock,
    checkStarTokenAssociation,
    associateStarToken,
    
    // Initialization
    initialize,
    isInitialized
  };
}

export default useWallet;
