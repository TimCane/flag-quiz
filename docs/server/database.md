# Database

Flag Quiz uses SQLite via the `better-sqlite3` driver. The database file is created at `$DATA_DIR/journal.db` (defaults to `./data/journal.db`).

## Configuration

- **Journal mode**: WAL (Write-Ahead Logging) for concurrent read access during writes
- **Foreign keys**: Enabled

## Schema

All attempt and progress tables are scoped by `collection_id` to support multiple flag collections.

### sessions

Stores quiz session metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `collection_id` | TEXT | Collection identifier (e.g., "world", "us-states") |
| `mode` | TEXT | Game mode: CLASSIC, PICK_THE_FLAG, PICK_THE_ITEM |
| `exit_condition` | TEXT | NORMAL, STREAK, SPEED, or DUE |
| `quick` | INTEGER | Quick mode flag (0 or 1) |
| `started` | TEXT | ISO timestamp when session began |
| `ended` | TEXT | ISO timestamp when session ended (null if active) |
| `created_at` | TEXT | Auto-set to current datetime |

**Indexes**: `collection_id`, `started`, `created_at`

### classic_attempts

Free-form text input attempts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `collection_id` | TEXT | Collection identifier |
| `session_id` | TEXT (FK) | References sessions.id |
| `flag` | TEXT | Flag code within the collection |
| `guess` | TEXT | User's typed answer (null if skipped) |
| `correct` | INTEGER | 1 if correct, 0 if wrong |
| `forgotten` | INTEGER | 1 if user marked as forgotten |
| `confidence` | INTEGER | User's confidence rating (1-4) |
| `reaction_time_ms` | INTEGER | Time taken in milliseconds |
| `ts` | TEXT | ISO timestamp of the attempt |
| `created_at` | TEXT | Auto-set to current datetime |
| `accidental` | INTEGER | 1 if marked as accidental (excluded from analytics) |

**Indexes**: `collection_id`, `(collection_id, flag)`, `session_id`, `ts`, `created_at`

### pick_flag_attempts

Multiple-choice attempts where the user picks the correct flag.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `collection_id` | TEXT | Collection identifier |
| `session_id` | TEXT (FK) | References sessions.id |
| `flag` | TEXT | Correct flag code |
| `guess` | TEXT | User's chosen flag code |
| `options` | TEXT | JSON array of option codes |
| `correct` | INTEGER | 1 if correct, 0 if wrong |
| `confidence` | INTEGER | Confidence rating (1-4) |
| `reaction_time_ms` | INTEGER | Time taken in milliseconds |
| `ts` | TEXT | ISO timestamp |
| `created_at` | TEXT | Auto-set |
| `accidental` | INTEGER | 1 if marked as accidental |

**Indexes**: `collection_id`, `(collection_id, flag)`, `session_id`, `ts`, `created_at`

### pick_item_attempts

Multiple-choice attempts where the user picks the correct item name. Same structure as `pick_flag_attempts`.

### flag_progress

FSRS spaced repetition state per flag per collection.

| Column | Type | Description |
|--------|------|-------------|
| `collection_id` | TEXT (PK) | Collection identifier |
| `flag` | TEXT (PK) | Flag code within the collection |
| `mnemonic` | TEXT | User-written memory aid |
| `stability` | REAL | FSRS stability parameter |
| `difficulty` | REAL | FSRS difficulty parameter |
| `state` | INTEGER | 0=New, 1=Learning, 2=Review, 3=Relearning |
| `last_review` | TEXT | ISO timestamp of last review |
| `due` | TEXT | ISO timestamp when next review is due |
| `updated_at` | TEXT | Last update timestamp |

**Primary key**: `(collection_id, flag)`
**Indexes**: `(collection_id, state)`, `(collection_id, due)`

### settings

Key-value configuration store.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT (PK) | Setting identifier |
| `value` | TEXT | Setting value |
| `type` | TEXT | Data type hint (e.g., "number") |
| `label` | TEXT | Human-readable label |
| `category` | TEXT | Grouping category |

### tags

User-defined flag groupings per collection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `collection_id` | TEXT | Collection identifier |
| `name` | TEXT | Tag display name |
| `sort_order` | INTEGER | Display ordering |
| `description` | TEXT | Optional description |
| `type` | TEXT | "group" or "similar" |
| `updated_at` | TEXT | Last update timestamp |

### flag_tags

Junction table linking flags to tags.

| Column | Type | Description |
|--------|------|-------------|
| `collection_id` | TEXT (PK) | Collection identifier |
| `flag` | TEXT (PK) | Flag code |
| `tag_id` | TEXT (PK, FK) | References tags.id (CASCADE delete) |
| `updated_at` | TEXT | Last update timestamp |

## Initialization

On startup, the server:

1. Creates the `$DATA_DIR` directory if it doesn't exist
2. Opens (or creates) `journal.db`
3. Creates all tables and indexes if they don't exist
4. Runs schema migrations (adding columns like `quick`, `accidental`, `type`)
5. Runs the multi-collection migration (adds `collection_id`, rebuilds composite PKs)
6. Runs the country-to-item migration (renames `pick_country_attempts` → `pick_item_attempts`, updates mode values and settings keys)
7. Seeds default settings using `INSERT OR IGNORE`

## Migrations

Schema migrations are handled in `packages/server/src/db.ts`. Each migration is idempotent — it checks for the current state before applying changes using `PRAGMA table_info` or `sqlite_master` queries. Migrations run in this order:

1. `migrateSchema()` — Adds `quick`, `accidental`, `type` columns
2. `migrateToMultiCollection()` — Adds `collection_id` to all tables, rebuilds `flag_progress` and `flag_tags` with composite PKs
3. `migrateCountryToItem()` — Renames `pick_country_attempts` → `pick_item_attempts`, updates session mode values and settings keys
