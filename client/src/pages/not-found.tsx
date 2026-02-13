import { Link } from "wouter";
import { FileX, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="noise-overlay rounded-[28px] border border-card-border/70 bg-card/60 p-8 shadow-premium-md backdrop-blur">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20">
            <FileX className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-5 text-center text-3xl sm:text-4xl">Page not found</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
            That route doesn’t exist. Head back to analyze a GitHub profile or view past reports.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
              data-testid="notfound-home"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze a profile
            </Link>
            <Link
              href="/analyses"
              className="inline-flex items-center justify-center rounded-2xl border border-card-border/70 bg-card/60 px-5 py-3 font-semibold text-foreground shadow-premium backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-card"
              data-testid="notfound-analyses"
            >
              View history
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
