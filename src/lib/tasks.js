// Tasks on ideas: progress roll-up, due dates and the task list.
// A task lives in node.data.task = { done: boolean, due?: 'YYYY-MM-DD', priority?: 'high' | 'medium' | 'low' }
import { childrenOf } from './mapOps.js';

export const PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

/** Today's date as YYYY-MM-DD in the user's time zone. */
export const todayISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Clean a task object from untrusted input; returns undefined if it isn't a task. */
export function cleanTask(t) {
  if (!t || typeof t !== 'object') return undefined;
  const out = { done: t.done === true };
  if (typeof t.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.due)) out.due = t.due;
  if (PRIORITIES.includes(t.priority)) out.priority = t.priority;
  return out;
}

/**
 * For every idea, count the tasks **below** it (not itself): { [id]: { done, total } }.
 * Ideas with no tasks below them are left out.
 */
export function rollUpProgress(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const memo = new Map();
  const visiting = new Set();
  const below = (id) => {
    if (memo.has(id)) return memo.get(id);
    if (visiting.has(id)) return { done: 0, total: 0 };
    visiting.add(id);
    let done = 0;
    let total = 0;
    for (const c of childrenOf(edges, id)) {
      const child = byId.get(c);
      if (!child) continue;
      if (child.data.task) {
        total += 1;
        if (child.data.task.done) done += 1;
      }
      const sub = below(c);
      done += sub.done;
      total += sub.total;
    }
    const r = { done, total };
    memo.set(id, r);
    return r;
  };
  const out = {};
  for (const n of nodes) {
    const r = below(n.id);
    if (r.total) out[n.id] = r;
  }
  return out;
}

/** 'overdue' | 'today' | 'soon' (within 7 days) | 'later' | 'none' */
export function dueStatus(due, today = todayISO()) {
  if (!due) return 'none';
  if (due < today) return 'overdue';
  if (due === today) return 'today';
  const days = (new Date(due) - new Date(today)) / 86400000;
  return days <= 7 ? 'soon' : 'later';
}

/** Open tasks first, sorted by due date (earliest first, no date last), then priority, then name. */
export function taskList(nodes, { includeDone = false } = {}) {
  return nodes
    .filter((n) => n.data.task && (includeDone || !n.data.task.done))
    .sort((a, b) => {
      const ta = a.data.task;
      const tb = b.data.task;
      if (ta.done !== tb.done) return ta.done ? 1 : -1;
      const da = ta.due ?? '9999-12-31';
      const db = tb.due ?? '9999-12-31';
      if (da !== db) return da < db ? -1 : 1;
      const pa = PRIORITY_RANK[ta.priority] ?? 3;
      const pb = PRIORITY_RANK[tb.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return a.data.label.localeCompare(b.data.label);
    });
}

/** Short, friendly date like "12 Nov". */
export const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
