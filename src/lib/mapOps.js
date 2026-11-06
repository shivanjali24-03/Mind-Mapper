// Pure helpers for working with mind-map nodes and edges.
// Kept free of React so they are easy to unit test.

export const COLORS = ['violet', 'cyan', 'pink', 'amber', 'emerald', 'slate'];

export const newId = (prefix = 'n') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function makeNode({ id = newId(), label = 'New idea', x = 0, y = 0, color = 'violet', root = false } = {}) {
  return { id, type: 'mind', position: { x, y }, data: { label, color, notes: '', root } };
}

export function makeEdge(source, target) {
  return { id: `e_${source}_${target}`, source, target, type: 'smoothstep' };
}

export const childrenOf = (edges, parentId) => edges.filter((e) => e.source === parentId).map((e) => e.target);

/** Add a child under `parentId`, placed to the right and stacked below existing children. */
export function addChild(nodes, edges, parentId) {
  const parent = nodes.find((n) => n.id === parentId);
  if (!parent) return { nodes, edges, node: null };
  const siblings = childrenOf(edges, parentId).length;
  const node = makeNode({
    x: parent.position.x + 260,
    y: parent.position.y + siblings * 90 - 45,
    color: parent.data.root ? COLORS[siblings % (COLORS.length - 1)] : parent.data.color,
  });
  return { nodes: [...nodes, node], edges: [...edges, makeEdge(parentId, node.id)], node };
}

/** Add a sibling next to `nodeId` (same parent). Falls back to a child when the node is the root. */
export function addSibling(nodes, edges, nodeId) {
  const parentEdge = edges.find((e) => e.target === nodeId);
  if (!parentEdge) return addChild(nodes, edges, nodeId);
  return addChild(nodes, edges, parentEdge.source);
}

/** Remove nodes and everything that hangs below them. The root node is never removed. */
export function removeWithDescendants(nodes, edges, ids) {
  const doomed = new Set();
  const stack = ids.filter((id) => !nodes.find((n) => n.id === id)?.data.root);
  while (stack.length) {
    const id = stack.pop();
    if (doomed.has(id)) continue;
    doomed.add(id);
    stack.push(...childrenOf(edges, id));
  }
  return {
    nodes: nodes.filter((n) => !doomed.has(n.id)),
    edges: edges.filter((e) => !doomed.has(e.source) && !doomed.has(e.target)),
    removed: doomed.size,
  };
}

export const X_GAP = 280;
export const Y_GAP = 68;
// Approximate rendered heights, used to centre each node on its band
export const nodeHeight = (n) => (n.data.root ? 56 : 42);

/**
 * Tidy tree layout: the root sits at (0, 0), each level is X_GAP to the right,
 * and every branch gets vertical space in proportion to how many leaves it has,
 * so sub-branches never overlap. Nodes not connected to the root keep their position.
 */
export function layoutTree(nodes, edges) {
  const root = nodes.find((n) => n.data.root) ?? nodes[0];
  if (!root) return nodes;
  const ids = new Set(nodes.map((n) => n.id));
  const kids = (id) => childrenOf(edges, id).filter((k) => ids.has(k));

  const leaves = new Map();
  const visiting = new Set();
  const count = (id) => {
    if (leaves.has(id)) return leaves.get(id);
    if (visiting.has(id)) return 0; // guard against cycles
    visiting.add(id);
    const k = kids(id);
    const total = k.length ? Math.max(1, k.reduce((s, c) => s + count(c), 0)) : 1;
    leaves.set(id, total);
    return total;
  };

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const pos = new Map();
  const place = (id, depth, top) => {
    if (pos.has(id)) return;
    const centre = top + (count(id) * Y_GAP) / 2;
    pos.set(id, { x: depth * X_GAP, y: centre - nodeHeight(byId.get(id)) / 2 });
    let cursor = top;
    for (const c of kids(id)) {
      place(c, depth + 1, cursor);
      cursor += count(c) * Y_GAP;
    }
  };
  place(root.id, 0, -(count(root.id) * Y_GAP) / 2);

  return nodes.map((n) => (pos.has(n.id) ? { ...n, position: pos.get(n.id) } : n));
}

function tree(rootLabel, branches) {
  let nodes = [makeNode({ id: 'root', label: rootLabel, root: true })];
  let edges = [];
  const rename = (list, id, label) => list.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n));
  branches.forEach(([label, kids = []]) => {
    const r = addChild(nodes, edges, 'root');
    nodes = rename(r.nodes, r.node.id, label);
    edges = r.edges;
    kids.forEach((kid) => {
      const k = addChild(nodes, edges, r.node.id);
      nodes = rename(k.nodes, k.node.id, kid);
      edges = k.edges;
    });
  });
  return { nodes: layoutTree(nodes, edges), edges };
}

export const TEMPLATES = {
  blank: { name: 'Blank map', build: () => tree('Central idea', []) },
  project: {
    name: 'Project plan',
    build: () =>
      tree('Project launch', [
        ['Goals', ['Ship v1', 'Grow users']],
        ['Timeline', ['Design', 'Build', 'Launch']],
        ['Team', ['Frontend', 'Backend']],
        ['Risks', ['Scope creep']],
      ]),
  },
  swot: {
    name: 'SWOT analysis',
    build: () =>
      tree('SWOT', [
        ['Strengths', ['Fast delivery']],
        ['Weaknesses', ['Small team']],
        ['Opportunities', ['New market']],
        ['Threats', ['Competitors']],
      ]),
  },
  meeting: {
    name: 'Meeting notes',
    build: () =>
      tree('Weekly sync', [
        ['Agenda', ['Updates', 'Blockers']],
        ['Decisions', []],
        ['Action items', ['Owner + date']],
      ]),
  },
};
