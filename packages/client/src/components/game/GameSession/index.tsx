import { Mode, ExitCondition, flagByCode } from "@flag-quiz/shared";
import { ClassicRound } from "../ClassicRound";
import { PickFlagRound } from "../PickFlagRound";
import { PickCountryRound } from "../PickCountryRound";
import { ResultScreen } from "../ResultScreen";
import { QuickFlash } from "../QuickFlash";
import { QuickWrongScreen } from "../QuickWrongScreen";
import { SpeedTimer } from "../SpeedTimer";
import { Button } from "../../ui/button";
import { Spinner } from "../../ui/spinner";
import { useGameSession } from "./useGameSession";

interface GameSessionProps {
  mode: string;
  exitCondition: string;
  quick?: boolean;
  resumeSession?: import("../../../lib/active-session").ActiveSession | null;
}

export function GameSession({ mode, exitCondition, quick = false, resumeSession }: GameSessionProps) {
  const {
    loading,
    error,
    currentFlag,
    currentIndex,
    currentOptions,
    phase,
    attempt,
    attemptCount,
    correctCount,
    speedTimedOut,
    speedTimeoutMs,
    queue,
    progressMap,
    handleClassicAnswer,
    handlePickAnswer,
    handleSpeedTimeout,
    handleRate,
    handleAccidental,
    handleQuickCorrectDone,
    handleQuickWrongNext,
    endSession,
    navigate,
    getTagNames,
  } = useGameSession({ mode, exitCondition, quick, resumeSession });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <span className="text-sm text-surface-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="rounded-xl bg-red-500/10 px-6 py-3 text-red-400 border border-red-500/20">
          {error}
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  if (!currentFlag) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="text-lg text-surface-400">No flags to review!</div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  const progressPct = queue.length > 0 ? ((attemptCount) / queue.length) * 100 : 0;

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center animate-fade-in">
      {/* Fixed top bar: progress + stats */}
      <div className="w-full max-w-lg space-y-2 pb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-surface-400">
            <span className="font-mono text-white">{attemptCount + 1}</span>
            <span className="text-surface-600"> / {queue.length}</span>
          </span>
          <span className="font-medium text-surface-400">
            <span className="font-mono text-emerald-400">{correctCount}</span>
            <span className="text-surface-600">/{attemptCount} correct</span>
          </span>
          <Button variant="ghost" size="sm" onClick={endSession} className="text-surface-500 hover:text-red-400">
            End
          </Button>
        </div>
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-surface-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 progress-bar-shimmer"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Centered game area */}
      <div className="flex flex-1 flex-col items-center justify-center w-full">

      {/* Speed mode timer */}
      {exitCondition === ExitCondition.SPEED && phase === "prompt" && speedTimeoutMs > 0 && (
        <div className="mb-6 w-full max-w-sm">
          <SpeedTimer
            key={currentIndex}
            timeoutMs={speedTimeoutMs}
            onTimeout={handleSpeedTimeout}
            paused={phase !== "prompt"}
          />
        </div>
      )}

      {phase === "prompt" && mode === Mode.CLASSIC && (
        <ClassicRound flagCode={currentFlag} onAnswer={handleClassicAnswer} />
      )}

      {phase === "prompt" && mode === Mode.PICK_THE_FLAG && currentOptions && (
        <PickFlagRound
          countryName={flagByCode.get(currentFlag)?.name ?? currentFlag}
          options={currentOptions}
          onAnswer={handlePickAnswer}
        />
      )}

      {phase === "prompt" && mode === Mode.PICK_THE_COUNTRY && currentOptions && (
        <PickCountryRound
          flagCode={currentFlag}
          options={currentOptions}
          onAnswer={handlePickAnswer}
        />
      )}

      {phase === "quick-flash" && attempt && (
        <QuickFlash
          flagCode={attempt.flagCode}
          correct={attempt.correct}
          onDone={handleQuickCorrectDone}
        />
      )}

      {phase === "quick-wrong" && attempt && (
        <QuickWrongScreen
          flagCode={attempt.flagCode}
          guess={attempt.guess}
          forgotten={attempt.forgotten}
          mnemonic={progressMap.get(attempt.flagCode)?.mnemonic || ""}
          onNext={handleQuickWrongNext}
          tagNames={getTagNames(attempt.flagCode)}
        />
      )}

      {phase === "result" && attempt && (
        <div className="animate-fade-in">
          {speedTimedOut && (
            <div className="mb-4 text-center">
              <span className="inline-block rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-400">
                Too slow! Time's up.
              </span>
            </div>
          )}
          <ResultScreen
            flagCode={attempt.flagCode}
            correct={attempt.correct}
            guess={attempt.guess}
            forgotten={attempt.forgotten}
            mnemonic={progressMap.get(attempt.flagCode)?.mnemonic || ""}
            schedulingChoices={attempt.schedulingChoices}
            onRate={handleRate}
            onAccidental={handleAccidental}
            tagNames={getTagNames(attempt.flagCode)}
          />
          <div className="mt-4 text-center text-xs font-medium text-surface-600">
            Press 1-4 to rate{!attempt.correct ? ", 0 for accidental" : ""}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
