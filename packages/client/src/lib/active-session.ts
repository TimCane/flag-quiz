const KEY = "flag-quiz-active-session";

export interface ActiveSession {
  sessionId: string;
  mode: string;
  exitCondition: string;
  queue: string[];
  currentIndex: number;
  attemptCount: number;
  correctCount: number;
}

export function getActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveSession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearActiveSession(): void {
  localStorage.removeItem(KEY);
}
