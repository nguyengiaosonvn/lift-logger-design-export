import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, 'source');
const OUT = path.join(__dirname, 'screens-full');

const MIME = {
  '.html': 'text/html', '.jsx': 'text/javascript', '.js': 'text/javascript',
  '.png': 'image/png', '.css': 'text/css',
};

function startServer(root, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent((req.url || '/').split('?')[0]);
      const filePath = path.join(root, rel === '/' ? 'Lift Logger.html' : rel.replace(/^\//, ''));
      if (!filePath.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

const PLAN = [
  { id: 'squat', name: 'Squat', equip: 'barbell', max: 220, prev: { w: 80, r: 5 } },
  { id: 'bench', name: 'Bench', equip: 'barbell', max: 160, prev: { w: 60, r: 8 } },
  { id: 'ohp', name: 'OHP', equip: 'barbell', max: 100, prev: { w: 40, r: 8 } },
  { id: 'dead', name: 'Deadlift', equip: 'barbell', max: 260, prev: { w: 100, r: 5 } },
  { id: 'row', name: 'Row', equip: 'machine', plates: 12, prev: { w: 7, r: 10 } },
  { id: 'lat', name: 'Lat Pull', equip: 'machine', plates: 20, prev: { w: 11, r: 12 } },
  { id: 'curl', name: 'Curl', equip: 'dumbbell', prev: { w: 12, r: 12 } },
];

function memFromPlan(plan) {
  const m = {};
  plan.forEach((p) => { m[p.id] = { ...p.prev }; });
  return m;
}

function sessionBase(overrides = {}) {
  const plan = overrides.plan ?? PLAN;
  const exIdx = overrides.exIdx ?? 1;
  const ex = plan[exIdx];
  return {
    screen: 'session',
    dayName: overrides.dayName ?? 'Day A',
    saveMode: false,
    plan,
    exIdx,
    mem: overrides.mem ?? memFromPlan(plan),
    sets: overrides.sets ?? { bench: [{ w: 60, r: 8 }, { w: 60, r: 8 }] },
    curW: overrides.curW ?? (ex ? ex.prev.w : 60),
    curR: overrides.curR ?? (ex ? ex.prev.r : 8),
    startTime: Date.now() - 14 * 60000,
    now: Date.now(),
    libOpen: false,
    libQuery: '',
    libMuscle: 'chest',
    editPlan: false,
    adding: false,
    addName: '',
    addEquip: 'barbell',
    addPlates: 12,
    open: true,
    userSplits: [],
    ...overrides,
  };
}

const CUSTOM_SPLIT = [{
  id: 'u-demo', name: 'My Push Day', custom: true, freq: 'Custom',
  days: [{ name: 'Push', exs: [{ id: 'bench', name: 'Bench', equip: 'barbell', max: 160, prev: { w: 60, r: 8 } }] }],
}];

/** Figma-level scene catalog */
const SCENES = [
  // ── Start ──
  { id: 'start-native', group: 'Start', wait: 'Ready to lift?', spec: { screen: 'start', tweaks: { vibe: 'Native' } } },
  { id: 'start-mono', group: 'Start', wait: 'Ready to lift?', spec: { screen: 'start', tweaks: { vibe: 'Mono' } } },
  { id: 'start-athletic', group: 'Start', wait: 'Ready to lift?', spec: { screen: 'start', tweaks: { vibe: 'Athletic', accent: '#FF375F' } } },

  // ── Split picker ──
  { id: 'splits-grid', group: 'Splits', wait: 'Choose a split', spec: { screen: 'splits', tweaks: { vibe: 'Native' } } },
  { id: 'splits-scrolled', group: 'Splits', wait: 'Choose a split', spec: { screen: 'splits', splitExport: { scrollY: 520 } } },
  { id: 'splits-fullbody-days', group: 'Splits', wait: 'Day A', spec: { screen: 'splits', splitExport: { sheetSplit: 'fullbody' } } },
  { id: 'splits-upperlower-days', group: 'Splits', wait: 'Upper', spec: { screen: 'splits', splitExport: { sheetSplit: 'upperlower' } } },
  { id: 'splits-ppl-days', group: 'Splits', wait: 'Push', spec: { screen: 'splits', splitExport: { sheetSplit: 'ppl' } } },
  { id: 'splits-bro-days', group: 'Splits', wait: 'Chest', spec: { screen: 'splits', splitExport: { sheetSplit: 'bro' } } },
  { id: 'splits-plus-menu', group: 'Splits', wait: 'Start without a split', spec: { screen: 'splits', splitExport: { plusOpen: true } } },
  { id: 'splits-with-custom-card', group: 'Splits', wait: 'My Push Day', spec: { screen: 'splits', userSplits: CUSTOM_SPLIT } },

  // ── Session idle ──
  { id: 'idle-with-sets', group: 'Session / Idle', wait: 'Nothing logged yet', invertWait: true, spec: sessionBase({ open: false }) },
  { id: 'idle-nothing-logged-yet', group: 'Session / Idle', wait: 'Nothing logged yet', spec: sessionBase({ open: false, sets: {} }) },
  { id: 'idle-empty-plan', group: 'Session / Idle', wait: 'Add a lift to start logging.', spec: sessionBase({ plan: [], sets: {}, mem: {}, exIdx: 0, open: false, dayName: 'Quick Session' }) },
  { id: 'idle-save-mode', group: 'Session / Idle', wait: 'Unsaved', spec: sessionBase({ saveMode: true, dayName: 'My Split', plan: [], sets: {}, mem: {}, exIdx: 0, open: false }) },

  // ── Logger · equipment types ──
  { id: 'logger-bench-barbell', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 1, open: true, tweaks: { mechanism: 'Per-exercise', machinePicker: 'Pin stack' } }) },
  { id: 'logger-squat-barbell', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 0, open: true }) },
  { id: 'logger-dead-barbell', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 3, open: true, curW: 100, curR: 5 }) },
  { id: 'logger-ohp-barbell', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 2, open: true, curW: 40, curR: 8 }) },
  { id: 'logger-curl-dumbbell', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 6, open: true }) },
  { id: 'logger-row-pin-stack', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 4, open: true, curW: 7, curR: 10, tweaks: { mechanism: 'Per-exercise', machinePicker: 'Pin stack' } }) },
  { id: 'logger-lat-pin-stack', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 5, open: true, curW: 11, curR: 12, tweaks: { mechanism: 'Per-exercise', machinePicker: 'Pin stack' } }) },
  { id: 'logger-row-wheel', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 4, open: true, curW: 7, tweaks: { mechanism: 'Per-exercise', machinePicker: 'Wheel' } }) },
  { id: 'logger-lat-wheel', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 5, open: true, curW: 11, curR: 12, tweaks: { mechanism: 'Per-exercise', machinePicker: 'Wheel' } }) },
  { id: 'logger-coarse-fine', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 1, open: true, curW: 62.5, curR: 8, tweaks: { mechanism: 'Coarse + fine' } }) },
  { id: 'logger-uniform', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 1, open: true, curW: 60, tweaks: { mechanism: 'Uniform', uniformStep: 2.5 } }) },
  { id: 'logger-touch-test', group: 'Session / Logger', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 4, open: true, curW: 7, tweaks: { mechanism: 'Per-exercise', machinePicker: 'Pin stack', touchTest: true } }) },
  { id: 'logger-edit-exercises', group: 'Session / Logger', wait: 'Edit exercises', spec: sessionBase({ open: true, editPlan: true }) },
  { id: 'logger-sheet-closed', group: 'Session / Logger', wait: 'LOG', spec: sessionBase({ open: false }) },

  // ── New exercise form ──
  { id: 'new-exercise-barbell', group: 'Session / New exercise', wait: 'New exercise', attrWait: true, spec: sessionBase({ open: true, adding: true, addName: 'Custom Press', addEquip: 'barbell' }) },
  { id: 'new-exercise-dumbbell', group: 'Session / New exercise', wait: 'New exercise', attrWait: true, spec: sessionBase({ open: true, adding: true, addName: 'Hammer Curl', addEquip: 'dumbbell' }) },
  { id: 'new-exercise-machine', group: 'Session / New exercise', wait: 'Plates in the stack', spec: sessionBase({ open: true, adding: true, addName: 'Cable Row', addEquip: 'machine', addPlates: 14 }) },
  { id: 'new-exercise-empty-name', group: 'Session / New exercise', wait: 'New exercise', attrWait: true, spec: sessionBase({ open: true, adding: true, addName: '', addEquip: 'barbell' }) },

  // ── Exercise library ──
  { id: 'library-anatomy-default', group: 'Library', wait: 'Add exercise', spec: sessionBase({ open: false, libOpen: true, libMuscle: 'chest', libQuery: '' }) },
  { id: 'library-tap-muscle', group: 'Library', wait: 'Tap a muscle', spec: sessionBase({ open: false, libOpen: true, libMuscle: null, libQuery: '' }) },
  { id: 'library-muscle-lats', group: 'Library', wait: 'Lats', spec: sessionBase({ open: false, libOpen: true, libMuscle: 'lats', libQuery: '' }) },
  { id: 'library-search-bench', group: 'Library', wait: 'Bench', spec: sessionBase({ open: false, libOpen: true, libQuery: 'bench', libMuscle: null }) },
  { id: 'library-search-empty', group: 'Library', wait: 'Add exercise', spec: sessionBase({ open: false, libOpen: true, libQuery: 'zzzznomatch', libMuscle: null }) },
  { id: 'library-free-flow', group: 'Library', wait: 'Add exercise', spec: sessionBase({ plan: [], sets: {}, mem: {}, exIdx: 0, open: false, libOpen: true, dayName: 'Quick Session' }) },

  // ── Vibes on key screens ──
  { id: 'idle-mono', group: 'Vibes', wait: 'Finish', spec: sessionBase({ open: false, tweaks: { vibe: 'Mono' } }) },
  { id: 'idle-athletic', group: 'Vibes', wait: 'Finish', spec: sessionBase({ open: false, tweaks: { vibe: 'Athletic', accent: '#30D158' } }) },
  { id: 'logger-mono', group: 'Vibes', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ open: true, tweaks: { vibe: 'Mono' } }) },
  { id: 'logger-athletic-red', group: 'Vibes', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ open: true, tweaks: { vibe: 'Athletic', accent: '#FF375F' } }) },
  { id: 'splits-mono', group: 'Vibes', wait: 'Choose a split', spec: { screen: 'splits', tweaks: { vibe: 'Mono' } } },
  { id: 'splits-athletic', group: 'Vibes', wait: 'Choose a split', spec: { screen: 'splits', tweaks: { vibe: 'Athletic', accent: '#FF9F0A' } } },

  // ── Accents ──
  { id: 'logger-accent-green', group: 'Accents', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ open: true, tweaks: { accent: '#30D158' } }) },
  { id: 'logger-accent-orange', group: 'Accents', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ open: true, tweaks: { accent: '#FF9F0A' } }) },

  // ── Behavior variants ──
  { id: 'logger-no-pr-marker', group: 'Behavior', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ open: true, exIdx: 1, tweaks: { lastMarker: false } }) },
  { id: 'logger-pin-absolute', group: 'Behavior', wait: 'Logger sheet', attrWait: true, spec: sessionBase({ exIdx: 4, open: true, curW: 7, tweaks: { pinDrag: 'Absolute', machinePicker: 'Pin stack' } }) },
  { id: 'logger-after-log-closed', group: 'Behavior', wait: 'LOG', spec: sessionBase({ open: false, sets: { bench: [{ w: 60, r: 8 }, { w: 60, r: 8 }, { w: 62.5, r: 8 }] }, curW: 62.5, tweaks: { afterLog: 'Auto-close' } }) },
];

function validateAuditCoverage() {
  const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'state-audit.json'), 'utf8'));
  const sceneIds = new Set(SCENES.map((s) => s.id));
  const missing = [];
  for (const b of audit.branches) {
    if (!sceneIds.has(b.requiredScene)) missing.push(b.requiredScene);
  }
  if (missing.length) {
    throw new Error(`state-audit.json requires scenes missing from SCENES[]: ${missing.join(', ')}`);
  }
  const required = audit.branches.map((b) => b.requiredScene);
  const extra = [...sceneIds].filter((id) => !required.includes(id) && !SCENES.find((s) => s.id === id && required.includes(s.id)));
  console.log(`Audit: ${audit.branches.length} required UI branches, ${SCENES.length} export scenes`);
  return audit;
}

async function waitForScene(page, scene) {
  if (scene.attrWait) {
    await page.locator('[data-screen-label="Logger sheet"], [data-screen-label="New exercise"]').first().waitFor({ state: 'visible', timeout: 15000 });
    return;
  }
  if (scene.invertWait) {
    await page.getByText(scene.wait, { exact: false }).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.getByText('Bench').first().waitFor({ timeout: 15000 });
    return;
  }
  await page.getByText(scene.wait, { exact: false }).first().waitFor({ timeout: 15000 });
}

async function captureScene(page, scene, index) {
  await page.goto('http://127.0.0.1:9877/Lift%20Logger.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__exportReady && window.__gotoScene, null, { timeout: 30000 });
  await page.evaluate((spec) => {
    window.__gotoScene(spec);
    document.querySelectorAll('*').forEach((el) => {
      el.getAnimations?.().forEach((a) => { try { a.finish(); } catch (e) {} });
    });
  }, scene.spec);
  await page.waitForTimeout(400);
  await waitForScene(page, scene);

  await page.addStyleTag({ content: '.twk-panel{display:none!important}' });
  const device = page.locator('[data-export-device]').first();
  const pad = String(index + 1).padStart(3, '0');
  const fileName = `${pad}-${scene.id}.png`;
  const filePath = path.join(OUT, fileName);
  await device.screenshot({ path: filePath });
  return { file: fileName, id: scene.id, group: scene.group };
}

async function main() {
  validateAuditCoverage();
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer(SOURCE, 9877);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  const manifest = [];

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    try {
      const entry = await captureScene(page, scene, i);
      manifest.push(entry);
      console.log(`[${i + 1}/${SCENES.length}] ${entry.file}`);
    } catch (err) {
      console.error(`FAIL ${scene.id}:`, err.message);
      manifest.push({ file: null, id: scene.id, group: scene.group, error: err.message });
    }
  }

  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
    count: manifest.filter((m) => m.file).length,
    auditBranches: JSON.parse(fs.readFileSync(path.join(__dirname, 'state-audit.json'), 'utf8')).branches.length,
    coverageComplete: manifest.filter((m) => m.file && !m.error).length >= SCENES.length,
    scenes: manifest,
  }, null, 2));
  const ok = manifest.filter((m) => m.file);
  const cols = 6;
  const cells = ok.map((m) => `<figure><img src="${m.file}" alt="${m.id}"/><figcaption>${m.id}</figcaption></figure>`).join('\n');
  fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Lift Logger — ${ok.length} scenes</title>
<style>body{background:#1e1e1e;color:#eee;font:12px system-ui;margin:0;padding:24px}h1{font-size:18px}
.grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px}figure{margin:0}img{width:100%;border-radius:12px;background:#333}
figcaption{margin-top:6px;opacity:.75;word-break:break-all}</style></head><body>
<h1>Lift Logger — ${ok.length} scenes</h1><div class="grid">${cells}</div></body></html>`);

  await browser.close();
  server.close();
  console.log(`\nDone — ${manifest.filter((m) => m.file).length} scenes → ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
