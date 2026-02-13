import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Github,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCreateGithubAnalysis, useGithubAnalyses } from "@/hooks/use-github-analyses";
import { RateLimitBanner } from "@/components/RateLimitBanner";
import { cn } from "@/lib/utils";

const urlSchema = z
  .string()
  .min(1, "GitHub profile URL is required")
  .superRefine((val, ctx) => {
    try {
      const u = new URL(val);
      if (u.hostname !== "github.com") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a github.com profile URL",
        });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please enter a valid URL" });
    }
  });

function formatDate(d: any) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-amber-500";
  return "text-rose-500";
}

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const create = useCreateGithubAnalysis();
  const { data: recent, isLoading: loadingRecent, error: recentErr } = useGithubAnalyses(8);

  const [profileUrl, setProfileUrl] = useState("https://github.com/");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const valid = useMemo(() => urlSchema.safeParse(profileUrl), [profileUrl]);

  const onAnalyze = async () => {
    setRateLimitMessage(null);
    const parsed = urlSchema.safeParse(profileUrl.trim());
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Invalid URL");
      return;
    }
    setFieldError(null);

    try {
      const created = await create.mutateAsync({ profileUrl: parsed.data });
      toast({
        title: "Analysis created",
        description: "Opening your report…",
      });
      navigate(`/analysis/${created.id}`);
    } catch (e: any) {
      if (e?.status === 503) {
        setRateLimitMessage(e.message || "GitHub rate limit hit. Please retry shortly.");
        return;
      }
      toast({
        title: "Couldn’t analyze profile",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const retryRateLimit = () => {
    setRateLimitMessage(null);
    void onAnalyze();
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="lg:col-span-7">
          <div className="noise-overlay glass rounded-[28px] p-7 shadow-premium-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-card-border/70 bg-background/40 px-3 py-1 text-xs text-muted-foreground shadow-premium">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                  Recruiter-ready portfolio report
                </div>
                <h1 className="mt-4 text-3xl sm:text-4xl">
                  Turn your GitHub into a{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    confident narrative
                  </span>
                  .
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Paste a GitHub profile URL. We’ll score documentation, code quality, activity,
                  project impact, and discoverability—then give crisp, actionable suggestions.
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent ring-1 ring-primary/20 shadow-premium">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  GitHub profile URL
                </label>
                <div className="relative">
                  <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    className={cn(
                      "h-12 rounded-2xl pl-10 text-sm sm:text-base",
                      fieldError ? "border-destructive focus-visible:ring-destructive/20" : "",
                    )}
                    placeholder="https://github.com/username"
                    data-testid="profile-url-input"
                  />
                </div>
                {fieldError ? (
                  <div
                    className="mt-2 text-sm text-destructive"
                    data-testid="profile-url-error"
                  >
                    {fieldError}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Tip: use your real profile—analysis uses public metadata.
                  </div>
                )}
              </div>

              <div className="sm:pt-7">
                <Button
                  onClick={onAnalyze}
                  disabled={create.isPending || !valid.success}
                  className={cn(
                    "h-12 w-full rounded-2xl px-6 font-semibold",
                    "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                    "shadow-lg shadow-primary/20 transition-all duration-200 ease-out",
                    "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 active:translate-y-0",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                  )}
                  data-testid="analyze-button"
                >
                  {create.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Analyzing…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Analyze <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {rateLimitMessage ? (
              <div className="mt-5">
                <RateLimitBanner
                  message={rateLimitMessage}
                  onRetry={retryRateLimit}
                  data-testid="rate-limit-banner"
                />
              </div>
            ) : null}

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { title: "Overall score", desc: "0–100, recruiter-readable summary." },
                { title: "Strengths & red flags", desc: "What stands out immediately." },
                { title: "Actionable fixes", desc: "Concrete steps you can do today." },
              ].map((f) => (
                <Card
                  key={f.title}
                  className="rounded-3xl border-card-border/70 bg-card/60 p-4 shadow-premium backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-premium-md"
                >
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {f.desc}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="noise-overlay rounded-[28px] border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl">Recent analyses</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open a previous report or run a new one.
                </p>
              </div>

              <Link
                href="/analyses"
                className="hidden rounded-2xl border border-card-border/70 bg-background/40 px-3 py-2 text-sm font-medium text-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:bg-background md:inline-flex"
                data-testid="view-all-analyses"
              >
                <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                View all
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {loadingRecent ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[74px] w-full rounded-3xl border border-card-border/70 bg-background/30 p-4"
                    >
                      <div className="skeleton-shimmer h-4 w-1/2 rounded-full" />
                      <div className="mt-3 skeleton-shimmer h-3 w-2/3 rounded-full opacity-80" />
                    </div>
                  ))}
                </>
              ) : recentErr ? (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" data-testid="recent-error">
                  {(recentErr as any)?.message || "Failed to load recent analyses."}
                </div>
              ) : !recent || recent.length === 0 ? (
                <div className="rounded-3xl border border-card-border/70 bg-background/30 p-6 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-3 text-sm font-semibold">No analyses yet</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Run your first analysis to build a baseline.
                  </div>
                </div>
              ) : (
                recent.map((a) => (
                  <Link
                    key={a.id}
                    href={`/analysis/${a.id}`}
                    className={cn(
                      "group block rounded-3xl border border-card-border/70 bg-background/30 p-4 shadow-premium transition-all",
                      "hover:-translate-y-0.5 hover:bg-background/50 hover:shadow-premium-md",
                    )}
                    data-testid={`recent-analysis-${a.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {a.username}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {a.profileUrl}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(a.createdAt)}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className={cn("font-display text-2xl leading-none", scoreTone(a.scoreOverall))}>
                          {a.scoreOverall}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                          overall
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="font-mono">{a.repoCount}</span> repos
                          {a.isPartial ? (
                            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500 ring-1 ring-amber-500/20">
                              partial
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/70 ring-1 ring-border/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                        style={{ width: `${Math.max(0, Math.min(100, a.scoreOverall))}%` }}
                      />
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="mt-4 md:hidden">
              <Link
                href="/analyses"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-card-border/70 bg-background/40 px-3 py-3 text-sm font-medium text-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:bg-background"
                data-testid="view-all-analyses-mobile"
              >
                <BarChart3 className="mr-2 h-4 w-4 text-primary" />
                View all analyses
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
