import { GitBranchPlus, Trash2, X } from 'lucide-react';
import { COLORS } from '../lib/mapOps.js';

export default function Inspector({ node, childCount, onChange, onAddChild, onDelete, onClose }) {
  if (!node) return null;
  const { label, color, notes, root } = node.data;
  return (
    <aside className="inspector" aria-label="Selected idea">
      <div className="inspector__head">
        <h2>{root ? 'Central idea' : 'Idea'}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close panel">
          <X size={17} />
        </button>
      </div>

      <label className="field">
        <span>Text</span>
        <input value={label} onChange={(e) => onChange({ label: e.target.value })} maxLength={80} />
      </label>

      <fieldset className="field">
        <legend>Colour</legend>
        <div className="swatches">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`swatch c-${c}${c === color ? ' is-active' : ''}`}
              onClick={() => onChange({ color: c })}
              aria-label={c}
              aria-pressed={c === color}
            />
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Notes</span>
        <textarea rows={6} value={notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Add details, links or to-dos…" />
      </label>

      <p className="inspector__meta">
        {childCount} {childCount === 1 ? 'branch' : 'branches'}
      </p>

      <div className="inspector__actions">
        <button className="btn btn--primary" onClick={onAddChild}>
          <GitBranchPlus size={16} /> Add child
        </button>
        {!root && (
          <button className="btn btn--danger" onClick={onDelete}>
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>
    </aside>
  );
}
