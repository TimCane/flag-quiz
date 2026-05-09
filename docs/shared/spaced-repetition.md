# Spaced Repetition (FSRS)

Flag Quiz uses the [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) (Free Spaced Repetition System) algorithm to schedule flag reviews for optimal long-term retention.

## How It Works

FSRS is a modern spaced repetition algorithm that calculates when a flag should next be reviewed based on the user's performance history. It replaces older algorithms like SM-2 (used in Anki) with a more accurate model of human memory.

## States

Each flag is in one of four states:

| State | Value | Description |
|-------|-------|-------------|
| **New** | 0 | Never reviewed |
| **Learning** | 1 | Recently introduced, short review intervals |
| **Review** | 2 | In the regular review cycle with increasing intervals |
| **Relearning** | 3 | Previously known but forgotten, re-entering short intervals |

## Ratings

After each attempt, the system assigns (or the user selects) a rating:

| Rating | Value | Meaning |
|--------|-------|---------|
| **Again** | 1 | Forgot the answer |
| **Hard** | 2 | Remembered with difficulty |
| **Good** | 3 | Remembered correctly |
| **Easy** | 4 | Remembered instantly |

## Scheduling

The FSRS algorithm uses two key parameters per flag:

- **Stability**: How long the memory is expected to last (in days).
- **Difficulty**: How hard the flag is for this user (0-10 scale).

After each rating, FSRS recalculates stability and difficulty, then sets a `due` date for the next review. The scheduling aims for the configured **target retention** rate (default 90%).

## Configuration

Two FSRS parameters are exposed as user-configurable settings:

| Setting | Default | Description |
|---------|---------|-------------|
| Target Retention | 0.9 | Desired probability of recall at review time (0-1) |
| Maximum Interval | 365 | Longest allowed gap between reviews (days) |

## Implementation

Utilities in `packages/shared/src/fsrs.ts`:

- `createFsrs()`: Creates an FSRS scheduler instance with the configured parameters.
- `progressToCard()`: Converts a database `flag_progress` record into an FSRS Card object.
- `cardToProgress()`: Converts an FSRS Card back to a database record for storage.
- `getSchedulingChoices()`: Given a card and the current time, returns the four scheduling outcomes (Again/Hard/Good/Easy) so the client can preview what each rating means.

## Flag Selection

During a game session, flags are selected in priority order:

1. Flags with a `due` date in the past (overdue reviews).
2. New flags that haven't been seen yet.
3. Random selection from remaining flags.
