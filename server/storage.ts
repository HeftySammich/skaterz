import { users, leaderboard, type User, type InsertUser, type Leaderboard, type InsertLeaderboard } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { desc, sql } from "drizzle-orm";
import { envLog } from "../shared/environment";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leaderboard methods
  saveScore(playerName: string, score: number): Promise<Leaderboard>;
  getTopScores(limit?: number): Promise<Leaderboard[]>;
  getHighScore(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const connection = neon(connectionString);
    this.db = drizzle(connection);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(sql`${users.id} = ${id}`).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(sql`${users.username} = ${username}`).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async saveScore(playerName: string, score: number): Promise<Leaderboard> {
    const result = await this.db.insert(leaderboard).values({ playerName, score }).returning();
    return result[0];
  }

  async getTopScores(limit: number = 10): Promise<Leaderboard[]> {
    return await this.db.select().from(leaderboard).orderBy(desc(leaderboard.score)).limit(limit);
  }

  async getHighScore(): Promise<number> {
    const result = await this.db.select({ maxScore: sql<number>`max(${leaderboard.score})` }).from(leaderboard);
    return result[0]?.maxScore || 0;
  }
}

// Memory storage implementation for development/fallback
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private leaderboard: Leaderboard[] = [];
  private nextUserId = 1;
  private nextLeaderboardId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      username: insertUser.username,
      password: insertUser.password
    };
    this.users.push(user);
    return user;
  }

  async saveScore(playerName: string, score: number): Promise<Leaderboard> {
    const entry: Leaderboard = {
      id: this.nextLeaderboardId++,
      playerName,
      score,
      createdAt: new Date()
    };
    this.leaderboard.push(entry);
    return entry;
  }

  async getTopScores(limit: number = 10): Promise<Leaderboard[]> {
    return this.leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getHighScore(): Promise<number> {
    if (this.leaderboard.length === 0) return 0;
    return Math.max(...this.leaderboard.map(entry => entry.score));
  }
}

// Create storage instance with fallback
function createStorage(): IStorage {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      envLog('Using database storage');
      return new DatabaseStorage();
    } catch (error) {
      envLog(`Database connection failed, falling back to memory storage: ${error}`, 'warn');
      return new MemoryStorage();
    }
  } else {
    envLog('No DATABASE_URL provided, using memory storage');
    return new MemoryStorage();
  }
}

export const storage = createStorage();
