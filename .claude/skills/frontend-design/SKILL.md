---
name: frontend-design
description: Review and build UI components that match the "Diplomatic Atlas" design system. Use this skill when asked to review design quality, build new components/pages, or audit visual consistency across the Flag Quiz codebase.
---

This skill enforces and extends the **"Diplomatic Atlas"** design system used throughout the Flag Quiz codebase. Use it when building new components, reviewing existing ones for design quality, or auditing visual consistency.

## The Design System

Flag Quiz uses a dark, refined aesthetic called "Diplomatic Atlas" — warm blue-black surfaces, emerald action colors, gold achievement accents, with a subtle noise texture overlay and ambient gradient background.

### Typography (self-hosted via fontsource)

| Role | Font | Tailwind class | Usage |
|------|------|---------------|-------|
| Display | DM Serif Display | `font-display` | Page titles, large headings, verdict text. Always `italic tracking-tight`. |
| Body | DM Sans | `font-body` (default) | All body text, labels, descriptions |
| Mono | JetBrains Mono | `font-mono` | Stats, percentages, reaction times, counters |

**Rules**: Never introduce new fonts. Display font is always italic. Use `font-mono` for any numerical data that benefits from tabular alignment.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-950` | `#0a0c10` | Page background, `ambient-bg` |
| `surface-900` | `#121620` | Cards, panels, header backgrounds (with `/80` or `/95` opacity) |
| `surface-800` | `#1c2030` | Input backgrounds, hover states, secondary surfaces |
| `surface-700` | `#2a2f42` | Borders (always with `/40` to `/80` opacity) |
| `surface-600` | `#3d4358` | Muted borders, inactive text |
| `surface-500` | `#5a6178` | Secondary text, labels, descriptions |
| `surface-400` | `#8890a4` | Body text in secondary positions |
| `surface-300` | `#b0b6c8` | Primary body text, card titles |
| `white` | `#ffffff` | Headings, emphasis, active states |
| `emerald-*` | Tailwind default | Primary actions, correct states, progress, active nav indicators |
| `gold-*` | Custom scale | Achievement, mastery, high accuracy (>=80%), session-in-progress |
| `red-*` | Tailwind default | Errors, wrong answers, destructive actions |
| `amber-*` | Tailwind default | Warnings, due counts, confusion counts |

**Rules**: Emerald is the only action color — all primary buttons, active states, and progress indicators use it. Gold is reserved for achievement/mastery contexts. Never use blue or purple as accent colors.

### Backgrounds & Atmosphere

- **Page background**: `ambient-bg` class — `surface-950` base with two subtle radial gradients (emerald top-center, gold bottom-right)
- **Noise overlay**: `body::after` applies a fractal noise SVG at 2.8% opacity with `mix-blend-mode: overlay`
- **Glass effect**: `.glass` class for elevated panels — `backdrop-blur-lg` with gradient transparency
- **Cards**: `bg-surface-900/50` or `bg-surface-900/60` with `border-surface-700/60` or `border-surface-800/80`
- **Headers**: `bg-surface-900/80 backdrop-blur-lg` with `border-b border-surface-700/40`

### Interactive States

| State | Pattern |
|-------|---------|
| Hover on cards/rows | `hover:border-surface-700 hover:bg-surface-800/50` + `.glow-border` (emerald box-shadow) |
| Hover on buttons | `hover:-translate-y-0.5` lift effect + color brightening |
| Active/press | `active:scale-95` or `active:scale-[0.98]` |
| Selected option | `border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-900/10` |
| Focus visible | `focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none` |

**Rules**: Every clickable element must have `cursor-pointer`. All transitions use `transition-all duration-200`. Cards and rows use the `glow-border` class for emerald hover glow.

### Animation

All animations are CSS-only, defined in `index.css`:

| Class | Effect | Usage |
|-------|--------|-------|
| `animate-fade-in` | Fade up 8px + opacity, 0.3s | Page content, sections |
| `animate-page-enter` | Fade up 12px, 0.4s | Main content area (applied by Layout) |
| `animate-dropdown-in` | Scale 0.97 → 1 + opacity, 0.15s | Dropdown menus |
| `animate-celebrate` | Scale bounce 1 → 1.02 → 1, 0.4s | Result screen reveal |
| `stagger-in` | Children fade in with 60ms delays | Grid/list items (up to 10 children) |
| `flag-reveal` | Scale 0.95 → 1, 0.3s | Flag image appearance |
| `progress-bar-shimmer` | Horizontal gradient sweep, 2s loop | Progress bars |

**Rules**: Use `animate-fade-in` on page/section containers. Use `stagger-in` on grids of cards. Dropdowns use `animate-dropdown-in`. Never add new animation libraries — CSS keyframes only.

### Component Patterns

| Pattern | Implementation |
|---------|---------------|
| **Section heading** | `<h1 className="font-display text-3xl italic">Title</h1>` |
| **Card** | Use `Card`/`CardHeader`/`CardTitle`/`CardContent` from `components/ui/card` |
| **Primary button** | `bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500` with shadow |
| **Ghost button** | `text-surface-500 hover:text-surface-300 hover:bg-surface-800/60` |
| **Input field** | `rounded-xl border border-surface-700/80 bg-surface-800/60 px-4 py-3.5 text-white placeholder-surface-500 backdrop-blur-sm` with emerald focus ring |
| **Stat value** | `font-mono text-lg font-bold` with semantic color (`text-emerald-400`, `text-gold-400`, `text-red-400`) |
| **Badge/pill** | `rounded-full bg-{color}-500/10 px-2 py-0.5 font-medium text-{color}-300` |
| **Empty state** | Centered text with `text-surface-400`, optional action button |
| **Row item** | `rounded-xl border border-surface-800/80 bg-surface-900/50 p-3.5 transition-all duration-200 glow-border` |

### Spacing & Layout

- Max content width: `max-w-5xl mx-auto px-4`
- Page vertical padding: `py-5 sm:py-6`
- Section spacing: `space-y-6`
- Card internal padding: `p-4` or `p-5`
- Grid gaps: `gap-2.5` (tight), `gap-4` (standard)
- Border radius: `rounded-xl` (standard), `rounded-2xl` (cards/flags), `rounded-lg` (small elements), `rounded-full` (pills)

### Responsive Approach

- Mobile-first with `sm:` breakpoint for desktop
- Bottom nav on mobile (hidden on `sm:`), top header on desktop (hidden below `sm:`)
- Grids: `grid-cols-1 sm:grid-cols-2` or `sm:grid-cols-3` / `sm:grid-cols-4`
- Stack → row: `flex flex-col sm:flex-row`

### Accessibility Requirements

- All interactive dropdowns: `aria-expanded`, `role="listbox"`, `role="option"`
- Combobox inputs: `role="combobox"`, `aria-autocomplete="list"`, `aria-activedescendant`
- All buttons: `type="button"` (prevent form submission), `cursor-pointer`
- Focus states: `focus-visible:ring-2 focus-visible:ring-emerald-500/40`
- Flag images: `alt="Flag of {name}"` with error fallback
- Color semantics: never rely on color alone — pair with text labels or icons

## Review Mode

When asked to review, audit each component against:

1. **Theme compliance** — Does it use the correct surface/emerald/gold palette? No rogue colors?
2. **Typography** — Display font for headings (italic)? Mono for numbers? Body for text?
3. **Interactive states** — Hover, active, focus-visible all present on clickable elements?
4. **Animation** — Entry animations on page content? `glow-border` on hoverable rows/cards?
5. **Spacing** — Consistent with the scale above? No arbitrary pixel values?
6. **Responsive** — Works on mobile? Stacks properly? No horizontal overflow?
7. **Accessibility** — ARIA attributes, focus management, alt text, semantic HTML?
8. **Atmosphere** — Uses card/glass/border patterns? Consistent opacity values on borders and backgrounds?

Output a prioritized table of issues with file paths, severity, and specific fixes.

## Build Mode

When asked to build new components, follow the design system exactly. Do not invent new colors, fonts, or animation patterns. New components should be indistinguishable from existing ones in visual style.
