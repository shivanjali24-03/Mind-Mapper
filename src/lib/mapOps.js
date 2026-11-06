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

function tree(rootLabel, branches) {
  const root = makeNode({ id: 'root', label: rootLabel, root: true });
  let nodes = [root];
  let edges = [];
  branches.forEach(([label, kids = []], i) => {
    const r = addChild(nodes, edges, 'root');
    nodes = r.nodes.map((n) => (n.id === r.node.id ? { ...n, data: { ...n.data, label } } : n));
    edges = r.edges;
    nodes = nodes.map((n) =>
      n.id === r.node.id ? { ...n, position: { x: 260, y: (i - (branches.length - 1) / 2) * 170 } } : n,
    );
    kids.forEach((kid) => {
      const k = addChild(nodes, edges, r.node.id);
      nodes = k.nodes.map((n) => (n.id === k.node.id ? { ...n, data: { ...n.data, label: kid } } : n));
      edges = k.edges;
    });
  });
  return { nodes, edges };
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
