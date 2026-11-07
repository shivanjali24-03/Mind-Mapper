import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Presenter({ slides, index, notes, onIndex, onExit }) {
  const last = slides.length - 1;
  const go = (i) => onIndex(Math.max(0, Math.min(last, i)));

  useEffect(() => {
    const onKey = (e) => {
      const next = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key);
      const prev = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key);
      if (!next && !prev && !['Home', 'End', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation(); // the presenter owns the keyboard while it's open
      if (e.key === 'Escape') return onExit();
      if (e.key === 'Home') return onIndex(0);
      if (e.key === 'End') return onIndex(last);
      onIndex((i) => Math.max(0, Math.min(last, i + (next ? 1 : -1))));
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [last, onExit, onIndex]);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <div className="presenter" role="region" aria-label="Presentation controls">
      <button className="icon-btn presenter__btn" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide">
        <ChevronLeft size={20} />
      </button>
      <div className="presenter__info">
        <div className="presenter__title" aria-live="polite">
          {slide.title}
        </div>
        {notes && <div className="presenter__notes">{notes}</div>}
        <div className="presenter__dots" aria-hidden="true">
          {slides.map((_, i) => (
            <button key={i} className={i === index ? 'is-on' : ''} onClick={() => go(i)} tabIndex={-1} />
          ))}
        </div>
      </div>
      <span className="presenter__count">
        {index + 1} / {slides.length}
      </span>
      <button className="icon-btn presenter__btn" onClick={() => go(index + 1)} disabled={index === last} aria-label="Next slide">
        <ChevronRight size={20} />
      </button>
      <button className="icon-btn presenter__btn" onClick={onExit} aria-label="Exit presentation (Esc)" title="Exit (Esc)">
        <X size={18} />
      </button>
    </div>
  );
}
