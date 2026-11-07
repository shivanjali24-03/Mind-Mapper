import { useMemo, useRef, useState } from 'react';
import { ENV_LABEL } from '../env.js';
import { Check, Cloud, Compass, HardDrive, Map, Plus, Search, Sparkles, Trash2, Upload, X } from 'lucide-react';

const timeAgo = (iso) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export default function Sidebar({ maps, activeId, mode, open, onSelect, onNewMap, onDelete, onClose, onLoadDemo, onTour, onImport }) {
  const [query, setQuery] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const fileRef = useRef(null);

  const filtered = useMemo(
    () => maps.filter((m) => m.title.toLowerCase().includes(query.trim().toLowerCase())),
    [maps, query],
  );

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="Your mind maps">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true">
          <Logo size={34} />
        </span>
        <span className="brand__name">Mind Mapper</span>
        {ENV_LABEL && (
          <span className={`env-badge env-badge--${ENV_LABEL.toLowerCase()}`} title="Not production: test data only">
            {ENV_LABEL}
          </span>
        )}
        <button className="icon-btn sidebar__close" onClick={onClose} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      <div className="new-map" data-tour="new-map">
        <button className="btn btn--primary btn--block" onClick={onNewMap}>
          <Plus size={16} /> New map
        </button>
      </div>

      <label className="search">
        <Search size={15} aria-hidden="true" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search maps" aria-label="Search maps" />
      </label>

      <nav className="map-list" data-tour="map-list">
        {filtered.length === 0 && <p className="map-list__empty">{maps.length ? 'No maps match your search.' : 'No maps yet.'}</p>}
        {filtered.map((m) => (
          <div key={m.id} className={`map-item${m.id === activeId ? ' is-active' : ''}`}>
            <button className="map-item__main" onClick={() => onSelect(m.id)}>
              <span className="map-item__title">{m.title}</span>
              <span className="map-item__time">{timeAgo(m.updatedAt)}</span>
            </button>
            {confirmId === m.id ? (
              <span className="map-item__confirm">
                <button className="icon-btn icon-btn--danger" onClick={() => onDelete(m.id)} aria-label={`Confirm delete ${m.title}`}>
                  <Check size={15} />
                </button>
                <button className="icon-btn" onClick={() => setConfirmId(null)} aria-label="Cancel delete">
                  <X size={15} />
                </button>
              </span>
            ) : (
              <button className="icon-btn map-item__delete" onClick={() => setConfirmId(m.id)} aria-label={`Delete ${m.title}`}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="link-btn" onClick={onLoadDemo}>
          <Sparkles size={15} /> Load demo maps
        </button>
        <button className="link-btn" onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // allow importing the same file twice
            if (file) onImport(file);
          }}
        />
        <button className="link-btn" onClick={onTour}>
          <Compass size={15} /> Take the tour
        </button>
      </div>

      <div className={`mode mode--${mode}`} title={mode === 'api' ? 'Saved to the server' : 'Saved in this browser only'}>
        {mode === 'api' ? <Cloud size={14} /> : <HardDrive size={14} />}
        {mode === 'api' ? 'Cloud sync on' : 'Local demo mode'}
      </div>
    </aside>
  );
}
