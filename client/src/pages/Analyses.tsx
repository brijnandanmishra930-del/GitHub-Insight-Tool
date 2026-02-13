import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BarChart3, Filter, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useGithubAnalyses } from "@/hooks/use-github-analyses";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

function formatDate(d: any) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function Analyses() {
  const [limit, setLimit] = useState(20);
  const { data, isLoading, error, refetch, isFetching } = useGithubAnalyses(limit);

  const [q, setQ] = useState("");
  const [onlyPartial, setOnlyPartial] = useState<"all" | "partial" | "full">("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = data ?? [];
    return base.filter((a) => {
      const matchesQ =
        !query ||
        a.username.toLowerCase().includes(query) ||
        a.profileUrl.toLowerCase().includes(query);

      const matchesPartial =
        onlyPartial === "all" ? true : onlyPartial === "partial" ? a.isPartial : !a.isPartial;

      return matchesQ && matchesPartial;
    });
  }, [data, q, onlyPartial]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-card-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-premium backdrop-blur">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Analysis history
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl">All analyses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Search by username or URL, then open any report to review the breakdown, strengths,
              red flags, and repo drill-down.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search username or URL…"
                className="h-11 rounded-2xl pl-10"
                data-testid="analyses-search"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => refetch()}
              className="h-11 rounded-2xl border-card-border/70 bg-card/60 shadow-premium backdrop-blur hover:bg-card"
              data-testid="analyses-refresh"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </Button>

            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
              data-testid="analyses-new"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              New analysis
            </Link>
          </div>
        </div>

        <div className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-4 shadow-premium backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              Filters
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 rounded-2xl border-card-border/70 bg-background/30 hover:bg-background",
                    onlyPartial === "all" ? "ring-1 ring-primary/30" : "",
                  )}
                  onClick={() => setOnlyPartial("all")}
                  data-testid="filter-all"
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 rounded-2xl border-card-border/70 bg-background/30 hover:bg-background",
                    onlyPartial === "full" ? "ring-1 ring-primary/30" : "",
                  )}
                  onClick={() => setOnlyPartial("full")}
                  data-testid="filter-full"
                >
                  Full
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 rounded-2xl border-card-border/70 bg-background/30 hover:bg-background",
                    onlyPartial === "partial" ? "ring-1 ring-primary/30" : "",
                  )}
                  onClick={() => setOnlyPartial("partial")}
                  data-testid="filter-partial"
                >
                  Partial
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Limit</span>
                <div className="flex items-center gap-2">
                  {[10, 20, 50].map((n) => (
                    <Button
                      key={n}
                      variant="outline"
                      className={cn(
                        "h-10 rounded-2xl border-card-border/70 bg-background/30 hover:bg-background",
                        limit === n ? "ring-1 ring-primary/30" : "",
                      )}
                      onClick={() => setLimit(n)}
                      data-testid={`limit-${n}`}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-5 shadow-premium backdrop-blur"
              >
                <div className="skeleton-shimmer h-4 w-1/2 rounded-full" />
                <div className="mt-3 skeleton-shimmer h-3 w-3/4 rounded-full opacity-80" />
                <div className="mt-6 skeleton-shimmer h-2 w-full rounded-full opacity-70" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="rounded-3xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive"
            data-testid="analyses-error"
          >
            {(error as any)?.message || "Failed to load analyses."}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-6 w-6 text-primary" />}
            title="No analyses found"
            description="Try adjusting filters, or run a new analysis from the Analyze page."
            action={
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                data-testid="empty-new-analysis"
              >
                Run an analysis
              </Link>
            }
            data-testid="analyses-empty"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((a) => (
              <Link
                key={a.id}
                href={`/analysis/${a.id}`}
                className={cn(
                  "group noise-overlay block rounded-3xl border border-card-border/70 bg-card/60 p-5 shadow-premium backdrop-blur",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium-md hover:border-card-border",
                )}
                data-testid={`analysis-card-${a.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{a.username}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{a.profileUrl}</div>
                    <div className="mt-3 text-xs text-muted-foreground">{formatDate(a.createdAt)}</div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="font-display text-3xl leading-none text-foreground">
                      {a.scoreOverall}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      overall
                    </div>
                    {a.isPartial ? (
                      <div className="mt-2 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500 ring-1 ring-amber-500/20">
                        partial
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/70 ring-1 ring-border/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                    style={{ width: `${Math.max(0, Math.min(100, a.scoreOverall))}%` }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="font-mono">{a.repoCount} repos</div>
                  <div className="font-mono">{a.recentCommitDays}d since last push</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
