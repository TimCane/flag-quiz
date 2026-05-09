# API Reference

All API endpoints are prefixed with `/api`. Protected routes require a `Authorization: Bearer <token>` header.

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

All routes below require authentication.

### Sessions

#### Create Session

```
POST /api/sessions
```

**Body:**
```json
{
  "id": "uuid",
  "mode": "CLASSIC",
  "exit_condition": "NORMAL",
  "quick": 0,
  "started": "2025-01-01T00:00:00.000Z"
}
```

#### List Sessions

```
GET /api/sessions?page=1&limit=20
```

Returns paginated sessions with attempt counts and accuracy stats.

#### Get Session

```
GET /api/sessions/:id
```

Returns session details including all attempts across game modes.

#### End Session

```
PUT /api/sessions/:id
```

**Body:**
```json
{ "ended": "2025-01-01T00:30:00.000Z" }
```

### Attempts

#### Save Classic Attempt

```
POST /api/classic-attempts
```

**Body:**
```json
{
  "id": "uuid",
  "session_id": "session-uuid",
  "flag": "gb",
  "guess": "United Kingdom",
  "correct": 1,
  "forgotten": 0,
  "confidence": 3,
  "reaction_time_ms": 4500,
  "ts": "2025-01-01T00:01:00.000Z"
}
```

#### Save Pick-Flag Attempt

```
POST /api/pick-flag-attempts
```

**Body:**
```json
{
  "id": "uuid",
  "session_id": "session-uuid",
  "flag": "gb",
  "guess": "gb",
  "options": "[\"gb\",\"fr\",\"de\",\"it\"]",
  "correct": 1,
  "confidence": 3,
  "reaction_time_ms": 2100,
  "ts": "2025-01-01T00:01:00.000Z"
}
```

#### Save Pick-Country Attempt

```
POST /api/pick-country-attempts
```

Same structure as pick-flag attempts.

#### Get Wrong Guesses

```
GET /api/attempts/wrong-guesses
```

Returns all incorrect guesses across all modes. Used to build the confusion map for intelligent decoy selection.

#### Get Flag Attempts

```
GET /api/attempts/:flag
```

Returns all attempts for a specific flag across all three game modes.

### Flag Progress (Spaced Repetition)

#### Get All Progress

```
GET /api/flag-progress
```

Returns FSRS state for all flags that have been practiced.

#### Upsert Progress

```
POST /api/flag-progress
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

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Overall stats (total attempts, sessions, accuracy, FSRS breakdown) |
| `GET /api/stats/flags` | Per-flag stats (attempt count, accuracy, last seen) |
| `GET /api/stats/confusions/:flag` | Confusion pairs for a specific flag |
| `GET /api/stats/progress` | Daily progress over time |
| `GET /api/stats/continents` | Per-flag accuracy (client groups by continent) |
| `GET /api/stats/confused-pairs` | Top 50 most confused flag pairs |
| `GET /api/stats/confidence` | Confidence rating distribution |
| `GET /api/stats/activity` | Activity heatmap data (attempts per day) |
| `GET /api/stats/sparklines` | Per-flag attempt sequence (correct/wrong) |
| `GET /api/stats/hardest` | Hardest flags (lowest accuracy, min 3 attempts) |
| `GET /api/stats/comparison` | Before/after comparison (first 7 vs last 7 days) |
| `GET /api/stats/percentiles` | Reaction time percentiles (global, by mode, by flag) |

### Export

| Endpoint | Description |
|----------|-------------|
| `GET /api/export/json` | Full JSON dump of all tables |
| `GET /api/export/csv` | CSV export of all tables |
