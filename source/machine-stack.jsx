// machine-stack.jsx — Pin Stack: skeuomorphic selector for machine exercises.
// Relative-drag (precision decoupled from plate height) + loupe + tap-to-pick.
// Optional Touch-test overlay: physical-mm fingertip disc + coverage readout.
// Exports (to window): PinStack

const PIN_GAIN = 22; // px of finger travel per plate, in relative mode

function PinStack({ count = 12, value = 1, onChange, markValue = null, relative = true, touchTest = false }) {
  const H = 220;
  const GAP = 2;
  const plateH = Math.floor((H - GAP * (count - 1)) / count);
  const stride = plateH + GAP;
  const stackH = plateH * count + GAP * (count - 1);
  const topPad = Math.floor((H - stackH) / 2);
  const W = 168;
  const STACK_LEFT = 36, STACK_W = 92;
  const ref = React.useRef(null);
  const dragging = React.useRef(false);
  const moved = React.useRef(false);
  const start = React.useRef({ y: 0, v: 1 });
  const [tick, setTick] = React.useState(0);
  const [rawTop, setRawTop] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [fingerY, setFingerY] = React.useState(null); // for touch-test disc
  const [seatKey, setSeatKey] = React.useState(0);     // bumps on release → stamp anim

  const clampP = (p) => Math.max(1, Math.min(count, p));
  const restTop = (p) => topPad + (p - 1) * stride + plateH / 2;
  const minTop = restTop(1), maxTop = restTop(count);
  const localY = (clientY) => clientY - ref.current.getBoundingClientRect().top;
  const plateFromTop = (top) => clampP(Math.round((top - topPad - plateH / 2) / stride) + 1);
  const rubber = (t) => (t < minTop ? minTop - (minTop - t) * 0.32 : t > maxTop ? maxTop + (t - maxTop) * 0.32 : t);

  const setVal = (p) => { if (p !== value) { setTick((x) => x + 1); onChange(p); } };

  const onPointerDown = (e) => {
    dragging.current = true;
    moved.current = false;
    start.current = { y: e.clientY, v: value };
    setIsDragging(true);
    ref.current.setPointerCapture(e.pointerId);
    if (touchTest) setFingerY(localY(e.clientY));
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    if (touchTest) setFingerY(localY(e.clientY));
    const dy = e.clientY - start.current.y;
    if (Math.abs(dy) > 3) moved.current = true;
    if (relative) {
      const p = clampP(start.current.v + Math.round(dy / PIN_GAIN));
      // pin head tracks finger 1:1 within range so it feels connected; value snaps via gain
      setRawTop(rubber(restTop(start.current.v) + dy));
      setVal(p);
    } else {
      const t = localY(e.clientY);
      setRawTop(rubber(t));
      setVal(plateFromTop(t));
    }
  };
  const onPointerUp = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    setRawTop(null);
    setFingerY(null);
    // a tap (no real movement) = coarse pick of the plate under the finger
    if (!moved.current) setVal(plateFromTop(localY(e.clientY)));
    setSeatKey((k) => k + 1); // → pin stamps into the hole
  };

  const pinTop = rawTop != null ? rawTop : restTop(value);
  const beaten = markValue != null && value >= markValue;
  const holeLeft = STACK_LEFT + STACK_W - 9; // x of the plate's pin hole
  const seated = !isDragging && seatKey > 0;  // pin is in the hole

  // touch-test coverage: how many plates a ~9mm finger pad spans
  const discMm = 9;
  const discPx = discMm * (96 / 25.4); // CSS physical approximation
  const covers = Math.max(1, Math.round(discPx / stride));

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'relative', width: W, height: H, flex: '0 0 auto',
        cursor: 'grab', userSelect: 'none', touchAction: 'none',
      }}
    >
      {/* guide rods */}
      <div style={{ position: 'absolute', left: STACK_LEFT + 16, top: 0, bottom: 0, width: 3, borderRadius: 2, background: 'var(--pill)' }}></div>
      <div style={{ position: 'absolute', left: STACK_LEFT + STACK_W - 19, top: 0, bottom: 0, width: 3, borderRadius: 2, background: 'var(--pill)' }}></div>

      {/* plates */}
      <div style={{ position: 'absolute', left: STACK_LEFT, top: topPad, display: 'flex', flexDirection: 'column', gap: GAP }}>
        {Array.from({ length: count }, (_, i) => {
          const p = i + 1;
          const lifted = p <= value;
          const isPR = markValue != null && p === markValue; // your best — the plate to beat
          return (
            <div
              key={p}
              style={{
                width: STACK_W, height: plateH, borderRadius: 4,
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isPR
                  ? 'linear-gradient(180deg, #F4D479 0%, #E7B23E 52%, #D49A28 100%)'
                  : lifted ? 'var(--ink)' : 'var(--pill)',
                color: isPR ? '#5A3A06' : lifted ? 'var(--sheet)' : 'var(--mut)',
                fontSize: 10, fontWeight: isPR ? 800 : 600, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                transition: 'background 180ms, color 180ms, box-shadow 180ms',
                boxShadow: isPR
                  ? (beaten ? '0 0 0 1.5px #E3AE3E, 0 0 9px rgba(231,181,72,0.75)' : '0 0 0 1.5px rgba(227,174,62,0.55)')
                  : (lifted && p === value ? '0 2px 4px rgba(0,0,0,0.18)' : 'none'),
                zIndex: isPR ? 1 : 0,
              }}
            >
              {p}
              <span style={{
                position: 'absolute', right: 7, top: '50%', marginTop: -2,
                width: 4, height: 4, borderRadius: '50%',
                background: isPR ? 'rgba(90,58,6,0.35)' : lifted ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.14)',
              }}></span>
            </div>
          );
        })}
      </div>

      {/* ── while dragging: the pin is OUT (in your hand, toward you) — only the loupe + a target ring show ── */}
      {isDragging && (
        <React.Fragment>
          <span style={{
            position: 'absolute', left: holeLeft, top: restTop(value), width: 16, height: 16,
            transform: 'translate(-50%, -50%)', borderRadius: '50%',
            border: '2px dashed rgba(224,53,43,0.5)', pointerEvents: 'none', zIndex: 2,
          }}></span>
          <div style={{ position: 'absolute', left: STACK_LEFT - 8, top: pinTop, transform: 'translate(-100%, -50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <div style={{
              minWidth: 40, height: 40, padding: '0 9px', borderRadius: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--sheet)', border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 8px 22px rgba(0,0,0,0.24)',
              fontSize: 23, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>{value}</div>
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '7px solid var(--sheet)', filter: 'drop-shadow(2px 0 1px rgba(0,0,0,0.10))' }}></div>
          </div>
        </React.Fragment>
      )}

      {/* ── released: the pin flies in from your POV and SLAMS into the hole, resting inside the stack ── */}
      {!isDragging && (
        <React.Fragment>
          <span key={'ring' + seatKey} className="hole-ring" style={{
            position: 'absolute', left: holeLeft, top: pinTop, width: 16, height: 16,
            transform: 'translate(-50%, -50%)', borderRadius: '50%',
            border: '2px solid rgba(224,53,43,0.85)', pointerEvents: 'none', zIndex: 4,
          }}></span>
          <div key={'pin' + seatKey} className={seatKey > 0 ? 'pin-slam' : ''} style={{
            position: 'absolute', left: holeLeft, top: pinTop, width: 18, height: 18,
            transform: 'translate(-50%, -50%)', borderRadius: '50%', zIndex: 5,
            pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at 36% 28%, #ff8a7f 0%, #f0463b 44%, #cf2a20 72%, #a3190f 100%)',
            border: '1.5px solid rgba(110,16,10,0.6)',
            boxShadow: '0 2px 6px rgba(110,18,12,0.5), inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -2px 2px rgba(90,12,8,0.5)',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffe0db, #c52a20)', boxShadow: 'inset 0 0 1px rgba(70,8,5,0.8)' }}></div>
          </div>
        </React.Fragment>
      )}

      {/* ── Touch-test overlay: physical fingertip disc + coverage readout ── */}
      {touchTest && (
        <React.Fragment>
          <div style={{
            position: 'absolute', left: STACK_LEFT + STACK_W / 2,
            top: fingerY != null ? fingerY : restTop(value),
            width: discMm + 'mm', height: discMm + 'mm',
            transform: 'translate(-50%, -50%)', borderRadius: '50%',
            background: 'rgba(255,69,58,0.22)', border: '1.5px solid rgba(255,69,58,0.65)',
            pointerEvents: 'none', zIndex: 5,
          }}></div>
          <div style={{
            position: 'absolute', left: '50%', bottom: -22, transform: 'translateX(-50%)',
            whiteSpace: 'nowrap', fontSize: 10, fontWeight: 600, color: '#FF453A',
            fontVariantNumeric: 'tabular-nums',
          }}>finger ≈ {discMm}mm · covers {covers} plate{covers > 1 ? 's' : ''}</div>
        </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { PinStack });
