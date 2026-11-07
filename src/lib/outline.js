// Convert between plain-text outlines (bullet lists, Markdown, indented notes) and mind maps.
import { COLORS, childrenOf, layoutTree, makeEdge, makeNode, newId } from './mapOps.js';

export const MAX_LINES = 2000;
const MAX_LABEL = 80;

// Bullet and numbering markers we strip: -, *, +, •, ‣, ◦, 1. 1) a. (a) and Markdown checkboxes
const BULLET = /^(?:[-*+•‣◦▪]\s+|\(?(?:\d+|[a-zA-Z])[.)]\s+)/;
const CHECKBOX = /^\[([ xX])\]\s+/;

/**
 * Parse text into a forest of { label, done?, children } items.
 * Indentation decides nesting (tabs or any consistent number of spaces);
 * Markdown headings (#, ##, ###) also create levels.
 */
export function parseOutline(text) {
  const raw = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((l) => l.trim());
  if (!raw.length) throw new Error('There is no text to turn into a map.');
  if (raw.length > MAX_LINES) throw new Error(`That's too many lines (max ${MAX_LINES}).`);

  // Work out the indent unit from the smallest non-zero space indent (tabs count as one level)
  const spaceIndents = raw.map((l) => l.match(/^ */)[0].length).filter((n) => n > 0);
  const unit = spaceIndents.length ? Math.min(...spaceIndents) : 1;

  let base = 0; // lines under a Markdown heading nest inside it
  const items = raw.map((line) => {
    const lead = line.match(/^[\t ]*/)[0];
    let level = base + (lead.match(/\t/g) || []).length + Math.round(lead.replace(/\t/g, '').length / unit);
    let body = line.trim();
    const heading = body.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      level = heading[1].length - 1;
      base = heading[1].length;
      body = heading[2];
    }
    body = body.replace(BULLET, '');
    let done;
    const box = body.match(CHECKBOX);
    if (box) {
      done = box[1].toLowerCase() === 'x';
      body = body.replace(CHECKBOX, '');
    }
    const label = body.replace(/\*\*|__|`/g, '').trim().slice(0, MAX_LABEL) || 'Untitled';
    return { level, label, done };
  });

  // Build the tree with a stack; a line can't be nested more than one level deeper than its parent
  const roots = [];
  const stack = [];
  for (const { level, label, done } of items) {
    const item = { label, children: [], ...(done !== undefined ? { done } : {}) };
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    if (stack.length) stack[stack.length - 1].item.children.push(item);
    else roots.push(item);
    stack.push({ level, item });
  }
  return roots;
}

/** Turn a forest into a brand-new map. One top-level line becomes the central idea. */
export function mapFromOutline(forest, fallbackTitle = 'Pasted ideas') {
  const root = forest.length === 1 ? forest[0] : { label: fallbackTitle, children: forest };
  const nodes = [];
  const edges = [];
  const walk = (item, parentId, depth, color, index) => {
    const id = parentId ? newId() : 'root';
    const c = depth === 1 ? COLORS[index % (COLORS.length - 1)] : color;
    const node = makeNode({ id, label: item.label, color: c, root: depth === 0 });
    if (item.done !== undefined) node.data.task = { done: item.done };
    nodes.push(node);
    if (parentId) edges.push(makeEdge(parentId, id));
    item.children.forEach((child, i) => walk(child, id, depth + 1, c, i));
  };
  walk(root, null, 0, 'violet', 0);
  return { title: root.label, nodes: layoutTree(nodes, edges), edges };
}

/** Add a forest as new branches under an existing idea. Returns the new ids too. */
export function addOutlineUnder(nodes, edges, parentId, forest) {
  const parent = nodes.find((n) => n.id === parentId);
  if (!parent) return { nodes, edges, added: [] };
  const newNodes = [];
  const newEdges = [];
  const start = childrenOf(edges, parentId).length;
  const walk = (item, pid, color) => {
    const id = newId();
    const node = makeNode({ id, label: item.label, color });
    if (item.done !== undefined) node.data.task = { done: item.done };
    newNodes.push(node);
    newEdges.push(makeEdge(pid, id));
    item.children.forEach((child) => walk(child, id, color));
  };
  forest.forEach((item, i) =>
    walk(item, parentId, parent.data.root ? COLORS[(start + i) % (COLORS.length - 1)] : parent.data.color),
  );
  const allEdges = [...edges, ...newEdges];
  return { nodes: layoutTree([...nodes, ...newNodes], allEdges), edges: allEdges, added: newNodes.map((n) => n.id) };
}

/** Export a map as a Markdown bullet list (tasks become checkboxes). */
export function toOutline(nodes, edges) {
  const root = nodes.find((n) => n.data.root) ?? nodes[0];
  if (!root) return '';
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lines = [];
  const seen = new Set();
  const walk = (id, depth) => {
    if (seen.has(id)) return;
    seen.add(id);
    const n = byId.get(id);
    if (!n) return;
    const box = n.data.task ? (n.data.task.done ? '[x] ' : '[ ] ') : '';
    lines.push(`${'  '.repeat(depth)}- ${box}${n.data.label}`);
    childrenOf(edges, id).forEach((c) => walk(c, depth + 1));
  };
  walk(root.id, 0);
  return lines.join('\n') + '\n';
}

/** Count the items in a forest (for previews like "12 ideas"). */
export const countOutline = (forest) => forest.reduce((s, i) => s + 1 + countOutline(i.children), 0);
