import { type ReactNode } from "react";
import { Flag, BarChart3, PenLine, Play } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; to: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="mb-6 rounded-2xl bg-surface-800/40 p-5 text-surface-500">
        {icon}
      </div>
      <h3 className="mb-2 font-display text-xl italic text-surface-300">{title}</h3>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-surface-500">
        {description}
      </p>
      {action && (
        <Link to={action.to}>
          <Button variant="outline" size="lg">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}

export function NoSessionsEmpty() {
  return (
    <EmptyState
      icon={<Play className="h-14 w-14" />}
      title="No sessions yet"
      description="Start your first session to begin learning flags from around the world."
      action={{ label: "Start a Session", to: "/" }}
    />
  );
}

export function NoAttemptsEmpty() {
  return (
    <EmptyState
      icon={<Flag className="h-14 w-14" />}
      title="No attempts yet"
      description="Play some rounds to see your progress here."
      action={{ label: "Start Playing", to: "/" }}
    />
  );
}

export function NoMnemonicsEmpty() {
  return (
    <EmptyState
      icon={<PenLine className="h-14 w-14" />}
      title="No mnemonics yet"
      description="Add memory aids during gameplay or use the Mnemonic Workshop."
      action={{ label: "Open Workshop", to: "/mnemonics" }}
    />
  );
}

export function NoAnalyticsEmpty() {
  return (
    <EmptyState
      icon={<BarChart3 className="h-14 w-14" />}
      title="No data yet"
      description="Play some sessions to see analytics and charts here."
      action={{ label: "Start a Session", to: "/" }}
    />
  );
}
