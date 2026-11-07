import { describe, expect, it } from 'vitest';
import { addChild, layoutTree, makeNode } from './mapOps.js';
import { ancestors, breadcrumb, descendants, focusHidden, hiddenIds, revealNode, searchNodes } from './mapView.js';

// root -> a -> a1 -> a1x ; root -> b
function sample() {
  let s = { nodes: [makeNode({ id: 'root', label: 'Root', root: true })], edges: [] };
  const a = addChild(s.nodes, s.edges, 'root');
  const a1 = addChild(a.nodes, a.edges, a.node.id);
  const a1x = addChild(a1.nodes, a1.edges, a1.node.id);
  const b = addChild(a1x.nodes, a1x.edges, 'root');
  const label = (list, id, text, notes = '') => list.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: text, notes } } : n));
  let nodes = label(b.nodes, a.node.id, 'Alpha');
  nodes = label(nodes, a1.node.id, 'Apple pie', 'secret recipe');
  nodes = label(nodes, a1x.node.id, 'Crust');
  nodes = label(nodes, b.node.id, 'Beta');
  return { nodes, edges: b.edges, ids: { a: a.node.id, a1: a1.node.id, a1x: a1x.node.id, b: b.node.id } };
}
const collapse = (nodes, id) => nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, collapsed: true } } : n));

describe('descendants & ancestors', () => {
  it('finds everything below and above an idea', () => {
    const { edges, ids } = sample();
    expect([...descendants(edges, ids.a)].sort()).toEqual([ids.a1, ids.a1x].sort());
    expect(ancestors(edges, ids.a1x)).toEqual([ids.a1, ids.a, 'root']);
  });
});

describe('hiddenIds', () => {
  it('hides the whole subtree of a collapsed idea, but not the idea itself', () => {
    const { nodes, edges, ids } = sample();
    const hidden = hiddenIds(collapse(nodes, ids.a), edges);
    expect(hidden.has(ids.a)).toBe(false);
    expect(hidden.has(ids.a1)).toBe(true);
    expect(hidden.has(ids.a1x)).toBe(true);
    expect(hidden.has(ids.b)).toBe(false);
  });

  it('hides nothing when nothing is collapsed', () => {
    const { nodes, edges } = sample();
    expect(hiddenIds(nodes, edges).size).toBe(0);
  });
});

describe('searchNodes', () => {
  it('matches text and notes, ignoring case', () => {
    const { nodes, ids } = sample();
    expect(searchNodes(nodes, 'ALP')).toEqual([ids.a]);
    expect(searchNodes(nodes, 'recipe')).toEqual([ids.a1]);
    expect(searchNodes(nodes, 'a').length).toBeGreaterThan(2);
  });

  it('returns nothing for an empty query', () => {
    expect(searchNodes(sample().nodes, '   ')).toEqual([]);
  });
});

describe('revealNode', () => {
  it('opens collapsed ancestors so a search result becomes visible', () => {
    const { nodes, edges, ids } = sample();
    const closed = collapse(collapse(nodes, ids.a), ids.a1);
    const open = revealNode(closed, edges, ids.a1x);
    expect(hiddenIds(open, edges).has(ids.a1x)).toBe(false);
  });
});

describe('layoutTree with collapsed branches', () => {
  it('treats a collapsed idea as a leaf, so no gap is left for its hidden children', () => {
    const { nodes, edges, ids } = sample();
    const open = layoutTree(nodes, edges);
    const closed = layoutTree(collapse(nodes, ids.a), edges);
    const gap = (list) => list.find((n) => n.id === ids.b).position.y - list.find((n) => n.id === ids.a).position.y;
    expect(gap(closed)).toBeLessThanOrEqual(gap(open));
  });
});

describe('focus mode', () => {
  it('hides everything except the focused idea and its branches', () => {
    const { nodes, edges, ids } = sample();
    const hidden = focusHidden(nodes, edges, ids.a);
    expect(hidden.has(ids.a)).toBe(false);
    expect(hidden.has(ids.a1)).toBe(false);
    expect(hidden.has(ids.a1x)).toBe(false);
    expect(hidden.has('root')).toBe(true);
    expect(hidden.has(ids.b)).toBe(true);
  });

  it('hides nothing without a focus, or for an unknown id', () => {
    const { nodes, edges } = sample();
    expect(focusHidden(nodes, edges, null).size).toBe(0);
    expect(focusHidden(nodes, edges, 'nope').size).toBe(0);
  });

  it('builds a breadcrumb from the central idea down', () => {
    const { nodes, edges, ids } = sample();
    expect(breadcrumb(nodes, edges, ids.a1x).map((c) => c.label)).toEqual(['Root', 'Alpha', 'Apple pie', 'Crust']);
  });
});
