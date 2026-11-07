// Arrow-key navigation between ideas. Pure: works on nodes/edges and returns the id to select.
import { childrenOf } from './mapOps.js';

const byY = (a, b) => a.position.y - b.position.y;

/**
 * @param {Array} nodes  all nodes (hidden ones are skipped)
 * @param {Array} edges
 * @param {string|null} fromId  currently selected idea
 * @param {'up'|'down'|'left'|'right'} dir
 * @param {Set<string>} hidden  ids hidden by collapsed branches
 * @returns {string|null} id to select, or null to stay put
 */
export function navigate(nodes, edges, fromId, dir, hidden = new Set()) {
  const visible = nodes.filter((n) => !hidden.has(n.id));
  const byId = new Map(visible.map((n) => [n.id, n]));
  const from = byId.get(fromId);
  if (!from) return (visible.find((n) => n.data.root) ?? visible[0])?.id ?? null;

  const parentId = edges.find((e) => e.target === fromId)?.source;

  if (dir === 'left') return parentId && byId.has(parentId) ? parentId : null;

  if (dir === 'right') {
    if (from.data.collapsed) return null;
    const kids = childrenOf(edges, fromId).map((id) => byId.get(id)).filter(Boolean).sort(byY);
    if (!kids.length) return null;
    // Pick the child closest to this idea's height, so → feels like "straight ahead"
    return kids.reduce((best, k) => (Math.abs(k.position.y - from.position.y) < Math.abs(best.position.y - from.position.y) ? k : best)).id;
  }

  // Up / down: siblings first, then the nearest idea in the same column
  const step = dir === 'up' ? -1 : 1;
  const siblings = parentId ? childrenOf(edges, parentId).map((id) => byId.get(id)).filter(Boolean).sort(byY) : [from];
  const i = siblings.findIndex((n) => n.id === fromId);
  if (siblings[i + step]) return siblings[i + step].id;

  const column = visible
    .filter((n) => n.id !== fromId && Math.abs(n.position.x - from.position.x) < 1)
    .filter((n) => (step < 0 ? n.position.y < from.position.y : n.position.y > from.position.y))
    .sort((a, b) => Math.abs(a.position.y - from.position.y) - Math.abs(b.position.y - from.position.y));
  return column[0]?.id ?? null;
}
