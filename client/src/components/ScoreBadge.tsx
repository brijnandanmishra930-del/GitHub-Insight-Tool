import { cn } from "@/lib/utils";

function scoreToTone(score: number) {
  if (score >= 85) return "emerald";
  if (score >= 70) return "cyan";
  if (score >= 55) return "amber";
  return "rose";
}

export function ScoreBadge({
  label,
  score,
  subtitle,
  "data-testid": testId,
}: {
  label: string;
  score: number;
  subtitle?: string;
  "data-testid"?: string;
}) {
  const tone = scoreToTone(score);

  const toneClasses =
    tone === "emerald"
      ? "from-emerald-500/20 via-emerald-400/10 to-transparent ring-emerald-500/20 text-emerald-200"
      : tone === "cyan"
        ? "from-cyan-500/20 via-cyan-400/10 to-transparent ring-cyan-500/20 text-cyan-200"
        : tone === "amber"
          ? "from-amber-500/20 via-amber-400/10 to-transparent ring-amber-500/20 text-amber-200"
          : "from-rose-500/20 via-rose-400/10 to-transparent ring-rose-500/20 text-rose-200";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-card-border/70 bg-card/60 p-5 shadow-premium backdrop-blur",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium-md",
      )}
      data-testid={testId}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", toneClasses)} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground/90">
              {label}
            </div>
            {subtitle ? (
              <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          <div className="rounded-2xl bg-background/60 px-3 py-2 text-right ring-1 ring-border/60">
            <div className="font-display text-2xl leading-none text-foreground">
              {score}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              / 100
            </div>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background/60 ring-1 ring-border/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Needs work</span>
          <span>Excellent</span>
        </div>
      </div>
    </div>
  );
}
