# Flag Data

The shared package contains metadata for 196 country flags in `packages/shared/src/flags.ts`.

## Structure

Each flag entry includes:

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | 2-letter ISO 3166-1 alpha-2 country code (lowercase) |
| `name` | string | Country name in English |
| `colors` | string[] | Dominant colors in the flag |
| `patterns` | string[] | Visual patterns (e.g., "stripes", "cross", "triangle") |
| `symbols` | string[] | Symbols on the flag (e.g., "star", "crescent", "eagle") |
| `continent` | Continent | One of 6 continents |

## Continents

The `Continent` enum defines:

- `AFRICA`
- `ASIA`
- `EUROPE`
- `NORTH_AMERICA`
- `SOUTH_AMERICA`
- `OCEANIA`

## Usage

Flag data is used by both client and server:

- **Client**: Renders flag images from `/flags/{code}.png`, displays country names, and groups flags by continent for analytics.
- **Server**: No direct use of flag images, but the flag codes are used as foreign keys in attempt and progress tables.
- **Confusion map**: The `colors`, `patterns`, and `symbols` fields are used to find visually similar flags for multiple-choice decoy selection (see [Confusion Map](confusion-map.md)).

## Flag Images

Flag images are stored as PNG files in `packages/client/public/flags/` and named by their 2-letter country code (e.g., `gb.png`, `us.png`).
