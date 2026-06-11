# Lift Logger — Developer Handoff

Design reference package for building the Lift Logger workout app in **Flutter** (or any native stack). This is **not** a Figma file — use the PNG gallery for layout and the web prototype for behavior.

## Quick start (5 minutes)

1. **Browse all screens** — open [`screens-full/index.html`](screens-full/index.html) in Chrome or Edge.
2. **Check coverage** — skim [`STATE-AUDIT.md`](STATE-AUDIT.md) (every UI branch → PNG).
3. **Try interactions** — run the prototype locally (see [Run the prototype](#run-the-prototype)).
4. **Implement screen-by-screen** — match PNGs; use prototype for wheels, sheets, and transitions.

## What you get

| Asset | Path | Use for |
|-------|------|---------|
| Screen captures | `screens-full/*.png` | Layout, typography, colors, empty/filled states |
| Scene index | `screens-full/manifest.json` | IDs, groups, file names |
| Visual gallery | `screens-full/index.html` | Quick overview in browser |
| Interactive prototype | `source/` | Flows, logger mechanisms, navigation |
| State checklist | `STATE-AUDIT.md` | Proof all branches are documented |

**Captured:** 50 scenes · **Audit branches:** 41 · **Coverage:** complete (`manifest.json` → `"coverageComplete": true`)

## Run the prototype

The HTML app loads JSX via Babel — it must be served over HTTP (not `file://`).

```powershell
cd source
npx --yes serve .
```

Open **http://localhost:3000/Lift%20Logger.html** (port may differ — check terminal output).

Optional: press `T` in the prototype to open the design-time tweaks panel (hidden in PNG exports).

## Screen map by feature

### Start & theme
- `001–003` — Start screen (native, mono, athletic vibes)

### Split picker
- `004–011` — Grid, scroll, day sheets (Full Body, Upper/Lower, PPL, Bro), plus menu, custom card
- `044–045` — Split picker in mono / athletic themes

### Session idle (main workout list)
- `012` — Logged sets visible
- `013` — Plan exists, nothing logged yet
- `014` — Empty plan
- `015` — Save-mode draft
- `040–041` — Mono / athletic idle

### Weight logger (bottom sheet)
- `016–019` — Barbell wheels (bench, squat, deadlift, OHP)
- `020` — Dumbbell rack
- `021–022` — Pin stack (row, lat)
- `023–024` — Machine wheels (row, lat)
- `025–027` — Coarse+fine, uniform, touch-test overlay
- `028` — Edit exercises in plan
- `029` — Sheet dismissed (idle underneath)
- `042–043` — Mono / athletic logger
- `046–047` — Green / orange accent samples
- `048` — No PR markers
- `049` — Absolute pin drag
- `050` — Auto-close after logging a set

### New exercise
- `030–033` — Barbell, dumbbell, machine, empty name (disabled submit)

### Exercise library
- `034–039` — Anatomy default, tap muscle prompt, lats filter, search hit, search empty, free-flow session

## Flutter implementation notes

### Device frame
PNGs include an iOS-style chrome frame for presentation. **Implement native Flutter UI** — treat the frame as decorative reference, not a widget to ship.

### Theme system
Three vibes appear across the app: **native**, **mono**, **athletic**. Accent colors are sampled on logger screens (`046–047`); you do not need every accent on every surface.

### Logger mechanisms
The prototype supports distinct input UIs — each has a reference PNG:

| Mechanism | Example scene |
|-----------|----------------|
| Barbell wheel | `logger-bench-barbell` |
| Dumbbell rack | `logger-curl-dumbbell` |
| Pin stack | `logger-row-pin-stack` |
| Machine wheel | `logger-row-wheel` |
| Coarse + fine | `logger-coarse-fine` |
| Uniform | `logger-uniform` |

Match interaction feel from the prototype; exact wheel physics can be simplified if UX stays equivalent.

### Intentionally out of scope
See `STATE-AUDIT.md` — includes tweaks panel, LOG flash animation, every scroll position on splits, and exhaustive accent permutations.

## Questions?

1. Is the state listed in `STATE-AUDIT.md`? → PNG exists or variant is noted.
2. How does it animate or scroll? → Check the prototype.
3. Missing Figma components? → Build from PNGs + prototype; no Figma source for this project.

## Regenerating exports (optional)

Only needed if the design changes. From repo root:

```powershell
npm install
npx playwright install chromium
node export-all-scenes.mjs
```

The script validates `state-audit.json` before capturing.
