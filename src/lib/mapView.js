// View helpers: which ideas are hidden by collapsed branches, and searching ideas.
import { childrenOf } from './mapOps.js';

/** Ids of every idea below `id` (not including `id`). */
export function descendants(edges, id) {
  const out = new Set();
  const stack = [...childrenOf(edges, id)];
  while (stack.length) {
    const next = stack.pop();
    if (out.has(next)) continue;
    out.add(next);
    stack.push(...childrenOf(edges, next));
  }
  return out;
}

/** Ideas hidden because one of their ancestors is collapsed. */
export function hiddenIds(nodes, edges) {
  const hidden = new Set();
  for (const n of nodes) {
    if (n.data.collapsed) for (const d of descendants(edges, n.id)) hidden.add(d);
  }
  return hidden;
}

/** Ancestors of `id`, nearest first. */
export function ancestors(edges, id) {
  const out = [];
  const seen = new Set([id]);
  let parent = edges.find((e) => e.target === id)?.source;
  while (parent && !seen.has(parent)) {
    out.push(parent);
    seen.add(parent);
    parent = edges.find((e) => e.target === parent)?.source;
  }
  return out;
}

/** Ideas whose text or notes contain the query (case-insensitive), in map order. */
export function searchNodes(nodes, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return nodes
    .filter((n) => n.data.label.toLowerCase().includes(q) || (n.data.notes || '').toLowerCase().includes(q))
    .map((n) => n.id);
}

/** Open every collapsed ancestor so `id` becomes visible. */
export function revealNode(nodes, edges, id) {
  const open = new Set(ancestors(edges, id));
  return nodes.map((n) => (open.has(n.id) && n.data.collapsed ? { ...n, data: { ...n.data, collapsed: false } } : n));
}

/** Focus mode: ids to hide so only `focusId` and everything below it stays visible. */
export function focusHidden(nodes, edges, focusId) {
  if (!focusId || !nodes.some((n) => n.id === focusId)) return new Set();
  const keep = descendants(edges, focusId);
  keep.add(focusId);
  return new Set(nodes.filter((n) => !keep.has(n.id)).map((n) => n.id));
}

/** Breadcrumb from the central idea down to `id`: [{ id, label }]. */
export function breadcrumb(nodes, edges, id) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return [...ancestors(edges, id).reverse(), id].filter((x) => byId.has(x)).map((x) => ({ id: x, label: byId.get(x).data.label || 'Untitled' }));
}
