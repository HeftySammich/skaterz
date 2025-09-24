import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  const httpServer = createServer(app);

  return httpServer;
}
