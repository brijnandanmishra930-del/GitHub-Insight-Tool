import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from "recharts";

type Datum = { metric: string; score: number };

export function ScoreRadar({
  data,
  "data-testid": testId,
}: {
  data: Datum[];
  "data-testid"?: string;
}) {
  return (
    <div
      className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg">Score shape</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick visual read on balance across dimensions.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-background/60 px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/60 sm:block">
          Tip: aim for a “full” polygon
        </div>
      </div>

      <div className="mt-5 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border) / 0.8)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover) / 0.9)",
                border: "1px solid hsl(var(--popover-border) / 0.9)",
                borderRadius: 14,
                boxShadow: "var(--shadow-sm)",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Radar
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.20)"
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
