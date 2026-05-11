---
name: frontend-developer
description: Review and fix React TSX files that violate the codebase's hook/component separation pattern. Use this skill when the user asks to review component structure, refactor components, or enforce the logic/presentation split.
---

This skill enforces the codebase's strict separation between logic and presentation in React components. Every component with stateful logic should follow the **hook + component** pattern: a `useX.ts` hook file owns state, effects, API calls, and derived data; the `index.tsx` file is a pure rendering function that destructures the hook's return value and produces JSX.

The user points you at TSX files (changed files, a directory, or the whole client). You audit each one against the pattern rules below, then either report violations or fix them — depending on what the user asked for.

## The Pattern

This codebase uses a consistent structure for all React components:

```
ComponentName/
  index.tsx          — Pure presentation: props in, JSX out
  useComponentName.ts — All logic: state, effects, refs, callbacks, derived data
```

### What belongs in the hook (`useX.ts`)

- `useState`, `useRef`, `useEffect`, `useCallback`, `useMemo`
- API calls (`collectionApi.get`, `collectionApi.post`, etc.)
- Navigation (`useNavigate`)
- Context consumption (`useActiveCollection`, `useCollectionApi`)
- Event handlers and callbacks
- Derived/computed values (filtering, sorting, mapping)
- Timer logic, keyboard listeners, resize observers

### What belongs in the component (`index.tsx`)

- Destructuring the hook's return value
- JSX markup with Tailwind classes
- Conditional rendering based on hook-provided booleans/values
- Mapping arrays to JSX elements
- Importing child components and passing props

### When a hook is NOT needed

Not every component needs a hook. Skip it when the component is:

- **Purely presentational** — receives all data via props, no internal state (e.g., `FlagDisplay`, `Spinner`, `Card`, `TagPills`)
- **Trivially stateful** — a single `useState` with no effects or callbacks that would benefit from extraction (use judgement: if the component body is under ~30 lines total including the state, a hook adds noise)
- **A UI primitive** — buttons, inputs, layout wrappers in `components/ui/`

The threshold: if a component has **2+ hooks, an effect, or any API/navigation logic**, it should have a companion hook file.

## Audit Checklist

When reviewing a TSX file, check for these violations:

1. **Mixed concerns** — `useState`/`useEffect`/`useRef` calls directly in a component that also renders JSX. This is the primary violation.

2. **Inline handlers with logic** — `onClick={() => { setState(x); doThing(); navigate(...) }}` in JSX rather than a named handler from the hook.

3. **Derived data in render** — Filtering, sorting, or mapping data inside the component body rather than in the hook.

4. **API calls in components** — Any `fetch`, `api.get`, `collectionApi.post` inside a component file.

5. **Context consumption without hook** — `useActiveCollection()` called directly in a component that also has its own state. Should be consumed in the hook instead, with needed values passed through.

6. **Missing interface** — Hook props should have a named interface (`UseXProps`), and the hook should return a typed object.

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Hook file | `use` + ComponentName in camelCase | `useGameSession.ts` |
| Hook function | `use` + ComponentName | `useGameSession()` |
| Hook props interface | `Use` + ComponentName + `Props` | `UseGameSessionProps` |
| Component file | `index.tsx` | `index.tsx` |
| Component function | PascalCase | `GameSession` |
| Component props interface | ComponentName + `Props` | `GameSessionProps` |
| Directory | PascalCase | `GameSession/` |

## Codebase Conventions to Enforce

While reviewing, also flag:

- **Imports** — Use `@flag-quiz/shared` workspace alias, never relative paths to shared package
- **TypeScript** — Strict mode, explicit interface for props, no `any` unless unavoidable
- **Variables** — camelCase, booleans prefixed with `is`/`should`/`has`
- **Tailwind** — Utility classes only, no inline styles unless dynamic values require it (e.g., `style={{ width }}`)
- **Event handlers** — Prefix with `handle` in components, no prefix needed in hooks for internal callbacks

## Output Format

### For review/report mode

Produce a table:

| File | Violation | Severity | Description |
|------|-----------|----------|-------------|

Severity levels:
- **High** — Component has 3+ hooks mixed with JSX, needs immediate extraction
- **Medium** — Component has 1-2 hooks that should be extracted for consistency
- **Low** — Minor convention violation (naming, import style)

### For fix mode

1. Create the `useX.ts` hook file with all extracted logic
2. Refactor `index.tsx` to destructure the hook and render only JSX
3. Ensure the component still compiles and behaves identically

**CRITICAL**: When extracting, do not change behavior. The refactor must be mechanical — move logic out, wire up the return object, destructure in the component. No functional changes, no "improvements" beyond the structural split.
