import { describe, expect, it } from 'vitest';
import { fileName, parseFile, toFile } from './mapFile.js';
import { TEMPLATES } from './mapOps.js';

const sample = () => ({ title: 'Plan', ...TEMPLATES.project.build() });
const fileWith = (patch) => JSON.stringify({ format: 'mind-mapper', version: 1, title: 'T', ...patch });

describe('toFile / parseFile', () => {
  it('round-trips a map without losing ideas, connections or positions', () => {
    const map = sample();
    const back = parseFile(toFile(map));
    expect(back.title).toBe('Plan');
    expect(back.nodes.map((n) => n.data.label)).toEqual(map.nodes.map((n) => n.data.label));
    expect(back.nodes.map((n) => n.position)).toEqual(map.nodes.map((n) => n.position));
    expect(back.edges).toHaveLength(map.edges.length);
  });

  it.each([
    ['not JSON', '{oops', 'not valid JSON'],
    ['another app', JSON.stringify({ format: 'other', nodes: [], edges: [] }), 'not a Mind Mapper file'],
    ['newer version', fileWith({ version: 99, nodes: [], edges: [] }), 'newer version'],
    ['missing arrays', fileWith({}), 'missing'],
    ['empty map', fileWith({ nodes: [], edges: [] }), 'empty'],
  ])('rejects %s with a clear message', (_, raw, msg) => {
    expect(() => parseFile(raw)).toThrow(msg);
  });

  it('rejects duplicate ids', () => {
    const raw = fileWith({ nodes: [{ id: 'a', data: { label: 'A' } }, { id: 'a', data: { label: 'B' } }], edges: [] });
    expect(() => parseFile(raw)).toThrow('duplicate');
  });

  it('cleans unsafe or broken values', () => {
    const raw = fileWith({
      title: '  ',
      nodes: [
        { id: 'r', position: { x: 'NaN' }, data: { label: 'x'.repeat(500), color: 'hotpink', root: true } },
        { id: 'c', position: { x: 10, y: 20 }, data: { label: 'Child', notes: 42 } },
      ],
      edges: [
        { source: 'r', target: 'c' },
        { source: 'r', target: 'c' }, // duplicate
        { source: 'r', target: 'ghost' }, // unknown idea
        { source: 'c', target: 'r' }, // into the root
      ],
    });
    const m = parseFile(raw);
    expect(m.title).toBe('Imported map');
    expect(m.nodes[0].data.label).toHaveLength(80);
    expect(m.nodes[0].data.color).toBe('violet');
    expect(m.nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(m.nodes[1].data.notes).toBe('');
    expect(m.edges).toEqual([expect.objectContaining({ source: 'r', target: 'c' })]);
  });

  it('makes sure there is exactly one central idea', () => {
    const none = parseFile(fileWith({ nodes: [{ id: 'a', data: { label: 'A' } }, { id: 'b', data: { label: 'B' } }], edges: [] }));
    expect(none.nodes.filter((n) => n.data.root).map((n) => n.id)).toEqual(['a']);
    const two = parseFile(
      fileWith({ nodes: [{ id: 'a', data: { root: true } }, { id: 'b', data: { root: true } }], edges: [] }),
    );
    expect(two.nodes.filter((n) => n.data.root)).toHaveLength(1);
  });
});

describe('tasks in files', () => {
  it('keeps valid task data and cleans the rest', () => {
    const raw = fileWith({
      nodes: [
        { id: 'r', data: { label: 'R', root: true } },
        { id: 't', data: { label: 'T', task: { done: true, due: '2026-12-01', priority: 'high', x: 1 } } },
        { id: 'b', data: { label: 'B', task: { due: 'soon' } } },
      ],
      edges: [{ source: 'r', target: 't' }, { source: 'r', target: 'b' }],
    });
    const [, t, b] = parseFile(raw).nodes;
    expect(t.data.task).toEqual({ done: true, due: '2026-12-01', priority: 'high' });
    expect(b.data.task).toEqual({ done: false });
  });
});

describe('fileName', () => {
  it('turns a title into a safe file name', () => {
    expect(fileName('Sprint 14: Plan!', 'pdf')).toBe('sprint-14-plan.pdf');
    expect(fileName('', 'json')).toBe('mind-map.json');
    expect(fileName('***', 'png')).toBe('mind-map.png');
  });
});
