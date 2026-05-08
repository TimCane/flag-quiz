import { useHome } from "./useHome";
import { StatCard } from "../../components/ui/stat-card";
import { ActiveSessionCard } from "./ActiveSessionCard";
import { SessionSetup } from "./SessionSetup";

export function Home() {
  const {
    mode,
    setMode,
    exitCondition,
    setExitCondition,
    quick,
    setQuick,
    stats,
    activeSession,
    handleStart,
    handleResume,
    handleEndSession,
  } = useHome();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 stagger-in">
        {stats && (
          <>
            <StatCard label="Mastered" value={stats.flags_mastered} />
            <StatCard label="Learning" value={stats.flags_learning} />
            <StatCard label="New" value={stats.flags_new} />
          </>
        )}
      </div>

      {activeSession && (
        <ActiveSessionCard
          session={activeSession}
          onResume={handleResume}
          onEnd={handleEndSession}
        />
      )}

      <SessionSetup
        mode={mode}
        setMode={setMode}
        exitCondition={exitCondition}
        setExitCondition={setExitCondition}
        quick={quick}
        setQuick={setQuick}
        onStart={handleStart}
      />
    </div>
  );
}
