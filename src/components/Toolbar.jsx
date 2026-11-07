import { useEffect, useRef, useState } from 'react';
import {
  CircleAlert,
  CircleCheck,
  Compass,
  CornerDownRight,
  Download,
  FileImage,
  FileJson,
  FileText,
  ClipboardCopy,
  ListTree,
  GitBranchPlus,
  Keyboard,
  ListChecks,
  Loader,
  Maximize,
  Menu,
  Moon,
  Network,
  Redo2,
  Search,
  Sun,
  Trash2,
  Undo2,
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
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSearch,
  onTasks,
  tasksOpen,
  openTaskCount,
  onExport,
  onTheme,
  onHelp,
  onTour,
  viewMode,
  onViewMode,
}) {
  const S = STATUS[status] ?? STATUS.saved;
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  // Close the export menu when clicking anywhere else
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e) => !exportRef.current?.contains(e.target) && setExportOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [exportOpen]);

  const pick = (kind) => {
    setExportOpen(false);
    onExport(kind);
  };
  return (
    <header className="toolbar">
      <button className="icon-btn toolbar__menu" onClick={onMenu} aria-label="Open maps">
        <Menu size={18} />
      </button>
      <input className="title-input" value={title} onChange={(e) => onTitle(e.target.value)} aria-label="Map title" maxLength={120} />
      <div className="segmented" role="tablist" aria-label="View">
        {[
          ['map', 'Map'],
          ['outline', 'Outline'],
        ].map(([key, text]) => (
          <button key={key} role="tab" aria-selected={viewMode === key} className={viewMode === key ? 'is-on' : ''} onClick={() => onViewMode(key)}>
            {text}
          </button>
        ))}
      </div>
      <span className={`status status--${status}`} role="status" data-tour="status">
        <S.icon size={14} className={status === 'saving' ? 'spin' : ''} /> {S.text}
      </span>

      <div className="toolbar__group" role="toolbar" aria-label="Map actions">
        <button className="icon-btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/⌘+Z)" aria-label="Undo">
          <Undo2 size={17} />
        </button>
        <button className="icon-btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/⌘+Shift+Z)" aria-label="Redo">
          <Redo2 size={17} />
        </button>
        <button className="icon-btn" onClick={onSearch} title="Search ideas (Ctrl/⌘+K)" aria-label="Search ideas">
          <Search size={17} />
        </button>
        <button
          className={`icon-btn tasks-btn${tasksOpen ? ' is-on' : ''}`}
          onClick={onTasks}
          title="Tasks"
          aria-label={`Tasks (${openTaskCount} open)`}
          aria-pressed={tasksOpen}
        >
          <ListChecks size={17} />
          {openTaskCount > 0 && <span className="count-badge">{openTaskCount}</span>}
        </button>
        <span className="toolbar__sep" />
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
        <span className="export" ref={exportRef}>
          <button
            className="icon-btn"
            onClick={() => setExportOpen((v) => !v)}
            title="Export"
            aria-label="Export"
            aria-haspopup="menu"
            aria-expanded={exportOpen}
          >
            <Download size={17} />
          </button>
          {exportOpen && (
            <div className="menu export__menu" role="menu">
              <button role="menuitem" className="menu__item" onClick={() => pick('png')}>
                <FileImage size={15} /> Image (PNG)
              </button>
              <button role="menuitem" className="menu__item" onClick={() => pick('pdf')}>
                <FileText size={15} /> Document (PDF)
              </button>
              <button role="menuitem" className="menu__item" onClick={() => pick('json')}>
                <FileJson size={15} /> Backup (JSON)
              </button>
              <button role="menuitem" className="menu__item" onClick={() => pick('md')}>
                <ListTree size={15} /> Outline (Markdown)
              </button>
              <button role="menuitem" className="menu__item" onClick={() => pick('copy-outline')}>
                <ClipboardCopy size={15} /> Copy as outline
              </button>
            </div>
          )}
        </span>
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
