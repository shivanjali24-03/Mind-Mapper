// One storage interface with two backends:
//  - "api":   the Express + MongoDB server
//  - "local": the browser's localStorage (used automatically when the API or DB is unavailable,
//             so the live demo always works)

const API_BASE = import.meta.env.VITE_API_URL || '';
const LS_KEY = 'mindmapper.maps.v1';

let mode = null;

const now = () => new Date().toISOString();
const meta = ({ id, title, updatedAt }) => ({ id, title, updatedAt });
const fromApi = (m) => ({ ...m, id: m._id ?? m.id });

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) ?? [];
  } catch {
    return [];
  }
}
function writeLocal(maps) {
  localStorage.setItem(LS_KEY, JSON.stringify(maps));
}

async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}/api/mindmaps${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

export async function detectMode() {
  if (mode) return mode;
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(2500) });
    const body = await res.json();
    mode = res.ok && body.db ? 'api' : 'local';
  } catch {
    mode = 'local';
  }
  return mode;
}

/** For tests only. */
export function _setMode(m) {
  mode = m;
}

export async function listMaps() {
  if ((await detectMode()) === 'api') return (await http('')).map((m) => meta(fromApi(m)));
  return readLocal()
    .map(meta)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getMap(id) {
  if ((await detectMode()) === 'api') return fromApi(await http(`/${id}`));
  const map = readLocal().find((m) => m.id === id);
  if (!map) throw new Error('Mind map not found');
  return map;
}

export async function createMap({ title, nodes, edges }) {
  if ((await detectMode()) === 'api') {
    return fromApi(await http('', { method: 'POST', body: JSON.stringify({ title, nodes, edges }) }));
  }
  const map = { id: `local_${Date.now().toString(36)}`, title, nodes, edges, createdAt: now(), updatedAt: now() };
  writeLocal([map, ...readLocal()]);
  return map;
}

export async function updateMap(id, changes) {
  if ((await detectMode()) === 'api') {
    return fromApi(await http(`/${id}`, { method: 'PUT', body: JSON.stringify(changes) }));
  }
  const maps = readLocal();
  const i = maps.findIndex((m) => m.id === id);
  if (i === -1) throw new Error('Mind map not found');
  maps[i] = { ...maps[i], ...changes, updatedAt: now() };
  writeLocal(maps);
  return maps[i];
}

export async function deleteMap(id) {
  if ((await detectMode()) === 'api') return http(`/${id}`, { method: 'DELETE' });
  writeLocal(readLocal().filter((m) => m.id !== id));
  return null;
}
