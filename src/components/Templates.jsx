import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { TEMPLATE_CATEGORIES, TEMPLATES } from '../lib/mapOps.js';

// Count ideas once, not on every render
const IDEA_COUNTS = Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, t.build().nodes.length]));

export function TemplateGrid({ onPick, compact = false }) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(TEMPLATES).filter(
      ([, t]) =>
        (category === 'All' || t.category === category) &&
        (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    );
  }, [category, query]);

  return (
    <div className={`tpl${compact ? ' tpl--compact' : ''}`}>
      <div className="tpl__bar">
        <div className="chips" role="tablist" aria-label="Template categories">
          {['All', ...TEMPLATE_CATEGORIES].map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              className={`chip${category === c ? ' is-on' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search tpl__search">
          <Search size={15} aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" aria-label="Search templates" />
        </label>
      </div>

      <div className="tpl__grid">
        {items.map(([key, t]) => (
          <button key={key} className="template-card" onClick={() => onPick(key)}>
            <span className="template-card__icon" aria-hidden="true">
              {t.icon}
            </span>
            <span className="template-card__name">{t.name}</span>
            <span className="template-card__desc">{t.description}</span>
            <span className="template-card__count">
              {IDEA_COUNTS[key]} {IDEA_COUNTS[key] === 1 ? 'idea' : 'ideas'} · {t.category}
            </span>
          </button>
        ))}
        {items.length === 0 && <p className="tpl__empty">No templates match “{query}”.</p>}
      </div>
    </div>
  );
}

export function TemplateGallery({ onPick, onClose }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tpl-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="dialog__head">
          <h2 id="tpl-title">Choose a template</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            <X size={17} />
          </button>
        </div>
        <TemplateGrid onPick={onPick} compact />
      </div>
    </div>
  );
}
