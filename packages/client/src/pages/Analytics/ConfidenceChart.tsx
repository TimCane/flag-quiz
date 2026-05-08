import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { RATING_LABELS, CONFIDENCE_COLORS, CHART_TOOLTIP_STYLE } from "../../lib/labels";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import type { ConfidenceDist } from "./useAnalytics";

export function ConfidenceChart({ data }: { data: ConfidenceDist[] }) {
  const chartData = data.map((d) => ({ ...d, name: RATING_LABELS[d.confidence] || String(d.confidence) }));

  return (
    <Card>
      <CardHeader><CardTitle>Confidence Distribution</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
            <XAxis dataKey="name" stroke="#5a6178" tick={{ fontSize: 12 }} />
            <YAxis stroke="#5a6178" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.confidence} fill={CONFIDENCE_COLORS[d.confidence] || "#5a6178"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
