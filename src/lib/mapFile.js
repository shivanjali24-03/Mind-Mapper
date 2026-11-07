// The .json file format for exporting and importing maps, with strict validation:
// imported files come from users, so nothing is trusted as-is.
import { COLORS } from './mapOps.js';

export const FILE_FORMAT = 'mind-mapper';
export const FILE_VERSION = 1;
export const MAX_NODES = 5000;
export const MAX_BYTES = 5 * 1024 * 1024;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (Number.isFinite(v) ? v : 0);

/** Build the file contents for a map. */
export function toFile({ title, nodes, edges }) {
  return JSON.stringify(
    {
      format: FILE_FORMAT,
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      title,
      nodes: nodes.map(({ id, position, data }) => ({ id, position, data })),
      edges: edges.map(({ id, source, target }) => ({ id, source, target })),
    },
    null,
    2,
  );
}

/** Parse and clean an imported file. Throws an Error with a user-friendly message if it's not valid. */
export function parseFile(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) throw new Error('The file is too large (max 5 MB).');

  let doc;
  try {
    doc = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!doc || doc.format !== FILE_FORMAT) throw new Error('This is not a Mind Mapper file.');
  if (doc.version > FILE_VERSION) throw new Error('This file was made by a newer version of Mind Mapper.');
  if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) throw new Error('The file is missing its ideas or connections.');
  if (doc.nodes.length === 0) throw new Error('The map in this file is empty.');
  if (doc.nodes.length > MAX_NODES) throw new Error(`The map is too big (max ${MAX_NODES} ideas).`);

  const ids = new Set();
  const nodes = doc.nodes.map((n, i) => {
    const id = text(n?.id, 100);
    if (!id || ids.has(id)) throw new Error(`Idea #${i + 1} has a missing or duplicate id.`);
    ids.add(id);
    const d = n.data ?? {};
    return {
      id,
      type: 'mind',
      position: { x: num(n.position?.x), y: num(n.position?.y) },
      data: {
        label: text(d.label, 80) || 'Untitled',
        color: COLORS.includes(d.color) ? d.color : 'violet',
        notes: text(d.notes, 2000),
        root: d.root === true,
        ...(d.collapsed === true ? { collapsed: true } : {}),
      },
    };
  });

  // Exactly one root: keep the first one marked, or promote the first idea
  const roots = nodes.filter((n) => n.data.root);
  if (roots.length !== 1) nodes.forEach((n, i) => (n.data.root = roots.length ? n === roots[0] : i === 0));

  // Keep only connections between known ideas, never into the root, and no duplicates
  const rootId = nodes.find((n) => n.data.root).id;
  const seen = new Set();
  const edges = [];
  for (const e of doc.edges) {
    const source = text(e?.source, 100);
    const target = text(e?.target, 100);
    const key = `${source}->${target}`;
    if (!ids.has(source) || !ids.has(target) || source === target || target === rootId || seen.has(key)) continue;
    seen.add(key);
    edges.push({ id: `e_${source}_${target}`, source, target, type: 'smoothstep' });
  }

  return { title: text(doc.title, 120) || 'Imported map', nodes, edges };
}

/** Safe file name from a map title. */
export const fileName = (title, ext) => `${(title || 'mind-map').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'mind-map'}.${ext}`;
