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

// Each template: name, icon, category, short description and a builder.
// tree() takes [branch, [children...]] pairs and lays them out automatically.
export const TEMPLATE_CATEGORIES = ['Basics', 'Work', 'Strategy', 'Personal'];

export const TEMPLATES = {
  blank: {
    name: 'Blank map',
    icon: '🧠',
    category: 'Basics',
    description: 'Start from a single central idea',
    build: () => tree('Central idea', []),
  },
  brainstorm: {
    name: 'Brainstorm',
    icon: '💡',
    category: 'Basics',
    description: 'Capture ideas, questions and next steps',
    build: () =>
      tree('Big idea', [
        ['Ideas', ['Idea 1', 'Idea 2', 'Idea 3']],
        ['Questions', ['What problem does it solve?']],
        ['Inspiration', ['Examples we like']],
        ['Next steps', ['Pick top 3']],
      ]),
  },
  project: {
    name: 'Project plan',
    icon: '🚀',
    category: 'Work',
    description: 'Goals, timeline, team and risks',
    build: () =>
      tree('Project launch', [
        ['Goals', ['Ship v1', 'Grow users']],
        ['Timeline', ['Design', 'Build', 'Launch']],
        ['Team', ['Frontend', 'Backend']],
        ['Risks', ['Scope creep']],
      ]),
  },
  roadmap: {
    name: 'Product roadmap',
    icon: '🗺️',
    category: 'Work',
    description: 'Now, next and later, plus success metrics',
    build: () =>
      tree('Product roadmap', [
        ['Now', ['User login', 'Dashboard v1']],
        ['Next', ['Reports', 'Mobile layout']],
        ['Later', ['Integrations', 'Public API']],
        ['Metrics', ['Weekly active users', 'Churn rate']],
      ]),
  },
  meeting: {
    name: 'Meeting notes',
    icon: '📝',
    category: 'Work',
    description: 'Agenda, decisions and action items',
    build: () =>
      tree('Weekly sync', [
        ['Agenda', ['Updates', 'Blockers']],
        ['Decisions', []],
        ['Action items', ['Owner + date']],
      ]),
  },
  retro: {
    name: 'Sprint retrospective',
    icon: '🔁',
    category: 'Work',
    description: 'What went well, what to improve, actions',
    build: () =>
      tree('Sprint retro', [
        ['Went well', ['Shipped on time', 'Good teamwork']],
        ['To improve', ['Too many meetings', 'Unclear tickets']],
        ['Ideas', ['Pair programming']],
        ['Action items', ['Owner + due date']],
      ]),
  },
  okr: {
    name: 'Goals & OKRs',
    icon: '🎯',
    category: 'Work',
    description: 'Objectives with measurable key results',
    build: () =>
      tree('Quarter goals', [
        ['Objective: Delight customers', ['KR: NPS above 50', 'KR: Reply within 2h']],
        ['Objective: Grow revenue', ['KR: +20% MRR', 'KR: 30 new clients']],
        ['Objective: Ship faster', ['KR: Weekly releases']],
      ]),
  },
  swot: {
    name: 'SWOT analysis',
    icon: '📊',
    category: 'Strategy',
    description: 'Strengths, weaknesses, opportunities, threats',
    build: () =>
      tree('SWOT', [
        ['Strengths', ['Fast delivery']],
        ['Weaknesses', ['Small team']],
        ['Opportunities', ['New market']],
        ['Threats', ['Competitors']],
      ]),
  },
  decision: {
    name: 'Decision making',
    icon: '⚖️',
    category: 'Strategy',
    description: 'Compare options with pros and cons',
    build: () =>
      tree('Which option?', [
        ['Option A', ['Pro: cheaper', 'Con: slower']],
        ['Option B', ['Pro: faster', 'Con: costs more']],
        ['Criteria', ['Budget', 'Time', 'Risk']],
        ['Decision', ['Chosen option + why']],
      ]),
  },
  problem: {
    name: 'Problem solving',
    icon: '🔍',
    category: 'Strategy',
    description: 'Problem, root causes, solutions and plan',
    build: () =>
      tree('The problem', [
        ['Symptoms', ['What we see']],
        ['Root causes (5 Whys)', ['Why 1', 'Why 2', 'Why 3']],
        ['Possible solutions', ['Quick fix', 'Long-term fix']],
        ['Action plan', ['Who, what, when']],
      ]),
  },
  journey: {
    name: 'Customer journey',
    icon: '🧭',
    category: 'Strategy',
    description: 'From first contact to loyal customer',
    build: () =>
      tree('Customer journey', [
        ['Awareness', ['Social media', 'Search']],
        ['Consideration', ['Website visit', 'Free trial']],
        ['Purchase', ['Checkout']],
        ['Onboarding', ['Welcome email', 'First success']],
        ['Loyalty', ['Referrals', 'Reviews']],
      ]),
  },
  business: {
    name: 'Business model',
    icon: '💼',
    category: 'Strategy',
    description: 'Lean canvas: problem, value, customers, money',
    build: () =>
      tree('Business model', [
        ['Problem', ['Top 3 problems']],
        ['Customers', ['Early adopters']],
        ['Value proposition', ['Why us?']],
        ['Channels', ['How we reach them']],
        ['Revenue', ['Pricing']],
        ['Costs', ['Main expenses']],
      ]),
  },
  study: {
    name: 'Study notes',
    icon: '📚',
    category: 'Personal',
    description: 'Key concepts, examples and revision plan',
    build: () =>
      tree('Topic', [
        ['Key concepts', ['Concept 1', 'Concept 2']],
        ['Examples', ['Example 1']],
        ['Questions', ['What is unclear?']],
        ['Revision plan', ['Day 1', 'Day 3', 'Day 7']],
      ]),
  },
  weekly: {
    name: 'Weekly planner',
    icon: '🗓️',
    category: 'Personal',
    description: 'Plan work, health, learning and fun',
    build: () =>
      tree('This week', [
        ['Work', ['Top 3 tasks']],
        ['Learning', ['1 course lesson']],
        ['Health', ['3 workouts', 'Sleep by 11']],
        ['Personal', ['Call family']],
      ]),
  },
  event: {
    name: 'Event planning',
    icon: '🎉',
    category: 'Personal',
    description: 'Venue, guests, budget and schedule',
    build: () =>
      tree('Event', [
        ['Venue', ['Options', 'Booking']],
        ['Guests', ['Invite list', 'RSVPs']],
        ['Budget', ['Food', 'Decor']],
        ['Schedule', ['Start', 'Main activity', 'Close']],
        ['To-do', ['Send invites']],
      ]),
  },
  book: {
    name: 'Book summary',
    icon: '📖',
    category: 'Personal',
    description: 'Big ideas, favourite quotes and actions',
    build: () =>
      tree('Book title', [
        ['Big ideas', ['Idea 1', 'Idea 2', 'Idea 3']],
        ['Favourite quotes', ['Quote 1']],
        ['What I will do', ['Action 1']],
      ]),
  },
};
