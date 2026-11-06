import { describe, expect, it } from 'vitest';
import { addChild, addSibling, layoutTree, makeNode, nodeHeight, removeWithDescendants, TEMPLATE_CATEGORIES, TEMPLATES, X_GAP } from './mapOps.js';

const root = () => makeNode({ id: 'root', label: 'Root', root: true });

describe('addChild', () => {
  it('adds a node to the right of the parent and connects it', () => {
    const { nodes, edges, node } = addChild([root()], [], 'root');
    expect(nodes).toHaveLength(2);
    expect(node.position.x).toBe(260);
    expect(edges).toEqual([expect.objectContaining({ source: 'root', target: node.id })]);
  });

  it('stacks siblings vertically', () => {
    let s = addChild([root()], [], 'root');
    const first = s.node;
    s = addChild(s.nodes, s.edges, 'root');
    expect(s.node.position.y).toBeGreaterThan(first.position.y);
  });

  it('returns the input unchanged for an unknown parent', () => {
    const nodes = [root()];
    expect(addChild(nodes, [], 'missing').nodes).toBe(nodes);
  });
});

describe('addSibling', () => {
  it('adds under the same parent', () => {
    const a = addChild([root()], [], 'root');
    const b = addSibling(a.nodes, a.edges, a.node.id);
    expect(b.edges.at(-1).source).toBe('root');
  });
});

describe('removeWithDescendants', () => {
  it('removes a node and its whole subtree', () => {
    const a = addChild([root()], [], 'root');
    const b = addChild(a.nodes, a.edges, a.node.id);
    const r = removeWithDescendants(b.nodes, b.edges, [a.node.id]);
    expect(r.nodes.map((n) => n.id)).toEqual(['root']);
    expect(r.edges).toHaveLength(0);
    expect(r.removed).toBe(2);
  });

  it('never removes the root', () => {
    const r = removeWithDescendants([root()], [], ['root']);
    expect(r.nodes).toHaveLength(1);
  });
});

describe('layoutTree', () => {
  const overlaps = (nodes) => {
    const seen = new Set();
    for (const n of nodes) {
      const key = `${n.position.x}:${Math.round(n.position.y)}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  };

  it('places the root at the origin and children one level to the right', () => {
    const a = addChild([root()], [], 'root');
    const nodes = layoutTree(a.nodes, a.edges);
    const r = nodes.find((n) => n.id === 'root');
    expect(r.position.x).toBe(0);
    expect(r.position.y + nodeHeight(r) / 2).toBe(0); // root is centred on y = 0
    expect(nodes.find((n) => n.id === a.node.id).position.x).toBe(X_GAP);
  });

  it('never stacks two nodes in the same spot, even with uneven branches', () => {
    let s = { nodes: [root()], edges: [] };
    const a = addChild(s.nodes, s.edges, 'root');
    const b = addChild(a.nodes, a.edges, 'root');
    s = b;
    for (let i = 0; i < 4; i++) s = addChild(s.nodes, s.edges, a.node.id);
    for (let i = 0; i < 3; i++) s = addChild(s.nodes, s.edges, b.node.id);
    expect(overlaps(layoutTree(s.nodes, s.edges))).toBe(false);
  });

  it('keeps sibling subtrees in separate vertical bands', () => {
    let s = addChild([root()], [], 'root');
    const first = s.node;
    s = addChild(s.nodes, s.edges, 'root');
    const second = s.node;
    for (let i = 0; i < 3; i++) s = addChild(s.nodes, s.edges, first.id);
    const laid = layoutTree(s.nodes, s.edges);
    const lowestOfFirst = Math.max(
      ...laid.filter((n) => s.edges.some((e) => e.source === first.id && e.target === n.id)).map((n) => n.position.y),
    );
    expect(laid.find((n) => n.id === second.id).position.y).toBeGreaterThan(lowestOfFirst);
  });
});

describe('templates', () => {
  it('every template has a name, icon, known category and description', () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(t.name).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(TEMPLATE_CATEGORIES).toContain(t.category);
      expect(t.description).toBeTruthy();
    }
  });

  it('offers plenty of templates', () => {
    expect(Object.keys(TEMPLATES).length).toBeGreaterThanOrEqual(16);
  });

  it.each(Object.keys(TEMPLATES))('%s builds a connected tree with one root', (key) => {
    const { nodes, edges } = TEMPLATES[key].build();
    expect(nodes.filter((n) => n.data.root)).toHaveLength(1);
    expect(edges).toHaveLength(nodes.length - 1);
  });
});
