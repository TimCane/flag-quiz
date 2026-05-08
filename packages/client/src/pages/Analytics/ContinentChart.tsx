import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { CHART_TOOLTIP_STYLE } from "../../lib/labels";

interface ContinentDatum {
  continent: string;
  accuracy: number;
  count: number;
}

export function ContinentChart({ data }: { data: ContinentDatum[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Accuracy by Continent</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
            <XAxis dataKey="continent" stroke="#5a6178" tick={{ fontSize: 12 }} />
            <YAxis stroke="#5a6178" tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [`${value}%`, "Accuracy"]}
            />
            <Bar dataKey="accuracy" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
