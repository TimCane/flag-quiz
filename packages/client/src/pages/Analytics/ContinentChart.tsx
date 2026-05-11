import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { CHART_TOOLTIP_STYLE, groupColors } from "../../lib/labels";
import { useActiveCollection } from "../../lib/collection-context";

interface GroupDatum {
  group: string;
  accuracy: number;
  count: number;
}

export function GroupAccuracyChart({ data, label }: { data: GroupDatum[]; label: string }) {
  const { collection } = useActiveCollection();
  const colors = groupColors(collection);
  return (
    <Card>
      <CardHeader><CardTitle>Accuracy by {label}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
            <XAxis dataKey="group" stroke="#5a6178" tick={{ fontSize: 12 }} />
            <YAxis stroke="#5a6178" tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [`${value}%`, "Accuracy"]}
            />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.group} fill={colors[d.group] || "#10b981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
