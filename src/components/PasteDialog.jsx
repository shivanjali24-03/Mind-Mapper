import { useMemo, useState } from 'react';
import { ClipboardPaste, X } from 'lucide-react';
import { countOutline, parseOutline } from '../lib/outline.js';

const EXAMPLE = `Product launch
  - Goals
    - 1,000 sign-ups
    - Press coverage
  - Marketing
    - Blog post
    - Social media
  - [ ] Book the venue
  - [x] Pick a date`;

export default function PasteDialog({ onCreate, onClose }) {
  const [text, setText] = useState('');

  const preview = useMemo(() => {
    if (!text.trim()) return null;
    try {
      const forest = parseOutline(text);
      const depth = (items) => (items.length ? 1 + Math.max(...items.map((i) => depth(i.children))) : 0);
      return { ok: true, count: countOutline(forest), levels: depth(forest) };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }, [text]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog dialog--paste"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paste-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') onClose();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && preview?.ok) onCreate(text);
        }}
      >
        <div className="dialog__head">
          <h2 id="paste-title">Paste text to map</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <p className="dialog__hint">
          Paste notes, a bullet list or Markdown from anywhere. Indentation becomes branches, and checkboxes become tasks.
        </p>
        <textarea
          className="paste-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          rows={12}
          autoFocus
          aria-label="Text to turn into a map"
        />
        <div className="paste-foot">
          <span className={`paste-preview${preview && !preview.ok ? ' is-error' : ''}`} aria-live="polite">
            {!preview && 'Tip: try the example in the box (⌘/Ctrl+Enter to create)'}
            {preview?.ok && `${preview.count} ${preview.count === 1 ? 'idea' : 'ideas'} · ${preview.levels} ${preview.levels === 1 ? 'level' : 'levels'}`}
            {preview && !preview.ok && preview.message}
          </span>
          <div className="paste-actions">
            {!text && (
              <button className="btn btn--ghost" onClick={() => setText(EXAMPLE)}>
                Use example
              </button>
            )}
            <button className="btn btn--primary" disabled={!preview?.ok} onClick={() => onCreate(text)}>
              <ClipboardPaste size={16} /> Create map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
