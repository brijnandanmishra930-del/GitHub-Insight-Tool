import { useMemo, useState } from "react";
import { ArrowUpDown, ExternalLink, Search, Star, GitFork, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { githubRepoSnapshotSchema } from "@shared/schema";

type Repo = z.infer<typeof githubRepoSnapshotSchema>;

function parseRepoLoose(x: unknown): Repo | null {
  const res = githubRepoSnapshotSchema.safeParse(x);
  if (!res.success) return null;
  return res.data;
}

type SortKey = "stars" | "forks" | "issues" | "readme" | "topics" | "name";

export function RepoTable({
  reposRaw,
  "data-testid": testId,
}: {
  reposRaw: unknown[];
  "data-testid"?: string;
}) {
  const repos = useMemo(() => reposRaw.map(parseRepoLoose).filter(Boolean) as Repo[], [reposRaw]);
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stars");
  const [desc, setDesc] = useState(true);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? repos.filter((r) => {
          return (
            r.name.toLowerCase().includes(query) ||
            r.fullName.toLowerCase().includes(query) ||
            (r.primaryLanguage ?? "").toLowerCase().includes(query) ||
            (r.description ?? "").toLowerCase().includes(query)
          );
        })
      : repos;

    const sorted = [...base].sort((a, b) => {
      const dir = desc ? -1 : 1;
      const av =
        sortKey === "stars"
          ? a.stars
          : sortKey === "forks"
            ? a.forks
            : sortKey === "issues"
              ? a.openIssues
              : sortKey === "readme"
                ? a.readmeLength
                : sortKey === "topics"
                  ? a.topicsCount
                  : a.name.localeCompare(b.name);
      const bv =
        sortKey === "stars"
          ? b.stars
          : sortKey === "forks"
            ? b.forks
            : sortKey === "issues"
              ? b.openIssues
              : sortKey === "readme"
                ? b.readmeLength
                : sortKey === "topics"
                  ? b.topicsCount
                  : b.name.localeCompare(a.name);

      if (typeof av === "string" && typeof bv === "string") return dir * av.localeCompare(bv);
      return dir * ((av as number) - (bv as number));
    });

    return sorted;
  }, [repos, q, sortKey, desc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(true);
    }
  };

  return (
    <div
      className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur"
      data-testid={testId}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg">Repository drill-down</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect key signals across repos (README, topics, license, activity).
          </p>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search repos, languages, descriptions…"
            className="h-11 rounded-2xl pl-10"
            data-testid="repo-search"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-card-border/70">
        <div className="max-h-[520px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur">
              <TableRow>
                <TableHead className="w-[280px]">
                  <button
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    data-testid="sort-name"
                  >
                    Repo <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("stars")}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    data-testid="sort-stars"
                  >
                    Stars <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <button
                    onClick={() => toggleSort("forks")}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    data-testid="sort-forks"
                  >
                    Forks <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    onClick={() => toggleSort("issues")}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    data-testid="sort-issues"
                  >
                    Issues <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Signals</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No repositories match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.fullName} className="hover:bg-muted/40">
                    <TableCell className="align-top">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20">
                          <span className="font-mono text-xs text-primary">
                            {r.primaryLanguage?.slice(0, 2)?.toUpperCase() || "GH"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{r.name}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {r.description || "No description provided."}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {r.primaryLanguage ? (
                              <Badge variant="secondary" className="rounded-full" data-testid={`repo-lang-${r.name}`}>
                                {r.primaryLanguage}
                              </Badge>
                            ) : null}
                            <Badge
                              variant={r.hasReadme ? "outline" : "destructive"}
                              className={cn("rounded-full", r.hasReadme ? "" : "bg-destructive/10 text-destructive border-destructive/20")}
                              data-testid={`repo-readme-${r.name}`}
                            >
                              {r.hasReadme ? `README ${r.readmeLength.toLocaleString()} chars` : "Missing README"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="inline-flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="font-mono">{r.stars}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <div className="inline-flex items-center gap-2 text-sm">
                        <GitFork className="h-4 w-4 text-primary" />
                        <span className="font-mono">{r.forks}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <div className="inline-flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{r.openIssues}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full",
                            r.hasLicense ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/10" : "border-border/60 text-muted-foreground",
                          )}
                          data-testid={`repo-license-${r.name}`}
                        >
                          {r.hasLicense ? "License" : "No license"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full",
                            r.hasTopics ? "border-primary/25 text-primary bg-primary/10" : "border-border/60 text-muted-foreground",
                          )}
                          data-testid={`repo-topics-${r.name}`}
                        >
                          {r.hasTopics ? `${r.topicsCount} topics` : "No topics"}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        className="h-9 rounded-xl border-card-border/70 bg-background/40 hover:bg-background"
                        onClick={() => window.open(r.url, "_blank", "noopener,noreferrer")}
                        data-testid={`repo-open-${r.name}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing <span className="font-mono text-foreground">{filtered.length}</span> of{" "}
          <span className="font-mono text-foreground">{repos.length}</span> repositories
        </div>
        <div className="font-mono">Sort: {sortKey} {desc ? "↓" : "↑"}</div>
      </div>
    </div>
  );
}
