# Database

Flag Quiz uses SQLite via the `better-sqlite3` driver. The database file is created at `$DATA_DIR/journal.db` (defaults to `./data/journal.db`).

## Configuration

- **Journal mode**: WAL (Write-Ahead Logging) for concurrent read access during writes
- **Foreign keys**: Enabled

## Schema

### sessions

Stores quiz session metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `mode` | TEXT | Game mode: CLASSIC, PICK_THE_FLAG, PICK_THE_COUNTRY |
| `exit_condition` | TEXT | NORMAL, STREAK, or SPEED |
| `quick` | INTEGER | Quick mode flag (0 or 1) |
| `started` | TEXT | ISO timestamp when session began |
| `ended` | TEXT | ISO timestamp when session ended (null if active) |
| `created_at` | TEXT | Auto-set to current datetime |

**Indexes**: `started`, `created_at`

### classic_attempts

Free-form text input attempts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `session_id` | TEXT (FK) | References sessions.id |
| `flag` | TEXT | 2-letter country code |
| `guess` | TEXT | User's typed answer (null if skipped) |
| `correct` | INTEGER | 1 if correct, 0 if wrong |
| `forgotten` | INTEGER | 1 if user marked as forgotten |
| `confidence` | INTEGER | User's confidence rating (1-4) |
| `reaction_time_ms` | INTEGER | Time taken in milliseconds |
| `ts` | TEXT | ISO timestamp of the attempt |
| `created_at` | TEXT | Auto-set to current datetime |

**Indexes**: `flag`, `session_id`, `ts`, `created_at`

### pick_flag_attempts

Multiple-choice attempts where the user picks the correct flag.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `session_id` | TEXT (FK) | References sessions.id |
| `flag` | TEXT | Correct flag code |
| `guess` | TEXT | User's chosen flag code |
| `options` | TEXT | JSON array of option codes |
| `correct` | INTEGER | 1 if correct, 0 if wrong |
| `confidence` | INTEGER | Confidence rating (1-4) |
| `reaction_time_ms` | INTEGER | Time taken in milliseconds |
| `ts` | TEXT | ISO timestamp |
| `created_at` | TEXT | Auto-set |

**Indexes**: `flag`, `session_id`, `ts`, `created_at`

### pick_country_attempts

Multiple-choice attempts where the user picks the correct country name. Same structure as `pick_flag_attempts`.

### flag_progress

FSRS spaced repetition state per flag.

| Column | Type | Description |
|--------|------|-------------|
| `flag` | TEXT (PK) | 2-letter country code |
| `mnemonic` | TEXT | User-written memory aid |
| `stability` | REAL | FSRS stability parameter |
| `difficulty` | REAL | FSRS difficulty parameter |
| `state` | INTEGER | 0=New, 1=Learning, 2=Review, 3=Relearning |
| `last_review` | TEXT | ISO timestamp of last review |
| `due` | TEXT | ISO timestamp when next review is due |
| `updated_at` | TEXT | Last update timestamp |

**Indexes**: `state`, `due`

### settings

Key-value configuration store.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT (PK) | Setting identifier |
| `value` | TEXT | Setting value |
| `type` | TEXT | Data type hint (e.g., "number") |
| `label` | TEXT | Human-readable label |
| `category` | TEXT | Grouping category |

## Initialization

On startup, the server:

1. Creates the `$DATA_DIR` directory if it doesn't exist
2. Opens (or creates) `journal.db`
3. Creates all tables and indexes if they don't exist
4. Runs schema migrations (e.g., adding the `quick` column)
5. Seeds default settings using `INSERT OR IGNORE`

## Migrations

Schema migrations are handled in `packages/server/src/db.ts` in the `migrateSchema()` function. Migrations check for missing columns using `PRAGMA table_info` and add them with `ALTER TABLE` as needed.
