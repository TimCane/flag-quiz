# Schemas

The shared package defines Zod schemas for runtime validation of data exchanged between client and server. These are defined in `packages/shared/src/schemas/`.

## Session Schema

Validates quiz session records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | UUID |
| `mode` | Mode enum | Yes | CLASSIC, PICK_THE_FLAG, or PICK_THE_ITEM |
| `exit_condition` | ExitCondition enum | Yes | NORMAL, STREAK, SPEED, or DUE |
| `quick` | boolean | Yes | Quick mode flag |
| `started` | string | Yes | ISO timestamp |
| `ended` | string | No | ISO timestamp |

## Attempt Schemas

Three schemas cover the different game modes:

### ClassicAttemptSchema

Adds a `guess` (nullable string for skipped attempts), `forgotten` (boolean), and `accidental` (boolean) fields to the base attempt fields.

### PickFlagAttemptSchema / PickItemAttemptSchema

Adds `guess` (selected option code), `options` (array of flag codes), and `accidental` (boolean) fields.

### Common Attempt Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `session_id` | string | FK to sessions |
| `flag` | string | Correct flag code |
| `correct` | boolean | Whether the answer was correct |
| `confidence` | number | 1-4 rating |
| `reaction_time_ms` | number | Response time |
| `ts` | string | ISO timestamp |

## FlagProgressSchema

Validates FSRS spaced repetition state.

| Field | Type | Description |
|-------|------|-------------|
| `flag` | string | Flag code (part of composite PK with collection_id) |
| `mnemonic` | string | User memory aid |
| `stability` | number (nullable) | FSRS stability |
| `difficulty` | number (nullable) | FSRS difficulty |
| `state` | number | FSRS state (0-3) |
| `last_review` | string (nullable) | Last review timestamp |
| `due` | string (nullable) | Next due timestamp |
| `updated_at` | string | Last update |

## SettingSchema

Validates configuration key-value pairs.

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Setting identifier |
| `value` | string | Setting value |
| `type` | string | Data type hint |
| `label` | string | Display label |
| `category` | string | Grouping category |

## Enums

| Enum | Values |
|------|--------|
| `Mode` | CLASSIC, PICK_THE_FLAG, PICK_THE_ITEM |
| `ExitCondition` | NORMAL, STREAK, SPEED, DUE |
| `FsrsState` | NEW (0), LEARNING (1), REVIEW (2), RELEARNING (3) |
| `Rating` | AGAIN (1), HARD (2), GOOD (3), EASY (4) |

## Collection Types

| Type | Description |
|------|-------------|
| `Collection` | Defines a flag collection with `id`, `name`, `description`, `groupLabel`, `itemLabel`, `groups`, and `flags` |
| `Flag` | Individual flag with `code`, `name`, `group`, `colors`, `patterns`, `symbols`, `ext` |
| `GroupValue` | Group definition with `id` and `name` |
