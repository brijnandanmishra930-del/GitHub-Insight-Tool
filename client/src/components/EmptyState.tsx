import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  "data-testid": testId,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  "data-testid"?: string;
}) {
  return (
    <div
      className={cn(
        "noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-8 shadow-premium backdrop-blur",
        "text-center",
      )}
      data-testid={testId}
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20">
        {icon}
      </div>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
