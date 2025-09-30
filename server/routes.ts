import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendStarTokensFromTreasury, isValidAccountId } from "./hedera-treasury";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
  
  // Leaderboard API endpoints
  app.post('/api/leaderboard', async (req, res) => {
    try {
      const { playerName, score } = req.body;
      
      if (!playerName || typeof score !== 'number') {
        return res.status(400).json({ error: 'Player name and score are required' });
      }
      
      const savedScore = await storage.saveScore(playerName, score);
      res.json(savedScore);
    } catch (error) {
      console.error('Error saving score:', error);
      res.status(500).json({ error: 'Failed to save score' });
    }
  });
  
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topScores = await storage.getTopScores(limit);
      res.json(topScores);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });
  
  app.get('/api/leaderboard/high-score', async (req, res) => {
    try {
      const highScore = await storage.getHighScore();
      res.json({ highScore });
    } catch (error) {
      console.error('Error fetching high score:', error);
      res.status(500).json({ error: 'Failed to fetch high score' });
    }
  });

  // STAR token rewards API endpoint
  app.post('/api/rewards/claim', async (req, res) => {
    console.log('🎮 ========== REWARD CLAIM REQUEST ==========');
    console.log('Request body:', req.body);

    try {
      const { accountId, amount } = req.body;

      // Validation
      if (!accountId || !amount) {
        console.log('❌ Validation failed: Missing accountId or amount');
        return res.status(400).json({ error: 'Account ID and amount are required' });
      }

      if (!isValidAccountId(accountId)) {
        console.log('❌ Validation failed: Invalid account ID format:', accountId);
        return res.status(400).json({ error: 'Invalid Hedera account ID format' });
      }

      if (typeof amount !== 'number' || amount <= 0) {
        console.log('❌ Validation failed: Invalid amount:', amount);
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }

      // Anti-cheat: Maximum reward per claim (adjust as needed)
      if (amount > 1000) {
        console.log('❌ Validation failed: Amount too large:', amount);
        return res.status(400).json({ error: 'Amount exceeds maximum allowed per claim' });
      }

      console.log(`✅ Validation passed: ${amount} STAR tokens to ${accountId}`);
      console.log('🏦 Calling treasury service...');

      // Send tokens from treasury
      const transactionId = await sendStarTokensFromTreasury(accountId, amount);

      console.log('✅ Reward claim successful!');
      console.log('========================================');

      res.json({
        success: true,
        transactionId,
        amount,
        accountId
      });

    } catch (error: any) {
      console.error('❌ ========== REWARD CLAIM FAILED ==========');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('========================================');

      res.status(500).json({
        error: 'Failed to send reward tokens',
        details: error?.message || 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
