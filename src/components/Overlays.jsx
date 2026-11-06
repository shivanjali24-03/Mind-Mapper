import { Brain, X } from 'lucide-react';
import { TEMPLATES } from '../lib/mapOps.js';

export function EmptyState({ onCreate }) {
  return (
    <div className="empty">
      <div className="empty__icon" aria-hidden="true">
        <Brain size={34} />
      </div>
      <h1>Map out your ideas</h1>
      <p>Start from a blank canvas or pick a template. Your work saves automatically.</p>
      <div className="empty__grid">
        {Object.entries(TEMPLATES).map(([key, t]) => (
          <button key={key} className="template-card" onClick={() => onCreate(key)}>
            <span className="template-card__name">{t.name}</span>
            <span className="template-card__count">
              {t.build().nodes.length} {t.build().nodes.length === 1 ? 'idea' : 'ideas'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const SHORTCUTS = [
  ['Tab', 'Add a child idea'],
  ['Enter', 'Add a sibling idea'],
  ['Double-click', 'Edit text'],
  ['Delete / Backspace', 'Delete idea and its branches'],
  ['T', 'Tidy up the layout'],
  ['F', 'Fit map to screen'],
  ['⌘/Ctrl + S', 'Save now'],
  ['?', 'Show this help'],
];

export function ShortcutsDialog({ onClose }) {
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="sc-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog__head">
          <h2 id="sc-title">Keyboard shortcuts</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            <X size={17} />
          </button>
        </div>
        <dl className="shortcuts">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
