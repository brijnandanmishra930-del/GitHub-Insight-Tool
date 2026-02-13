import { db } from "./db";
import { githubAnalyses, type CreateGithubAnalysisRequest, type GithubAnalysisResponse } from "@shared/schema";
import { desc, eq } from "drizzle-orm";

export interface IStorage {
  listGithubAnalyses(limit?: number): Promise<GithubAnalysisResponse[]>;
  getGithubAnalysis(id: string): Promise<GithubAnalysisResponse | undefined>;
  createGithubAnalysis(input: Omit<GithubAnalysisResponse, "id" | "createdAt">): Promise<GithubAnalysisResponse>;
}

export class DatabaseStorage implements IStorage {
  async listGithubAnalyses(limit = 10): Promise<GithubAnalysisResponse[]> {
    return await db
      .select()
      .from(githubAnalyses)
      .orderBy(desc(githubAnalyses.createdAt))
      .limit(limit);
  }

  async getGithubAnalysis(id: string): Promise<GithubAnalysisResponse | undefined> {
    const [row] = await db.select().from(githubAnalyses).where(eq(githubAnalyses.id, id)).limit(1);
    return row;
  }

  async createGithubAnalysis(
    input: Omit<GithubAnalysisResponse, "id" | "createdAt">,
  ): Promise<GithubAnalysisResponse> {
    const [created] = await db.insert(githubAnalyses).values(input).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
