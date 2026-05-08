import { Card, CardContent } from "../card";

interface StatCardProps {
  value: string | number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="animate-count-up font-mono text-2xl font-medium tracking-tight text-gold-400 sm:text-3xl">
          {value}
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-widest text-surface-500 sm:text-sm">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
