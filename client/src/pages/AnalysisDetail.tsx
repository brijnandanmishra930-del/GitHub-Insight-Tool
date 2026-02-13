import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { AlertTriangle, ArrowLeft, ExternalLink, FileText, Flag, ShieldAlert, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useGithubAnalysis, useGithubRepos } from "@/hooks/use-github-analyses";
import { ScoreBadge } from "@/components/ScoreBadge";
import { ScoreRadar } from "@/components/ScoreRadar";
import { TopLanguagesBar } from "@/components/TopLanguagesBar";
import { RepoTable } from "@/components/RepoTable";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

function formatDate(d: any) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnalysisDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const { data: analysis, isLoading, error, refetch, isFetching } = useGithubAnalysis(id);
  const { data: reposRaw, isLoading: reposLoading, error: reposError, refetch: refetchRepos, isFetching: reposFetching } =
    useGithubRepos(id);

  const radarData = useMemo(() => {
    if (!analysis) return [];
    return [
      { metric: "Docs", score: analysis.scoreDocumentation },
      { metric: "Code", score: analysis.scoreCodeQuality },
      { metric: "Activity", score: analysis.scoreActivity },
      { metric: "Impact", score: analysis.scoreProjectImpact },
      { metric: "Discover", score: analysis.scoreDiscoverability },
    ];
  }, [analysis]);

  const languageData = useMemo(() => {
    const arr = (analysis?.topLanguages ?? []) as any[];
    return arr
      .filter((x) => x && typeof x.language === "string" && typeof x.share === "number")
      .map((x) => ({ language: x.language, share: x.share }));
  }, [analysis]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <Link
              href="/analyses"
              className="inline-flex items-center gap-2 rounded-2xl border border-card-border/70 bg-card/60 px-3 py-2 text-sm text-muted-foreground shadow-premium backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card hover:text-foreground"
              data-testid="back-to-analyses"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to history
            </Link>

            <h1 className="mt-4 truncate text-3xl sm:text-4xl" data-testid="analysis-title">
              {analysis ? (
                <>
                  Report for{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {analysis.username}
                  </span>
                </>
              ) : (
                "Analysis"
              )}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A clean, recruiter-ready readout—scores, signals, and next steps.
            </p>

            {analysis ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full" data-testid="analysis-created-at">
                  {formatDate(analysis.createdAt)}
                </Badge>
                <Badge variant="outline" className="rounded-full" data-testid="analysis-repo-count">
                  {analysis.repoCount} repos
                </Badge>
                <Badge variant="outline" className="rounded-full" data-testid="analysis-pinned-count">
                  {analysis.pinnedCount} pinned
                </Badge>
                <Badge variant="outline" className="rounded-full" data-testid="analysis-recent-commit-days">
                  {analysis.recentCommitDays}d since last push
                </Badge>
                {analysis.isPartial ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-amber-500/25 bg-amber-500/10 text-amber-500"
                    data-testid="analysis-partial"
                  >
                    Partial data
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => {
                void refetch();
                void refetchRepos();
              }}
              className="h-11 rounded-2xl border-card-border/70 bg-card/60 shadow-premium backdrop-blur hover:bg-card"
              data-testid="analysis-refresh"
            >
              {isFetching || reposFetching ? "Refreshing…" : "Refresh"}
            </Button>

            {analysis?.profileUrl ? (
              <Button
                onClick={() => window.open(analysis.profileUrl, "_blank", "noopener,noreferrer")}
                className={cn(
                  "h-11 rounded-2xl px-4 font-semibold",
                  "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                  "shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25",
                )}
                data-testid="open-github-profile"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open profile
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur"
              >
                <div className="skeleton-shimmer h-4 w-1/2 rounded-full" />
                <div className="mt-3 skeleton-shimmer h-10 w-1/3 rounded-2xl" />
                <div className="mt-6 skeleton-shimmer h-2 w-full rounded-full opacity-70" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="rounded-3xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive"
            data-testid="analysis-error"
          >
            {(error as any)?.message || "Failed to load analysis."}{" "}
            <button
              className="ml-2 underline"
              onClick={() => refetch()}
              data-testid="analysis-error-retry"
            >
              Retry
            </button>
          </div>
        ) : !analysis ? (
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6 text-primary" />}
            title="Analysis not found"
            description="This report may have been deleted or the link is incorrect."
            action={
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                data-testid="analysis-not-found-cta"
              >
                Run a new analysis
              </Link>
            }
            data-testid="analysis-not-found"
          />
        ) : (
          <>
            {analysis.isPartial ? (
              <div
                className="noise-overlay rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card/60 to-card/40 p-5 shadow-premium backdrop-blur"
                data-testid="partial-banner"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/20">
                      <ShieldAlert className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Partial data fetched
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {analysis.partialReason ||
                          "GitHub returned limited data. Scores may be conservative."}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-card-border/70 bg-background/40 px-4 text-sm font-medium text-foreground shadow-premium transition-all hover:-translate-y-0.5 hover:bg-background"
                    data-testid="partial-try-again"
                  >
                    Try again later
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              <ScoreBadge
                label="Overall"
                subtitle="Single signal for the portfolio’s readiness"
                score={analysis.scoreOverall}
                data-testid="score-overall"
              />
              <ScoreBadge
                label="Documentation"
                subtitle="READMEs, topics, license signals"
                score={analysis.scoreDocumentation}
                data-testid="score-documentation"
              />
              <ScoreBadge
                label="Code quality"
                subtitle="Project hygiene & clarity proxies"
                score={analysis.scoreCodeQuality}
                data-testid="score-code-quality"
              />
              <ScoreBadge
                label="Activity"
                subtitle="Recency, steady shipping"
                score={analysis.scoreActivity}
                data-testid="score-activity"
              />
              <ScoreBadge
                label="Project impact"
                subtitle="Stars, usage signals, substance"
                score={analysis.scoreProjectImpact}
                data-testid="score-project-impact"
              />
              <ScoreBadge
                label="Discoverability"
                subtitle="Pinned repos, descriptions, scannability"
                score={analysis.scoreDiscoverability}
                data-testid="score-discoverability"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ScoreRadar data={radarData} data-testid="radar-chart" />
              <TopLanguagesBar data={languageData} data-testid="languages-chart" />
            </div>

            <Tabs defaultValue="insights" className="w-full" data-testid="analysis-tabs">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-card/60 p-1 ring-1 ring-border/60 backdrop-blur">
                <TabsTrigger value="insights" className="rounded-xl" data-testid="tab-insights">
                  Insights
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="rounded-xl" data-testid="tab-suggestions">
                  Suggestions
                </TabsTrigger>
                <TabsTrigger value="repos" className="rounded-xl" data-testid="tab-repos">
                  Repos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="mt-5 space-y-4" data-testid="tab-content-insights">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg">Strengths</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          What’s already working in your portfolio.
                        </p>
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/12 ring-1 ring-emerald-500/20">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2" data-testid="strengths-list">
                      {(analysis.strengths as any[])?.length ? (
                        (analysis.strengths as any[]).slice(0, 10).map((s, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-sm text-foreground"
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                              <span className="leading-relaxed">{String(s)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No strengths were detected. That’s unusual—try re-running analysis later.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg">Red flags</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Quick fixes that improve recruiter trust.
                        </p>
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-500/12 ring-1 ring-rose-500/20">
                        <Flag className="h-5 w-5 text-rose-400" />
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2" data-testid="redflags-list">
                      {(analysis.redFlags as any[])?.length ? (
                        (analysis.redFlags as any[]).slice(0, 10).map((s, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-sm text-foreground"
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-rose-400" />
                              <span className="leading-relaxed">{String(s)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
                          No red flags detected. Nice—keep consistency and clarity.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg">Key facts</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        A few computed signals used to inform the scoring.
                      </p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/12 ring-1 ring-primary/20">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="key-facts">
                    {[
                      { k: "Repos", v: analysis.repoCount },
                      { k: "Pinned", v: analysis.pinnedCount },
                      { k: "Recent commit days", v: analysis.recentCommitDays },
                      { k: "Languages tracked", v: languageData.length },
                    ].map((x) => (
                      <div
                        key={x.k}
                        className="rounded-2xl border border-card-border/70 bg-background/30 p-4"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {x.k}
                        </div>
                        <div className="mt-2 font-display text-2xl text-foreground">
                          <span className="font-mono">{x.v}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="mt-5 space-y-4" data-testid="tab-content-suggestions">
                <div className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg">Action plan</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Concrete steps you can apply across the next 30–60 minutes.
                      </p>
                    </div>
                    <div className="hidden rounded-2xl bg-background/60 px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/60 sm:block">
                      Aim for clarity + scannability
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <Accordion type="multiple" className="w-full" data-testid="suggestions-accordion">
                    {(analysis.suggestions as any[])?.length ? (
                      (analysis.suggestions as any[]).slice(0, 12).map((s, i) => (
                        <AccordionItem
                          key={i}
                          value={`s-${i}`}
                          className="rounded-2xl border border-card-border/70 bg-background/30 px-4 mb-2"
                        >
                          <AccordionTrigger className="text-left" data-testid={`suggestion-${i}`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20">
                                <span className="font-mono text-xs text-primary">
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-foreground">
                                {String(s).split(".")[0] || `Suggestion ${i + 1}`}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
                            {String(s)}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge variant="secondary" className="rounded-full">
                                do-now
                              </Badge>
                              <Badge variant="outline" className="rounded-full">
                                recruiter-signal
                              </Badge>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No suggestions were generated. Try re-running analysis later.
                      </div>
                    )}
                  </Accordion>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">
                      Pro move: update pinned repos + README headers first.
                    </div>
                    <Link
                      href="/"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                      data-testid="suggestions-run-new"
                    >
                      Run another analysis
                    </Link>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="repos" className="mt-5 space-y-4" data-testid="tab-content-repos">
                {reposLoading ? (
                  <div className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur">
                    <div className="skeleton-shimmer h-4 w-1/3 rounded-full" />
                    <div className="mt-5 space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="skeleton-shimmer h-10 w-full rounded-2xl opacity-80" />
                      ))}
                    </div>
                  </div>
                ) : reposError ? (
                  <div
                    className="rounded-3xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive"
                    data-testid="repos-error"
                  >
                    {(reposError as any)?.message || "Failed to load repos."}{" "}
                    <button
                      className="ml-2 underline"
                      onClick={() => refetchRepos()}
                      data-testid="repos-error-retry"
                    >
                      Retry
                    </button>
                  </div>
                ) : !reposRaw ? (
                  <EmptyState
                    icon={<AlertTriangle className="h-6 w-6 text-primary" />}
                    title="Repo snapshots not found"
                    description="This report doesn’t have repo drill-down data."
                    data-testid="repos-not-found"
                  />
                ) : (
                  <RepoTable reposRaw={reposRaw} data-testid="repo-table" />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
}
