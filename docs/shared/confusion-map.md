# Confusion Map

The confusion map system tracks which flags the user commonly mistakes for one another and uses this data to generate more challenging multiple-choice options.

## How It Works

1. **Data collection**: Every incorrect attempt across all game modes is recorded with both the correct flag and the user's wrong guess.

2. **Building the map**: The `buildConfusionMap()` function aggregates all wrong guesses into bidirectional pairs with frequency counts. If the user confuses flag A with flag B, and later confuses flag B with flag A, both contribute to the same confusion pair.

3. **Decoy selection**: When generating options for Pick the Flag or Pick the Country rounds, `pickOptions()` selects decoys in priority order:
   - **Historically confused flags**: Flags the user has previously mixed up with the target (highest priority).
   - **Visually similar flags**: Flags sharing colors, patterns, or symbols with the target.
   - **Random flags**: Fallback to fill remaining slots.

## Visual Similarity

Each flag in the dataset has metadata about its colors, patterns, and symbols. The similarity algorithm compares these attributes to find flags that look alike:

- **Colors**: Flags sharing dominant colors (e.g., red, white, blue).
- **Patterns**: Flags with similar layouts (e.g., horizontal stripes, crosses).
- **Symbols**: Flags featuring the same emblems (e.g., stars, crescents).

## Analytics Integration

Confusion data powers several analytics features:

- **Confused Pairs Table**: Shows the top 50 most confused pairs globally.
- **Flag Detail Confusions**: Shows which flags a specific flag is confused with via `GET /api/stats/confusions/:flag`.
