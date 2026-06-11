// lift-logger-app.jsx — session screen: idle view + logger sheet
// Needs: wheel-pickers.jsx, tweaks-panel.jsx, ios-frame.jsx loaded first.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "vibe": "Native",
  "accent": "#0A84FF",
  "mechanism": "Per-exercise",
  "uniformStep": 2.5,
  "afterLog": "Stay open",
  "lastMarker": true,
  "machinePicker": "Pin stack",
  "pinDrag": "Relative",
  "touchTest": false
}/*EDITMODE-END*/;

// ── Session plan (preloaded; equipment + last session are properties of the exercise) ──
const PLAN = [
  { id: 'squat', name: 'Squat',    equip: 'barbell',  max: 220, prev: { w: 80, r: 5 } },
  { id: 'bench', name: 'Bench',    equip: 'barbell',  max: 160, prev: { w: 60, r: 8 } },
  { id: 'ohp',   name: 'OHP',      equip: 'barbell',  max: 100, prev: { w: 40, r: 8 } },
  { id: 'dead',  name: 'Deadlift', equip: 'barbell',  max: 260, prev: { w: 100, r: 5 } },
  { id: 'row',   name: 'Row',     equip: 'machine',  plates: 12, prev: { w: 7, r: 10 } },
  { id: 'lat',   name: 'Lat Pull', equip: 'machine', plates: 20, prev: { w: 11, r: 12 } },
  { id: 'curl',  name: 'Curl',     equip: 'dumbbell', prev: { w: 12, r: 12 } },
];

const DUMBBELL_RACK = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40];
const REPS = Array.from({ length: 30 }, (_, i) => i + 1);
const FINE_PLATES = [0, 0.5, 1.25, 2.5, 3.75];

function rangeLadder(from, to, step) {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

function ladderFor(ex, mechanism, uniformStep) {
  if (mechanism === 'Uniform') return rangeLadder(0, 250, uniformStep);
  if (ex.equip === 'barbell') return rangeLadder(20, ex.max, 2.5);   // plate math, empty bar up
  if (ex.equip === 'machine') return rangeLadder(1, ex.plates, 1);   // pin numbers — the stack itself
  return DUMBBELL_RACK;                                              // the rack ladder
}

function nearestIndex(values, v) {
  let best = 0, bestD = Infinity;
  values.forEach((x, i) => { const d = Math.abs(x - v); if (d < bestD) { bestD = d; best = i; } });
  return best;
}

const fmtKg = (v) => String(Math.round(v * 100) / 100);
const fmtFine = (v) => (v === 0 ? '0' : '+' + fmtKg(v));
const fmtSet = (p, s) => (p.equip === 'machine' ? 'P' + s.w : fmtKg(s.w)) + '×' + s.r;
const COARSE = rangeLadder(0, 250, 5);

// library row — name + metric tag, used by the anatomy-map picker and search
function LibRow({ e, onPick }) {
  return (
    <button
      onClick={() => onPick({ id: e.id, name: e.name, equip: e.equip, plates: e.plates, max: e.max, prev: { ...e.prev } })}
      className="tap day-row"
      style={{ width: '100%', flex: '0 0 auto', appearance: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'var(--bg)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontFamily: 'inherit' }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{e.name}</span>
      {e.equip === 'machine' ? (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ width: 12, height: 2.5, borderRadius: 1, background: '#C8922A' }}></span>
          <span style={{ width: 12, height: 2.5, borderRadius: 1, background: '#C8922A' }}></span>
          <span style={{ width: 12, height: 2.5, borderRadius: 1, background: '#C8922A' }}></span>
        </span>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mut)', letterSpacing: '0.04em' }}>{e.equip === 'dumbbell' ? 'DB · kg' : 'kg'}</span>
      )}
    </button>
  );
}

// ── App ──
function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const vibe = t.vibe.toLowerCase().replace(/\s+/g, '-');

  const [screen, setScreen] = React.useState('start'); // start | splits | session
  const [dayName, setDayName] = React.useState('Workout');
  const [saveMode, setSaveMode] = React.useState(false);
  const [libOpen, setLibOpen] = React.useState(false);
  const [libQuery, setLibQuery] = React.useState('');
  const [libMuscle, setLibMuscle] = React.useState('chest');
  const [editPlan, setEditPlan] = React.useState(false);
  const [userSplits, setUserSplits] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('ll_userSplits') || '[]'); } catch (e) { return []; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('ll_userSplits', JSON.stringify(userSplits)); } catch (e) {}
  }, [userSplits]);
  const [open, setOpen] = React.useState(true);
  const [plan, setPlan] = React.useState(PLAN);
  const [exIdx, setExIdx] = React.useState(1); // Bench
  const ex = plan[exIdx] || null;

  // per-exercise memory: last logged weight + reps (seeded from last session)
  const [mem, setMem] = React.useState(() => {
    const m = {};
    PLAN.forEach((p) => { m[p.id] = { ...p.prev }; });
    return m;
  });
  const [sets, setSets] = React.useState({ bench: [{ w: 60, r: 8 }, { w: 60, r: 8 }] });
  const [curW, setCurW] = React.useState(60);
  const [curR, setCurR] = React.useState(8);
  const [flash, setFlash] = React.useState(0);

  // elapsed session time
  const [startTime, setStartTime] = React.useState(() => Date.now() - 14 * 60000);
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.floor((now - startTime) / 1000);
  const elapsedStr = Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');

  // start a session from a chosen split day → preloads its exercises
  const startDay = (exercises, name) => {
    const m = {};
    exercises.forEach((e) => { m[e.id] = { ...e.prev }; });
    setPlan(exercises);
    setMem(m);
    setSets({});
    setExIdx(0);
    setCurW(exercises[0].prev.w);
    setCurR(exercises[0].prev.r);
    setDayName(name);
    setStartTime(Date.now());
    setOpen(true);
    setSaveMode(false);
    setScreen('session');
  };

  // "I don't need a split" → a real, timed freestyle session
  // "Add your own split"   → a draft you name + save as a card (no timer)
  const startCustom = (kind) => {
    setPlan([]); setMem({}); setSets({}); setExIdx(0);
    setAdding(false);
    if (kind === 'own') {
      setDayName('My Split');
      setSaveMode(true);
    } else {
      setDayName('Quick Session');
      setSaveMode(false);
      setStartTime(Date.now());   // the freestyle session is a session of itself — start the clock
    }
    setLibOpen(true);   // jump straight into picking the first lift
    setOpen(false);
    setScreen('session');
  };

  // add a lift from the library into the current session
  const addFromLibrary = (lib) => {
    const at = plan.findIndex((p) => p.id === lib.id);
    if (at >= 0) { setExIdx(at); }
    else {
      setPlan((p) => [...p, lib]);
      setMem((m) => ({ ...m, [lib.id]: { ...lib.prev } }));
      setExIdx(plan.length);
    }
    setCurW(lib.prev.w); setCurR(lib.prev.r);
    setLibOpen(false);
    setOpen(true);
  };

  // finish / save — a saved custom session becomes a split card in the picker
  const finishSession = () => {
    if (saveMode) {
      const logged = plan.filter((p) => (sets[p.id] || []).length > 0);
      if (logged.length) {
        const exs = logged.map((p) => ({ id: p.id, name: p.name, equip: p.equip, plates: p.plates, max: p.max, prev: mem[p.id] || { w: curW, r: curR } }));
        const split = { id: 'u' + Date.now(), name: (dayName || 'My Split').trim(), custom: true, freq: 'Custom', days: [{ name: dayName || 'Session', exs }] };
        setUserSplits((s) => [split, ...s]);
      }
      setSaveMode(false);
    }
    setScreen('splits');
  };

  // switching exercise → recall its last weight/reps
  const pickExercise = (i) => {
    setExIdx(i);
    const m = mem[plan[i].id];
    if (m) { setCurW(m.w); setCurR(m.r); }
  };

  // "+" in the roller → new-exercise form (equipment is captured HERE, once)
  const [adding, setAdding] = React.useState(false);
  const [addName, setAddName] = React.useState('');
  const [addEquip, setAddEquip] = React.useState('barbell');
  const [addPlates, setAddPlates] = React.useState(12);
  const addExercise = () => {
    const name = addName.trim();
    if (!name) return;
    const id = 'x' + Date.now();
    const exNew = {
      id, name, equip: addEquip,
      ...(addEquip === 'barbell' ? { max: 160 } : addEquip === 'machine' ? { plates: addPlates } : {}),
    };
    const def = addEquip === 'barbell' ? { w: 20, r: 8 } : addEquip === 'dumbbell' ? { w: 10, r: 10 } : { w: 5, r: 10 };
    setPlan((p) => [...p, exNew]);
    setMem((m) => ({ ...m, [id]: def }));
    setExIdx(plan.length);
    setCurW(def.w);
    setCurR(def.r);
    setAdding(false);
    setAddName('');
  };

  const weightLadder = React.useMemo(
    () => (ex ? ladderFor(ex, t.mechanism, t.uniformStep) : []),
    [ex, t.mechanism, t.uniformStep]
  );

  // exercise library (from splits.jsx) for freeform picking
  const libList = React.useMemo(
    () => Object.keys(window.EX || {}).map((id) => ({ id, ...window.EX[id], cat: (window.CAT_BY_EX || {})[id] || 'Other' })),
    []
  );
  const libCats = window.CATS || ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

  // coarse + fine decomposition
  const fine = (() => {
    const rem = curW - Math.floor(curW / 5) * 5;
    return FINE_PLATES[nearestIndex(FINE_PLATES, rem)];
  })();
  const coarse = Math.round((curW - fine) / 5) * 5;

  // last-session markers (the value to beat)
  const prev = ex ? ex.prev : null;
  const showMark = t.lastMarker && prev;
  const repsMark = showMark ? nearestIndex(REPS, prev.r) : null;
  const weightMark = showMark && weightLadder[nearestIndex(weightLadder, prev.w)] === prev.w
    ? nearestIndex(weightLadder, prev.w) : null;
  const coarseMark = showMark ? nearestIndex(COARSE, prev.w) : null;

  const equipHint = ex && t.mechanism === 'Per-exercise' && ex.equip === 'dumbbell' ? ' · dumbbell' : '';
  const isPinStack = ex && t.mechanism === 'Per-exercise' && ex.equip === 'machine';

  // edit mode: reorder / delete plan exercises
  const movePlan = (from, to) => {
    const selId = ex && ex.id;
    const n = [...plan];
    const [it] = n.splice(from, 1);
    n.splice(to, 0, it);
    setPlan(n);
    if (selId) setExIdx(Math.max(0, n.findIndex((p) => p.id === selId)));
  };
  const deletePlan = (id) => {
    const selId = ex && ex.id;
    const n = plan.filter((p) => p.id !== id);
    setPlan(n);
    if (n.length === 0) { setEditPlan(false); setExIdx(0); setOpen(false); return; }
    const ni = selId === id ? Math.min(exIdx, n.length - 1) : Math.max(0, n.findIndex((p) => p.id === selId));
    setExIdx(ni);
    const nx = n[ni];
    const m = mem[nx.id] || nx.prev;
    setCurW(m.w); setCurR(m.r);
  };

  const logSet = () => {
    if (!ex) return;
    const entry = { w: curW, r: curR };
    setSets((s) => ({ ...s, [ex.id]: [...(s[ex.id] || []), entry] }));
    setMem((m) => ({ ...m, [ex.id]: entry }));
    setFlash((f) => f + 1);
    if (t.afterLog === 'Auto-close') setTimeout(() => setOpen(false), 480);
  };

  // sheet drag-to-dismiss
  const [dragY, setDragY] = React.useState(0);
  const sheetDrag = React.useRef(null);
  const onHandleDown = (e) => {
    sheetDrag.current = { y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e) => {
    if (!sheetDrag.current) return;
    setDragY(Math.max(0, e.clientY - sheetDrag.current.y));
  };
  const onHandleUp = (e) => {
    if (!sheetDrag.current) return;
    const dy = e.clientY - sheetDrag.current.y;
    sheetDrag.current = null;
    setDragY(0);
    if (dy > 110) setOpen(false);
  };

  const doneList = plan.filter((p) => (sets[p.id] || []).length > 0);

  const [splitExport, setSplitExport] = React.useState(null);

  const applyScene = React.useCallback((spec) => {
    if (!spec) return;
    if (spec.tweaks) setTweak(spec.tweaks);
    if (spec.screen != null) setScreen(spec.screen);
    if (spec.dayName != null) setDayName(spec.dayName);
    if (spec.saveMode != null) setSaveMode(spec.saveMode);
    if (spec.libOpen != null) setLibOpen(spec.libOpen);
    if (spec.libQuery != null) setLibQuery(spec.libQuery);
    if ('libMuscle' in spec) setLibMuscle(spec.libMuscle);
    if (spec.editPlan != null) setEditPlan(spec.editPlan);
    if (spec.open != null) setOpen(spec.open);
    if (spec.plan != null) setPlan(spec.plan);
    if (spec.exIdx != null) setExIdx(spec.exIdx);
    if (spec.mem != null) setMem(spec.mem);
    if (spec.sets != null) setSets(spec.sets);
    if (spec.curW != null) setCurW(spec.curW);
    if (spec.curR != null) setCurR(spec.curR);
    if (spec.adding != null) setAdding(spec.adding);
    if (spec.addName != null) setAddName(spec.addName);
    if (spec.addEquip != null) setAddEquip(spec.addEquip);
    if (spec.addPlates != null) setAddPlates(spec.addPlates);
    if (spec.userSplits != null) setUserSplits(spec.userSplits);
    if (spec.startTime != null) setStartTime(spec.startTime);
    if (spec.now != null) setNow(spec.now);
    if ('splitExport' in spec) setSplitExport(spec.splitExport);
    setDragY(0);
    setFlash(0);
  }, [setTweak]);

  React.useEffect(() => {
    document.body.classList.add('export-freeze');
    window.__gotoScene = applyScene;
    window.__exportReady = true;
    return () => {
      document.body.classList.remove('export-freeze');
      delete window.__gotoScene;
      delete window.__exportReady;
    };
  }, [applyScene]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8e8ec', padding: 24 }}>
      <IOSDevice>
        <div className={'app vibe-' + vibe} style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflow: 'hidden', '--accent': t.accent }}>

          {screen === 'start' && (
            <StartScreen onBegin={() => setScreen('splits')}></StartScreen>
          )}
          {screen === 'splits' && (
            <SplitPicker onBack={() => setScreen('start')} onStartDay={startDay} onStartCustom={startCustom} userSplits={userSplits} accent={t.accent} exportScene={splitExport}></SplitPicker>
          )}

          {screen === 'session' && (<React.Fragment>
          {/* ── Idle screen ── */}
          <div data-screen-label="Idle" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '110px 28px 48px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={dayName}
                  onChange={(e) => setDayName(e.target.value)}
                  spellCheck={false}
                  aria-label="Session name"
                  style={{
                    appearance: 'none', border: 'none', outline: 'none', background: 'transparent',
                    width: '100%', padding: 0, margin: 0, fontFamily: 'inherit',
                    fontSize: 'var(--title-size)', fontWeight: 700, color: 'var(--ink)',
                    textTransform: 'var(--caps)', letterSpacing: 'var(--track)',
                  }}
                ></input>
                {saveMode ? (
                  <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500, color: 'var(--mut)' }}>Unsaved · tap the name to rename</div>
                ) : (
                  <div style={{ marginTop: 6, fontSize: 16, fontWeight: 500, color: t.accent, fontVariantNumeric: 'tabular-nums' }}>{elapsedStr}</div>
                )}
              </div>
              <button
                onClick={finishSession}
                style={{ appearance: 'none', border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: saveMode ? t.accent : 'var(--mut)' }}
              >{saveMode ? 'Save' : 'Finish'}</button>
            </div>

            <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {doneList.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <div style={{ width: 92, fontSize: 17, fontWeight: 600, color: 'var(--ink)', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>{p.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 16, color: 'var(--sub)', fontVariantNumeric: 'tabular-nums' }}>
                    {(sets[p.id] || []).map((s, i) => (
                      <span key={i}>{fmtSet(p, s)}</span>
                    ))}
                  </div>
                </div>
              ))}
              {doneList.length === 0 && (
                <div style={{ fontSize: 15, color: 'var(--mut)' }}>{plan.length === 0 ? 'Add a lift to start logging.' : 'Nothing logged yet.'}</div>
              )}
            </div>

            <button
              onClick={() => (plan.length === 0 ? setLibOpen(true) : setOpen(true))}
              style={{
                marginTop: 'auto', height: 56, borderRadius: 'var(--r-log)', border: 'none', cursor: 'pointer',
                background: 'var(--log-bg)', color: 'var(--log-fg)',
                fontFamily: 'inherit', fontSize: 16, fontWeight: 700, letterSpacing: '0.12em',
              }}
            >{plan.length === 0 ? 'ADD EXERCISE' : 'LOG'}</button>
          </div>

          {/* ── Scrim ── */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)',
              opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
              transition: 'opacity 360ms',
            }}
          ></div>

          {/* ── Logger sheet ── */}
          <div
            data-screen-label="Logger sheet"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              background: 'var(--sheet)',
              borderRadius: '28px 28px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
              padding: '8px 24px 44px',
              transform: open ? `translateY(${dragY}px)` : 'translateY(110%)',
              transition: sheetDrag.current ? 'none' : 'transform 480ms cubic-bezier(.3,1.18,.36,1)',
            }}
          >
            {/* grabber / drag handle */}
            <div
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 10px', cursor: 'grab', touchAction: 'none' }}
            >
              <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--pill)' }}></div>
            </div>

            {/* ── Touch-test calibration: hold a real bank card to the screen ── */}
            {t.touchTest && isPinStack && t.machinePicker === 'Pin stack' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <div style={{
                  width: '85.6mm', maxWidth: '100%', height: '20px',
                  border: '1px dashed rgba(255,69,58,0.6)', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 600, color: '#FF453A', letterSpacing: '0.03em',
                }}>← hold a bank card here to check scale →</div>
              </div>
            )}

            {!editPlan ? (<React.Fragment>
            {/* wheel labels */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <div style={{ width: 120, textAlign: 'center', fontSize: 13, color: 'var(--mut)', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>Reps</div>
              {t.mechanism === 'Coarse + fine' ? (
                <React.Fragment>
                  <div style={{ width: 110, textAlign: 'center', fontSize: 13, color: 'var(--mut)', whiteSpace: 'nowrap', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>Weight · kg</div>
                  <div style={{ width: 84, textAlign: 'center', fontSize: 13, color: 'var(--mut)', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>Plates</div>
                </React.Fragment>
              ) : (
                <div style={{ width: isPinStack ? 168 : 150, textAlign: 'center', fontSize: 13, color: 'var(--mut)', whiteSpace: 'nowrap', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>{isPinStack ? '' : ex && ex.equip === 'machine' ? 'Stack' : 'Weight · kg' + equipHint}</div>
              )}
            </div>

            {/* wheels */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              <WheelPicker
                width={120}
                values={REPS}
                index={nearestIndex(REPS, curR)}
                onChange={(i) => setCurR(REPS[i])}
                markIndex={repsMark}
                accent={t.accent}
              />
              {t.mechanism === 'Coarse + fine' ? (
                <React.Fragment>
                  <WheelPicker
                    width={110}
                    values={COARSE}
                    index={nearestIndex(COARSE, coarse)}
                    onChange={(i) => setCurW(COARSE[i] + fine)}
                    format={fmtKg}
                    markIndex={coarseMark}
                    accent={t.accent}
                  />
                  <WheelPicker
                    width={84}
                    values={FINE_PLATES}
                    index={nearestIndex(FINE_PLATES, fine)}
                    onChange={(i) => setCurW(coarse + FINE_PLATES[i])}
                    format={fmtFine}
                  />
                </React.Fragment>
              ) : isPinStack && t.machinePicker === 'Pin stack' ? (
                <PinStack
                  count={ex.plates}
                  value={Math.round(curW)}
                  onChange={(p) => setCurW(p)}
                  markValue={showMark ? prev.w : null}
                  relative={t.pinDrag === 'Relative'}
                  touchTest={t.touchTest}
                />
              ) : (
                <WheelPicker
                  width={150}
                  values={weightLadder}
                  index={nearestIndex(weightLadder, curW)}
                  onChange={(i) => setCurW(weightLadder[i])}
                  format={fmtKg}
                  markIndex={weightMark}
                  accent={t.accent}
                />
              )}
            </div>

            {/* exercise roller — the preloaded session plan, in plan order */}
            <div style={{ marginTop: 12 }}>
              <ExerciseRoller items={plan} index={exIdx} onChange={pickExercise} accent={t.accent} onAdd={() => setLibOpen(true)} onLongPress={() => setEditPlan(true)} />
            </div>
            </React.Fragment>) : (
            <React.Fragment>
              {/* ── Edit mode: wiggle, drag to reorder, drop on the bin to delete ── */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 4px 8px' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Edit exercises</span>
                <span style={{ fontSize: 12, color: 'var(--mut)' }}>drag to reorder · bin to remove</span>
              </div>
              <ExerciseEditList items={plan} selectedId={ex && ex.id} onMove={movePlan} onDelete={deletePlan}></ExerciseEditList>
            </React.Fragment>
            )}

            {/* LOG */}
            <button
              key={flash}
              onClick={editPlan ? () => setEditPlan(false) : logSet}
              className={flash > 0 && !editPlan ? 'log-flash' : ''}
              style={{
                marginTop: 14, width: '100%', height: 58, borderRadius: 'var(--r-log)',
                border: 'none', cursor: 'pointer',
                background: 'var(--log-bg)', color: 'var(--log-fg)',
                fontFamily: 'inherit', fontSize: 17, fontWeight: 700, letterSpacing: '0.14em',
              }}
            >{editPlan ? 'DONE' : 'LOG'}</button>

            {/* ── New exercise form — equipment captured once, here ── */}
            {adding && (
              <div
                data-screen-label="New exercise"
                style={{
                  position: 'absolute', inset: 0, borderRadius: '28px 28px 0 0',
                  background: 'var(--sheet)', padding: '26px 24px 44px',
                  display: 'flex', flexDirection: 'column', gap: 22,
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--mut)', textAlign: 'center', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>New exercise</div>
                <input
                  autoFocus
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addExercise(); }}
                  placeholder="Exercise name"
                  style={{
                    appearance: 'none', border: 'none', outline: 'none',
                    background: 'var(--pill)', borderRadius: 'var(--r-pill)',
                    padding: '14px 16px', fontFamily: 'inherit', fontSize: 17,
                    color: 'var(--ink)', textAlign: 'center',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--mut)', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>Equipment</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['barbell', 'dumbbell', 'machine'].map((eq) => (
                      <button
                        key={eq}
                        onClick={() => setAddEquip(eq)}
                        style={{
                          flex: 1, padding: '12px 0', borderRadius: 'var(--r-pill)',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          fontSize: 15, fontWeight: addEquip === eq ? 600 : 400,
                          background: addEquip === eq ? 'var(--ink)' : 'var(--pill)',
                          color: addEquip === eq ? 'var(--sheet)' : 'var(--sub)',
                          textTransform: 'capitalize',
                          transition: 'background 160ms, color 160ms',
                        }}
                      >{eq}</button>
                    ))}
                  </div>
                </div>
                {addEquip === 'machine' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 13, color: 'var(--mut)', textTransform: 'var(--caps)', letterSpacing: 'var(--track)' }}>Plates in the stack</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[8, 10, 12, 14, 16, 20].map((n) => (
                        <button
                          key={n}
                          onClick={() => setAddPlates(n)}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 'var(--r-pill)',
                            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: 15, fontWeight: addPlates === n ? 600 : 400,
                            fontVariantNumeric: 'tabular-nums',
                            background: addPlates === n ? 'var(--ink)' : 'var(--pill)',
                            color: addPlates === n ? 'var(--sheet)' : 'var(--sub)',
                            transition: 'background 160ms, color 160ms',
                          }}
                        >{n}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={addExercise}
                    disabled={!addName.trim()}
                    style={{
                      width: '100%', height: 58, borderRadius: 'var(--r-log)',
                      border: 'none', cursor: addName.trim() ? 'pointer' : 'default',
                      background: 'var(--log-bg)', color: 'var(--log-fg)',
                      opacity: addName.trim() ? 1 : 0.35,
                      fontFamily: 'inherit', fontSize: 17, fontWeight: 700, letterSpacing: '0.14em',
                      transition: 'opacity 160ms',
                    }}
                  >ADD TO PLAN</button>
                  <button
                    onClick={() => { setAdding(false); setAddName(''); }}
                    style={{
                      appearance: 'none', border: 'none', background: 'none', cursor: 'pointer',
                      padding: 6, fontFamily: 'inherit', fontSize: 15, color: 'var(--sub)',
                    }}
                  >Cancel</button>
                </div>
              </div>
            )}
          </div>
          {/* ── Exercise library picker (freeform add) ── */}
          <div
            onClick={() => setLibOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)', opacity: libOpen ? 1 : 0, pointerEvents: libOpen ? 'auto' : 'none', transition: 'opacity 320ms' }}
          ></div>
          <div
            data-screen-label="Exercise library"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: '84%',
              background: 'var(--sheet)', borderRadius: '26px 26px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.16)',
              transform: libOpen ? 'translateY(0)' : 'translateY(110%)',
              transition: 'transform 460ms cubic-bezier(.3,1.18,.36,1)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
              <div style={{ width: 38, height: 5, borderRadius: 3, background: 'var(--pill)' }}></div>
            </div>
            <div style={{ padding: '0 22px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Add exercise</div>
              <input
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
                placeholder="Search lifts"
                spellCheck={false}
                style={{ appearance: 'none', border: 'none', outline: 'none', background: 'var(--pill)', borderRadius: 'var(--r-pill)', padding: '12px 14px', fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)' }}
              ></input>
            </div>
            <div className="wheel-scroll" style={{ flex: 1, overflowY: 'auto', padding: '2px 22px 28px', display: 'flex', flexDirection: 'column' }}>
              {libQuery.trim() ? (
                /* search — flat results, bypasses the map */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {libList.filter((e) => e.name.toLowerCase().includes(libQuery.trim().toLowerCase())).map((e) => (
                    <LibRow key={e.id} e={e} onPick={addFromLibrary}></LibRow>
                  ))}
                </div>
              ) : (
                <React.Fragment>
                  {/* anatomy map — the body is the category list */}
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 4px' }}>
                    <MuscleMap selected={libMuscle} onPick={(m) => setLibMuscle(m === libMuscle ? null : m)} width={236}></MuscleMap>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '6px 2px 8px' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: libMuscle ? '#E23B43' : 'var(--mut)' }}>
                      {libMuscle ? (window.MUSCLE_LABEL || {})[libMuscle] || libMuscle : 'Tap a muscle'}
                    </span>
                    {libMuscle && (
                      <span style={{ fontSize: 12, color: 'var(--mut)', fontVariantNumeric: 'tabular-nums' }}>
                        {libList.filter((e) => ((window.MUSCLE_BY_EX || {})[e.id] || []).includes(libMuscle)).length} lifts
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {libMuscle && libList.filter((e) => ((window.MUSCLE_BY_EX || {})[e.id] || []).includes(libMuscle)).map((e) => (
                      <LibRow key={e.id} e={e} onPick={addFromLibrary}></LibRow>
                    ))}
                  </div>
                </React.Fragment>
              )}
              <button
                onClick={() => { setLibOpen(false); setAdding(true); setOpen(true); }}
                className="tap"
                style={{ width: '100%', flex: '0 0 auto', marginTop: 10, appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', border: '2px dashed var(--mut)', borderRadius: 12, padding: '13px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--sub)', fontSize: 14, fontWeight: 600 }}
              ><span style={{ fontSize: 18, fontWeight: 300, lineHeight: 0.6 }}>+</span> Create custom exercise</button>
            </div>
          </div>
          </React.Fragment>)}
        </div>
      </IOSDevice>

      {/* ── Tweaks ── */}
      <TweaksPanel>
        <TweakSection label="Vibe"></TweakSection>
        <TweakRadio label="Visual" value={t.vibe} options={['Native', 'Mono', 'Athletic']} onChange={(v) => setTweak('vibe', v)}></TweakRadio>
        <TweakColor label="Accent" value={t.accent} options={['#0A84FF', '#FF375F', '#30D158', '#FF9F0A']} onChange={(v) => setTweak('accent', v)}></TweakColor>
        <TweakSection label="Weight wheel"></TweakSection>
        <TweakRadio label="Mechanism" value={t.mechanism} options={['Per-exercise', 'Uniform', 'Coarse + fine']} onChange={(v) => setTweak('mechanism', v)}></TweakRadio>
        <TweakRadio label="Machine picker" value={t.machinePicker} options={['Pin stack', 'Wheel']} onChange={(v) => setTweak('machinePicker', v)}></TweakRadio>
        <TweakRadio label="Pin drag" value={t.pinDrag} options={['Relative', 'Absolute']} onChange={(v) => setTweak('pinDrag', v)}></TweakRadio>
        <TweakToggle label="Touch test (finger overlay)" value={t.touchTest} onChange={(v) => setTweak('touchTest', v)}></TweakToggle>
        {t.mechanism === 'Uniform' && (
          <TweakSlider label="Step" value={t.uniformStep} min={0.5} max={5} step={0.5} unit=" kg" onChange={(v) => setTweak('uniformStep', v)}></TweakSlider>
        )}
        <TweakSection label="Behavior"></TweakSection>
        <TweakRadio label="After LOG" value={t.afterLog} options={['Stay open', 'Auto-close']} onChange={(v) => setTweak('afterLog', v)}></TweakRadio>
        <TweakToggle label="PR marker" value={t.lastMarker} onChange={(v) => setTweak('lastMarker', v)}></TweakToggle>
        <TweakButton label="Clear logged sets" onClick={() => setSets({})}></TweakButton>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App></App>);
