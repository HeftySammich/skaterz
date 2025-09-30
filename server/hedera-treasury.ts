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
  console.log('🔑 Initializing treasury client...');
  console.log('   Treasury Account ID:', BLOCKCHAIN_CONFIG.HEDERA_TREASURY_ACCOUNT_ID);
  console.log('   Private Key Set:', !!BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY);
  console.log('   Private Key Length:', BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY?.length || 0);

  if (!BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY) {
    console.error('❌ HEDERA_TREASURY_PRIVATE_KEY environment variable is missing!');
    throw new Error('HEDERA_TREASURY_PRIVATE_KEY environment variable is required');
  }

  if (BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY.length === 0) {
    console.error('❌ HEDERA_TREASURY_PRIVATE_KEY environment variable is empty!');
    throw new Error('HEDERA_TREASURY_PRIVATE_KEY environment variable is empty');
  }

  try {
    const client = Client.forMainnet();

    // Parse private key - try ED25519 first (most common), then ECDSA
    let privateKey;
    try {
      // Most Hedera accounts use ED25519 keys
      privateKey = PrivateKey.fromStringED25519(BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY);
      console.log('✅ Private key parsed as ED25519');
    } catch (ed25519Error) {
      console.log('⚠️ ED25519 parsing failed, trying ECDSA...');
      try {
        privateKey = PrivateKey.fromStringECDSA(BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY);
        console.log('✅ Private key parsed as ECDSA');
      } catch (ecdsaError) {
        console.error('❌ Failed to parse private key as ED25519 or ECDSA');
        throw new Error('Invalid private key format. Must be hex-encoded ED25519 or ECDSA key.');
      }
    }

    client.setOperator(
      AccountId.fromString(BLOCKCHAIN_CONFIG.HEDERA_TREASURY_ACCOUNT_ID),
      privateKey
    );

    console.log('✅ Treasury client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize treasury client:', error);
    throw error;
  }
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
  console.log(`   STAR Token ID: ${BLOCKCHAIN_CONFIG.STAR_TOKEN_ID}`);
  console.log(`   Treasury Account: ${BLOCKCHAIN_CONFIG.HEDERA_TREASURY_ACCOUNT_ID}`);

  let client;

  try {
    client = getTreasuryClient();

    console.log('📝 Creating token transfer transaction...');
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

    console.log('🚀 Executing transaction...');
    const response = await transaction.execute(client);

    console.log('⏳ Waiting for receipt...');
    const receipt = await response.getReceipt(client);

    const transactionId = response.transactionId.toString();

    console.log(`✅ Treasury: STAR tokens sent successfully!`);
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Status: ${receipt.status.toString()}`);

    return transactionId;
  } catch (error) {
    console.error('❌ Treasury: Failed to send STAR tokens:');
    console.error('   Error type:', error?.constructor?.name);
    console.error('   Error message:', error?.message);
    console.error('   Full error:', error);
    throw error;
  } finally {
    if (client) {
      client.close();
    }
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

