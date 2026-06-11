// wheel-pickers.jsx — vertical wheel picker + horizontal exercise roller
// Exports (to window): WheelPicker, ExerciseRoller

const WHEEL_ITEM_H = 44;
const WHEEL_VISIBLE = 5;

function clampNum(v, a, b) { return Math.max(a, Math.min(b, v)); }

// rAF tween — scrollTo({behavior:'smooth'}) is unreliable in embedded previews
function tweenScroll(el, prop, target, dur = 380) {
  if (el.__tween) cancelAnimationFrame(el.__tween.raf);
  const from = el[prop];
  const delta = target - from;
  if (Math.abs(delta) < 0.5) { el[prop] = target; el.__tween = null; return; }
  const t0 = performance.now();
  const ease = (x) => 1 - Math.pow(1 - x, 3); // easeOutCubic
  const st = {};
  el.__tween = st;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    el[prop] = from + delta * ease(p);
    if (p < 1) st.raf = requestAnimationFrame(step);
    else el.__tween = null;
  };
  st.raf = requestAnimationFrame(step);
}

function cancelTween(el) {
  if (el && el.__tween) { cancelAnimationFrame(el.__tween.raf); el.__tween = null; }
}

function WheelPicker({ values, index, onChange, width = 130, format = (v) => String(v), markIndex = null, accent }) {
  const H = WHEEL_ITEM_H * WHEEL_VISIBLE;
  const PAD = WHEEL_ITEM_H * 2;
  const scrollRef = React.useRef(null);
  const [scrollTop, setScrollTop] = React.useState(index * WHEEL_ITEM_H);
  const settleTimer = React.useRef(null);
  const lastReported = React.useRef(index);
  const lastTick = React.useRef(index);
  const [tickCount, setTickCount] = React.useState(0);
  const drag = React.useRef(null);

  // initial position (no animation)
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) { el.scrollTop = index * WHEEL_ITEM_H; setScrollTop(el.scrollTop); }
  }, []);

  // external index / ladder change → spring there (programmatic recall wins)
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || drag.current) return;
    const target = index * WHEEL_ITEM_H;
    if (index !== lastReported.current || Math.abs(el.scrollTop - target) > 1) {
      lastReported.current = index;
      lastTick.current = index;
      clearTimeout(settleTimer.current);
      tweenScroll(el, 'scrollTop', target, 420);
    }
  }, [index, values]);

  const settle = () => {
    const el = scrollRef.current;
    if (!el || el.__tween || drag.current) return;
    const i = clampNum(Math.round(el.scrollTop / WHEEL_ITEM_H), 0, values.length - 1);
    const target = i * WHEEL_ITEM_H;
    if (Math.abs(el.scrollTop - target) > 1) tweenScroll(el, 'scrollTop', target, 240);
    if (i !== lastReported.current) {
      lastReported.current = i;
      onChange(i);
    }
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    const i = clampNum(Math.round(el.scrollTop / WHEEL_ITEM_H), 0, values.length - 1);
    if (i !== lastTick.current) { lastTick.current = i; setTickCount((t) => t + 1); }
    if (el.__tween) return; // programmatic — no settle logic
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, 140);
  };

  // mouse drag-to-scroll with momentum
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = scrollRef.current;
    cancelTween(el);
    drag.current = { y: e.clientY, top: el.scrollTop, v: 0, lastY: e.clientY, lastT: performance.now() };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const el = scrollRef.current;
    el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
    const now = performance.now();
    const dt = Math.max(1, now - drag.current.lastT);
    drag.current.v = (drag.current.lastY - e.clientY) / dt;
    drag.current.lastY = e.clientY;
    drag.current.lastT = now;
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const el = scrollRef.current;
    const proj = el.scrollTop + drag.current.v * 160;
    const i = clampNum(Math.round(proj / WHEEL_ITEM_H), 0, values.length - 1);
    drag.current = null;
    clearTimeout(settleTimer.current);
    tweenScroll(el, 'scrollTop', i * WHEEL_ITEM_H, 340);
    if (i !== lastReported.current) { lastReported.current = i; onChange(i); }
  };

  // PR tiers: below best = neutral; tied = gold outline; beaten = full gold ignite (higher = better)
  const liveIdx = Math.round(scrollTop / WHEEL_ITEM_H);
  const cmp = markIndex == null ? -1 : (liveIdx > markIndex ? 1 : liveIdx === markIndex ? 0 : -1);
  const markY = markIndex != null ? PAD + WHEEL_ITEM_H / 2 + (markIndex * WHEEL_ITEM_H - scrollTop) : null;

  return (
    <div style={{ position: 'relative', width: width, height: H, flex: '0 0 auto' }}>
      <div
        key={tickCount}
        className="wheel-pill"
        style={{
          position: 'absolute', left: 4, right: 4, top: PAD, height: WHEEL_ITEM_H,
          borderRadius: 'var(--r-pill)', pointerEvents: 'none',
          background: 'var(--pill)', boxShadow: 'none',
        }}
      ></div>
      {/* PR marker — a clean gold bar on the right rail at last session's best */}
      {markY != null && markY > 4 && markY < H - 4 && (
        <div style={{ position: 'absolute', right: 3, top: markY, transform: 'translateY(-50%)', width: 4, height: 22, borderRadius: 3, background: 'linear-gradient(180deg,#F2CB6E,#E3AE3E)', boxShadow: cmp >= 1 ? '0 0 8px rgba(231,181,72,0.85)' : 'none', transition: 'box-shadow 220ms', pointerEvents: 'none', zIndex: 3 }}></div>
      )}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="wheel-scroll"
        style={{
          position: 'absolute', inset: 0, overflowY: 'scroll',
          cursor: 'grab', userSelect: 'none', touchAction: 'pan-y',
        }}
      >
        <div style={{ height: PAD }}></div>
        {values.map((v, i) => {
          const d = Math.abs(i * WHEEL_ITEM_H - scrollTop) / WHEEL_ITEM_H;
          const selected = d < 0.5;
          return (
            <div
              key={i}
              style={{
                height: WHEEL_ITEM_H,
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--wheel-size)',
                fontWeight: selected ? 600 : 400,
                color: selected ? 'var(--ink)' : (markIndex === i ? '#C8922A' : 'var(--mut)'),
                opacity: selected ? 1 : Math.max(0.16, 1 - 0.38 * d),
                transform: `scale(${1 - 0.06 * Math.min(d, 2)})`,
              }}
            >
              {format(v)}
            </div>
          );
        })}
        <div style={{ height: PAD }}></div>
      </div>
    </div>
  );
}

function ExerciseRoller({ items, index, onChange, accent, onAdd, onLongPress }) {
  const ref = React.useRef(null);
  const itemRefs = React.useRef([]);
  const settleTimer = React.useRef(null);
  const drag = React.useRef(null);
  const dragged = React.useRef(false);

  // long-press → edit mode (cancelled by scroll/movement)
  const lp = React.useRef(null); // { x, y, timer, fired }
  const lpBegin = (e) => {
    if (!onLongPress) return;
    if (lp.current) clearTimeout(lp.current.timer);
    const timer = setTimeout(() => {
      if (!dragged.current && lp.current) {
        lp.current.fired = true;
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) {}
        onLongPress();
      }
    }, 480);
    lp.current = { x: e.clientX, y: e.clientY, timer, fired: false };
  };
  const lpMove = (e) => {
    if (lp.current && !lp.current.fired && (Math.abs(e.clientX - lp.current.x) > 8 || Math.abs(e.clientY - lp.current.y) > 8)) {
      clearTimeout(lp.current.timer);
    }
  };
  const lpEnd = () => { if (lp.current) clearTimeout(lp.current.timer); };

  const centerOn = (i, smooth) => {
    const el = ref.current, it = itemRefs.current[i];
    if (!el || !it) return;
    const left = it.offsetLeft + it.offsetWidth / 2 - el.clientWidth / 2;
    if (smooth) tweenScroll(el, 'scrollLeft', left, 380);
    else el.scrollLeft = left;
  };

  React.useLayoutEffect(() => { centerOn(index, false); }, []);
  React.useEffect(() => { if (!drag.current) centerOn(index, true); }, [index]);

  const nearest = () => {
    const el = ref.current;
    if (!el) return index;
    const cx = el.scrollLeft + el.clientWidth / 2;
    let best = 0, bestD = Infinity;
    itemRefs.current.forEach((it, i) => {
      if (!it) return;
      const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - cx);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el || el.__tween) return;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (drag.current || !ref.current || ref.current.__tween) return;
      const i = nearest();
      if (i !== index) onChange(i); else centerOn(i, true);
    }, 160);
  };

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    cancelTween(ref.current);
    drag.current = { x: e.clientX, left: ref.current.scrollLeft, id: e.pointerId, captured: false };
    dragged.current = false;
    // NOTE: do NOT capture here — capturing on press swallows child <button> clicks
    // (mouse): the pointerup gets retargeted to this container, so "+" / name taps never fire.
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 5) {
      dragged.current = true;
      if (!drag.current.captured) {
        try { ref.current.setPointerCapture(drag.current.id); } catch (err) {}
        drag.current.captured = true;
      }
    }
    ref.current.scrollLeft = drag.current.left - dx;
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const wasDrag = dragged.current;
    drag.current = null;
    if (!wasDrag) return;            // a tap → let the child button's click run
    const i = nearest();
    if (i !== index) onChange(i); else centerOn(i, true);
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="wheel-scroll"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        overflowX: 'scroll', cursor: 'grab', userSelect: 'none',
        touchAction: 'pan-x',
        padding: '6px 0',
        maskImage: 'linear-gradient(90deg, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0, black 48px, black calc(100% - 48px), transparent 100%)',
      }}
    >
      <div style={{ flex: '0 0 auto', width: '50%' }}></div>
      {items.map((it, i) => {
        const selected = i === index;
        return (
          <button
            key={it.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            onClick={() => {
              if (lp.current && lp.current.fired) { lp.current.fired = false; return; }
              if (!dragged.current) onChange(i);
            }}
            onPointerDown={lpBegin}
            onPointerMove={lpMove}
            onPointerUp={lpEnd}
            onPointerCancel={lpEnd}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              flex: '0 0 auto',
              appearance: 'none', border: 'none', background: 'none',
              padding: '8px 14px 10px', cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--roller-size)',
              textTransform: 'var(--caps)',
              letterSpacing: 'var(--track)',
              fontWeight: selected ? 600 : 400,
              color: selected ? 'var(--ink)' : 'var(--mut)',
              position: 'relative',
              transition: 'color 200ms',
            }}
          >
            {it.name}
            <span style={{
              position: 'absolute', left: 14, right: 14, bottom: 4, height: 2,
              borderRadius: 1, background: accent,
              opacity: selected ? 1 : 0,
              transform: selected ? 'scaleX(1)' : 'scaleX(0.4)',
              transition: 'opacity 200ms, transform 260ms cubic-bezier(.34,1.56,.64,1)',
            }}></span>
          </button>
        );
      })}
      {onAdd && (
        <button
          onClick={() => { if (!dragged.current) onAdd(); }}
          title="Add exercise"
          style={{
            flex: '0 0 auto',
            appearance: 'none', border: 'none', background: 'none',
            padding: '8px 14px 10px', cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'var(--roller-size)',
            fontWeight: 400,
            color: 'var(--mut)',
          }}
        >+</button>
      )}
      <div style={{ flex: '0 0 auto', width: '50%' }}></div>
    </div>
  );
}

Object.assign(window, { WheelPicker, ExerciseRoller, tweenScroll });
