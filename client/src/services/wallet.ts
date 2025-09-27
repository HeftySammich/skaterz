/**
 * Hedera Wallet Service
 * Handles wallet connection, account management, and blockchain interactions
 */

import {
  DAppConnector,
  HederaSessionEvent,
  HederaJsonRpcMethod,
  HederaChainId
} from '@hashgraph/hedera-wallet-connect';
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

  /**
   * Get the wallet-connected client for blockchain operations
   */
  private async getClient(): Promise<Client> {
    if (!this.dAppConnector) {
      throw new Error('Wallet not connected - cannot perform blockchain operations');
    }

    if (!this.state.isConnected || !this.state.accountId) {
      throw new Error('Wallet not properly connected - no account ID available');
    }

    // Verify we have an active session
    const sessions = this.dAppConnector.walletConnectClient?.session.getAll();
    if (!sessions || sessions.length === 0) {
      throw new Error('No active wallet session found');
    }

    // Create client that routes through the connected wallet
    const client = BLOCKCHAIN_CONFIG.HEDERA_NETWORK === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet();

    try {
      // Debug: Check session state
      const sessions = this.dAppConnector.walletConnectClient?.session.getAll();
      envLog('Active sessions:', sessions?.length || 0);

      if (sessions && sessions.length > 0) {
        envLog('Session details:', JSON.stringify(sessions[0], null, 2));
      }

      // Get the signer from the DApp connector
      envLog('Attempting to get signer from DAppConnector...');
      const signer = this.dAppConnector.getSigner();

      envLog('Signer result:', signer);

      if (!signer) {
        throw new Error('Failed to get wallet signer - wallet may not be properly authorized');
      }

      // Set the operator to use the wallet signer
      envLog('Setting client operator with account:', this.state.accountId);
      client.setOperator(this.state.accountId, signer);

      envLog('Client operator set successfully');
      return client;
    } catch (error) {
      envLog('Error in getClient:', error);
      throw new Error(`Failed to initialize Hedera client with wallet: ${error}`);
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

      // Determine chain ID
      const chainId = BLOCKCHAIN_CONFIG.HEDERA_NETWORK === 'mainnet'
        ? HederaChainId.Mainnet
        : HederaChainId.Testnet;

      // Initialize DApp Connector with proper Hedera methods and events
      this.dAppConnector = new DAppConnector(
        {
          name: 'Zombie Skaterz V3',
          description: 'Retro GBA-style endless runner with blockchain features',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        },
        network,
        BLOCKCHAIN_CONFIG.WALLETCONNECT_PROJECT_ID,
        Object.values(HederaJsonRpcMethod),
        [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
        [chainId]
      );

      // Initialize the connector
      envLog('Initializing DAppConnector...');
      await this.dAppConnector.init();
      envLog('DAppConnector initialized successfully');

      // Verify the connector is ready
      envLog('DAppConnector state after init:', {
        isInitialized: !!this.dAppConnector.walletConnectClient,
        hasClient: !!this.dAppConnector.walletConnectClient?.core,
        projectId: BLOCKCHAIN_CONFIG.WALLETCONNECT_PROJECT_ID
      });

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

    if (this.state.isConnected) {
      return;
    }

    try {
      this.setState({ isLoading: true, error: null });
      envLog('Current wallet state: ' + JSON.stringify(this.state, null, 2));

      // Check if already connected
      const existingSessions = this.dAppConnector.walletConnectClient?.session.getAll();

      if (existingSessions && existingSessions.length > 0) {
        await this.handleConnectionSuccess(existingSessions[0]);
        return;
      }

      // Clean up any pending sessions first
      try {
        await this.dAppConnector.disconnectAll();
      } catch (e) {
        envLog('Error cleaning up sessions: ' + e);
      }

      // Open WalletConnect modal and connect
      const session = await this.dAppConnector.openModal();

      if (!session) {
        this.setState({ isLoading: false, error: 'Connection cancelled' });
        throw new Error('Wallet connection was cancelled or failed');
      }

      // Handle successful connection
      await this.handleConnectionSuccess(session);
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
  private async handleConnectionSuccess(session: any) {
    if (!session) {
      throw new Error('Invalid session data');
    }

    envLog('Session data received:');
    envLog('Session keys:', Object.keys(session));
    envLog('Session namespaces:', session.namespaces);
    envLog('Session accounts:', session.accounts);
    envLog('Full session:', JSON.stringify(session, null, 2));

    // Extract account ID from session - try multiple possible paths
    let accountId = null;

    // Try different session structures for Hedera namespace
    if (session.namespaces?.hedera?.accounts?.[0]) {
      const account = session.namespaces.hedera.accounts[0];
      accountId = account.includes(':') ? account.split(':')[2] : account;
    } else if (session.peer?.metadata?.accountIds?.[0]) {
      accountId = session.peer.metadata.accountIds[0];
    } else if (session.accounts?.[0]) {
      const account = session.accounts[0];
      accountId = account.includes(':') ? account.split(':')[2] : account;
    }

    if (!accountId) {
      envLog('Session structure:', JSON.stringify(session, null, 2));
      throw new Error('No account ID found in wallet session - wallet may not be properly connected');
    }

    // Validate account ID format
    if (!accountId.match(/^\d+\.\d+\.\d+$/)) {
      throw new Error(`Invalid account ID format: ${accountId}`);
    }

    this.setState({
      isConnected: true,
      accountId: accountId,
      evmAddress: null,
      isLoading: false,
      error: null
    });

    envLog(`Successfully connected to account: ${accountId}`);

    // Wait a moment for the session to fully establish, then test blockchain operations
    setTimeout(() => {
      this.testBlockchainConnection();
    }, 1000);
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
    if (!this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const client = await this.getClient();
      const accountId = AccountId.fromString(this.state.accountId);
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

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
    if (!this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const client = await this.getClient();
      const nftId = new NftId(TokenId.fromString(tokenId), serialNumber);
      const nftInfo = await new TokenNftInfoQuery()
        .setNftId(nftId)
        .execute(client);

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
    if (!this.state.accountId) {
      throw new Error('Wallet not connected');
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
    if (!this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const client = await this.getClient();
      const accountId = AccountId.fromString(this.state.accountId);
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

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
      const client = await this.getClient();
      const accountId = AccountId.fromString(this.state.accountId);
      const transaction = new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(client);

      // Execute transaction through wallet signer
      const result = await transaction.executeWithSigner(this.dAppConnector.getSigner());

      envLog(`Successfully associated with token ${tokenId}: ${result.transactionId}`);
    } catch (error) {
      envLog('Failed to associate token: ' + error, 'error');
      throw error;
    }
  }

  /**
   * Test if blockchain operations actually work after connection
   */
  private async testBlockchainConnection(): Promise<void> {
    try {
      console.log('🧪 Testing blockchain connection...');

      // Test 1: Simple balance query (should work without signing)
      const balance = await this.getAccountBalance();
      console.log('✅ Balance query successful:', balance);

      // Test 2: Check if we can create a transaction (this should prompt wallet)
      console.log('🔐 Testing transaction creation (should prompt wallet)...');

      const client = await this.getClient();
      const { TransferTransaction, Hbar } = await import('@hashgraph/sdk');

      const transaction = new TransferTransaction()
        .addHbarTransfer(this.state.accountId!, Hbar.fromTinybars(-1))
        .addHbarTransfer('0.0.98', Hbar.fromTinybars(1))
        .setTransactionMemo('Zombie Skaterz connection test')
        .freezeWith(client);

      console.log('📝 Transaction created, attempting to sign...');

      // This should trigger wallet signing prompt
      const result = await transaction.executeWithSigner(this.dAppConnector!.getSigner());
      console.log('✅ Transaction signed successfully:', result.transactionId.toString());

    } catch (error) {
      console.error('❌ Blockchain connection test failed:', error);
      console.log('💡 This means wallet is paired but not properly authorized for blockchain operations');
    }
  }

  /**
   * Game-specific convenience methods
   */

  /**
   * Check if user owns Stacy unlock NFT (any of the configured serial numbers)
   */
  async checkStacyUnlock(): Promise<boolean> {
    return this.checkMultipleNFTOwnership(
      BLOCKCHAIN_CONFIG.UNLOCK_NFT_TOKEN_ID,
      BLOCKCHAIN_CONFIG.UNLOCK_SERIAL_NUMBERS
    );
  }

  /**
   * Check if user has STAR token associated
   */
  async checkStarTokenAssociation(): Promise<boolean> {
    return this.checkTokenAssociation(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID);
  }

  /**
   * Associate STAR token with user's account
   */
  async associateStarToken(): Promise<void> {
    return this.associateToken(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID);
  }

  /**
   * Send STAR tokens as reward (requires treasury account setup)
   */
  async sendStarReward(amount: number): Promise<void> {
    if (!this.dAppConnector || !this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const client = await this.getClient();
      const receiverAccountId = AccountId.fromString(this.state.accountId);
      const tokenId = TokenId.fromString(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID);

      const transaction = new TransferTransaction()
        .addTokenTransfer(tokenId, BLOCKCHAIN_CONFIG.HEDERA_TREASURY_ACCOUNT_ID, -amount)
        .addTokenTransfer(tokenId, receiverAccountId, amount)
        .setTransactionMemo(`Zombie Skaterz reward: ${amount} STAR tokens`)
        .freezeWith(client);

      const result = await transaction.executeWithSigner(this.dAppConnector.getSigner());
      envLog(`Successfully sent ${amount} STAR tokens: ${result.transactionId}`);
    } catch (error) {
      envLog('Failed to send STAR reward: ' + error, 'error');
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
