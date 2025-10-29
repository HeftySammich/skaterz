/**
 * Client-side blockchain configuration
 * Uses Vite's import.meta.env for browser compatibility
 */

export const BLOCKCHAIN_CONFIG = {
  // Hedera Configuration
  HEDERA_NETWORK: import.meta.env.VITE_HEDERA_NETWORK || 'mainnet',
  HEDERA_TREASURY_ACCOUNT_ID: import.meta.env.VITE_HEDERA_TREASURY_ACCOUNT_ID || '0.0.9972684',
  HEDERA_TREASURY_PRIVATE_KEY: import.meta.env.VITE_HEDERA_TREASURY_PRIVATE_KEY || '',

  // Token Configuration
  STAR_TOKEN_ID: import.meta.env.VITE_STAR_TOKEN_ID || '0.0.9243537',
  UNLOCK_NFT_TOKEN_ID: import.meta.env.VITE_UNLOCK_NFT_TOKEN_ID || '0.0.9963841',
  UNLOCK_SERIAL_NUMBERS: import.meta.env.VITE_UNLOCK_SERIAL_NUMBER
    ? import.meta.env.VITE_UNLOCK_SERIAL_NUMBER.split(',').map((n: string) => parseInt(n.trim()))
    : [2],

  // WalletConnect
  WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2abfdd275154279c314b1b873de18f5a',
} as const;

