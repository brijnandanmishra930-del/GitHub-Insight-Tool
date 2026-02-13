import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

function parseGithubUsername(profileUrl: string): string {
  const u = new URL(profileUrl);
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 1) throw new Error("Invalid GitHub profile URL");
  return parts[0];
}

async function fetchJson(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "User-Agent": "github-portfolio-analyzer",
      Accept: "application/vnd.github+json",
      ...(opts?.headers ?? {}),
    },
  });
  return { res, json: await res.json().catch(() => null) };
}

async function fetchText(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "User-Agent": "github-portfolio-analyzer",
      Accept: "application/vnd.github.raw",
      ...(opts?.headers ?? {}),
    },
  });
  return { res, text: await res.text().catch(() => "") };
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreFrom(
  input: {
    repoCount: number;
    readmeCoverage: number; // 0..1
    avgReadmeLen: number;
    topicsCoverage: number; // 0..1
    licenseCoverage: number; // 0..1
    recentCommitDays: number; // 0..365
    langDiversity: number; // 1..N
    starsTotal: number;
    forksTotal: number;
  },
): {
  documentation: number;
  codeQuality: number;
  activity: number;
  projectImpact: number;
  discoverability: number;
  overall: number;
  strengths: string[];
  redFlags: string[];
  suggestions: string[];
} {
  const strengths: string[] = [];
  const redFlags: string[] = [];
  const suggestions: string[] = [];

  const documentation = clampScore(
    input.readmeCoverage * 55 +
      Math.min(25, input.avgReadmeLen / 80) +
      input.licenseCoverage * 10 +
      input.topicsCoverage * 10,
  );

  const codeQuality = clampScore(
    (input.licenseCoverage * 15 + input.topicsCoverage * 15) +
      Math.min(40, input.langDiversity * 10) +
      Math.min(30, Math.log10(1 + input.repoCount) * 25),
  );

  // recentCommitDays: higher is better
  const activity = clampScore(
    Math.min(70, input.recentCommitDays / 120 * 70) +
      Math.min(30, Math.log10(1 + input.repoCount) * 18),
  );

  const projectImpact = clampScore(
    Math.min(70, Math.log10(1 + input.starsTotal) * 35) +
      Math.min(30, Math.log10(1 + input.forksTotal) * 30),
  );

  const discoverability = clampScore(
    input.topicsCoverage * 45 + input.readmeCoverage * 35 + Math.min(20, input.repoCount * 2),
  );

  const overall = clampScore(
    documentation * 0.25 +
      codeQuality * 0.2 +
      activity * 0.2 +
      projectImpact * 0.2 +
      discoverability * 0.15,
  );

  if (input.readmeCoverage >= 0.7) strengths.push("Most repositories have a README, which helps recruiters quickly understand your work.");
  if (input.topicsCoverage >= 0.5) strengths.push("Many repositories use topics, improving search/discoverability.");
  if (input.recentCommitDays >= 60) strengths.push("Recent and consistent activity signals momentum and learning consistency.");
  if (input.starsTotal >= 20) strengths.push("Your projects show external interest (stars), which helps with credibility.");

  if (input.readmeCoverage < 0.4) redFlags.push("Many repositories are missing READMEs, which makes it hard for recruiters to evaluate impact.");
  if (input.recentCommitDays < 10) redFlags.push("Low recent activity can look like an inactive portfolio.");
  if (input.topicsCoverage < 0.25) redFlags.push("Few repos have topics, reducing discoverability and clarity.");

  // Suggestions: always at least 3
  suggestions.push(
    "Pick your top 3–5 repositories and add recruiter-focused READMEs (problem, approach, setup, screenshots, tradeoffs, and results).",
  );
  suggestions.push(
    "Add topics and short descriptions to each showcased repository so people can understand them at a glance.",
  );
  suggestions.push(
    "Create a simple project story: add a demo link, key features, and a clear 'what I learned' section for each project.",
  );

  if (input.licenseCoverage < 0.5) {
    suggestions.push("Add a LICENSE file to public repos you want recruiters to review—signals professionalism.");
  }
  if (input.langDiversity <= 1) {
    suggestions.push("Show breadth by pinning projects in different languages/frameworks (even small ones) to demonstrate range.");
  }
  if (input.starsTotal === 0) {
    suggestions.push("Improve shareability: add screenshots, a short demo video, and clear usage instructions to encourage stars.");
  }

  return {
    documentation,
    codeQuality,
    activity,
    projectImpact,
    discoverability,
    overall,
    strengths,
    redFlags,
    suggestions: suggestions.slice(0, 6),
  };
}

async function analyzeGithubProfile(profileUrl: string) {
  const username = parseGithubUsername(profileUrl);

  const { res: userRes, json: userJson } = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
  );

  if (!userRes.ok) {
    const message = typeof userJson?.message === "string" ? userJson.message : "Unable to fetch GitHub profile";
    const err: any = new Error(message);
    err.status = userRes.status;
    err.isRateLimit = userRes.status === 403;
    throw err;
  }

  const { res: reposRes, json: reposJson } = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
  );

  const repos: any[] = Array.isArray(reposJson) ? reposJson : [];

  const repoSnapshots: any[] = [];
  const languageCounts = new Map<string, number>();

  let hasReadmeCount = 0;
  let readmeLenSum = 0;
  let hasTopicsCount = 0;
  let hasLicenseCount = 0;
  let starsTotal = 0;
  let forksTotal = 0;

  // We keep it light-weight: only probe README for first 12 most recently updated repos
  const readmeProbeRepos = repos.slice(0, 12);
  const readmeLengthsByFullName = new Map<string, number>();
  const readmeExistsByFullName = new Map<string, boolean>();

  for (const r of readmeProbeRepos) {
    const fullName = r?.full_name;
    if (!fullName) continue;

    const { res: readmeRes, text } = await fetchText(
      `https://api.github.com/repos/${fullName}/readme`,
    );

    if (readmeRes.ok) {
      readmeExistsByFullName.set(fullName, true);
      readmeLengthsByFullName.set(fullName, text.length);
    } else {
      readmeExistsByFullName.set(fullName, false);
      readmeLengthsByFullName.set(fullName, 0);
    }
  }

  for (const r of repos) {
    const fullName = String(r?.full_name ?? "");
    const htmlUrl = String(r?.html_url ?? "");

    const stars = Number(r?.stargazers_count ?? 0) || 0;
    const forks = Number(r?.forks_count ?? 0) || 0;
    const openIssues = Number(r?.open_issues_count ?? 0) || 0;

    starsTotal += stars;
    forksTotal += forks;

    const primaryLanguage = r?.language ? String(r.language) : null;
    if (primaryLanguage) {
      languageCounts.set(primaryLanguage, (languageCounts.get(primaryLanguage) ?? 0) + 1);
    }

    const topics: unknown = r?.topics;
    const topicsArr = Array.isArray(topics) ? topics.filter((t) => typeof t === "string") : [];
    const hasTopics = topicsArr.length > 0;
    if (hasTopics) hasTopicsCount += 1;

    const hasLicense = Boolean(r?.license?.spdx_id && r.license.spdx_id !== "NOASSERTION");
    if (hasLicense) hasLicenseCount += 1;

    const hasReadme = readmeExistsByFullName.get(fullName) ?? false;
    const readmeLength = readmeLengthsByFullName.get(fullName) ?? 0;

    if (hasReadme) {
      hasReadmeCount += 1;
      readmeLenSum += readmeLength;
    }

    repoSnapshots.push({
      name: String(r?.name ?? ""),
      fullName,
      url: htmlUrl,
      description: typeof r?.description === "string" ? r.description : null,
      primaryLanguage,
      stars,
      forks,
      openIssues,
      hasReadme,
      readmeLength,
      hasLicense,
      hasTopics,
      topicsCount: topicsArr.length,
      lastPushAt: String(r?.pushed_at ?? r?.updated_at ?? ""),
    });
  }

  const repoCount = repoSnapshots.length;
  const readmeCoverage = repoCount ? hasReadmeCount / repoCount : 0;
  const topicsCoverage = repoCount ? hasTopicsCount / repoCount : 0;
  const licenseCoverage = repoCount ? hasLicenseCount / repoCount : 0;
  const avgReadmeLen = hasReadmeCount ? readmeLenSum / hasReadmeCount : 0;

  const topLanguages = Array.from(languageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([language, count]) => ({
      language,
      share: repoCount ? count / repoCount : 0,
    }));

  // Activity heuristic: use events API (public). If rate-limited, fallback to lastPush.
  let recentCommitDays = 0;
  let isPartial = false;
  let partialReason: string | null = null;

  const { res: eventsRes, json: eventsJson } = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`,
  );

  if (eventsRes.ok && Array.isArray(eventsJson)) {
    const pushes = eventsJson.filter((e) => e?.type === "PushEvent" && typeof e?.created_at === "string");
    const uniqueDays = new Set<string>();
    for (const p of pushes) {
      uniqueDays.add(String(p.created_at).slice(0, 10));
    }
    recentCommitDays = uniqueDays.size;
  } else {
    // fallback: count unique push days from repo pushed_at among last 100 repos
    const unique = new Set<string>();
    for (const r of repoSnapshots.slice(0, 30)) {
      const d = String(r.lastPushAt || "").slice(0, 10);
      if (d) unique.add(d);
    }
    recentCommitDays = unique.size;
    isPartial = true;
    partialReason = "Could not fetch recent activity events; using repo update dates as fallback.";
  }

  const scores = scoreFrom({
    repoCount,
    readmeCoverage,
    avgReadmeLen,
    topicsCoverage,
    licenseCoverage,
    recentCommitDays,
    langDiversity: Math.max(1, languageCounts.size),
    starsTotal,
    forksTotal,
  });

  return {
    username,
    repoCount,
    pinnedCount: 0,
    topLanguages,
    recentCommitDays,
    repos: repoSnapshots,
    isPartial,
    partialReason,
    scoreOverall: scores.overall,
    scoreDocumentation: scores.documentation,
    scoreCodeQuality: scores.codeQuality,
    scoreActivity: scores.activity,
    scoreProjectImpact: scores.projectImpact,
    scoreDiscoverability: scores.discoverability,
    strengths: scores.strengths,
    redFlags: scores.redFlags,
    suggestions: scores.suggestions,
  };
}

async function seedDatabase() {
  const existing = await storage.listGithubAnalyses(1);
  if (existing.length > 0) return;

  // Seed with a known public profile (safe) - this is for first-load polish.
  // If GitHub rate-limits, we skip seeding.
  try {
    const profileUrl = "https://github.com/octocat";
    const analysis = await analyzeGithubProfile(profileUrl);
    await storage.createGithubAnalysis({
      profileUrl,
      username: analysis.username,
      scoreOverall: analysis.scoreOverall,
      scoreDocumentation: analysis.scoreDocumentation,
      scoreCodeQuality: analysis.scoreCodeQuality,
      scoreActivity: analysis.scoreActivity,
      scoreProjectImpact: analysis.scoreProjectImpact,
      scoreDiscoverability: analysis.scoreDiscoverability,
      repoCount: analysis.repoCount,
      pinnedCount: analysis.pinnedCount,
      topLanguages: analysis.topLanguages,
      recentCommitDays: analysis.recentCommitDays,
      strengths: analysis.strengths,
      redFlags: analysis.redFlags,
      suggestions: analysis.suggestions,
      repos: analysis.repos,
      isPartial: analysis.isPartial,
      partialReason: analysis.partialReason,
    });
  } catch {
    // no-op
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Seed once at startup
  void seedDatabase();

  app.get(api.github.analyses.list.path, async (req, res) => {
    const parsed = api.github.analyses.list.input?.safeParse(req.query);
    const limit = parsed?.success ? parsed.data?.limit : undefined;
    const items = await storage.listGithubAnalyses(limit ?? 10);
    res.json(items);
  });

  app.get(api.github.analyses.get.path, async (req, res) => {
    const item = await storage.getGithubAnalysis(String(req.params.id));
    if (!item) {
      return res.status(404).json({ message: "Analysis not found" });
    }
    res.json(item);
  });

  app.get(api.github.analyses.repos.path, async (req, res) => {
    const item = await storage.getGithubAnalysis(String(req.params.id));
    if (!item) {
      return res.status(404).json({ message: "Analysis not found" });
    }
    res.json(item.repos ?? []);
  });

  app.post(api.github.analyses.create.path, async (req, res) => {
    try {
      const input = api.github.analyses.create.input.parse(req.body);
      const analysis = await analyzeGithubProfile(input.profileUrl);

      const created = await storage.createGithubAnalysis({
        profileUrl: input.profileUrl,
        username: analysis.username,
        scoreOverall: analysis.scoreOverall,
        scoreDocumentation: analysis.scoreDocumentation,
        scoreCodeQuality: analysis.scoreCodeQuality,
        scoreActivity: analysis.scoreActivity,
        scoreProjectImpact: analysis.scoreProjectImpact,
        scoreDiscoverability: analysis.scoreDiscoverability,
        repoCount: analysis.repoCount,
        pinnedCount: analysis.pinnedCount,
        topLanguages: analysis.topLanguages,
        recentCommitDays: analysis.recentCommitDays,
        strengths: analysis.strengths,
        redFlags: analysis.redFlags,
        suggestions: analysis.suggestions,
        repos: analysis.repos,
        isPartial: analysis.isPartial,
        partialReason: analysis.partialReason,
      });

      res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }

      // GitHub rate limit or upstream problems
      if (err?.status === 403) {
        return res.status(503).json({
          message:
            "GitHub temporarily blocked requests (rate limit). Please wait a bit and try again.",
        });
      }

      return res.status(503).json({
        message: "Unable to fetch GitHub data right now. Please try again.",
      });
    }
  });

  return httpServer;
}
