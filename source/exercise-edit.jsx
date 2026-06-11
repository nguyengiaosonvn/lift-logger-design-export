// exercise-edit.jsx — iOS-style edit mode for the session plan.
// Long-press the roller → rows wiggle, drag to reorder, drop on the bin to delete.
// Exports (to window): ExerciseEditList

function ExerciseEditList({ items, selectedId, onMove, onDelete }) {
  const ROW_H = 52;
  const listRef = React.useRef(null);
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const [drag, setDrag] = React.useState(null); // { id, y, overTrash }
  const dragRef = React.useRef(null);
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  const startDrag = (id) => (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    buzz(10);
    const el = listRef.current;
    const rect0 = el.getBoundingClientRect();
    const idx0 = itemsRef.current.findIndex((it) => it.id === id);
    const grabOffset = e.clientY - (rect0.top - el.scrollTop + idx0 * ROW_H);
    dragRef.current = { id, y: idx0 * ROW_H, overTrash: false };
    setDrag({ ...dragRef.current });
    const move = (ev) => {
      const rect = el.getBoundingClientRect();
      const y = ev.clientY - rect.top + el.scrollTop - grabOffset;
      const overTrash = ev.clientX > rect.right - 8;
      const n = itemsRef.current.length;
      const idx = Math.max(0, Math.min(n - 1, Math.round(y / ROW_H)));
      const cur = itemsRef.current.findIndex((it) => it.id === id);
      if (!overTrash && idx !== cur) { onMove(cur, idx); buzz(6); }
      if (overTrash !== dragRef.current.overTrash) buzz(8);
      dragRef.current = { id, y, overTrash };
      setDrag({ ...dragRef.current });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const last = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (last && last.overTrash) { buzz(22); onDelete(id); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const H = items.length * ROW_H;

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      {/* rows */}
      <div ref={listRef} className="wheel-scroll" style={{ position: 'relative', flex: 1, height: Math.min(H, 312), overflowY: H > 312 ? 'auto' : 'visible' }}>
        <div style={{ position: 'relative', height: H }}>
          {items.map((it, i) => {
            const isDrag = drag && drag.id === it.id;
            return (
              <div
                key={it.id}
                onPointerDown={startDrag(it.id)}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  position: 'absolute', left: 0, right: 4, top: 0, height: ROW_H - 8,
                  transform: 'translateY(' + (isDrag ? drag.y : i * ROW_H) + 'px) scale(' + (isDrag ? (drag.overTrash ? 0.84 : 1.04) : 1) + ')',
                  transition: isDrag ? 'none' : 'transform 260ms cubic-bezier(.3,1.2,.4,1)',
                  zIndex: isDrag ? 5 : 1,
                  touchAction: 'none', cursor: 'grab', userSelect: 'none',
                  opacity: isDrag && drag.overTrash ? 0.6 : 1,
                }}
              >
                <div
                  className={isDrag ? '' : 'jiggle'}
                  style={{
                    animationDelay: ((i % 5) * -0.11) + 's',
                    height: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
                    background: 'var(--pill)', borderRadius: 12,
                    boxShadow: isDrag ? '0 10px 26px rgba(0,0,0,0.22)' : 'none',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 15, fontWeight: it.id === selectedId ? 700 : 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.55 }}>
                    <span style={{ width: 15, height: 2, borderRadius: 1, background: 'var(--sub)' }}></span>
                    <span style={{ width: 15, height: 2, borderRadius: 1, background: 'var(--sub)' }}></span>
                    <span style={{ width: 15, height: 2, borderRadius: 1, background: 'var(--sub)' }}></span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* trash rail — drop a row here to delete */}
      <div style={{ flex: '0 0 auto', width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: drag && drag.overTrash ? '#FF453A' : 'var(--pill)',
          transform: drag && drag.overTrash ? 'scale(1.2)' : drag ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform 220ms cubic-bezier(.34,1.56,.64,1), background 180ms',
        }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={drag && drag.overTrash ? '#ffffff' : 'var(--sub)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16"></path>
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"></path>
            <path d="M10 11v6M14 11v6"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ExerciseEditList });
