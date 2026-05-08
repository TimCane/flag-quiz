import { flags, flagByCode, type Flag } from "./flags.js";

export interface ConfusionMap {
  /** Map from flag code to array of [confused_flag_code, count] sorted by count desc */
  confusions: Map<string, [string, number][]>;
}

interface WrongGuess {
  flag: string;
  guess: string;
}

/**
 * Build a bidirectional confusion map from historical wrong guesses.
 */
export function buildConfusionMap(wrongGuesses: WrongGuess[]): ConfusionMap {
  const counts = new Map<string, Map<string, number>>();

  for (const { flag, guess } of wrongGuesses) {
    if (!guess || flag === guess) continue;

    // Bidirectional
    increment(counts, flag, guess);
    increment(counts, guess, flag);
  }

  const confusions = new Map<string, [string, number][]>();
  for (const [flag, peers] of counts) {
    const sorted = [...peers.entries()].sort((a, b) => b[1] - a[1]);
    confusions.set(flag, sorted);
  }

  return { confusions };
}

function increment(
  map: Map<string, Map<string, number>>,
  a: string,
  b: string,
): void {
  let inner = map.get(a);
  if (!inner) {
    inner = new Map();
    map.set(a, inner);
  }
  inner.set(b, (inner.get(b) || 0) + 1);
}

/**
 * Pick decoy options for a Pick mode round.
 *
 * @param targetCode - The correct flag code
 * @param confusionMap - Built from historical wrong guesses
 * @param minOptions - Minimum total options (including correct)
 * @param maxOptions - Maximum total options (including correct)
 * @returns Array of flag codes (shuffled, includes the correct one)
 */
export function pickOptions(
  targetCode: string,
  confusionMap: ConfusionMap,
  minOptions: number,
  maxOptions: number,
): string[] {
  const target = flagByCode.get(targetCode);
  if (!target) return [targetCode];

  const confused = confusionMap.confusions.get(targetCode) || [];
  const decoyCount = Math.max(minOptions - 1, Math.min(confused.length, maxOptions - 1));

  const decoys: string[] = [];
  const used = new Set<string>([targetCode]);

  // 1. Add historically confused flags first
  for (const [code] of confused) {
    if (decoys.length >= decoyCount) break;
    if (used.has(code)) continue;
    used.add(code);
    decoys.push(code);
  }

  // 2. Pad with visually similar flags if needed
  if (decoys.length < minOptions - 1) {
    const similar = findSimilarFlags(target, used);
    for (const code of similar) {
      if (decoys.length >= minOptions - 1) break;
      used.add(code);
      decoys.push(code);
    }
  }

  // 3. Last resort: random flags
  if (decoys.length < minOptions - 1) {
    const remaining = flags.filter((f) => !used.has(f.code));
    for (const f of shuffleArray(remaining)) {
      if (decoys.length >= minOptions - 1) break;
      used.add(f.code);
      decoys.push(f.code);
    }
  }

  return shuffleArray([targetCode, ...decoys]);
}

/**
 * Score visual similarity between two flags based on shared attributes.
 */
function similarityScore(a: Flag, b: Flag): number {
  let score = 0;

  // Shared colors (weighted x2)
  for (const color of a.colors) {
    if (b.colors.includes(color)) score += 2;
  }

  // Shared patterns (weighted x2)
  for (const pattern of a.patterns) {
    if (b.patterns.includes(pattern)) score += 2;
  }

  // Shared symbols
  for (const symbol of a.symbols) {
    if (b.symbols.includes(symbol)) score += 1;
  }

  // Same continent
  if (a.continent === b.continent) score += 1;

  return score;
}

function findSimilarFlags(target: Flag, exclude: Set<string>): string[] {
  const scored = flags
    .filter((f) => !exclude.has(f.code))
    .map((f) => ({ code: f.code, score: similarityScore(target, f) + Math.random() * 0.5 }))
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.code);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
