import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

// Each step points at an element marked with data-tour="...".
// If the element isn't on screen (e.g. the sidebar on a phone), the card is shown centred instead.
export const TOUR_STEPS = [
  {
    title: 'Welcome to Mind Mapper 👋',
    body: 'A quick 1-minute tour of the main things you can do. You can skip it any time.',
  },
  {
    target: 'new-map',
    title: 'Create a map',
    body: 'Click **New map** and pick a template (Blank, Project plan, SWOT or Meeting notes).',
  },
  {
    target: 'map-list',
    title: 'Your maps',
    body: 'All your maps are listed here. Click one to open it. We added a few **demo maps** so you can explore.',
  },
  {
    target: 'root-node',
    title: 'Edit an idea',
    body: '**Click** an idea to select it. **Double-click** to change its text.',
  },
  {
    target: 'add-child',
    title: 'Grow your map',
    body: 'With an idea selected, click **Child** (or press **Tab**). **Enter** adds a sibling, **Delete** removes a branch.',
  },
  {
    target: 'canvas',
    title: 'Move around',
    body: '**Drag** the background to pan and **scroll** to zoom. Drag between the dots on two ideas to connect them.',
  },
  {
    target: 'view-tools',
    title: 'Tidy, fit, export & theme',
    body: '**Tidy up** re-arranges the branches, **Fit** shows the whole map, **Download** saves a PNG, and the sun/moon switches theme.',
  },
  {
    target: 'status',
    title: 'Saved automatically',
    body: 'Every change is saved for you. Watch this badge change from **Saving…** to **Saved**.',
  },
  {
    target: 'guide',
    title: 'You’re all set! 🎉',
    body: 'Replay this tour any time with the **Guide** button. Press **?** to see every keyboard shortcut.',
  },
];

// Tiny **bold** support so steps read naturally
const rich = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : part));

const PAD = 8;
const CARD_W = 320;

function visibleRect(name) {
  if (!name) return null;
  const el = document.querySelector(`[data-tour="${name}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const onScreen = r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
  return onScreen ? r : null;
}

function cardPosition(rect, cardH) {
  if (!rect) return { left: (innerWidth - Math.min(CARD_W, innerWidth - 32)) / 2, top: (innerHeight - cardH) / 2 };
  const w = Math.min(CARD_W, innerWidth - 32);
  const clampX = (x) => Math.max(16, Math.min(x, innerWidth - w - 16));
  const clampY = (y) => Math.max(16, Math.min(y, innerHeight - cardH - 16));
  // Big targets (like the canvas): put the card inside, near the top
  if (rect.width > innerWidth * 0.5 && rect.height > innerHeight * 0.5) {
    return { left: clampX(rect.left + rect.width / 2 - w / 2), top: clampY(rect.top + 24) };
  }
  if (rect.bottom + PAD + 12 + cardH < innerHeight) return { left: clampX(rect.left), top: rect.bottom + PAD + 12 };
  if (rect.right + PAD + 12 + w < innerWidth) return { left: rect.right + PAD + 12, top: clampY(rect.top) };
  if (rect.left - PAD - 12 - w > 0) return { left: rect.left - PAD - 12 - w, top: clampY(rect.top) };
  return { left: clampX(rect.left), top: clampY(rect.top - PAD - 12 - cardH) };
}

export default function Tour({ open, onClose }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const cardRef = useRef(null);
  const step = TOUR_STEPS[i];
  const last = i === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  const measure = useCallback(() => {
    const r = visibleRect(step?.target);
    setRect(r);
    setPos(cardPosition(r, cardRef.current?.offsetHeight ?? 180));
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const t = setTimeout(measure, 60); // after the card has rendered its real height
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [open, measure]);

  const finish = useCallback(() => onClose(), [onClose]);
  const next = useCallback(() => (last ? finish() : setI((v) => v + 1)), [last, finish]);
  const back = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, next, back, finish]);

  if (!open) return null;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {rect ? (
        <div
          className="tour__spot"
          style={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
        />
      ) : (
        <div className="tour__dim" />
      )}
      <div className="tour__card" ref={cardRef} style={pos} key={i}>
        <div className="tour__top">
          <span className="tour__count">
            Step {i + 1} of {TOUR_STEPS.length}
          </span>
          <button className="icon-btn" onClick={finish} aria-label="Close guide">
            <X size={16} />
          </button>
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p>{rich(step.body)}</p>
        <div className="tour__dots" aria-hidden="true">
          {TOUR_STEPS.map((_, d) => (
            <span key={d} className={d === i ? 'is-on' : ''} />
          ))}
        </div>
        <div className="tour__actions">
          {i > 0 ? (
            <button className="btn btn--ghost" onClick={back}>
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <button className="btn btn--ghost" onClick={finish}>
              Skip
            </button>
          )}
          <button className="btn btn--primary" onClick={next} autoFocus>
            {last ? 'Finish' : 'Next'} {!last && <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
