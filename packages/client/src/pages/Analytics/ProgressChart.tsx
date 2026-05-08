import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { CHART_TOOLTIP_STYLE } from "../../lib/labels";
import type { ProgressDay } from "./useAnalytics";

export function ProgressChart({ data }: { data: ProgressDay[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Progress Over Time</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
            <XAxis dataKey="day" stroke="#5a6178" tick={{ fontSize: 12 }} />
            <YAxis stroke="#5a6178" tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={{ color: "#9ca3af" }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#10b981" }}
              activeDot={{ r: 5, fill: "#10b981", stroke: "#064e3b", strokeWidth: 2 }}
              name="Accuracy %"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
