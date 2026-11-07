// Slides for Presentation mode: an overview, then one slide per main branch.
import { childrenOf } from './mapOps.js';
import { descendants } from './mapView.js';

/**
 * @returns {Array<{ title: string, ids: string[], focus: string }>}
 *   ids   = ideas to show on the slide (everything else is dimmed)
 *   focus = the idea the slide is about
 */
export function buildSlides(nodes, edges, hidden = new Set()) {
  const visible = nodes.filter((n) => !hidden.has(n.id));
  const root = visible.find((n) => n.data.root) ?? visible[0];
  if (!root) return [];
  const slides = [{ title: root.data.label || 'Overview', ids: visible.map((n) => n.id), focus: root.id }];
  for (const branchId of childrenOf(edges, root.id)) {
    if (hidden.has(branchId)) continue;
    const branch = visible.find((n) => n.id === branchId);
    if (!branch) continue;
    const below = branch.data.collapsed ? [] : [...descendants(edges, branchId)].filter((id) => !hidden.has(id));
    slides.push({ title: branch.data.label || 'Untitled', ids: [root.id, branchId, ...below], focus: branchId });
  }
  return slides;
}
