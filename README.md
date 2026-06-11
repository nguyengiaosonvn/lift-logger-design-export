# Lift Logger — Design Handoff

**UI specification for Flutter development** — 50 screen states, interactive prototype, and full coverage checklist.

## Quick start

1. **Browse screens** — open [`screens-full/index.html`](screens-full/index.html)
2. **Read the guide** — [`HANDOFF.md`](HANDOFF.md) (screen map, Flutter notes, scope)
3. **Try interactions** — run the prototype locally:

```powershell
cd source
npx --yes serve .
```

Then open `http://localhost:3000/Lift%20Logger.html`.

## What's included

| Path | Description |
|------|-------------|
| [`HANDOFF.md`](HANDOFF.md) | Developer handoff guide |
| [`STATE-AUDIT.md`](STATE-AUDIT.md) | UI branch → scene checklist |
| [`state-audit.json`](state-audit.json) | Machine-readable audit (41 branches) |
| `screens-full/` | 50 PNGs @ 2×, `manifest.json`, browser gallery |
| `source/` | Interactive HTML/JSX prototype |
| `export-all-scenes.mjs` | Regenerate PNGs (design changes only) |

## Coverage

- **50** exported scenes
- **41** required UI branches — all covered
- Verified: `screens-full/manifest.json` → `"coverageComplete": true`

## Re-export (optional)

```powershell
npm install
npx playwright install chromium
npm run export
```

## License

Design prototype and exports — confirm usage rights with the project owner before commercial use.
