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
  TransactionId,
  AccountBalanceQuery,
  AccountInfoQuery,
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
  private static instance: WalletService | null = null;

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
   * Get singleton instance of WalletService
   */
  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Get the wallet-connected client for hashgraph transactions (not queries)
   */
  private async getClient(): Promise<Client> {
    if (!this.dAppConnector || !this.state.isConnected || !this.state.accountId) {
      throw new Error('Wallet not connected');
    }

    // Use simple mainnet client - no operator needed for transactions with wallet signer
    const client = Client.forMainnet();
    return client;
  }

  /**
   * Get the DApp signer for transactions
   */
  private getSigner() {
    if (!this.dAppConnector || !this.state.isConnected) {
      throw new Error('Wallet not connected');
    }

    const signer = this.dAppConnector.signers[0];
    if (!signer) {
      throw new Error('No signer available from wallet connection');
    }

    return signer;
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
          name: 'Skaterz',
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

    console.log('🔍 Session data received:', {
      namespaces: session.namespaces,
      accounts: session.accounts,
      peer: session.peer?.metadata
    });

    // Extract account ID from session - try multiple possible paths
    let accountId = null;

    // Try different session structures for Hedera namespace
    if (session.namespaces?.hedera?.accounts?.[0]) {
      const account = session.namespaces.hedera.accounts[0];
      accountId = account.includes(':') ? account.split(':')[2] : account;
      console.log('🔍 Account ID from namespaces.hedera.accounts:', accountId);
    } else if (session.peer?.metadata?.accountIds?.[0]) {
      accountId = session.peer.metadata.accountIds[0];
      console.log('🔍 Account ID from peer.metadata.accountIds:', accountId);
    } else if (session.accounts?.[0]) {
      const account = session.accounts[0];
      accountId = account.includes(':') ? account.split(':')[2] : account;
      console.log('🔍 Account ID from session.accounts:', accountId);
    }

    console.log('🔍 Final extracted account ID:', accountId);

    if (!accountId) {
      console.error('❌ No account ID found in session. Session structure:', session);
      throw new Error('No account ID found in wallet session');
    }

    // Validate account ID format
    if (!accountId.match(/^\d+\.\d+\.\d+$/)) {
      throw new Error(`Invalid account ID format: ${accountId}`);
    }

    // Verify we have a valid signer for this account
    try {
      const signer = this.dAppConnector.signers[0];
      if (signer && signer.getAccountId().toString() === accountId) {
        console.log('✅ Hedera wallet authenticated successfully with signer!');

        // Perform authentication signature to verify wallet ownership
        try {
          await this.authenticateAccount(accountId);
          console.log('✅ Wallet authentication signature completed');
        } catch (authError) {
          console.warn('⚠️ Authentication signature failed, but continuing with connection:', authError);
          // Continue with connection even if auth signature fails - some wallets may not support it
        }
      } else {
        console.warn('⚠️ No matching signer found for account:', accountId);
      }
    } catch (error) {
      console.warn('⚠️ Signer verification failed:', error);
    }

    this.setState({
      isConnected: true,
      accountId: accountId,
      evmAddress: null,
      isLoading: false,
      error: null
    });

    console.log('✅ Wallet connection established with account:', accountId);
  }



  /**
   * Authenticate account by requesting a signature from the wallet
   */
  private async authenticateAccount(accountId: string): Promise<void> {
    if (!this.dAppConnector) {
      throw new Error('Wallet service not initialized');
    }

    try {
      console.log('🔐 Requesting authentication signature from wallet...');

      // Create a centered, clean message to sign for authentication
      const timestamp = new Date().toLocaleString();
      const message = `Authenticate Skaterz access\n\nAccount: ${accountId}\nTime: ${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);

      // Request signature from wallet
      const signer = this.dAppConnector.signers[0];
      if (!signer) {
        throw new Error('No signer available');
      }

      // This will trigger a signature request in the wallet
      await signer.sign([messageBytes]);
      console.log('✅ Authentication signature successful');
    } catch (error) {
      console.error('❌ Authentication signature failed:', error);
      throw error;
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
   * Get account information using Mirror Node API (free, no payment required)
   */
  async getAccountInfo(accountId: string): Promise<any> {
    try {
      const response = await fetch(`https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${accountId}`);
      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get account info from Mirror Node:', error);
      throw error;
    }
  }

  /**
   * Query NFT information using Mirror Node API (free, no payment required)
   */
  async queryNftInfo(tokenId: TokenId, serialNumber: number): Promise<any> {
    try {
      const tokenIdString = tokenId.toString();
      const response = await fetch(`https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenIdString}/nfts/${serialNumber}`);
      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status}`);
      }
      const nftData = await response.json();

      // Convert Mirror Node format to match SDK format for compatibility
      return {
        nftId: {
          tokenId: { toString: () => tokenIdString },
          serial: { toString: () => serialNumber.toString() }
        },
        accountId: { toString: () => nftData.account_id }
      };
    } catch (error) {
      console.error(`❌ Failed to get NFT info from Mirror Node for ${tokenId}/${serialNumber}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has STAR token associated (for rewards eligibility)
   */
  async checkStarTokenAssociation(): Promise<boolean> {
    if (!this.state.isConnected || !this.state.accountId) {
      console.warn('⚠️ Wallet not connected for STAR token check');
      console.warn('⚠️ Connection state:', { isConnected: this.state.isConnected, accountId: this.state.accountId });
      return false;
    }

    try {
      console.log(`🔍 Checking STAR token association for account: ${this.state.accountId}`);
      console.log(`🔍 STAR Token ID: ${BLOCKCHAIN_CONFIG.STAR_TOKEN_ID}`);

      if (!this.state.accountId) {
        throw new Error('Account ID is undefined');
      }

      // Check specific STAR token association from Mirror Node
      const response = await fetch(`https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${this.state.accountId}/tokens?token.id=${BLOCKCHAIN_CONFIG.STAR_TOKEN_ID}`);
      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status}`);
      }
      const tokenData = await response.json();

      const hasStarToken = tokenData.tokens && tokenData.tokens.length > 0;

      console.log(`🌟 STAR token association check for ${this.state.accountId}:`, hasStarToken);

      if (hasStarToken) {
        console.log(`📋 STAR token balance: ${tokenData.tokens[0].balance}`);
      } else {
        console.log('📋 STAR token not associated - user needs to associate it for rewards');
      }

      return hasStarToken;

    } catch (error) {
      console.error('❌ Failed to check STAR token association:', error);
      return false;
    }
  }

  /**
   * Check if user owns Stacy NFT (serials #1 or #2) for character unlock
   */
  async checkStacyNftOwnership(): Promise<boolean> {
    if (!this.state.isConnected || !this.state.accountId) {
      console.warn('⚠️ Wallet not connected for Stacy NFT check');
      console.warn('⚠️ Connection state:', { isConnected: this.state.isConnected, accountId: this.state.accountId });
      return false;
    }

    try {
      console.log(`🔍 Parsing account ID: ${this.state.accountId}`);
      const accountId = AccountId.fromString(this.state.accountId);
      const unlockTokenId = TokenId.fromString(BLOCKCHAIN_CONFIG.UNLOCK_NFT_TOKEN_ID);

      console.log(`🔍 Checking Stacy NFT ownership for account: ${this.state.accountId}`);
      console.log(`🔍 Token ID: ${BLOCKCHAIN_CONFIG.UNLOCK_NFT_TOKEN_ID}`);
      console.log(`🔍 Required serials: ${BLOCKCHAIN_CONFIG.UNLOCK_SERIAL_NUMBERS.join(', ')}`);

      // Check for each required serial number
      for (const serialNumber of BLOCKCHAIN_CONFIG.UNLOCK_SERIAL_NUMBERS) {
        try {
          console.log(`🔍 Checking NFT serial #${serialNumber}...`);
          const nftInfo = await this.queryNftInfo(unlockTokenId, serialNumber);

          console.log(`📋 NFT serial #${serialNumber} info:`, {
            accountId: nftInfo.accountId?.toString(),
            tokenId: nftInfo.nftId?.tokenId?.toString(),
            serialNumber: nftInfo.nftId?.serial?.toString()
          });

          // Check if this account owns this NFT (Mirror Node returns strings)
          const nftOwner = nftInfo.accountId?.toString() || nftInfo.accountId;
          if (nftOwner === this.state.accountId) {
            console.log(`🎮 ✅ Stacy NFT found! Serial #${serialNumber} owned by ${this.state.accountId}`);
            return true;
          } else {
            console.log(`❌ Serial #${serialNumber} owned by: ${nftOwner || 'unknown'}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not check NFT serial #${serialNumber}:`, error);
          // Continue checking other serials
        }
      }

      console.log(`❌ Stacy NFT not found for ${this.state.accountId}`);
      return false;

    } catch (error) {
      console.error('❌ Failed to check Stacy NFT ownership:', error);
      return false;
    }
  }

  /**
   * Associate STAR token with user's account (required before receiving rewards)
   */
  async associateStarToken(): Promise<string> {
    try {
      const signer = this.getSigner();
      const client = await this.getClient();

      // Generate a transaction ID for the association
      const transactionId = TransactionId.generate(signer.getAccountId());

      const associateTransaction = new TokenAssociateTransaction()
        .setAccountId(signer.getAccountId())
        .setTokenIds([TokenId.fromString(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID)])
        .setTransactionId(transactionId)
        .freezeWith(client);

      // Execute transaction with wallet signer
      const response = await associateTransaction.executeWithSigner(signer);
      const receipt = await response.getReceipt(client);

      console.log(`✅ STAR token association successful for ${signer.getAccountId()}`);
      return transactionId.toString();
    } catch (error) {
      console.error('❌ Failed to associate STAR token:', error);
      throw error;
    }
  }

  /**
   * Send STAR tokens using wallet signer (for rewards)
   */
  async sendStarTokens(amount: number, receiverAccountId: string): Promise<string> {
    try {
      const signer = this.getSigner();
      const client = await this.getClient();

      // Generate a transaction ID for the transfer
      const transactionId = TransactionId.generate(signer.getAccountId());

      const transferTransaction = new TransferTransaction()
        .addTokenTransfer(
          TokenId.fromString(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID),
          AccountId.fromString(BLOCKCHAIN_CONFIG.TREASURY_ACCOUNT_ID),
          -amount
        )
        .addTokenTransfer(
          TokenId.fromString(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID),
          AccountId.fromString(receiverAccountId),
          amount
        )
        .setTransactionId(transactionId)
        .freezeWith(client);

      // Execute transaction with wallet signer
      const response = await transferTransaction.executeWithSigner(signer);
      const receipt = await response.getReceipt(client);

      console.log(`✅ STAR token transfer successful: ${amount} tokens to ${receiverAccountId}`);
      return transactionId.toString();
    } catch (error) {
      console.error('❌ Failed to send STAR tokens:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive wallet status for game features
   */
  async getWalletGameStatus(): Promise<{
    isConnected: boolean;
    accountId: string | null;
    hasStarToken: boolean;
    hasStacyNft: boolean;
  }> {
    if (!this.state.isConnected || !this.state.accountId) {
      return {
        isConnected: false,
        accountId: null,
        hasStarToken: false,
        hasStacyNft: false
      };
    }

    console.log('🔍 Checking wallet game status...');

    const [hasStarToken, hasStacyNft] = await Promise.all([
      this.checkStarTokenAssociation(),
      this.checkStacyNftOwnership()
    ]);

    const status = {
      isConnected: true,
      accountId: this.state.accountId,
      hasStarToken,
      hasStacyNft
    };

    console.log('🎮 Wallet game status:', status);
    return status;
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
        .setTransactionMemo(`Skaterz reward: ${amount} STAR tokens`)
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

// Export both the class and the instance
export { WalletService };
export default walletService;
