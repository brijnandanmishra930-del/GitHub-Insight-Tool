import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RateLimitBanner({
  message,
  onRetry,
  "data-testid": testId,
}: {
  message: string;
  onRetry: () => void;
  "data-testid"?: string;
}) {
  return (
    <div
      className="noise-overlay rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card/60 to-card/40 p-5 shadow-premium backdrop-blur"
      data-testid={testId}
      role="status"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              GitHub temporarily unavailable
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {message || "GitHub rate limit hit. Please wait a moment and retry."}
            </div>
          </div>
        </div>

        <Button
          onClick={onRetry}
          className="h-11 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 active:translate-y-0"
          data-testid="rate-limit-retry"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
