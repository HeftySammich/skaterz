import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TransferTransaction,
  TokenId 
} from '@hashgraph/sdk';
import { BLOCKCHAIN_CONFIG } from '../shared/environment';

/**
 * Initialize Hedera client with treasury credentials (server-side only)
 * This client has access to the treasury private key and can send tokens
 */
function getTreasuryClient(): Client {
  if (!BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY) {
    throw new Error('HEDERA_TREASURY_PRIVATE_KEY environment variable is required');
  }
  
  const client = Client.forMainnet();
  
  client.setOperator(
    AccountId.fromString(BLOCKCHAIN_CONFIG.HEDERA_TREASURY_ACCOUNT_ID),
    PrivateKey.fromString(BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY)
  );
  
  return client;
}

/**
 * Send STAR tokens from treasury to a player's account
 * @param receiverAccountId - The player's Hedera account ID (e.g., "0.0.9172674")
 * @param amount - Number of STAR tokens to send
 * @returns Transaction ID as string
 */
export async function sendStarTokensFromTreasury(
  receiverAccountId: string, 
  amount: number
): Promise<string> {
  console.log(`🏦 Treasury: Sending ${amount} STAR tokens to ${receiverAccountId}`);
  
  const client = getTreasuryClient();
  
  try {
    const transaction = new TransferTransaction()
      .addTokenTransfer(
        TokenId.fromString(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID),
        AccountId.fromString(BLOCKCHAIN_CONFIG.HEDERA_TREASURY_ACCOUNT_ID),
        -amount
      )
      .addTokenTransfer(
        TokenId.fromString(BLOCKCHAIN_CONFIG.STAR_TOKEN_ID),
        AccountId.fromString(receiverAccountId),
        amount
      )
      .setTransactionMemo(`Zombie Skaterz reward: ${amount} STAR`);
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    
    const transactionId = response.transactionId.toString();
    
    console.log(`✅ Treasury: STAR tokens sent successfully!`);
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Status: ${receipt.status.toString()}`);
    
    return transactionId;
  } catch (error) {
    console.error('❌ Treasury: Failed to send STAR tokens:', error);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Validate that a Hedera account ID is properly formatted
 */
export function isValidAccountId(accountId: string): boolean {
  // Hedera account ID format: 0.0.XXXXX
  const accountIdRegex = /^0\.0\.\d+$/;
  return accountIdRegex.test(accountId);
}

