import { describe, expect, it } from 'vitest';
import { buildDemoMaps, fromOutline } from './demoData.js';

describe('fromOutline', () => {
  it('turns a nested outline into a connected tree', () => {
    const { nodes, edges } = fromOutline('T', { label: 'Root', children: [{ label: 'A', children: [{ label: 'A1' }] }, { label: 'B' }] });
    expect(nodes.map((n) => n.data.label)).toEqual(['Root', 'A', 'A1', 'B']);
    expect(edges).toHaveLength(3);
    expect(nodes[0].data.root).toBe(true);
  });

  it('gives first-level branches different colours and children inherit them', () => {
    const { nodes } = fromOutline('T', { label: 'R', children: [{ label: 'A', children: [{ label: 'A1' }] }, { label: 'B' }] });
    const [, a, a1, b] = nodes;
    expect(a.data.color).not.toBe(b.data.color);
    expect(a1.data.color).toBe(a.data.color);
  });

  it('keeps notes', () => {
    const { nodes } = fromOutline('T', { label: 'R', notes: 'hello' });
    expect(nodes[0].data.notes).toBe('hello');
  });
});

describe('buildDemoMaps', () => {
  it('builds several valid, non-overlapping maps', () => {
    const maps = buildDemoMaps();
    expect(maps.length).toBeGreaterThanOrEqual(3);
    for (const m of maps) {
      expect(m.title).toBeTruthy();
      expect(m.edges).toHaveLength(m.nodes.length - 1);
      const spots = new Set(m.nodes.map((n) => `${n.position.x}:${Math.round(n.position.y)}`));
      expect(spots.size).toBe(m.nodes.length);
    }
  });
});
