import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

type Datum = { language: string; share: number };

const palette = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function TopLanguagesBar({
  data,
  "data-testid": testId,
}: {
  data: Datum[];
  "data-testid"?: string;
}) {
  const normalized = data
    .slice(0, 7)
    .map((d) => ({ ...d, pct: Math.round(d.share * 100) }));

  return (
    <div
      className="noise-overlay rounded-3xl border border-card-border/70 bg-card/60 p-6 shadow-premium backdrop-blur"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg">Top languages</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Share of code across analyzed repositories.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-background/60 px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/60 sm:block">
          Weighted by repo language signals
        </div>
      </div>

      <div className="mt-5 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalized} layout="vertical" margin={{ left: 12, right: 12 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="language"
              width={90}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: any) => [`${v}%`, "Share"]}
              contentStyle={{
                background: "hsl(var(--popover) / 0.9)",
                border: "1px solid hsl(var(--popover-border) / 0.9)",
                borderRadius: 14,
                boxShadow: "var(--shadow-sm)",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="pct" radius={[10, 10, 10, 10]}>
              {normalized.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} opacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
