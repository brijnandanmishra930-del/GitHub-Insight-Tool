import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================================
// Users (kept minimal; no auth in MVP)
// =====================================================
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// =====================================================
// GitHub profile analysis runs
// =====================================================
export const githubAnalyses = pgTable("github_analyses", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  profileUrl: text("profile_url").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  // Overall score 0-100
  scoreOverall: integer("score_overall").notNull(),

  // Dimension scores 0-100
  scoreDocumentation: integer("score_documentation").notNull(),
  scoreCodeQuality: integer("score_code_quality").notNull(),
  scoreActivity: integer("score_activity").notNull(),
  scoreProjectImpact: integer("score_project_impact").notNull(),
  scoreDiscoverability: integer("score_discoverability").notNull(),

  // Key computed facts shown in UI
  repoCount: integer("repo_count").notNull(),
  pinnedCount: integer("pinned_count").notNull().default(0),
  topLanguages: jsonb("top_languages").notNull().default(sql`'[]'::jsonb`),
  recentCommitDays: integer("recent_commit_days").notNull(),

  // Red flags + strengths + suggestions (arrays of strings)
  strengths: jsonb("strengths").notNull().default(sql`'[]'::jsonb`),
  redFlags: jsonb("red_flags").notNull().default(sql`'[]'::jsonb`),
  suggestions: jsonb("suggestions").notNull().default(sql`'[]'::jsonb`),

  // Snapshot of analyzed repo stats (used for drill-down)
  repos: jsonb("repos").notNull().default(sql`'[]'::jsonb`),

  // When we could not fetch full GitHub data
  isPartial: boolean("is_partial").notNull().default(false),
  partialReason: text("partial_reason"),
});

export const insertGithubAnalysisSchema = createInsertSchema(githubAnalyses).omit({
  id: true,
  createdAt: true,
});

export type GithubAnalysis = typeof githubAnalyses.$inferSelect;
export type InsertGithubAnalysis = z.infer<typeof insertGithubAnalysisSchema>;

export type CreateGithubAnalysisRequest = {
  profileUrl: string;
};

export type GithubAnalysisResponse = GithubAnalysis;
export type GithubAnalysisListResponse = GithubAnalysis[];

// Repo snapshot schema stored inside githubAnalyses.repos
export const githubRepoSnapshotSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  url: z.string().url(),
  description: z.string().nullable().optional(),
  primaryLanguage: z.string().nullable().optional(),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  openIssues: z.number().int().nonnegative(),
  hasReadme: z.boolean(),
  readmeLength: z.number().int().nonnegative(),
  hasLicense: z.boolean(),
  hasTopics: z.boolean(),
  topicsCount: z.number().int().nonnegative(),
  lastPushAt: z.string(),
});

export type GithubRepoSnapshot = z.infer<typeof githubRepoSnapshotSchema>;

export const topLanguageSchema = z.object({
  language: z.string(),
  share: z.number().min(0).max(1),
});

export type TopLanguage = z.infer<typeof topLanguageSchema>;

export const scoreBreakdownSchema = z.object({
  overall: z.number().int().min(0).max(100),
  documentation: z.number().int().min(0).max(100),
  codeQuality: z.number().int().min(0).max(100),
  activity: z.number().int().min(0).max(100),
  projectImpact: z.number().int().min(0).max(100),
  discoverability: z.number().int().min(0).max(100),
});

export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
