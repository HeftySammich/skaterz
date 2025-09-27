/**
 * Environment detection utilities for multi-platform deployment
 * Supports Replit, Railway, and local development environments
 */

export interface EnvironmentInfo {
  platform: 'replit' | 'railway' | 'local';
  isProduction: boolean;
  isDevelopment: boolean;
  port: number;
  host: string;
}

/**
 * Detect the current deployment environment
 */
export function detectEnvironment(): EnvironmentInfo {
  const isReplit = process.env.REPL_ID !== undefined;
  const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;
  const isLocal = !isReplit && !isRailway;
  
  const platform = isReplit ? 'replit' : isRailway ? 'railway' : 'local';
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = !isProduction;
  
  // Default port configuration
  let port = 5000;
  let host = '0.0.0.0';
  
  // Platform-specific overrides
  if (isRailway && process.env.PORT) {
    port = parseInt(process.env.PORT, 10);
  } else if (isReplit && process.env.REPL_PORT) {
    port = parseInt(process.env.REPL_PORT, 10);
  } else if (process.env.PORT) {
    port = parseInt(process.env.PORT, 10);
  }
  
  // Local development uses 127.0.0.1 to avoid IPv6 issues
  if (isLocal && isDevelopment) {
    host = '127.0.0.1';
  }
  
  return {
    platform,
    isProduction,
    isDevelopment,
    port,
    host
  };
}

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig() {
  const env = detectEnvironment();
  
  return {
    ...env,
    // Platform-specific features
    supportsHMR: env.isDevelopment,
    supportsReplitFeatures: env.platform === 'replit',
    supportsRailwayFeatures: env.platform === 'railway',
    
    // Logging configuration
    logLevel: env.isProduction ? 'error' : 'info',
    
    // Build configuration
    buildTarget: env.isProduction ? 'production' : 'development'
  };
}

/**
 * Environment-specific logging
 */
export function envLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const config = getPlatformConfig();
  const timestamp = new Date().toISOString();
  const prefix = `[${config.platform.toUpperCase()}]`;

  if (config.logLevel === 'error' && level !== 'error') {
    return; // Skip non-error logs in production
  }

  const logMessage = `${timestamp} ${prefix} ${message}`;

  switch (level) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

/**
 * Blockchain configuration from environment variables
 */
export const BLOCKCHAIN_CONFIG = {
  // Hedera Configuration
  HEDERA_NETWORK: process.env.HEDERA_NETWORK || 'mainnet',
  HEDERA_TREASURY_ACCOUNT_ID: process.env.HEDERA_TREASURY_ACCOUNT_ID || '0.0.9972684',
  HEDERA_TREASURY_PRIVATE_KEY: process.env.HEDERA_TREASURY_PRIVATE_KEY || '',

  // Token Configuration
  STAR_TOKEN_ID: process.env.STAR_TOKEN_ID || '0.0.9243537',
  UNLOCK_NFT_TOKEN_ID: process.env.UNLOCK_NFT_TOKEN_ID || '0.0.9963841',
  UNLOCK_SERIAL_NUMBERS: process.env.UNLOCK_SERIAL_NUMBER
    ? process.env.UNLOCK_SERIAL_NUMBER.split(',').map(n => parseInt(n.trim()))
    : [13],

  // WalletConnect
  WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID || '2abfdd275154279c314b1b873de18f5a',
} as const;

/**
 * Validate required blockchain configuration
 */
export function validateBlockchainConfig(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];

  if (!BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY) {
    missingVars.push('HEDERA_TREASURY_PRIVATE_KEY');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}
