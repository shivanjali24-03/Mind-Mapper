// Realistic demo maps so a first-time visitor sees a working app straight away.
import { layoutTree, makeEdge, makeNode, newId } from './mapOps.js';
import { todayISO } from './tasks.js';

// Due dates relative to today, so the demo always shows overdue / today / upcoming tasks
const inDays = (n) => todayISO(new Date(Date.now() + n * 86400000));

/**
 * Build a map from a simple outline:
 *   { label, color?, notes?, children?: [...] }
 * The first level of branches cycles through colours unless one is given.
 */
export function fromOutline(title, outline) {
  const nodes = [];
  const edges = [];
  const palette = ['violet', 'cyan', 'pink', 'amber', 'emerald'];

  const walk = (item, parentId, depth, inheritedColor, index) => {
    const id = parentId ? newId() : 'root';
    const color = item.color ?? (depth === 1 ? palette[index % palette.length] : inheritedColor);
    const node = makeNode({ id, label: item.label, color, root: depth === 0 });
    node.data.notes = item.notes ?? '';
    if (item.task) node.data.task = item.task;
    nodes.push(node);
    if (parentId) edges.push(makeEdge(parentId, id));
    (item.children ?? []).forEach((child, i) => walk(child, id, depth + 1, color, i));
  };
  walk(outline, null, 0, outline.color ?? 'violet', 0);

  return { title, nodes: layoutTree(nodes, edges), edges };
}

export const DEMO_OUTLINES = [
  [
    'Patient Portal: Product Plan',
    {
      label: 'Patient Portal v1',
      notes: 'Demo map: planning a HIPAA-ready patient portal. All data here is fictional.',
      children: [
        {
          label: 'Patients',
          children: [
            { label: 'Sign up & MFA', notes: 'Email + password, then an authenticator app (TOTP).' },
            { label: 'Book appointments' },
            { label: 'Secure messages' },
          ],
        },
        {
          label: 'Clinic staff',
          children: [{ label: 'Daily schedule' }, { label: 'Patient records' }, { label: 'Role-based access', notes: 'Doctor, nurse and admin see only what they need.' }],
        },
        {
          label: 'Security (HIPAA)',
          children: [
            { label: 'Encrypt PHI', notes: 'TLS 1.2+ in transit, AES-256 at rest.' },
            { label: 'Audit log' },
            { label: 'Auto logout' },
          ],
        },
        {
          label: 'Launch',
          children: [{ label: 'Pilot clinic' }, { label: 'Feedback survey' }],
        },
      ],
    },
  ],
  [
    'Sprint 14 Planning',
    {
      label: 'Sprint 14',
      notes: 'Two-week sprint. Goal: ship the new invoices screen.',
      children: [
        { label: 'Goals', children: [{ label: 'Invoices screen live' }, { label: 'Fix top 5 bugs' }] },
        {
          label: 'Frontend',
          children: [
            { label: 'Invoice table', task: { done: true } },
            { label: 'PDF preview', task: { done: false, due: inDays(2), priority: 'high' } },
            { label: 'Empty & error states', task: { done: false, due: inDays(5), priority: 'low' } },
          ],
        },
        {
          label: 'Backend',
          children: [
            { label: 'Invoices API', task: { done: true } },
            { label: 'Tax rules', notes: 'GST and VAT strategies.', task: { done: false, due: inDays(0), priority: 'medium' } },
          ],
        },
        {
          label: 'QA',
          children: [
            { label: 'Test plan', task: { done: false, due: inDays(-1), priority: 'high' } },
            { label: 'Regression run', task: { done: false, due: inDays(9) } },
          ],
        },
        { label: 'Risks', color: 'slate', children: [{ label: 'Payment gateway delay' }] },
      ],
    },
  ],
  [
    'Learning Path: React',
    {
      label: 'Master React',
      children: [
        { label: 'Basics', children: [{ label: 'JSX & props' }, { label: 'State & events' }, { label: 'Lists & keys' }] },
        { label: 'Hooks', children: [{ label: 'useEffect' }, { label: 'useMemo / useCallback' }, { label: 'Custom hooks' }] },
        { label: 'State management', children: [{ label: 'Context' }, { label: 'Redux Toolkit' }, { label: 'TanStack Query' }] },
        { label: 'Next.js', children: [{ label: 'App Router' }, { label: 'Server Components' }] },
        { label: 'Testing', children: [{ label: 'Vitest' }, { label: 'React Testing Library' }] },
      ],
    },
  ],
  [
    'Weekly Team Sync',
    {
      label: 'Team Sync: Monday',
      children: [
        { label: 'Wins', children: [{ label: 'CRM import released' }, { label: '2 new clients' }] },
        { label: 'Blockers', children: [{ label: 'Waiting on API keys' }] },
        { label: 'Decisions', children: [{ label: 'Move demo to Friday' }] },
        { label: 'Action items', children: [{ label: 'Update roadmap (Asha)' }, { label: 'Fix login bug (Ravi)' }] },
      ],
    },
  ],
];

export const buildDemoMaps = () => DEMO_OUTLINES.map(([title, outline]) => fromOutline(title, outline));
