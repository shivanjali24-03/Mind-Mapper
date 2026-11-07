// Structural edits for the Outline view. Sibling order = order of edges in the edges array,
// which is also the order layoutTree() uses, so the map and the outline always agree.
import { COLORS, childrenOf, makeEdge, makeNode } from './mapOps.js';

const parentOf = (edges, id) => edges.find((e) => e.target === id)?.source ?? null;

/** Ideas in reading order with their depth: [{ id, depth }]. Skips children of collapsed ideas. */
export function flatten(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const root = nodes.find((n) => n.data.root) ?? nodes[0];
  const out = [];
  const seen = new Set();
  const walk = (id, depth) => {
    if (seen.has(id) || !byId.has(id)) return;
    seen.add(id);
    out.push({ id, depth });
    if (byId.get(id).data.collapsed) return;
    childrenOf(edges, id).forEach((c) => walk(c, depth + 1));
  };
  if (root) walk(root.id, 0);
  return out;
}

/** Insert a new idea right after `id` (as its sibling), or as the first child of the root. */
export function insertAfter(nodes, edges, id) {
  const target = nodes.find((n) => n.id === id);
  if (!target) return { nodes, edges, id: null };
  const parent = target.data.root ? id : parentOf(edges, id);
  const parentNode = nodes.find((n) => n.id === parent);
  const color = parentNode?.data.root ? COLORS[childrenOf(edges, parent).length % (COLORS.length - 1)] : (parentNode?.data.color ?? 'violet');
  const node = makeNode({ label: '', color, x: target.position.x, y: target.position.y + 1 });
  const edge = makeEdge(parent, node.id);
  const next = [...edges];
  // On the central idea: become its first branch. Otherwise: go right after `id` among its siblings.
  const at = target.data.root ? edges.findIndex((e) => e.source === parent) : edges.findIndex((e) => e.target === id) + 1;
  if (at === -1) next.push(edge);
  else next.splice(at, 0, edge);
  return { nodes: [...nodes, node], edges: next, id: node.id };
}

/** Make `id` the last child of the sibling just above it. */
export function indent(nodes, edges, id) {
  const parent = parentOf(edges, id);
  if (!parent) return { nodes, edges, changed: false };
  const siblings = childrenOf(edges, parent);
  const i = siblings.indexOf(id);
  if (i <= 0) return { nodes, edges, changed: false };
  const newParent = siblings[i - 1];
  const rest = edges.filter((e) => e.target !== id);
  const lastChildEdge = rest.map((e, k) => [e, k]).filter(([e]) => e.source === newParent).pop();
  const insertAt = lastChildEdge ? lastChildEdge[1] + 1 : rest.length;
  const next = [...rest];
  next.splice(insertAt, 0, makeEdge(newParent, id));
  // un-collapse the new parent so the moved idea stays visible
  const ns = nodes.map((n) => (n.id === newParent && n.data.collapsed ? { ...n, data: { ...n.data, collapsed: false } } : n));
  return { nodes: ns, edges: next, changed: true };
}

/** Move `id` up one level, right after its current parent. The root's children can't be outdented. */
export function outdent(nodes, edges, id) {
  const parent = parentOf(edges, id);
  const grand = parent ? parentOf(edges, parent) : null;
  if (!grand) return { nodes, edges, changed: false };
  const rest = edges.filter((e) => e.target !== id);
  const parentEdgeIndex = rest.findIndex((e) => e.target === parent);
  const next = [...rest];
  next.splice(parentEdgeIndex + 1, 0, makeEdge(grand, id));
  return { nodes, edges: next, changed: true };
}

/** Move `id` one place up or down among its siblings. */
export function moveAmongSiblings(edges, id, step) {
  const parent = parentOf(edges, id);
  if (!parent) return { edges, changed: false };
  const sibs = childrenOf(edges, parent);
  const i = sibs.indexOf(id);
  const j = i + step;
  if (j < 0 || j >= sibs.length) return { edges, changed: false };
  const a = edges.findIndex((e) => e.target === id);
  const b = edges.findIndex((e) => e.target === sibs[j]);
  const next = [...edges];
  [next[a], next[b]] = [next[b], next[a]];
  return { edges: next, changed: true };
}
