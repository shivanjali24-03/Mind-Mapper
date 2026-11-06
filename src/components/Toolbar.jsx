import {
  CircleAlert,
  CircleCheck,
  Compass,
  CornerDownRight,
  Download,
  GitBranchPlus,
  Keyboard,
  Loader,
  Maximize,
  Menu,
  Moon,
  Network,
  Sun,
  Trash2,
} from 'lucide-react';

const STATUS = {
  saved: { icon: CircleCheck, text: 'Saved' },
  saving: { icon: Loader, text: 'Saving…' },
  dirty: { icon: Loader, text: 'Unsaved' },
  error: { icon: CircleAlert, text: 'Not saved' },
};

export default function Toolbar({
  title,
  onTitle,
  status,
  hasSelection,
  theme,
  onMenu,
  onAddChild,
  onAddSibling,
  onDelete,
  onFit,
  onTidy,
  onExport,
  onTheme,
  onHelp,
  onTour,
}) {
  const S = STATUS[status] ?? STATUS.saved;
  return (
    <header className="toolbar">
      <button className="icon-btn toolbar__menu" onClick={onMenu} aria-label="Open maps">
        <Menu size={18} />
      </button>
      <input className="title-input" value={title} onChange={(e) => onTitle(e.target.value)} aria-label="Map title" maxLength={120} />
      <span className={`status status--${status}`} role="status" data-tour="status">
        <S.icon size={14} className={status === 'saving' ? 'spin' : ''} /> {S.text}
      </span>

      <div className="toolbar__group" role="toolbar" aria-label="Map actions">
        <button className="btn btn--ghost" onClick={onAddChild} disabled={!hasSelection} title="Add child (Tab)" data-tour="add-child">
          <GitBranchPlus size={16} /> <span className="btn__text">Child</span>
        </button>
        <button className="btn btn--ghost hide-sm" onClick={onAddSibling} disabled={!hasSelection} title="Add sibling (Enter)">
          <CornerDownRight size={16} /> <span className="btn__text">Sibling</span>
        </button>
        <button className="icon-btn" onClick={onDelete} disabled={!hasSelection} title="Delete (Del)" aria-label="Delete selected">
          <Trash2 size={17} />
        </button>
        <span className="toolbar__sep" />
        <span className="toolbar__tools" data-tour="view-tools">
        <button className="icon-btn" onClick={onTidy} title="Tidy up layout (T)" aria-label="Tidy up layout">
          <Network size={17} />
        </button>
        <button className="icon-btn" onClick={onFit} title="Fit to screen (F)" aria-label="Fit to screen">
          <Maximize size={17} />
        </button>
        <button className="icon-btn" onClick={onExport} title="Export PNG" aria-label="Export as PNG">
          <Download size={17} />
        </button>
        <button className="icon-btn" onClick={onTheme} title="Toggle theme" aria-label="Toggle light or dark theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        </span>
        <button className="btn btn--ghost btn--guide" onClick={onTour} title="Guided tour" data-tour="guide">
          <Compass size={16} /> <span className="btn__text">Guide</span>
        </button>
        <button className="icon-btn hide-sm" onClick={onHelp} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">
          <Keyboard size={17} />
        </button>
      </div>
    </header>
  );
}
