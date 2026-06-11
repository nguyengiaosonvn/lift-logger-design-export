# Lift Logger — State Audit (dev-complete)

This file maps **every distinct UI branch** in the prototype to an export scene.  
The export script **fails at startup** if any `requiredScene` from `state-audit.json` is missing from `SCENES[]`.

## How to verify coverage

```powershell
node export-all-scenes.mjs   # validates audit, then captures PNGs
```

Check `screens-full/manifest.json` → `"coverageComplete": true`.

## Out of scope (intentionally not exported)

- Tweaks panel (design-time only, hidden in captures)
- Transient LOG flash animation
- Every accent on every screen (accents sampled on logger)
- Every scroll position on split grid (top + scrolled only)

## Branch → scene mapping

| Branch ID | UI surface | Required scene |
|-----------|------------|----------------|
| nav-start | Start screen | `start-native` (+ mono/athletic variants) |
| nav-splits-grid | Split picker | `splits-grid` |
| nav-splits-scroll | Split grid scrolled | `splits-scrolled` |
| sheet-fullbody | Full Body day sheet | `splits-fullbody-days` |
| sheet-upperlower | Upper/Lower day sheet | `splits-upperlower-days` |
| sheet-ppl | PPL day sheet | `splits-ppl-days` |
| sheet-bro | Bro split day sheet | `splits-bro-days` |
| sheet-plus-menu | Plus / no split menu | `splits-plus-menu` |
| splits-custom-card | Custom split card | `splits-with-custom-card` |
| idle-logged | Idle with logged sets | `idle-with-sets` |
| idle-nothing-logged | Idle, plan exists, no sets | `idle-nothing-logged-yet` |
| idle-empty-plan | Empty plan | `idle-empty-plan` |
| idle-save-mode | Save-mode draft | `idle-save-mode` |
| logger-barbell | Barbell wheel | `logger-bench-barbell` (+ squat/dead/ohp) |
| logger-dumbbell | Dumbbell rack | `logger-curl-dumbbell` |
| logger-pin-stack | Machine pin stack | `logger-row-pin-stack` (+ lat) |
| logger-machine-wheel | Machine wheel | `logger-row-wheel` (+ lat) |
| logger-coarse-fine | Coarse + fine wheels | `logger-coarse-fine` |
| logger-uniform | Uniform mechanism | `logger-uniform` |
| logger-touch-test | Touch test overlay | `logger-touch-test` |
| logger-edit-plan | Edit exercises | `logger-edit-exercises` |
| logger-closed | Sheet dismissed | `logger-sheet-closed` |
| new-exercise-barbell | New · barbell | `new-exercise-barbell` |
| new-exercise-dumbbell | New · dumbbell | `new-exercise-dumbbell` |
| new-exercise-machine | New · machine | `new-exercise-machine` |
| new-exercise-empty | Disabled submit | `new-exercise-empty-name` |
| library-anatomy | Muscle selected | `library-anatomy-default` |
| library-tap-muscle | No muscle selected | `library-tap-muscle` |
| library-muscle-filter | Lats filter | `library-muscle-lats` |
| library-search-hit | Search results | `library-search-bench` |
| library-search-empty | Search empty | `library-search-empty` |
| library-free-flow | Quick session library | `library-free-flow` |
| vibe-mono-idle | Mono idle | `idle-mono` |
| vibe-athletic-idle | Athletic idle | `idle-athletic` |
| vibe-mono-logger | Mono logger | `logger-mono` |
| vibe-athletic-logger | Athletic logger | `logger-athletic-red` |
| accent-green | Green accent | `logger-accent-green` |
| accent-orange | Orange accent | `logger-accent-orange` |
| behavior-no-pr | No PR markers | `logger-no-pr-marker` |
| behavior-pin-absolute | Absolute pin drag | `logger-pin-absolute` |
| behavior-auto-close | Post-log sheet closed | `logger-after-log-closed` |

## Source of truth files

| File | Role |
|------|------|
| `state-audit.json` | Machine-readable checklist (41 branches) |
| `export-all-scenes.mjs` → `SCENES[]` | Capture definitions |
| `screens-full/manifest.json` | Proof of last run |

## Adding a new UI branch

1. Add row to `state-audit.json` with `requiredScene` id  
2. Add matching entry to `SCENES[]` in `export-all-scenes.mjs`  
3. Re-run export — script validates before capturing
