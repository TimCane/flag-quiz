import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import type { ActivityDay } from "./useAnalytics";

export function Heatmap({ data }: { data: ActivityDay[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Practice Activity</CardTitle></CardHeader>
      <CardContent>
        <HeatmapGrid data={data} />
      </CardContent>
    </Card>
  );
}

function HeatmapGrid({ data }: { data: ActivityDay[] }) {
  if (data.length === 0) {
    return <div className="text-sm text-surface-500">No activity yet</div>;
  }

  const activityMap = new Map(data.map((d) => [d.day, d.count]));
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const today = new Date();
  const sortedDates = data.map((d) => d.day).sort();
  const startDate = sortedDates.length > 0 ? new Date(sortedDates[0]) : new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days: { date: string; count: number; dayOfWeek: number }[] = [];
  const current = new Date(startDate);
  while (current <= today) {
    const key = current.toISOString().slice(0, 10);
    days.push({
      date: key,
      count: activityMap.get(key) || 0,
      dayOfWeek: current.getDay(),
    });
    current.setDate(current.getDate() + 1);
  }

  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  function getColor(count: number): string {
    if (count === 0) return "#121620";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "#10b981";
    if (intensity > 0.5) return "#059669";
    if (intensity > 0.25) return "#047857";
    return "#065f46";
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} attempts`}
              className="h-3.5 w-3.5 rounded-sm transition-colors duration-200"
              style={{ backgroundColor: getColor(day.count) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
