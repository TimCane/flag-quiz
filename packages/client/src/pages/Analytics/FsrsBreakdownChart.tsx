import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { PIE_COLORS, CHART_TOOLTIP_STYLE } from "../../lib/labels";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";

interface StateEntry {
  name: string;
  value: number;
}

export function FsrsBreakdownChart({ data }: { data: StateEntry[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>FSRS State Breakdown</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <ResponsiveContainer width="100%" height={200} className="sm:max-w-[50%]">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 sm:flex-col sm:gap-2.5">
            {data.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2.5 text-sm">
                <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-surface-400">{s.name}</span>
                <span className="font-bold text-surface-300">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
