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
