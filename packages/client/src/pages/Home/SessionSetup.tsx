import { Mode, ExitCondition } from "@flag-quiz/shared";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Toggle } from "../../components/ui/toggle";
import { MODE_LABELS, MODE_DESCRIPTIONS, EXIT_LABELS, EXIT_DESCRIPTIONS } from "../../lib/labels";

interface SessionSetupProps {
  mode: string;
  setMode: (m: string) => void;
  exitCondition: string;
  setExitCondition: (ec: string) => void;
  quick: boolean;
  setQuick: (q: boolean) => void;
  onStart: () => void;
}

export function SessionSetup({
  mode,
  setMode,
  exitCondition,
  setExitCondition,
  quick,
  setQuick,
  onStart,
}: SessionSetupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2.5">
          <label className="text-sm font-semibold uppercase tracking-widest text-surface-500">Mode</label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {Object.values(Mode).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                  mode === m
                    ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-900/10"
                    : "border-surface-700/60 hover:border-surface-600 hover:bg-surface-800/30 hover:shadow-md"
                }`}
              >
                <div className="font-semibold text-surface-300">{MODE_LABELS[m]}</div>
                <div className="mt-0.5 text-sm text-surface-500">{MODE_DESCRIPTIONS[m]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-semibold uppercase tracking-widest text-surface-500">Exit Condition</label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {Object.values(ExitCondition).map((ec) => (
              <button
                key={ec}
                onClick={() => setExitCondition(ec)}
                className={`rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                  exitCondition === ec
                    ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-900/10"
                    : "border-surface-700/60 hover:border-surface-600 hover:bg-surface-800/30 hover:shadow-md"
                }`}
              >
                <div className="font-semibold text-surface-300">{EXIT_LABELS[ec]}</div>
                <div className="mt-0.5 text-sm text-surface-500">{EXIT_DESCRIPTIONS[ec]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-surface-700/60 p-4 transition-all duration-200 hover:bg-surface-800/20">
          <div>
            <div className="font-semibold text-surface-300">Quick Mode</div>
            <div className="mt-0.5 text-sm text-surface-500">Auto-rate based on response speed</div>
          </div>
          <Toggle checked={quick} onChange={setQuick} />
        </div>

        <Button onClick={onStart} size="xl" className="mt-2 w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 text-white shadow-xl shadow-emerald-900/40 hover:from-emerald-400 hover:via-emerald-500 hover:to-emerald-400 hover:shadow-2xl hover:shadow-emerald-800/30 hover:-translate-y-0.5 text-lg font-bold tracking-wide">
          Start Session
        </Button>
      </CardContent>
    </Card>
  );
}
