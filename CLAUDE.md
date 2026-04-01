# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build` (runs `tsc -b && vite build`)
- **Lint:** `pnpm lint` (ESLint + Prettier check)
- **Format:** `pnpm format`
- **Preview production build:** `pnpm preview`

No test suite exists yet.

## Architecture

React 19 + TypeScript SPA built with Vite. React Compiler is enabled via `babel-plugin-react-compiler` in `vite.config.ts`. Tailwind v4 is used for styling; the `tw()` helper in `src/layout/tw.ts` wraps `tailwind-merge`.

### Game concept

The player is given a **start country** and an **end country** (randomly chosen at a set distance apart). They type country names to "reveal" intermediate countries. The round completes when start and end are contiguously connected through revealed countries via shared borders. Post-round, a BFS finds the shortest winning path through the revealed countries and compares it to the pre-computed optimal path.

### State management — Jotai

State is split across two files:

- **`src/game/state.ts`** — all game logic atoms: `startCountryAtom`, `endCountryAtom`, `revealedCountriesAtom`, `optimalPathAtom` (the pre-computed optimal path), and derived atoms (`connectedRevealedCountriesAtom`, `isRoundCompleteAtom`, `winningPathAtom`, `missedOptimalPathAtom`, `revealedNonOptimalAtom`). Debug/display toggles (`showAllCountriesAtom`, `showAllNamesAtom`, `showColorKeyAtom`) are persisted via `atomWithStorage`.
- **`src/map/state.ts`** — visual/globe atoms: `hoveredCountryAtom`, `lastCenteredCountriesAtom`, `mouseGlobePosAtom`, plus constants for globe size, scale limits, and spring configs.

### Globe rendering — `src/map/useDrawMap.ts`

Canvas-based rendering using a **d3-geo orthographic projection**. Runs a continuous `requestAnimationFrame` loop. Globe rotation and zoom are animated with `@react-spring/web` spring values (`rotX/Y/Z`, `scale`) passed into the hook. Country fill colors are determined by game state (terminal, connected, revealed, optimal, unrevealed) and read from CSS custom properties via `getColors()` (cached after first call). Countries too small to render as polygons get a dot + circle outline instead.

### Country data — `src/map/countries.ts`

TopoJSON (`src/map/data/countries-simplified.json`) is processed once at module load via `topojson-client`. Contains name normalization overrides and a special-case split of France's `MultiPolygon` into mainland France + French Guiana (to prevent France from visually spanning the Atlantic).

`Country` type: `{ id: string, name: string, feature: GeoJSON Feature, centroid: [lonRad, latRad] }`.

### Border graph — `src/game/`

- `borders.ts` — static adjacency map `Record<string, string[]>` listing neighboring country names.
- `getNeighbors.ts` — looks up neighbors for a `Country` from the borders map.
- `getConnectedGroup.ts` — BFS to find all countries reachable from a seed within a given set.
- `getRandomPath.ts` — BFS from a random start, picks an end exactly `length` hops away, returns the connecting path.
- `countryByName.ts` — `Map<string, Country>` for O(1) name lookups.

### Cross-component events — `src/map/globeEvents.ts`

Lightweight pub/sub (`onCenterCountries` / `emitCenterCountries`) used to animate the globe to center on a country without prop drilling. `useOnCenterCountries` subscribes and springs the rotation. `useOnRevealCountry` watches `revealedCountriesAtom` and triggers centering when a new country is revealed.

### Component tree

```
App (JotaiProvider + createStore)
└── Landing
    ├── Map (canvas globe)
    │   useDrawMap, useMapGestures, useOnCenterCountries, useOnRevealCountry
    ├── NavBar (bottom bar)
    │   Search input → fuzzy match → reveal country
    │   Country pills showing path/revealed state
    │   Post-round summary with winning vs. optimal path comparison
    └── DebugInfo
```

### Styling notes

- Tailwind v4 — CSS custom properties (`--color-terminal`, `--color-connected`, `--color-optimal`, `--color-surface`, `--color-text`) are defined in CSS and consumed both by Tailwind classes and by `getColors()` for canvas rendering.
- `getColors()` caches on first call. If colors change at runtime (theme switch etc.), the cache must be invalidated manually.
