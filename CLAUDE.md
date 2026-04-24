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

The player is given a **start country** and an **end country** (randomly chosen at a set distance apart). They type country names to "reveal" intermediate countries. The round completes when start and end are contiguously connected through revealed countries via shared borders. Post-round, a BFS finds the shortest winning path through the revealed countries and compares it to the pre-computed target path.

### State management — Jotai

State is split across two files:

- **`src/game/state.ts`** — all game logic atoms:
  - Base atoms: `startCountryAtom`, `endCountryAtom`, `revealedCountriesAtom`, `targetPathAtom`, `termAtom` (search input text), `roundAtom`, `maxPathSizeAtom`
  - Display toggles (persisted via `atomWithStorage`): `showAllCountriesAtom`, `showAllNamesAtom`, `showDebugInfoAtom`, `showHelpAtom`
  - Derived atoms: `connectedRevealedCountriesAtom`, `isRoundCompleteAtom`, `winningPathAtom`, `currentRoundSummary` (returns `{ revealed, target }` when round complete), `revealedOffWinningPathAtom`
- **`src/map/state.ts`** — visual/globe atoms: `hoveredCountryAtom`, `lastCenteredCountriesAtom`, `mouseGlobePosAtom`, plus constants for globe size, scale limits, sensitivity, `KEYBOARD_ZOOM_STEP`, and spring configs (`ROTATION_SPRING_CONFIG`, `SCALE_SPRING_CONFIG`, `VIEWPORT_OFFSET_SPRING_CONFIG`).
- **`src/layout/state.ts`** — layout atoms: `navBarHeightAtom` (measured NavBar height used to dynamically center the globe in the visible space above the nav bar).

### Globe rendering — `src/map/useDrawMap.ts`

Canvas-based rendering using a **d3-geo orthographic projection**. Runs a continuous `requestAnimationFrame` loop. Globe rotation and zoom are animated with `@react-spring/web` spring values (`rotX/Y/Z`, `scale`, `viewportOffsetTop`) passed into the hook; `viewportOffsetTop` shifts the projection center so the globe visually centers in the space above the nav bar. Country fill colors are determined by game state (terminal, connected, revealed, target, unrevealed) and read from CSS custom properties via `getColors()` (cached after first call). Countries too small to render as polygons get a dot + circle outline instead (area threshold < 2 in projection units).

Hover detection (`src/map/useMapGestures.ts`) uses `geoContains` for normal countries. For small countries, a fallback circle hit-test runs if nothing was found: `smallCountryIds` is precomputed once at module load (same area threshold), and the fallback checks if the mouse is within 6px of the projected centroid — matching the drawn circle radius.

### Country data — `src/map/countries.ts` + `src/map/processGeoData.ts`

TopoJSON (`src/map/data/countries-simplified.json`) is loaded in `countries.ts`, passed through `processGeoData()`, and mapped to the exported `countries` array — the sole source of truth for all country data. `countryGeoData` is internal and not exported. All geo processing lives in `src/map/processGeoData.ts`:

- **`NAME_OVERRIDES`** — normalizes abbreviated TopoJSON names to full names.
- **`OMITTED_COUNTRIES`** — set of country names filtered out before processing (small/remote islands, isolated dead ends). Organized by region: Caribbean, Atlantic, Indian Ocean, Pacific, Antarctic, European microstates.
- **Polygon stripping** — removes offshore territories baked into parent country `MultiPolygon`s: Spain (Canary Islands), Portugal (Madeira, Azores), Netherlands (Bonaire etc.), South Africa (Prince Edward Islands).
- **Territory extraction** — splits France's `MultiPolygon` into separate named features: mainland France, French Guiana, Mayotte, Réunion, New Caledonia. Caribbean polygons (~-61°W) and other strays are dropped. Similarly extracts Galápagos Islands from Ecuador.

`Country` type: `{ id: string, name: string, feature: GeoJSON Feature, centroid: [lonRad, latRad] }`.

### Border graph — `src/game/`

- `borders.ts` — static adjacency map `Record<string, string[]>` listing neighboring country names. Includes land borders and water crossings up to ~200 km, plus explicit exceptions for gameplay (e.g. Bering Strait, Greenland/Iceland, Australia/NZ). Countries absent from the map (omitted or not yet added) are silently ignored by `getNeighbors`.
- `getNeighbors.ts` — looks up neighbors for a `Country` from the borders map, filtering out any names not present in `countryByName`.
- `getConnectedGroup.ts` — BFS to find all countries reachable from a seed within a given set. Also exports `areCountriesConnected` helper.
- `getRandomPath.ts` — BFS from a random start, picks an end exactly `length` hops away, returns the connecting path.
- `countryByName.ts` — `Map<string, Country>` for O(1) name lookups.

### Layout utilities — `src/layout/common/`

- `useObserveSize` — wraps `use-resize-observer` to track a single dimension (`width` or `height`) of a DOM element; `useObserveSizeSilently` fires a callback instead of re-rendering.
- `useVisualViewportHeight` — tracks `window.visualViewport` height and `offsetTop` (important for mobile Safari where the keyboard pushes the viewport).
- `getIsMobileSafari` — detects mobile Safari for platform-specific sensitivity tweaks.

### Fuzzy search — `src/layout/common/fuzzy.ts`

Lightweight custom fuzzy search used in `NavInput` to filter and rank country suggestions. `normalize()` strips accents (Unicode-aware). `fuzzyMatch()` checks if query characters appear in order. `score()` ranks by exact → prefix → partial match.

### Cross-component events — `src/map/globeEvents.ts`

Typed multi-event pub/sub used to drive globe animation without prop drilling. `globeEvents.sub(event, handler)` registers a listener and returns an unsubscribe function; `globeEvents.emit(event, payload)` fires all listeners. Two event types:

- `'center'` (`CenterCountriesHandler`) — rotates the globe to center on a list of countries. Accepts `{ countries, scaleToFit? }`. When `scaleToFit` is `true`, zoom is adjusted if needed: scale is only reduced (zoomed out) to the minimum required to fit all countries in view; it is never increased.
- `'scale'` (`ScaleHandler`) — adjusts zoom by a delta value.

`useOnGlobeEvents` (in `Map`) subscribes to both events and springs the rotation/scale. `useOnRevealCountry` watches `revealedCountriesAtom`, emits `'center'` when a new country is revealed, and — once the round is complete — updates `targetPathAtom` to the winning path when their lengths match (so the target highlight snaps to the actual winning route).

### CountryPill events — `src/app/createCountryPillEvents.ts`

Factory function that returns `{ onMouseEnter, onFocus, onClick }` — all call `globeEvents.emit('center', [country])`. Spread directly onto `<CountryPill>` props to wire map centering from any pill in the UI.

### Keyboard handling — `src/app/useOnKeyDown.ts`

Global `keydown` listener attached in `NavBar`. Behaviors:

- **ArrowLeft/Right** — navigate between country pills in the same row (`data-country-pill` attribute).
- **ArrowUp/Down** — navigate between pill rows (`data-pill-row` attribute), preserving column position.
- **Shift+ArrowUp/Down** — zoom in/out via `globeEvents.emit('scale', ±KEYBOARD_ZOOM_STEP)`.
- **Escape** — centers globe on start + end countries and blurs any focused pill.
- **Any printable character** — focuses the search input (if the round is still in progress).

Uses React 19's `useEffectEvent` to avoid stale closures.

### Component tree

```
App (JotaiProvider + createStore)
└── Landing
    ├── KeyboardShortcutGuide (top-right overlay, keyboard shortcut reference)
    ├── Map (canvas globe)
    │   useDrawMap, useMapGestures, useOnGlobeEvents, useOnRevealCountry
    └── NavBar (bottom bar)
        ├── NavInput (during round)
        │   Fuzzy search input → reveal country
        │   CountryPills for start, revealed, and end countries
        │   Show All Countries / Show All Names toggles
        └── RoundSummary (post-round)
            Winning path vs. target path comparison
            CountryPills for each path segment
            Info button toggles Help
```

### Styling notes

- Tailwind v4 — CSS custom properties (`--color-background`, `--color-text`, `--color-surface`, `--color-terminal`, `--color-connected`, `--color-target`) are defined in CSS and consumed both by Tailwind classes and by `getColors()` for canvas rendering.
- `getColors()` caches on first call. If colors change at runtime (theme switch etc.), the cache must be invalidated manually.
- `CountryPill` uses a `data-country-pill` attribute for keyboard navigation DOM selection.
