// Undo/redo history built from snapshots of the map.
// Pure functions: each returns a new history object and never mutates the old one.

export const HISTORY_LIMIT = 100;

export const emptyHistory = () => ({ past: [], future: [] });

/** Record that the map changed away from `previous`. Clears the redo stack. */
export function record(history, previous, limit = HISTORY_LIMIT) {
  const past = [...history.past, previous];
  return { past: past.length > limit ? past.slice(past.length - limit) : past, future: [] };
}

/** Step back. Returns the snapshot to restore, or null when there is nothing to undo. */
export function undo(history, current) {
  if (!history.past.length) return { history, snapshot: null };
  const snapshot = history.past[history.past.length - 1];
  return { history: { past: history.past.slice(0, -1), future: [current, ...history.future] }, snapshot };
}

/** Step forward again after an undo. */
export function redo(history, current) {
  if (!history.future.length) return { history, snapshot: null };
  const [snapshot, ...future] = history.future;
  return { history: { past: [...history.past, current], future }, snapshot };
}

export const canUndo = (h) => h.past.length > 0;
export const canRedo = (h) => h.future.length > 0;
