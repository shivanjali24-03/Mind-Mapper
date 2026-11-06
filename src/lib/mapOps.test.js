import { describe, expect, it } from 'vitest';
import { addChild, addSibling, makeNode, removeWithDescendants, TEMPLATES } from './mapOps.js';

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

describe('templates', () => {
  it.each(Object.keys(TEMPLATES))('%s builds a connected tree with one root', (key) => {
    const { nodes, edges } = TEMPLATES[key].build();
    expect(nodes.filter((n) => n.data.root)).toHaveLength(1);
    expect(edges).toHaveLength(nodes.length - 1);
  });
});
