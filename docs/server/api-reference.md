# API Reference

All API endpoints are prefixed with `/api`. Protected routes require a `Authorization: Bearer <token>` header. Collection-scoped routes are prefixed with `/api/:collection` (e.g., `/api/world/sessions`).

## Public Routes

### Health Check

```
GET /api/health
```

Returns server health status.

### Authentication

```
POST /api/auth/check
```

**Body:**
```json
{ "password": "your-password" }
```

**Response (200):**
```json
{ "ok": true, "token": "..." }
```

**Response (401):**
```json
{ "ok": false, "error": "Invalid password" }
```

**Response (429):**
```json
{ "ok": false, "error": "Too many attempts" }
```

Rate limited to 10 attempts per 60-second window.

---

## Protected Routes

All routes below require authentication. Routes under `/:collection` are scoped to a specific flag collection (e.g., `world`, `us-states`, `uk-counties`).

### Sessions

#### Create Session

```
POST /api/:collection/sessions
```

**Body:**
```json
{
  "id": "uuid",
  "mode": "classic",
  "exit_condition": "normal",
  "quick": false,
  "started": "2025-01-01T00:00:00.000Z"
}
```

#### List Sessions

```
GET /api/:collection/sessions?limit=50&offset=0
```

Returns paginated sessions with attempt counts and accuracy stats.

#### Get Session

```
GET /api/:collection/sessions/:id
```

Returns session details including all attempts for the session's game mode.

#### End Session

```
PUT /api/:collection/sessions/:id
```

**Body:**
```json
{ "ended": "2025-01-01T00:30:00.000Z" }
```

### Attempts

#### Save Classic Attempt

```
POST /api/:collection/classic-attempts
```

**Body:**
```json
{
  "id": "uuid",
  "session_id": "session-uuid",
  "flag": "gb",
  "guess": "gb",
  "correct": true,
  "forgotten": false,
  "confidence": 3,
  "reaction_time_ms": 4500,
  "ts": "2025-01-01T00:01:00.000Z"
}
```

#### Save Pick-Flag Attempt

```
POST /api/:collection/pick-flag-attempts
```

**Body:**
```json
{
  "id": "uuid",
  "session_id": "session-uuid",
  "flag": "gb",
  "guess": "gb",
  "options": ["gb", "fr", "de", "it"],
  "correct": true,
  "confidence": 3,
  "reaction_time_ms": 2100,
  "ts": "2025-01-01T00:01:00.000Z"
}
```

#### Save Pick-Item Attempt

```
POST /api/:collection/pick-item-attempts
```

Same structure as pick-flag attempts.

#### Get Wrong Guesses

```
GET /api/:collection/attempts/wrong-guesses
```

Returns all incorrect guesses across all modes. Used to build the confusion map for intelligent decoy selection.

#### Get Flag Attempts

```
GET /api/:collection/attempts/:flag
```

Returns all attempts for a specific flag across all three game modes (`classic`, `pick_flag`, `pick_item`).

### Flag Progress (Spaced Repetition)

#### Get All Progress

```
GET /api/:collection/flag-progress
```

Returns FSRS state for all flags that have been practiced.

#### Upsert Progress

```
POST /api/:collection/flag-progress
```

**Body:**
```json
{
  "flag": "gb",
  "mnemonic": "Union Jack crosses",
  "stability": 4.93,
  "difficulty": 5.0,
  "state": 2,
  "last_review": "2025-01-01T00:00:00.000Z",
  "due": "2025-01-05T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### Settings

#### Get All Settings

```
GET /api/settings
```

Returns settings grouped by category.

#### Update Setting

```
PUT /api/settings/:key
```

**Body:**
```json
{ "value": "5000" }
```

### Statistics

All stats endpoints are collection-scoped.

| Endpoint | Description |
|----------|-------------|
| `GET /api/:collection/stats` | Overall stats (total attempts, sessions, accuracy, FSRS breakdown) |
| `GET /api/:collection/stats/flags` | Per-flag stats (attempt count, accuracy, last seen) |
| `GET /api/:collection/stats/confusions/:flag` | Confusion pairs for a specific flag |
| `GET /api/:collection/stats/progress` | Daily progress over time |
| `GET /api/:collection/stats/groups` | Per-flag accuracy (client groups by collection group) |
| `GET /api/:collection/stats/confused-pairs` | Top 50 most confused flag pairs |
| `GET /api/:collection/stats/confidence` | Confidence rating distribution |
| `GET /api/:collection/stats/activity` | Activity heatmap data (attempts per day) |
| `GET /api/:collection/stats/sparklines` | Per-flag attempt sequence (correct/wrong) |
| `GET /api/:collection/stats/hardest` | Hardest flags (lowest accuracy, min 3 attempts) |
| `GET /api/:collection/stats/comparison` | Before/after comparison (first 7 vs last 7 days) |
| `GET /api/:collection/stats/percentiles` | Reaction time percentiles (global, by mode, by flag) |
| `GET /api/:collection/stats/reaction-times` | Average reaction time per flag |

### Tags

| Endpoint | Description |
|----------|-------------|
| `GET /api/:collection/tags` | List all tags for the collection |
| `POST /api/:collection/tags` | Create a new tag |
| `PUT /api/:collection/tags/:id` | Update a tag |
| `DELETE /api/:collection/tags/:id` | Delete a tag |
| `GET /api/:collection/flag-tags` | List all flag-tag assignments |
| `PUT /api/:collection/flag-tags` | Bulk update flag-tag assignments |

### Export

| Endpoint | Description |
|----------|-------------|
| `GET /api/:collection/export/json` | Full JSON dump of collection-scoped tables + settings |
| `GET /api/:collection/export/csv` | CSV export of collection-scoped tables + settings |
