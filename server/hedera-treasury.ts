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

    // Clean the private key (remove any whitespace, newlines, 0x prefix)
    let cleanKey = BLOCKCHAIN_CONFIG.HEDERA_TREASURY_PRIVATE_KEY.trim();
    if (cleanKey.startsWith('0x')) {
      cleanKey = cleanKey.substring(2);
      console.log('   Removed 0x prefix from private key');
    }
    console.log('   Cleaned key length:', cleanKey.length);

    // Parse private key - try multiple formats
    let privateKey;

    // Try 1: DER format (starts with 302e)
    if (cleanKey.startsWith('302e')) {
      try {
        privateKey = PrivateKey.fromStringDer(cleanKey);
        console.log('✅ Private key parsed as DER format');
      } catch (derError) {
        console.log('⚠️ DER parsing failed:', derError.message);
      }
    }

    // Try 2: ED25519 hex format (64 chars)
    if (!privateKey) {
      try {
        privateKey = PrivateKey.fromStringED25519(cleanKey);
        console.log('✅ Private key parsed as ED25519');
      } catch (ed25519Error) {
        console.log('⚠️ ED25519 parsing failed:', ed25519Error.message);
      }
    }

    // Try 3: ECDSA hex format
    if (!privateKey) {
      try {
        privateKey = PrivateKey.fromStringECDSA(cleanKey);
        console.log('✅ Private key parsed as ECDSA');
      } catch (ecdsaError) {
        console.log('⚠️ ECDSA parsing failed:', ecdsaError.message);
      }
    }

    // Try 4: Generic fromString (last resort)
    if (!privateKey) {
      try {
        privateKey = PrivateKey.fromString(cleanKey);
        console.log('✅ Private key parsed with generic fromString');
      } catch (genericError) {
        console.error('❌ All private key parsing methods failed');
        throw new Error('Invalid private key format. Tried DER, ED25519, ECDSA, and generic parsing.');
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

