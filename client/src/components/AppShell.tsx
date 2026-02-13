import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Github,
  Moon,
  Sun,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("gpae-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("gpae-theme", theme);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    setTheme,
  };
}

export function AppShell({ children }: PropsWithChildren) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  const nav = useMemo(
    () => [
      { href: "/", label: "Analyze", icon: Sparkles },
      { href: "/analyses", label: "History", icon: BarChart3 },
    ],
    [],
  );

  return (
    <div className="min-h-screen surface-grid">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-[35%] right-[-220px] h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/60"
              data-testid="nav-logo"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20 shadow-premium">
                <Github className="h-5 w-5 text-primary" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg text-foreground">
                  Portfolio Analyzer
                </div>
                <div className="text-xs text-muted-foreground">
                  Recruiter-ready GitHub insights
                </div>
              </div>
              <ArrowRight className="ml-1 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </Link>

            <div className="flex items-center gap-2">
              <nav className="hidden items-center gap-1 rounded-2xl border border-card-border/70 bg-card/60 p-1 shadow-premium backdrop-blur md:flex">
                {nav.map((item) => {
                  const active = location === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                        "hover:bg-muted/70 hover:text-foreground",
                        active
                          ? "bg-gradient-to-b from-foreground/5 to-foreground/0 text-foreground ring-1 ring-border"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <Button
                variant="outline"
                onClick={toggle}
                className="h-11 w-11 rounded-2xl border-card-border/70 bg-card/60 shadow-premium backdrop-blur hover:bg-card"
                data-testid="theme-toggle"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="md:hidden">
            <div className="flex gap-2 pb-3">
              {nav.map((item) => {
                const active = location === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex-1 rounded-2xl border px-3 py-3 text-sm font-medium transition-all",
                      active
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-card-border/70 bg-card/60 text-muted-foreground hover:bg-card",
                    )}
                    data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="animate-float-in">{children}</div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-card/60 px-3 py-1 ring-1 ring-border/60 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
              Clean minimal analytics • Dark mode
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="font-mono text-muted-foreground/90">
              MVP • GitHub Portfolio Analyzer & Enhancer
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
