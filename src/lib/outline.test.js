import { describe, expect, it } from 'vitest';
import { addOutlineUnder, countOutline, mapFromOutline, parseOutline, toOutline } from './outline.js';
import { makeNode } from './mapOps.js';

const labels = (forest) => forest.map((i) => [i.label, labels(i.children)]);

describe('parseOutline', () => {
  it('reads dash bullets with 2-space indents', () => {
    const f = parseOutline('- Plan\n  - Design\n  - Build\n    - API\n- Launch');
    expect(labels(f)).toEqual([
      ['Plan', [['Design', []], ['Build', [['API', []]]]]],
      ['Launch', []],
    ]);
  });

  it('handles tabs, 4-space indents, * • + bullets and numbering', () => {
    expect(labels(parseOutline('* A\n\t• B\n\t\t+ C'))).toEqual([['A', [['B', [['C', []]]]]]]);
    expect(labels(parseOutline('1. A\n    2) B\n    a. C'))).toEqual([['A', [['B', []], ['C', []]]]]);
  });

  it('treats Markdown headings as levels', () => {
    expect(labels(parseOutline('# Trip\n## Packing\n- Passport\n## Budget'))).toEqual([
      ['Trip', [['Packing', [['Passport', []]]], ['Budget', []]]],
    ]);
  });

  it('keeps checkbox state and strips Markdown emphasis', () => {
    const [a, b] = parseOutline('- [x] **Done** thing\n- [ ] `Todo`');
    expect(a).toMatchObject({ label: 'Done thing', done: true });
    expect(b).toMatchObject({ label: 'Todo', done: false });
  });

  it('copes with lines that jump more than one level deeper', () => {
    expect(labels(parseOutline('A\n        B\nC'))).toEqual([['A', [['B', []]]], ['C', []]]);
  });

  it('rejects empty text with a clear message', () => {
    expect(() => parseOutline('  \n\n ')).toThrow('no text');
  });

  it('limits label length', () => {
    expect(parseOutline('x'.repeat(300))[0].label).toHaveLength(80);
  });
});

describe('mapFromOutline', () => {
  it('uses a single top-level line as the central idea', () => {
    const m = mapFromOutline(parseOutline('Trip\n  Flights\n  Hotel'));
    expect(m.title).toBe('Trip');
    expect(m.nodes.filter((n) => n.data.root).map((n) => n.data.label)).toEqual(['Trip']);
    expect(m.edges).toHaveLength(2);
  });

  it('wraps several top-level lines under a new central idea', () => {
    const m = mapFromOutline(parseOutline('A\nB\nC'));
    expect(m.title).toBe('Pasted ideas');
    expect(m.nodes).toHaveLength(4);
  });

  it('turns checkboxes into tasks', () => {
    const m = mapFromOutline(parseOutline('Root\n  - [x] Done\n  - [ ] Open'));
    expect(m.nodes.filter((n) => n.data.task).map((n) => n.data.task.done)).toEqual([true, false]);
  });
});

describe('addOutlineUnder', () => {
  it('adds pasted lines as branches under the selected idea', () => {
    const root = makeNode({ id: 'root', label: 'R', root: true });
    const r = addOutlineUnder([root], [], 'root', parseOutline('- A\n  - A1\n- B'));
    expect(r.added).toHaveLength(3);
    expect(r.edges.filter((e) => e.source === 'root')).toHaveLength(2);
  });
});

describe('toOutline', () => {
  it('round-trips through text', () => {
    const text = '- Trip\n  - Flights\n  - [x] Hotel\n    - Check-in\n';
    const m = mapFromOutline(parseOutline(text));
    expect(toOutline(m.nodes, m.edges)).toBe(text);
  });
});

describe('countOutline', () => {
  it('counts every item', () => {
    expect(countOutline(parseOutline('A\n  B\n    C\nD'))).toBe(4);
  });
});
