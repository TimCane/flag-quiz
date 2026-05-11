const KEY = "flag-quiz-active-session";
const SCHEMA_VERSION = 2;

export interface ActiveSession {
  sessionId: string;
  mode: string;
  exitCondition: string;
  queue: string[];
  currentIndex: number;
  attemptCount: number;
  correctCount: number;
  collectionId: string;
}

interface StoredSession extends ActiveSession {
  _v: number;
}

export function getActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (parsed._v !== SCHEMA_VERSION || !parsed.sessionId || !parsed.collectionId) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed as ActiveSession;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveSession): void {
  const stored: StoredSession = { ...session, _v: SCHEMA_VERSION };
  localStorage.setItem(KEY, JSON.stringify(stored));
}

export function clearActiveSession(): void {
  localStorage.removeItem(KEY);
}
