import { describe, expect, it } from 'vitest';
import { layoutTree, makeEdge, makeNode } from './mapOps.js';
import { navigate } from './navigate.js';

// root ─┬─ a ─┬─ a1
//       │     └─ a2
//       └─ b ─── b1
function map() {
  const n = (id, root = false) => makeNode({ id, label: id, root });
  const nodes = [n('root', true), n('a'), n('a1'), n('a2'), n('b'), n('b1')];
  const edges = [makeEdge('root', 'a'), makeEdge('a', 'a1'), makeEdge('a', 'a2'), makeEdge('root', 'b'), makeEdge('b', 'b1')];
  return { nodes: layoutTree(nodes, edges), edges };
}

describe('navigate', () => {
  const { nodes, edges } = map();
  const go = (from, dir, hidden) => navigate(nodes, edges, from, dir, hidden);

  it('selects the central idea when nothing is selected', () => {
    expect(go(null, 'down')).toBe('root');
  });

  it('moves to the parent with ←', () => {
    expect(go('a1', 'left')).toBe('a');
    expect(go('root', 'left')).toBeNull();
  });

  it('moves into the children with →', () => {
    expect(['a1', 'a2']).toContain(go('a', 'right'));
    expect(go('a1', 'right')).toBeNull();
  });

  it('moves between siblings with ↑ / ↓', () => {
    expect(go('a1', 'down')).toBe('a2');
    expect(go('a2', 'up')).toBe('a1');
    expect(go('a', 'down')).toBe('b');
  });

  it('continues to the nearest idea in the same column after the last sibling', () => {
    expect(go('a2', 'down')).toBe('b1');
    expect(go('b1', 'up')).toBe('a2');
  });

  it('skips hidden ideas inside collapsed branches', () => {
    const collapsed = nodes.map((n) => (n.id === 'a' ? { ...n, data: { ...n.data, collapsed: true } } : n));
    const hidden = new Set(['a1', 'a2']);
    expect(navigate(collapsed, edges, 'a', 'right', hidden)).toBeNull();
    expect(navigate(collapsed, edges, 'b1', 'up', hidden)).toBeNull();
  });
});
