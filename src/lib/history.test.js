import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, emptyHistory, record, redo, undo } from './history.js';

describe('history', () => {
  it('starts empty', () => {
    const h = emptyHistory();
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it('undoes back to the previous snapshot and can redo it', () => {
    let h = record(emptyHistory(), 'A'); // A -> B
    const u = undo(h, 'B');
    expect(u.snapshot).toBe('A');
    expect(canRedo(u.history)).toBe(true);
    const r = redo(u.history, 'A');
    expect(r.snapshot).toBe('B');
    expect(canUndo(r.history)).toBe(true);
  });

  it('walks back through several steps in order', () => {
    let h = emptyHistory();
    h = record(h, 'A'); // A -> B
    h = record(h, 'B'); // B -> C
    let r = undo(h, 'C');
    expect(r.snapshot).toBe('B');
    r = undo(r.history, 'B');
    expect(r.snapshot).toBe('A');
    expect(canUndo(r.history)).toBe(false);
  });

  it('a new change clears the redo stack', () => {
    let h = record(emptyHistory(), 'A');
    const u = undo(h, 'B');
    h = record(u.history, 'A');
    expect(canRedo(h)).toBe(false);
  });

  it('returns null when there is nothing to undo or redo', () => {
    expect(undo(emptyHistory(), 'X').snapshot).toBeNull();
    expect(redo(emptyHistory(), 'X').snapshot).toBeNull();
  });

  it('keeps at most `limit` steps, dropping the oldest', () => {
    let h = emptyHistory();
    for (let i = 0; i < 5; i++) h = record(h, `S${i}`, 3);
    expect(h.past).toEqual(['S2', 'S3', 'S4']);
  });
});
