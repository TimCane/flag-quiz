# Flag Data

The shared package defines multiple flag collections in `packages/shared/src/collections/`. Each collection contains flag metadata used for quizzing, analytics, and decoy selection.

## Collections

| Collection | ID | Items | Description |
|---|---|---|---|
| World Flags | `world` | 197 | Sovereign nation flags |
| US State Flags | `us-states` | 51 | 50 states + DC |
| UK Historic Counties | `uk-counties` | 39+ | Historic counties of England |

Collections are defined in `packages/shared/src/collections/` and exported from the index.

## Collection Structure

Each collection has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (used in URLs and DB) |
| `name` | string | Display name |
| `description` | string | Short description |
| `groupLabel` | string | Label for the grouping dimension (e.g., "Continent", "Region") |
| `itemLabel` | string | What each item is called (e.g., "country", "state", "county") |
| `groups` | GroupValue[] | Grouping values (e.g., continents, regions) |
| `flags` | Flag[] | Array of flag entries |

## Flag Structure

Each flag entry includes:

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Short identifier unique within the collection (lowercase) |
| `name` | string | Display name in English |
| `group` | string | Group ID within the collection |
| `colors` | string[] | Dominant colors in the flag |
| `patterns` | string[] | Visual patterns (e.g., "stripes", "cross", "triangle") |
| `symbols` | string[] | Symbols on the flag (e.g., "star", "crescent", "eagle") |
| `ext` | string | Image file extension ("png" or "svg") |

## Usage

Flag data is used by both client and server:

- **Client**: Renders flag images from `/flags/:collection/{code}.{ext}`, displays item names, and groups flags for analytics.
- **Server**: Flag codes are used as keys in attempt and progress tables, scoped by `collection_id`.
- **Confusion map**: The `colors`, `patterns`, and `symbols` fields are used to find visually similar flags for multiple-choice decoy selection (see [Confusion Map](confusion-map.md)).

## Flag Images

Flag images are stored in `packages/client/public/flags/:collection/` and named by their code and extension (e.g., `gb.png`, `ca.svg`).

## Helper Functions

| Function | Description |
|---|---|
| `getCollection(id)` | Get a collection by ID |
| `flagByCode(collectionId, code)` | Find a flag in a collection |
| `flagsForCollection(collectionId)` | Get all flags for a collection |
| `isKnownCollection(id)` | Check if a collection ID is valid |
