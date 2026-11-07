import { describe, expect, it } from 'vitest';
import { makeEdge, makeNode } from './mapOps.js';
import { buildSlides } from './presentation.js';

const n = (id, root = false, extra = {}) => {
  const node = makeNode({ id, label: id.toUpperCase(), root });
  Object.assign(node.data, extra);
  return node;
};
const nodes = [n('root', true), n('a'), n('a1'), n('b'), n('b1'), n('b2')];
const edges = [makeEdge('root', 'a'), makeEdge('a', 'a1'), makeEdge('root', 'b'), makeEdge('b', 'b1'), makeEdge('b', 'b2')];

describe('buildSlides', () => {
  it('starts with an overview of the whole map, then one slide per main branch', () => {
    const s = buildSlides(nodes, edges);
    expect(s.map((x) => x.title)).toEqual(['ROOT', 'A', 'B']);
    expect(s[0].ids).toHaveLength(6);
  });

  it('shows the central idea, the branch and everything below it on each branch slide', () => {
    const [, a, b] = buildSlides(nodes, edges);
    expect(a.ids.sort()).toEqual(['a', 'a1', 'root']);
    expect(b.ids.sort()).toEqual(['b', 'b1', 'b2', 'root']);
    expect(b.focus).toBe('b');
  });

  it('respects collapsed branches', () => {
    const collapsed = nodes.map((x) => (x.id === 'b' ? { ...x, data: { ...x.data, collapsed: true } } : x));
    const s = buildSlides(collapsed, edges, new Set(['b1', 'b2']));
    expect(s[2].ids.sort()).toEqual(['b', 'root']);
    expect(s[0].ids).not.toContain('b1');
  });

  it('returns no slides for an empty map', () => {
    expect(buildSlides([], [])).toEqual([]);
  });
});
