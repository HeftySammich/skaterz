import { users, leaderboard, type User, type InsertUser, type Leaderboard, type InsertLeaderboard } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { desc, sql } from "drizzle-orm";

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

export const storage = new DatabaseStorage();
