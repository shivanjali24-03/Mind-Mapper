import { beforeEach, describe, expect, it } from 'vitest';
import { _setMode, createMap, deleteMap, getMap, listMaps, updateMap } from './storage.js';

describe('storage (local demo mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    _setMode('local');
  });

  it('creates, reads, updates and deletes a map', async () => {
    const created = await createMap({ title: 'Plan', nodes: [], edges: [] });
    expect((await getMap(created.id)).title).toBe('Plan');

    await updateMap(created.id, { title: 'Plan v2' });
    expect((await listMaps())[0]).toMatchObject({ id: created.id, title: 'Plan v2' });

    await deleteMap(created.id);
    expect(await listMaps()).toEqual([]);
  });

  it('lists maps newest first', async () => {
    const a = await createMap({ title: 'A', nodes: [], edges: [] });
    await new Promise((r) => setTimeout(r, 5));
    await createMap({ title: 'B', nodes: [], edges: [] });
    await new Promise((r) => setTimeout(r, 5));
    await updateMap(a.id, { title: 'A2' });
    expect((await listMaps()).map((m) => m.title)).toEqual(['A2', 'B']);
  });

  it('throws for a missing map', async () => {
    await expect(getMap('nope')).rejects.toThrow('not found');
  });
});
