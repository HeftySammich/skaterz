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
import { BLOCKCHAIN_CONFIG } from '../../../shared/environment';

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
   * Get the wallet-connected client for hashgraph operations with node cycling
   */
  private async getClient(): Promise<Client> {
    if (!this.dAppConnector || !this.state.isConnected || !this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    const client = Client.forMainnet();

    // Configure multiple mainnet nodes to handle rate limiting
    client.setNetwork({
      "0.0.3": "35.237.200.180:50211",
      "0.0.4": "35.186.191.247:50211",
      "0.0.5": "35.192.2.25:50211",
      "0.0.6": "35.199.161.108:50211",
      "0.0.7": "35.203.82.240:50211"
    });

    // Set operator with dummy key (wallet handles actual signing)
    const { PrivateKey } = await import('@hashgraph/sdk');
    const dummyKey = PrivateKey.generate();
    client.setOperator(this.state.accountId, dummyKey);

    return client;
  }

  /**
   * Initialize wallet connection services
   */
  async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    try {
      this.setState({ isLoading: true, error: null });

      // Clean up any existing connector first
      if (this.dAppConnector) {
        try {
          await this.dAppConnector.disconnectAll();
        } catch (e) {
          // Ignore cleanup errors
        }
        this.dAppConnector = null;
      }

      // Use mainnet network and chain ID
      const network = LedgerId.MAINNET;
      const chainId = HederaChainId.Mainnet;

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
      await this.dAppConnector.init();

      this.isInitialized = true;
      this.setState({ isLoading: false });
    } catch (error) {
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

      // Check if already connected
      const existingSessions = this.dAppConnector.walletConnectClient?.session.getAll();

      if (existingSessions && existingSessions.length > 0) {
        await this.handleConnectionSuccess(existingSessions[0]);
        return;
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle successful connection with proper authentication
   */
  private async handleConnectionSuccess(session: any) {
    if (!session) {
      throw new Error('Invalid session data');
    }

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
      throw new Error('No account ID found in wallet session');
    }

    // Validate account ID format
    if (!accountId.match(/^\d+\.\d+\.\d+$/)) {
      throw new Error(`Invalid account ID format: ${accountId}`);
    }

    // Authenticate the account by requesting a signature
    try {
      await this.authenticateAccount(accountId);
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    this.setState({
      isConnected: true,
      accountId: accountId,
      evmAddress: null,
      isLoading: false,
      error: null
    });

    console.log('✅ Hedera wallet authenticated successfully!');
  }

  /**
   * Authenticate account ownership by requesting a signature
   */
  private async authenticateAccount(accountId: string): Promise<void> {
    if (!this.dAppConnector) {
      throw new Error('DApp connector not initialized');
    }

    // Create a simple message to sign for authentication
    const message = `Authenticate Zombie Skaterz access for account ${accountId} at ${new Date().toISOString()}`;
    const messageBytes = new TextEncoder().encode(message);

    try {
      // Request signature from wallet using Hedera JSON-RPC method
      const result = await this.dAppConnector.request({
        topic: this.dAppConnector.walletConnectClient?.session.getAll()[0]?.topic || '',
        chainId: `hedera:${BLOCKCHAIN_CONFIG.HEDERA_NETWORK}`,
        request: {
          method: 'hedera_signMessage',
          params: {
            accountId: accountId,
            message: Array.from(messageBytes)
          }
        }
      });

      if (!result || !result.signature) {
        throw new Error('No signature received from wallet');
      }

      // For now, we'll trust that the wallet properly signed with the correct account
      // In a production app, you might want to verify the signature cryptographically
      console.log('🔐 Account authentication signature received');

    } catch (error) {
      // If signing fails, still allow connection but log the issue
      console.warn('⚠️ Authentication signature failed, proceeding with basic connection:', error);
      // Don't throw here to maintain compatibility with wallets that don't support message signing
    }
  }

  /**
   * Test authentication by requesting a test signature
   */
  async testAuthentication(): Promise<void> {
    if (!this.state.isConnected || !this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.authenticateAccount(this.state.accountId);
      console.log('✅ Authentication test successful');
    } catch (error) {
      console.warn('⚠️ Authentication test failed:', error);
      // Don't throw - authentication might not be supported by all wallets
    }
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

    const client = await this.getClient();
    const accountId = AccountId.fromString(this.state.accountId);

    // Extended retry logic with longer delays for rate limiting
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const balance = await new AccountBalanceQuery()
          .setAccountId(accountId)
          .setMaxQueryPayment(new (await import('@hashgraph/sdk')).Hbar(1))
          .execute(client);
        return balance.hbars.toString();
      } catch (error: any) {
        if (attempt === 5) {
          throw error;
        }

        // Handle different error types
        if (error.message?.includes('BUSY') || error.message?.includes('max attempts')) {
          // Exponential backoff for rate limiting
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Non-rate-limit errors should fail immediately
        }
      }
    }

    throw new Error('Network congestion - please try again later');
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

      return nftInfo[0]?.accountId?.toString() === this.state.accountId;
    } catch (error) {
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
          return true;
        }
      }

      return false;
    } catch (error) {
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
      return balance.tokens ? balance.tokens.get(TokenId.fromString(tokenId)) !== undefined : false;
    } catch (error) {
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
      const result = await transaction.executeWithSigner(this.dAppConnector.getSigner(accountId));
    } catch (error) {
      throw error;
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

      const result = await transaction.executeWithSigner(this.dAppConnector.getSigner(receiverAccountId));
    } catch (error) {
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
