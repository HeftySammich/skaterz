/**
 * Hedera Wallet Service
 * Handles wallet connection, account management, and blockchain interactions
 */

import { DAppConnector } from '@hashgraph/hedera-wallet-connect';
import {
  AccountId,
  TokenId,
  NftId,
  LedgerId,
  TransferTransaction,
  TokenAssociateTransaction,
  AccountBalanceQuery,
  TokenNftInfoQuery,
  Client
} from '@hashgraph/sdk';
import { BLOCKCHAIN_CONFIG, envLog } from '../../../shared/environment';

export interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  evmAddress: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface TokenBalance {
  tokenId: string;
  balance: string;
  decimals: number;
}

export interface NFTInfo {
  tokenId: string;
  serialNumber: number;
  accountId: string;
  metadata?: string;
}

class WalletService {
  private dAppConnector: DAppConnector | null = null;
  private client: Client | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private state: WalletState = {
    isConnected: false,
    accountId: null,
    evmAddress: null,
    isLoading: false,
    error: null
  };
  private listeners: Array<(state: WalletState) => void> = [];

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Hedera client
   */
  private initializeClient() {
    try {
      if (BLOCKCHAIN_CONFIG.HEDERA_NETWORK === 'mainnet') {
        this.client = Client.forMainnet();
      } else {
        this.client = Client.forTestnet();
      }
      envLog('Hedera client initialized for ' + BLOCKCHAIN_CONFIG.HEDERA_NETWORK);
    } catch (error) {
      envLog('Failed to initialize Hedera client: ' + error, 'error');
    }
  }

  /**
   * Initialize wallet connection services
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized || this.isInitializing) {
      envLog('Wallet service already initialized or initializing');
      return;
    }

    this.isInitializing = true;

    try {
      this.setState({ isLoading: true, error: null });

      // Log configuration for debugging
      envLog(`Initializing wallet service with network: ${BLOCKCHAIN_CONFIG.HEDERA_NETWORK}`);
      envLog(`WalletConnect Project ID: ${BLOCKCHAIN_CONFIG.WALLETCONNECT_PROJECT_ID}`);

      // Clean up any existing connector first
      if (this.dAppConnector) {
        try {
          await this.dAppConnector.disconnectAll();
        } catch (e) {
          envLog('Error cleaning up existing connector: ' + e);
        }
        this.dAppConnector = null;
      }

      // Determine network
      const network = BLOCKCHAIN_CONFIG.HEDERA_NETWORK === 'mainnet'
        ? LedgerId.MAINNET
        : LedgerId.TESTNET;

      // Initialize DApp Connector
      this.dAppConnector = new DAppConnector(
        {
          name: 'Zombie Skaterz V3',
          description: 'Retro GBA-style endless runner with blockchain features',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        },
        network,
        BLOCKCHAIN_CONFIG.WALLETCONNECT_PROJECT_ID
      );

      // Initialize the connector
      await this.dAppConnector.init();

      this.isInitialized = true;
      envLog('Wallet service initialized successfully');
      this.setState({ isLoading: false });
    } catch (error) {
      envLog('Failed to initialize wallet service: ' + error, 'error');
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize wallet service'
      });
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Connect to wallet
   */
  async connect(): Promise<void> {
    if (!this.dAppConnector) {
      throw new Error('Wallet service not initialized');
    }

    try {
      this.setState({ isLoading: true, error: null });
      envLog('Attempting to connect wallet...');
      envLog('Current wallet state: ' + JSON.stringify(this.state, null, 2));
      envLog('Current wallet state: ' + JSON.stringify(this.state, null, 2));

      // Check if already connected
      const existingSessions = this.dAppConnector.walletConnectClient?.session.getAll();
      envLog(`Checking existing sessions: ${existingSessions?.length || 0} found`);

      if (existingSessions && existingSessions.length > 0) {
        envLog('Found existing session, using it');
        envLog('Existing session data: ' + JSON.stringify(existingSessions[0], null, 2));
        this.handleConnectionSuccess(existingSessions[0]);
        return;
      }

      // Clean up any pending sessions first
      try {
        await this.dAppConnector.disconnectAll();
      } catch (e) {
        envLog('Error cleaning up sessions: ' + e);
      }

      // Open WalletConnect modal and connect
      envLog('Opening WalletConnect modal...');
      const session = await this.dAppConnector.openModal();

      envLog('Modal returned, checking session...');
      envLog('Session type: ' + typeof session);

      if (!session || session === null || session === undefined) {
        envLog('User cancelled wallet connection or no session returned', 'error');
        this.setState({ isLoading: false, error: 'Connection cancelled' });
        throw new Error('Wallet connection was cancelled or failed');
      }

      envLog('Session received, processing...');
      envLog('Session keys: ' + Object.keys(session).join(', '));

      // Handle successful connection
      this.handleConnectionSuccess(session);

      envLog('Wallet connected successfully');
    } catch (error) {
      envLog('Failed to connect wallet: ' + error, 'error');
      this.setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      });
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (!this.dAppConnector) return;

    try {
      await this.dAppConnector.disconnectAll();
      this.handleDisconnection();
      envLog('Wallet disconnected successfully');
    } catch (error) {
      envLog('Failed to disconnect wallet: ' + error, 'error');
      throw error;
    }
  }

  /**
   * Handle successful connection
   */
  private handleConnectionSuccess(session: any) {
    envLog('Processing connection success...');

    // Validate session structure
    if (!session) {
      envLog('No session provided', 'error');
      throw new Error('Invalid session data');
    }

    envLog('Session data: ' + JSON.stringify(session, null, 2));

    // Extract account ID from session - try multiple possible paths
    let accountId = null;

    // Try different session structures
    if (session.namespaces?.hedera?.accounts?.[0]) {
      accountId = session.namespaces.hedera.accounts[0].split(':')[2];
    } else if (session.peer?.metadata?.accountIds?.[0]) {
      accountId = session.peer.metadata.accountIds[0];
    } else if (session.accounts?.[0]) {
      accountId = session.accounts[0].split(':')[2];
    }

    envLog(`Extracted account ID: ${accountId}`);

    if (!accountId) {
      envLog('No account ID found in session', 'error');
      throw new Error('No account ID found in wallet session');
    }

    this.setState({
      isConnected: true,
      accountId: accountId,
      evmAddress: null, // DAppConnector doesn't provide EVM address directly
      isLoading: false,
      error: null
    });

    envLog(`Wallet state updated - Connected: ${!!accountId}, Account: ${accountId}`);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection() {
    this.setState({
      isConnected: false,
      accountId: null,
      evmAddress: null,
      isLoading: false,
      error: null
    });
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Get account balance for HBAR
   */
  async getAccountBalance(): Promise<string> {
    if (!this.client || !this.state.accountId) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      const accountId = AccountId.fromString(this.state.accountId);
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(this.client);

      return balance.hbars.toString();
    } catch (error) {
      envLog('Failed to get account balance: ' + error, 'error');
      throw error;
    }
  }

  /**
   * Check if account owns specific NFT
   */
  async checkNFTOwnership(tokenId: string, serialNumber: number): Promise<boolean> {
    if (!this.client || !this.state.accountId) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      const nftId = new NftId(TokenId.fromString(tokenId), serialNumber);
      const nftInfo = await new TokenNftInfoQuery()
        .setNftId(nftId)
        .execute(this.client);

      return nftInfo.accountId?.toString() === this.state.accountId;
    } catch (error) {
      envLog('Failed to check NFT ownership: ' + error, 'error');
      return false;
    }
  }

  /**
   * Check if account owns any of multiple NFT serial numbers
   */
  async checkMultipleNFTOwnership(tokenId: string, serialNumbers: number[]): Promise<boolean> {
    if (!this.client || !this.state.accountId) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      // Check each serial number
      for (const serialNumber of serialNumbers) {
        const hasNFT = await this.checkNFTOwnership(tokenId, serialNumber);
        if (hasNFT) {
          envLog(`Found NFT ${tokenId} serial #${serialNumber} owned by account`);
          return true;
        }
      }

      envLog(`No NFTs found for token ${tokenId} with serials: ${serialNumbers.join(', ')}`);
      return false;
    } catch (error) {
      envLog('Failed to check multiple NFT ownership: ' + error, 'error');
      return false;
    }
  }

  /**
   * Check if account is associated with a token
   */
  async checkTokenAssociation(tokenId: string): Promise<boolean> {
    if (!this.client || !this.state.accountId) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      const accountId = AccountId.fromString(this.state.accountId);
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(this.client);

      // Check if token appears in balance (even with 0 balance means associated)
      return balance.tokens.has(TokenId.fromString(tokenId));
    } catch (error) {
      envLog('Failed to check token association: ' + error, 'error');
      return false;
    }
  }

  /**
   * Associate account with token (requires user signature)
   */
  async associateToken(tokenId: string): Promise<void> {
    if (!this.dAppConnector || !this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const accountId = AccountId.fromString(this.state.accountId);
      const transaction = new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(this.client!);

      // Sign and execute transaction through DApp connector
      const result = await this.dAppConnector.signAndExecuteTransaction({
        signerAccountId: this.state.accountId,
        transaction: [transaction.toString()]
      });

      if (result.response.success) {
        envLog(`Successfully associated with token ${tokenId}`);
      } else {
        throw new Error('Token association failed');
      }
    } catch (error) {
      envLog('Failed to associate token: ' + error, 'error');
      throw error;
    }
  }
}

// Singleton pattern to prevent multiple instances
let walletServiceInstance: WalletService | null = null;

export const walletService = (() => {
  if (!walletServiceInstance) {
    walletServiceInstance = new WalletService();
  }
  return walletServiceInstance;
})();
export default walletService;
