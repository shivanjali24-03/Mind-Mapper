import { ChevronRight, X } from 'lucide-react';

export default function FocusBar({ trail, onFocus, onExit }) {
  return (
    <nav className="focusbar" aria-label="Focus path">
      <span className="focusbar__label">Focus</span>
      <ol>
        {trail.map((c, i) => (
          <li key={c.id}>
            {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {i === trail.length - 1 ? (
              <span className="focusbar__current" aria-current="location">
                {c.label}
              </span>
            ) : (
              <button onClick={() => (i === 0 ? onExit() : onFocus(c.id))}>{c.label}</button>
            )}
          </li>
        ))}
      </ol>
      <button className="btn btn--ghost focusbar__exit" onClick={onExit} title="Exit focus (Esc)">
        <X size={15} /> Exit focus
      </button>
    </nav>
  );
}
