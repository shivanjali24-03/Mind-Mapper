import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { childrenOf, layoutTree, removeWithDescendants } from '../lib/mapOps.js';
import { flatten, indent, insertAfter, moveAmongSiblings, outdent } from '../lib/outlineOps.js';
import ProgressRing from './ProgressRing.jsx';
import { useView } from './viewContext.js';

/**
 * The map as an editable outline. Keys:
 * Enter new line · Tab / Shift+Tab indent / outdent · ↑ ↓ move focus · Alt+↑ ↓ reorder
 * Backspace on an empty line deletes it · Ctrl/⌘+Enter ticks a task
 */
export default function OutlineView({ nodes, edges, onGraph, onLabel, onSelect, onUndo, onRedo }) {
  const { progress, toggleTask, toggleCollapse } = useView();
  const rows = useMemo(() => flatten(nodes, edges), [nodes, edges]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [focusId, setFocusId] = useState(() => nodes.find((n) => n.selected)?.id ?? null);
  const listRef = useRef(null);
  // Focus moves only when a key asks for it (Enter, Tab, arrows), never on ordinary re-renders,
  // so clicking elsewhere isn't undone by the outline grabbing focus back
  const pendingFocus = useRef(null);

  const focusRow = (id) => {
    pendingFocus.current = id;
    setFocusId(id);
  };

  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    const input = listRef.current?.querySelector(`[data-row="${CSS.escape(id)}"] input`);
    if (input) {
      input.focus();
      pendingFocus.current = null;
    }
  }, [focusId, rows]);

  const apply = (r, nextFocus) => {
    onGraph(layoutTree(r.nodes, r.edges), r.edges);
    if (nextFocus) focusRow(nextFocus);
  };

  const onKeyDown = (e, id, index) => {
    const node = byId.get(id);
    // Undo/redo the whole outline change (new lines, indents), not just the text in this box
    if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
      e.preventDefault();
      return e.key.toLowerCase() === 'y' || e.shiftKey ? onRedo() : onUndo();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      return toggleTask(id);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const r = insertAfter(nodes, edges, id);
      return r.id && apply(r, r.id);
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const r = e.shiftKey ? outdent(nodes, edges, id) : indent(nodes, edges, id);
      return r.changed && apply(r, id);
    }
    if (e.key === 'Backspace' && !e.currentTarget.value && !node.data.root && !childrenOf(edges, id).length) {
      e.preventDefault();
      const r = removeWithDescendants(nodes, edges, [id]);
      return apply(r, rows[index - 1]?.id);
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.altKey) {
      e.preventDefault();
      const r = moveAmongSiblings(edges, id, e.key === 'ArrowUp' ? -1 : 1);
      return r.changed && apply({ nodes, edges: r.edges }, id);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = rows[index + (e.key === 'ArrowUp' ? -1 : 1)];
      if (next) focusRow(next.id);
    }
  };

  return (
    <div className="outline" ref={listRef}>
      <div className="outline__inner" role="tree" aria-label="Outline">
        {rows.map(({ id, depth }, index) => {
          const n = byId.get(id);
          const kids = childrenOf(edges, id).length;
          const prog = progress[id];
          return (
            <div
              key={id}
              data-row={id}
              role="treeitem"
              aria-level={depth + 1}
              aria-expanded={kids ? !n.data.collapsed : undefined}
              className={`outline-row c-${n.data.color}${n.data.root ? ' is-root' : ''}${n.data.task?.done ? ' is-done' : ''}${focusId === id ? ' is-focus' : ''}`}
              style={{ paddingLeft: depth * 26 }}
            >
              <button
                className="outline-row__toggle"
                tabIndex={-1}
                onClick={() => kids && toggleCollapse(id)}
                aria-label={kids ? (n.data.collapsed ? 'Expand' : 'Collapse') : undefined}
                style={{ visibility: kids ? 'visible' : 'hidden' }}
              >
                {n.data.collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              </button>
              {n.data.task ? (
                <button
                  className={`task-check${n.data.task.done ? ' is-on' : ''}`}
                  tabIndex={-1}
                  onClick={() => toggleTask(id)}
                  aria-label={n.data.task.done ? 'Mark as not done' : 'Mark as done'}
                >
                  {n.data.task.done && <Check size={12} strokeWidth={3} />}
                </button>
              ) : (
                <span className="outline-row__dot" aria-hidden="true" />
              )}
              <input
                value={n.data.label}
                placeholder={n.data.root ? 'Central idea' : 'Type an idea…'}
                aria-label={n.data.label || 'New idea'}
                maxLength={80}
                onChange={(e) => onLabel(id, e.target.value)}
                onFocus={() => {
                  setFocusId(id);
                  onSelect(id);
                }}
                onKeyDown={(e) => onKeyDown(e, id, index)}
              />
              {n.data.collapsed && kids > 0 && <span className="outline-row__more">+{kids}</span>}
              {prog && <ProgressRing done={prog.done} total={prog.total} size={18} />}
            </div>
          );
        })}
        <p className="outline__help">
          <kbd>Enter</kbd> new line · <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> indent · <kbd>Alt+↑↓</kbd> reorder ·{' '}
          <kbd>⌘/Ctrl+Enter</kbd> tick task · <kbd>⌫</kbd> on an empty line deletes it
        </p>
      </div>
    </div>
  );
}
