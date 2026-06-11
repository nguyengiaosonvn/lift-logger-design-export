// splits.jsx — Start screen + Split picker + the split/exercise library.
// Equipment decides the metric: barbell/dumbbell = kg, machine = pin stack.
// Exports (to window): SPLITS, buildDay, StartScreen, SplitPicker

// ── Exercise library. equip drives the logging metric. ──
//   barbell  → kg, plate math (max = top of ladder)
//   dumbbell → kg, fixed rack ladder
//   machine  → pin stack (plates = number of plates in the stack); prev.w is a PIN number
const EX = {
  // Barbell (kg)
  squat:    { name: 'Squat',          equip: 'barbell', max: 220, prev: { w: 100, r: 5 } },
  front:    { name: 'Front Squat',    equip: 'barbell', max: 160, prev: { w: 70, r: 6 } },
  bench:    { name: 'Bench',          equip: 'barbell', max: 160, prev: { w: 72.5, r: 6 } },
  incbench: { name: 'Incline Bench',  equip: 'barbell', max: 140, prev: { w: 60, r: 6 } },
  dead:     { name: 'Deadlift',       equip: 'barbell', max: 280, prev: { w: 130, r: 4 } },
  rdl:      { name: 'Romanian DL',    equip: 'barbell', max: 200, prev: { w: 90, r: 8 } },
  ohp:      { name: 'OHP',            equip: 'barbell', max: 110, prev: { w: 47.5, r: 6 } },
  bbrow:    { name: 'Barbell Row',    equip: 'barbell', max: 160, prev: { w: 75, r: 8 } },
  bbcurl:   { name: 'Barbell Curl',   equip: 'barbell', max: 80,  prev: { w: 37.5, r: 8 } },
  hipthrust:{ name: 'Hip Thrust',     equip: 'barbell', max: 240, prev: { w: 110, r: 10 } },

  // Dumbbell (kg, rack)
  dbpress:  { name: 'DB Shoulder Press', equip: 'dumbbell', prev: { w: 24, r: 9 } },
  incdb:    { name: 'Incline DB Press',  equip: 'dumbbell', prev: { w: 28, r: 9 } },
  dbcurl:   { name: 'DB Curl',           equip: 'dumbbell', prev: { w: 14, r: 10 } },
  hammer:   { name: 'Hammer Curl',       equip: 'dumbbell', prev: { w: 16, r: 10 } },
  latraise: { name: 'Lateral Raise',     equip: 'dumbbell', prev: { w: 10, r: 14 } },
  dbrow:    { name: 'DB Row',            equip: 'dumbbell', prev: { w: 30, r: 10 } },
  shrug:    { name: 'DB Shrug',          equip: 'dumbbell', prev: { w: 32.5, r: 12 } },
  ohext:    { name: 'OH Extension',      equip: 'dumbbell', prev: { w: 18, r: 12 } },
  dblunge:  { name: 'DB Lunge',          equip: 'dumbbell', prev: { w: 20, r: 10 } },

  // Machine (pin stack) — prev.w is the pin number
  latpull:  { name: 'Lat Pulldown',     equip: 'machine', plates: 20, prev: { w: 12, r: 10 } },
  seatrow:  { name: 'Seated Row',       equip: 'machine', plates: 20, prev: { w: 13, r: 10 } },
  legpress: { name: 'Leg Press',        equip: 'machine', plates: 20, prev: { w: 15, r: 10 } },
  legcurl:  { name: 'Leg Curl',         equip: 'machine', plates: 15, prev: { w: 9, r: 12 } },
  legext:   { name: 'Leg Extension',    equip: 'machine', plates: 15, prev: { w: 10, r: 12 } },
  pushdown: { name: 'Tricep Pushdown',  equip: 'machine', plates: 15, prev: { w: 9, r: 12 } },
  cablefly: { name: 'Cable Fly',        equip: 'machine', plates: 15, prev: { w: 8, r: 12 } },
  pecdeck:  { name: 'Pec Deck',         equip: 'machine', plates: 15, prev: { w: 10, r: 12 } },
  facepull: { name: 'Face Pull',        equip: 'machine', plates: 12, prev: { w: 6, r: 15 } },
  reardelt: { name: 'Rear Delt Fly',    equip: 'machine', plates: 12, prev: { w: 7, r: 15 } },
  calf:     { name: 'Calf Raise',       equip: 'machine', plates: 20, prev: { w: 14, r: 15 } },
  pullover: { name: 'Pullover',         equip: 'machine', plates: 15, prev: { w: 10, r: 12 } },
  cablecurl:{ name: 'Cable Curl',       equip: 'machine', plates: 12, prev: { w: 8, r: 12 } },
  abs:      { name: 'Cable Crunch',     equip: 'machine', plates: 15, prev: { w: 9, r: 15 } },
};

function buildDay(keys) {
  return keys.map((k) => ({ id: k, ...EX[k] }));
}

// ── which muscles each lift trains (drives the anatomy art) + a body-part category ──
const MUSCLE_BY_EX = {
  squat: ['quads', 'glutes', 'hamstrings', 'lower_back', 'abs'], front: ['quads', 'glutes', 'abs'],
  bench: ['chest', 'shoulders', 'triceps'], incbench: ['chest', 'shoulders', 'triceps'],
  dead: ['lower_back', 'glutes', 'hamstrings', 'traps', 'lats', 'forearms'], rdl: ['hamstrings', 'glutes', 'lower_back'],
  ohp: ['shoulders', 'triceps', 'traps'], bbrow: ['lats', 'traps', 'biceps'], bbcurl: ['biceps', 'forearms'],
  hipthrust: ['glutes', 'hamstrings'], dbpress: ['shoulders', 'triceps'], incdb: ['chest', 'shoulders'],
  dbcurl: ['biceps', 'forearms'], hammer: ['biceps', 'forearms'], latraise: ['shoulders'], dbrow: ['lats', 'traps', 'biceps'],
  shrug: ['traps'], ohext: ['triceps'], dblunge: ['quads', 'glutes', 'hamstrings'], latpull: ['lats', 'biceps'],
  seatrow: ['lats', 'traps', 'biceps'], legpress: ['quads', 'glutes'], legcurl: ['hamstrings'], legext: ['quads'],
  pushdown: ['triceps'], cablefly: ['chest'], pecdeck: ['chest'], facepull: ['shoulders', 'traps'], reardelt: ['shoulders'],
  calf: ['calves'], pullover: ['lats', 'chest'], cablecurl: ['biceps'], abs: ['abs'],
};
const CAT_BY_EX = {
  bench: 'Chest', incbench: 'Chest', incdb: 'Chest', cablefly: 'Chest', pecdeck: 'Chest',
  dead: 'Back', bbrow: 'Back', dbrow: 'Back', latpull: 'Back', seatrow: 'Back', shrug: 'Back', pullover: 'Back',
  ohp: 'Shoulders', dbpress: 'Shoulders', latraise: 'Shoulders', facepull: 'Shoulders', reardelt: 'Shoulders',
  bbcurl: 'Arms', dbcurl: 'Arms', hammer: 'Arms', ohext: 'Arms', pushdown: 'Arms', cablecurl: 'Arms',
  squat: 'Legs', front: 'Legs', rdl: 'Legs', hipthrust: 'Legs', dblunge: 'Legs', legpress: 'Legs', legcurl: 'Legs', legext: 'Legs', calf: 'Legs',
  abs: 'Core',
};
const CATS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

function exMuscles(id) { return MUSCLE_BY_EX[id] || []; }
function splitMuscles(split) {
  const set = new Set();
  split.days.forEach((d) => {
    const ids = d.exs ? d.exs.map((e) => e.id) : d.keys;
    ids.forEach((id) => exMuscles(id).forEach((m) => set.add(m)));
  });
  return [...set];
}

// front + back anatomy figure; the `active` muscles light up red
function MuscleFigure({ active = [], width = 128 }) {
  const set = active.includes('all') ? null : active;
  const on = (m) => (set === null ? true : set.indexOf(m) >= 0);
  const base = '#d3d4da';
  const f = (m) => (on(m) ? 'url(#mmHot)' : base);
  const Base = () => (
    <React.Fragment>
      <ellipse cx="50" cy="16" rx="9" ry="10" fill={base}></ellipse>
      <rect x="45" y="24" width="10" height="7" fill={base}></rect>
      <path d="M34 38 Q50 34 66 38 L62 92 Q50 97 38 92 Z" fill={base}></path>
      <path d="M39 90 L61 90 L58 104 L42 104 Z" fill={base}></path>
      <ellipse cx="24" cy="58" rx="6" ry="13" fill={base}></ellipse>
      <ellipse cx="76" cy="58" rx="6" ry="13" fill={base}></ellipse>
      <ellipse cx="19" cy="83" rx="5" ry="12" fill={base}></ellipse>
      <ellipse cx="81" cy="83" rx="5" ry="12" fill={base}></ellipse>
      <ellipse cx="43" cy="130" rx="8" ry="24" fill={base}></ellipse>
      <ellipse cx="57" cy="130" rx="8" ry="24" fill={base}></ellipse>
      <ellipse cx="43" cy="178" rx="6" ry="22" fill={base}></ellipse>
      <ellipse cx="57" cy="178" rx="6" ry="22" fill={base}></ellipse>
    </React.Fragment>
  );
  return (
    <svg viewBox="0 0 200 210" width={width} height={width * 210 / 200} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="mmHot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF7A6B"></stop><stop offset="1" stopColor="#E23B43"></stop>
        </linearGradient>
      </defs>
      <g>
        <Base></Base>
        <ellipse cx="31" cy="41" rx="8" ry="7" fill={f('shoulders')}></ellipse>
        <ellipse cx="69" cy="41" rx="8" ry="7" fill={f('shoulders')}></ellipse>
        <ellipse cx="42" cy="51" rx="8" ry="6" fill={f('chest')}></ellipse>
        <ellipse cx="58" cy="51" rx="8" ry="6" fill={f('chest')}></ellipse>
        <rect x="43" y="60" width="14" height="26" rx="4" fill={f('abs')}></rect>
        <ellipse cx="24" cy="56" rx="5.2" ry="10" fill={f('biceps')}></ellipse>
        <ellipse cx="76" cy="56" rx="5.2" ry="10" fill={f('biceps')}></ellipse>
        <ellipse cx="19" cy="82" rx="4.2" ry="9" fill={f('forearms')}></ellipse>
        <ellipse cx="81" cy="82" rx="4.2" ry="9" fill={f('forearms')}></ellipse>
        <ellipse cx="43" cy="128" rx="7" ry="21" fill={f('quads')}></ellipse>
        <ellipse cx="57" cy="128" rx="7" ry="21" fill={f('quads')}></ellipse>
      </g>
      <g transform="translate(100,0)">
        <Base></Base>
        <ellipse cx="31" cy="41" rx="8" ry="7" fill={f('shoulders')}></ellipse>
        <ellipse cx="69" cy="41" rx="8" ry="7" fill={f('shoulders')}></ellipse>
        <path d="M38 33 L62 33 L66 48 L34 48 Z" fill={f('traps')}></path>
        <path d="M36 50 L47 54 L45 76 L35 72 Z" fill={f('lats')}></path>
        <path d="M64 50 L53 54 L55 76 L65 72 Z" fill={f('lats')}></path>
        <rect x="44" y="72" width="12" height="16" rx="3" fill={f('lower_back')}></rect>
        <ellipse cx="24" cy="56" rx="5.2" ry="10" fill={f('triceps')}></ellipse>
        <ellipse cx="76" cy="56" rx="5.2" ry="10" fill={f('triceps')}></ellipse>
        <ellipse cx="43" cy="106" rx="8" ry="9" fill={f('glutes')}></ellipse>
        <ellipse cx="57" cy="106" rx="8" ry="9" fill={f('glutes')}></ellipse>
        <ellipse cx="43" cy="140" rx="7" ry="19" fill={f('hamstrings')}></ellipse>
        <ellipse cx="57" cy="140" rx="7" ry="19" fill={f('hamstrings')}></ellipse>
        <ellipse cx="43" cy="182" rx="5.5" ry="15" fill={f('calves')}></ellipse>
        <ellipse cx="57" cy="182" rx="5.5" ry="15" fill={f('calves')}></ellipse>
      </g>
    </svg>
  );
}

const MUSCLE_LABEL = {
  chest: 'Chest', shoulders: 'Shoulders', traps: 'Traps', lats: 'Lats', lower_back: 'Lower back',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', abs: 'Abs',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
};

// interactive anatomy map — tap a muscle to browse its lifts
function MuscleMap({ selected, onPick, width = 250 }) {
  const body = '#dcdde2';
  const off = '#c2c4cd';
  const f = (m) => (selected === m ? 'url(#mmHot2)' : off);
  const S = { stroke: 'transparent', strokeWidth: 10 };
  const G = ({ m, children }) => (
    <g onClick={() => onPick(m)} style={{ cursor: 'pointer' }}>{children}</g>
  );
  const Base = () => (
    <React.Fragment>
      <ellipse cx="50" cy="16" rx="9" ry="10" fill={body}></ellipse>
      <rect x="45" y="24" width="10" height="7" fill={body}></rect>
      <path d="M34 38 Q50 34 66 38 L62 92 Q50 97 38 92 Z" fill={body}></path>
      <path d="M39 90 L61 90 L58 104 L42 104 Z" fill={body}></path>
      <ellipse cx="24" cy="58" rx="6" ry="13" fill={body}></ellipse>
      <ellipse cx="76" cy="58" rx="6" ry="13" fill={body}></ellipse>
      <ellipse cx="19" cy="83" rx="5" ry="12" fill={body}></ellipse>
      <ellipse cx="81" cy="83" rx="5" ry="12" fill={body}></ellipse>
      <ellipse cx="43" cy="130" rx="8" ry="24" fill={body}></ellipse>
      <ellipse cx="57" cy="130" rx="8" ry="24" fill={body}></ellipse>
      <ellipse cx="43" cy="178" rx="6" ry="22" fill={body}></ellipse>
      <ellipse cx="57" cy="178" rx="6" ry="22" fill={body}></ellipse>
    </React.Fragment>
  );
  return (
    <svg viewBox="0 0 200 218" width={width} height={width * 218 / 200} style={{ display: 'block', touchAction: 'manipulation' }}>
      <defs>
        <linearGradient id="mmHot2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF7A6B"></stop><stop offset="1" stopColor="#E23B43"></stop>
        </linearGradient>
      </defs>
      {/* front */}
      <g>
        <Base></Base>
        <G m="shoulders"><ellipse cx="31" cy="41" rx="8" ry="7" fill={f('shoulders')} {...S}></ellipse><ellipse cx="69" cy="41" rx="8" ry="7" fill={f('shoulders')} {...S}></ellipse></G>
        <G m="chest"><ellipse cx="42" cy="51" rx="8" ry="6" fill={f('chest')} {...S}></ellipse><ellipse cx="58" cy="51" rx="8" ry="6" fill={f('chest')} {...S}></ellipse></G>
        <G m="abs"><rect x="43" y="60" width="14" height="26" rx="4" fill={f('abs')} {...S}></rect></G>
        <G m="biceps"><ellipse cx="24" cy="56" rx="5.2" ry="10" fill={f('biceps')} {...S}></ellipse><ellipse cx="76" cy="56" rx="5.2" ry="10" fill={f('biceps')} {...S}></ellipse></G>
        <G m="forearms"><ellipse cx="19" cy="82" rx="4.2" ry="9" fill={f('forearms')} {...S}></ellipse><ellipse cx="81" cy="82" rx="4.2" ry="9" fill={f('forearms')} {...S}></ellipse></G>
        <G m="quads"><ellipse cx="43" cy="128" rx="7" ry="21" fill={f('quads')} {...S}></ellipse><ellipse cx="57" cy="128" rx="7" ry="21" fill={f('quads')} {...S}></ellipse></G>
      </g>
      {/* back */}
      <g transform="translate(100,0)">
        <Base></Base>
        <G m="shoulders"><ellipse cx="31" cy="41" rx="8" ry="7" fill={f('shoulders')} {...S}></ellipse><ellipse cx="69" cy="41" rx="8" ry="7" fill={f('shoulders')} {...S}></ellipse></G>
        <G m="traps"><path d="M38 33 L62 33 L66 48 L34 48 Z" fill={f('traps')} {...S}></path></G>
        <G m="lats"><path d="M36 50 L47 54 L45 76 L35 72 Z" fill={f('lats')} {...S}></path><path d="M64 50 L53 54 L55 76 L65 72 Z" fill={f('lats')} {...S}></path></G>
        <G m="lower_back"><rect x="44" y="72" width="12" height="16" rx="3" fill={f('lower_back')} {...S}></rect></G>
        <G m="triceps"><ellipse cx="24" cy="56" rx="5.2" ry="10" fill={f('triceps')} {...S}></ellipse><ellipse cx="76" cy="56" rx="5.2" ry="10" fill={f('triceps')} {...S}></ellipse></G>
        <G m="glutes"><ellipse cx="43" cy="106" rx="8" ry="9" fill={f('glutes')} {...S}></ellipse><ellipse cx="57" cy="106" rx="8" ry="9" fill={f('glutes')} {...S}></ellipse></G>
        <G m="hamstrings"><ellipse cx="43" cy="140" rx="7" ry="19" fill={f('hamstrings')} {...S}></ellipse><ellipse cx="57" cy="140" rx="7" ry="19" fill={f('hamstrings')} {...S}></ellipse></G>
        <G m="calves"><ellipse cx="43" cy="182" rx="5.5" ry="15" fill={f('calves')} {...S}></ellipse><ellipse cx="57" cy="182" rx="5.5" ry="15" fill={f('calves')} {...S}></ellipse></G>
      </g>
      <text x="50" y="214" textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="1.5" fill="#a3a5ad">FRONT</text>
      <text x="150" y="214" textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="1.5" fill="#a3a5ad">BACK</text>
    </svg>
  );
}

const SPLITS = [
  {
    id: 'fullbody', name: 'Full Body', level: 'Beginner', freq: '3 days / week',
    blurb: 'One workout hits everything. The simplest way to start and the hardest to mess up.',
    days: [
      { name: 'Day A', keys: ['squat', 'bench', 'bbrow', 'latpull', 'legcurl', 'dbcurl'] },
      { name: 'Day B', keys: ['dead', 'ohp', 'legpress', 'seatrow', 'latraise', 'pushdown'] },
    ],
  },
  {
    id: 'upperlower', name: 'Upper / Lower', level: 'Intermediate', freq: '4 days / week',
    blurb: 'Split the body in half. Twice the volume per muscle, twice a week.',
    days: [
      { name: 'Upper', keys: ['bench', 'bbrow', 'ohp', 'latpull', 'dbcurl', 'pushdown'] },
      { name: 'Lower', keys: ['squat', 'rdl', 'legpress', 'legcurl', 'legext', 'calf'] },
    ],
  },
  {
    id: 'ppl', name: 'Push / Pull / Legs', level: 'Intermediate', freq: '6 days / week',
    blurb: 'The classic. Group lifts by movement so nothing gets trained two days running.',
    days: [
      { name: 'Push', keys: ['bench', 'ohp', 'incdb', 'latraise', 'cablefly', 'pushdown'] },
      { name: 'Pull', keys: ['dead', 'bbrow', 'latpull', 'seatrow', 'dbcurl', 'facepull'] },
      { name: 'Legs', keys: ['squat', 'rdl', 'legpress', 'legcurl', 'legext', 'calf'] },
    ],
  },
  {
    id: 'bro', name: 'Bro Split', level: 'Advanced', freq: '5 days / week',
    blurb: 'One muscle group a day. Maximum focus and volume — for lifters who recover well.',
    days: [
      { name: 'Chest',     keys: ['bench', 'incbench', 'incdb', 'cablefly', 'pecdeck'] },
      { name: 'Back',      keys: ['dead', 'bbrow', 'latpull', 'seatrow', 'pullover'] },
      { name: 'Shoulders', keys: ['ohp', 'dbpress', 'latraise', 'reardelt', 'shrug'] },
      { name: 'Legs',      keys: ['squat', 'rdl', 'legpress', 'legcurl', 'calf'] },
      { name: 'Arms',      keys: ['bbcurl', 'dbcurl', 'hammer', 'pushdown', 'ohext', 'cablecurl'] },
    ],
  },
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LEVEL_COLOR = { Beginner: '#1F8A5B', Intermediate: '#2A6FDB', Advanced: '#C2410C' };

// ── Start screen — just begin ──
function StartScreen({ onBegin }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
      <div style={{ position: 'absolute', top: 96, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', color: 'var(--mut)', textTransform: 'uppercase' }}>Pin</div>
      </div>

      {/* stack emblem */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 30 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            width: 84 - i * 4, height: 13, borderRadius: 3, alignSelf: 'center',
            background: i === 2 ? 'linear-gradient(180deg,#F4D479,#E7B23E 52%,#D49A28)' : 'var(--ink)',
            opacity: i === 2 ? 1 : 0.9,
          }}></div>
        ))}
      </div>

      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', textAlign: 'center', textWrap: 'balance', marginBottom: 6 }}>Ready to lift?</div>
      <div style={{ fontSize: 15, color: 'var(--sub)', textAlign: 'center', marginBottom: 40, textWrap: 'balance' }}>Pick a split and we'll load the bar.</div>

      <button
        onClick={onBegin}
        style={{
          width: '100%', maxWidth: 280, height: 58, borderRadius: 'var(--r-log)',
          border: 'none', cursor: 'pointer', background: 'var(--log-bg)', color: 'var(--log-fg)',
          fontFamily: 'inherit', fontSize: 16, fontWeight: 700, letterSpacing: '0.12em',
        }}
      >START SESSION</button>
    </div>
  );
}

// ── Split picker — a grid of splits (anatomy art), tap to start; "+" for freeform/custom ──
function SplitPicker({ onBack, onStartDay, onStartCustom, userSplits = [], accent, exportScene = null }) {
  const scrollRef = React.useRef(null);
  const moved = React.useRef(false);
  const fling = React.useRef(0);
  const [sheetSplit, setSheetSplit] = React.useState(null); // preset whose days are shown
  const [plusOpen, setPlusOpen] = React.useState(false);

  React.useEffect(() => {
    if (!exportScene) return;
    if (exportScene.sheetSplit) {
      const hit = SPLITS.find((s) => s.id === exportScene.sheetSplit);
      if (hit) setSheetSplit(hit);
    }
    if (exportScene.plusOpen) setPlusOpen(true);
    if (exportScene.scrollY != null && scrollRef.current) {
      scrollRef.current.scrollTop = exportScene.scrollY;
    }
  }, [exportScene]);

  // mouse drag-to-scroll with momentum fling (touch keeps native momentum)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    cancelAnimationFrame(fling.current);
    const start = { y0: e.clientY, lastY: e.clientY, lastT: performance.now(), v: 0 };
    moved.current = false;
    const move = (ev) => {
      const dy = ev.clientY - start.lastY;
      if (Math.abs(ev.clientY - start.y0) > 4) moved.current = true;
      el.scrollTop -= dy;
      const now = performance.now();
      start.v = -dy / Math.max(1, now - start.lastT);
      start.lastY = ev.clientY; start.lastT = now;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      let v = start.v * 16;
      if (Math.abs(v) < 0.6) return;
      const decay = () => {
        el.scrollTop += v; v *= 0.95;
        if (Math.abs(v) > 0.3) fling.current = requestAnimationFrame(decay);
      };
      fling.current = requestAnimationFrame(decay);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const onClickCapture = (e) => {
    if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; }
  };

  const dayExs = (day) => (day.exs ? day.exs : buildDay(day.keys));
  const tapCard = (split) => {
    if (split.custom) { const d = split.days[0]; onStartDay(dayExs(d), split.name); }
    else if (split.days.length === 1) { const d = split.days[0]; onStartDay(dayExs(d), split.name); }
    else setSheetSplit(split);
  };

  const cards = [...userSplits, ...SPLITS];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ flex: '0 0 auto', padding: '60px 22px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} className="tap" style={{ appearance: 'none', border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--ink)' }}>
          <span style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid currentColor' }}></span>
        </button>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>Choose a split</div>
      </div>

      {/* grid — flick it */}
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        className="wheel-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 28px', cursor: 'grab', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {cards.map((split) => (
            <button
              key={split.id}
              onClick={() => tapCard(split)}
              className="tap"
              style={{ appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', background: 'var(--sheet)', borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 6px 16px rgba(0,0,0,0.04)', padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, overflow: 'hidden' }}
            >
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '4px 0 2px' }}>
                <MuscleFigure active={splitMuscles(split)} width={120}></MuscleFigure>
              </div>
              <div style={{ alignSelf: 'stretch' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15 }}>{split.name}</div>
                <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--mut)' }}>
                  {split.custom ? (split.days[0].exs.length + ' exercises') : (split.days.length > 1 ? split.days.length + ' days · ' + split.freq.replace(' / week', '/wk') : split.freq.replace(' / week', '/wk'))}
                </div>
              </div>
            </button>
          ))}

          {/* "+" card — freeform / your own */}
          <button
            onClick={() => setPlusOpen(true)}
            className="tap"
            style={{ appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', border: '2px dashed var(--mut)', borderRadius: 18, minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--sub)' }}
          >
            <span style={{ fontSize: 34, fontWeight: 300, lineHeight: 0.7, color: 'var(--mut)' }}>+</span>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>New</span>
          </button>
        </div>
      </div>

      {/* ── day picker sheet (multi-day presets) ── */}
      <SheetOverlay open={!!sheetSplit} onClose={() => setSheetSplit(null)}>
        {sheetSplit && (
          <React.Fragment>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', padding: '2px 4px 2px' }}>{sheetSplit.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--sub)', lineHeight: 1.4, padding: '2px 4px 12px', textWrap: 'pretty' }}>{sheetSplit.blurb}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sheetSplit.days.map((day) => {
                const exs = dayExs(day);
                const preview = exs.map((e) => e.name).join('  ·  ');
                return (
                  <button key={day.name} onClick={() => { setSheetSplit(null); onStartDay(exs, day.name); }} className="tap day-row" style={{ width: '100%', appearance: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'var(--bg)', borderRadius: 12, padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{day.name}</div>
                      <div style={{ marginTop: 3, fontSize: 12, color: 'var(--mut)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>
                    </div>
                    <span style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', background: 'var(--log-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '8px solid var(--log-fg)', marginLeft: 2 }}></span>
                    </span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        )}
      </SheetOverlay>

      {/* ── "+" choices sheet ── */}
      <SheetOverlay open={plusOpen} onClose={() => setPlusOpen(false)}>
        <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', padding: '2px 4px 12px' }}>Start without a split</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => { setPlusOpen(false); onStartCustom('free'); }} className="tap day-row" style={{ width: '100%', appearance: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'var(--bg)', borderRadius: 14, padding: '14px 15px', fontFamily: 'inherit' }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>I don't need a split</div>
            <div style={{ marginTop: 3, fontSize: 12.5, color: 'var(--sub)', textWrap: 'pretty' }}>Log whatever you want, freestyle. Pick lifts from the library as you go.</div>
          </button>
          <button onClick={() => { setPlusOpen(false); onStartCustom('own'); }} className="tap day-row" style={{ width: '100%', appearance: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', background: 'var(--bg)', borderRadius: 14, padding: '14px 15px', fontFamily: 'inherit' }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>Add your own split</div>
            <div style={{ marginTop: 3, fontSize: 12.5, color: 'var(--sub)', textWrap: 'pretty' }}>Build a session and save it — it shows up here as your own card.</div>
          </button>
        </div>
      </SheetOverlay>
    </div>
  );
}

// ── reusable bottom sheet (scrim + slide-up) ──
function SheetOverlay({ open, onClose, children }) {
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 320ms' }}></div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--sheet)', borderRadius: '26px 26px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.16)', padding: '10px 20px 40px', transform: open ? 'translateY(0)' : 'translateY(110%)', transition: 'transform 460ms cubic-bezier(.3,1.18,.36,1)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 3, background: 'var(--pill)', margin: '0 auto 14px' }}></div>
        {children}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { SPLITS, EX, buildDay, splitMuscles, MuscleFigure, MuscleMap, MUSCLE_BY_EX, MUSCLE_LABEL, CAT_BY_EX, CATS, StartScreen, SplitPicker });
