import { describe, expect, it } from 'vitest';
import { childrenOf, makeEdge, makeNode } from './mapOps.js';
import { flatten, indent, insertAfter, moveAmongSiblings, outdent } from './outlineOps.js';

// root ─┬─ a ── a1
//       ├─ b
//       └─ c
function tree() {
  const n = (id, root = false) => makeNode({ id, label: id, root });
  return {
    nodes: [n('root', true), n('a'), n('a1'), n('b'), n('c')],
    edges: [makeEdge('root', 'a'), makeEdge('a', 'a1'), makeEdge('root', 'b'), makeEdge('root', 'c')],
  };
}
const order = (t) => flatten(t.nodes, t.edges).map((r) => `${'  '.repeat(r.depth)}${r.id}`);

describe('flatten', () => {
  it('lists ideas in reading order with depth', () => {
    expect(order(tree())).toEqual(['root', '  a', '    a1', '  b', '  c']);
  });

  it('skips the children of collapsed ideas', () => {
    const t = tree();
    t.nodes = t.nodes.map((n) => (n.id === 'a' ? { ...n, data: { ...n.data, collapsed: true } } : n));
    expect(order(t)).toEqual(['root', '  a', '  b', '  c']);
  });
});

describe('insertAfter', () => {
  it('adds a sibling right after the idea', () => {
    const t = tree();
    const r = insertAfter(t.nodes, t.edges, 'b');
    expect(childrenOf(r.edges, 'root')).toEqual(['a', 'b', r.id, 'c']);
  });

  it('on the central idea, adds its first branch', () => {
    const t = tree();
    const r = insertAfter(t.nodes, t.edges, 'root');
    expect(childrenOf(r.edges, 'root')[0]).toBe(r.id);
  });

  it('works on a map that only has a central idea', () => {
    const r = insertAfter([makeNode({ id: 'root', root: true })], [], 'root');
    expect(childrenOf(r.edges, 'root')).toEqual([r.id]);
  });
});

describe('indent / outdent', () => {
  it('indent makes an idea the last child of the sibling above', () => {
    const t = tree();
    const r = indent(t.nodes, t.edges, 'b');
    expect(r.changed).toBe(true);
    expect(childrenOf(r.edges, 'a')).toEqual(['a1', 'b']);
    expect(childrenOf(r.edges, 'root')).toEqual(['a', 'c']);
  });

  it('cannot indent the first sibling or the root', () => {
    const t = tree();
    expect(indent(t.nodes, t.edges, 'a').changed).toBe(false);
    expect(indent(t.nodes, t.edges, 'root').changed).toBe(false);
  });

  it('outdent moves an idea up a level, right after its parent', () => {
    const t = tree();
    const r = outdent(t.nodes, t.edges, 'a1');
    expect(childrenOf(r.edges, 'root')).toEqual(['a', 'a1', 'b', 'c']);
    expect(childrenOf(r.edges, 'a')).toEqual([]);
  });

  it("cannot outdent the root's direct children", () => {
    const t = tree();
    expect(outdent(t.nodes, t.edges, 'b').changed).toBe(false);
  });

  it('indent then outdent returns to the same structure', () => {
    const t = tree();
    const a = indent(t.nodes, t.edges, 'b');
    const b = outdent(a.nodes, a.edges, 'b');
    expect(order(b)).toEqual(order(t));
  });
});

describe('moveAmongSiblings', () => {
  it('moves an idea up or down within its parent', () => {
    const t = tree();
    expect(childrenOf(moveAmongSiblings(t.edges, 'c', -1).edges, 'root')).toEqual(['a', 'c', 'b']);
    expect(moveAmongSiblings(t.edges, 'a', -1).changed).toBe(false);
  });
});
