import { describe, expect, it } from 'vitest';
import { makeEdge, makeNode } from './mapOps.js';
import { cleanTask, dueStatus, rollUpProgress, taskList, todayISO } from './tasks.js';

const node = (id, task, root = false) => {
  const n = makeNode({ id, label: id, root });
  if (task) n.data.task = task;
  return n;
};

// root ─┬─ build ─┬─ api   (task, done)
//       │         └─ ui    (task)
//       └─ launch (task, done)
const nodes = [
  node('root', null, true),
  node('build'),
  node('api', { done: true }),
  node('ui', { done: false, due: '2026-11-10', priority: 'high' }),
  node('launch', { done: true, due: '2026-12-01' }),
];
const edges = [makeEdge('root', 'build'), makeEdge('build', 'api'), makeEdge('build', 'ui'), makeEdge('root', 'launch')];

describe('rollUpProgress', () => {
  it('counts tasks below each idea, all the way down', () => {
    const p = rollUpProgress(nodes, edges);
    expect(p.root).toEqual({ done: 2, total: 3 });
    expect(p.build).toEqual({ done: 1, total: 2 });
  });

  it('leaves out ideas with no tasks below them', () => {
    const p = rollUpProgress(nodes, edges);
    expect(p.api).toBeUndefined();
    expect(p.launch).toBeUndefined();
  });
});

describe('dueStatus', () => {
  const today = '2026-11-07';
  it.each([
    [undefined, 'none'],
    ['2026-11-01', 'overdue'],
    ['2026-11-07', 'today'],
    ['2026-11-12', 'soon'],
    ['2026-12-25', 'later'],
  ])('%s → %s', (due, status) => {
    expect(dueStatus(due, today)).toBe(status);
  });
});

describe('taskList', () => {
  it('lists open tasks only, by default', () => {
    expect(taskList(nodes).map((n) => n.id)).toEqual(['ui']);
  });

  it('puts done tasks last and sorts by due date, then priority', () => {
    const extra = [...nodes, node('docs', { done: false }), node('qa', { done: false, due: '2026-11-10', priority: 'low' })];
    expect(taskList(extra, { includeDone: true }).map((n) => n.id)).toEqual(['ui', 'qa', 'docs', 'launch', 'api']);
  });
});

describe('cleanTask', () => {
  it('keeps valid fields and drops anything else', () => {
    expect(cleanTask({ done: true, due: '2026-01-02', priority: 'high', evil: '<script>' })).toEqual({
      done: true,
      due: '2026-01-02',
      priority: 'high',
    });
    expect(cleanTask({ done: 'yes', due: 'tomorrow', priority: 'urgent' })).toEqual({ done: false });
    expect(cleanTask(null)).toBeUndefined();
  });
});

describe('todayISO', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
