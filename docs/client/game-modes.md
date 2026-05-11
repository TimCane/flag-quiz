# Game Modes

Flag Quiz offers three game modes, each testing flag recognition in a different way. Mode labels adapt to the active collection (e.g., "Pick the State" for US States).

## Classic

- A flag is displayed and the user types the item name in a free-text input.
- The user can also mark a flag as "forgotten" to skip it.
- Attempts are stored in the `classic_attempts` table with both the flag and the user's guess.

## Pick the Flag

- An item name is shown and the user selects the correct flag from a set of multiple-choice options.
- Options include historically confused flags and visually similar flags as decoys (see [Confusion Map](../shared/confusion-map.md)).
- The number of options is configurable via settings (min/max option count).
- Attempts are stored in `pick_flag_attempts` with the selected option and all available options.

## Pick the Item

- A flag is shown and the user selects the correct item name from a set of multiple-choice options.
- Decoy selection uses the same confusion-aware algorithm as Pick the Flag.
- Attempts are stored in `pick_item_attempts`.

## Quick Mode

Any of the three modes can be played with Quick mode enabled. Quick mode:

- Adds time pressure with mode-specific timeouts (configurable in settings).
- Tracks reaction time for each attempt.
- Auto-rates responses based on reaction time percentiles for FSRS scheduling.

## Exit Conditions

Each session is configured with an exit condition that determines when it ends:

| Condition | Behavior |
|-----------|----------|
| **Normal** | User manually ends the session |
| **Streak** | Session ends after a streak of correct answers |
| **Speed** | Session ends after a speed-based condition is met |
| **Due** | Only flags due for review |

## Session Lifecycle

1. User selects mode, exit condition, and quick toggle on the Home page.
2. A session record is created via `POST /api/:collection/sessions`.
3. Flags are selected for each round using FSRS scheduling (due flags first, then new flags).
4. After each attempt, the result is saved and FSRS state is updated.
5. The session is ended by setting the `ended` timestamp via `PUT /api/:collection/sessions/:id`.
6. The user is redirected to the Summary page.
