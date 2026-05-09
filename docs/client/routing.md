# Client Routing

The client uses React Router v7 with a single `BrowserRouter`. All routes except `/login` are wrapped in a `ProtectedRoute` component that redirects unauthenticated users.

## Route Map

| Path | Page Component | Description |
|------|---------------|-------------|
| `/login` | `Login` | Password entry screen |
| `/` | `Home` | Session setup (mode, exit condition, quick toggle) |
| `/play` | `Play` | Active game session |
| `/summary/:sessionId` | `Summary` | Post-session recap with stats |
| `/history` | `HistoryList` | All flags with per-flag stats |
| `/history/:flag` | `FlagDetail` | Single flag detail (attempts, confusions, FSRS state) |
| `/sessions` | `SessionsList` | Paginated list of all sessions |
| `/sessions/:id` | `SessionDetail` | Single session with all attempts |
| `/mnemonics` | `MnemonicWorkshop` | Create and edit flag mnemonics |
| `/analytics` | `Analytics` | Charts and statistics dashboard |
| `/settings` | `SettingsPage` | App configuration |

## Layout

All protected routes render inside the `Layout` component, which provides a navigation sidebar and an `<Outlet />` for page content. The layout uses React Router's nested route structure.

## Authentication Guard

The `ProtectedRoute` component checks `localStorage` for a stored token. If no token is found, it renders a `<Navigate to="/login" replace />` redirect. This is a client-side check only; the server independently validates tokens on every API request.
