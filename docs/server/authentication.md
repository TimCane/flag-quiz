# Authentication

Flag Quiz uses a single shared password for authentication, designed for personal or small-group use.

## Flow

1. User submits password to `POST /api/auth/check`.
2. Server compares the submitted password against the `APP_PASSWORD` environment variable.
3. On success, the server returns the password as the token.
4. The client stores the token in `localStorage` under the key `flag-quiz-token`.
5. All subsequent API requests include the token in the `Authorization: Bearer <token>` header.
6. The `requireAuth` middleware validates the token on every protected route.
7. On a 401 response, the client clears the token and redirects to `/login`.

## Rate Limiting

The login endpoint is rate-limited to **10 attempts per 60-second window**. The rate limiter is in-memory and resets on server restart.

## Middleware

The `requireAuth` middleware (`packages/server/src/middleware/auth.ts`) checks:

1. The `Authorization` header exists and starts with `Bearer `.
2. The token matches the `APP_PASSWORD` environment variable.

If either check fails, the request is rejected with a 401 status.

## Security Notes

- The `APP_PASSWORD` environment variable must be set for authentication to work. If unset, all login attempts are rejected.
- There is no user management, sessions, or token rotation. The token is the password itself.
- CORS is enabled for all origins (`*`), appropriate for a personal-use app.
