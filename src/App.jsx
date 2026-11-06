import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getNodesBounds,
  getViewportForBounds,
  useReactFlow,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import MindNode from './components/MindNode.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toolbar from './components/Toolbar.jsx';
import Inspector from './components/Inspector.jsx';
import { EmptyState, ShortcutsDialog, Toast } from './components/Overlays.jsx';
import { TEMPLATES, addChild, addSibling, childrenOf, layoutTree, removeWithDescendants } from './lib/mapOps.js';
import * as storage from './api/storage.js';

const nodeTypes = { mind: MindNode };
const MINIMAP_COLORS = { violet: '#8b5cf6', cyan: '#06b6d4', pink: '#ec4899', amber: '#f59e0b', emerald: '#10b981', slate: '#64748b' };
const minimapColor = (n) => MINIMAP_COLORS[n.data?.color] ?? '#8b5cf6';
const defaultEdgeOptions = { type: 'smoothstep', className: 'mind-edge' };
const LAST_KEY = 'mindmapper.last';
const THEME_KEY = 'mindmapper.theme';

// Only persist what matters, so selection or measuring doesn't trigger saves
const snapshot = (title, nodes, edges) =>
  JSON.stringify({
    title,
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target, type }) => ({ id, source, target, type })),
  });

const safeGet = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage unavailable: ignore */
  }
};

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

export default function App() {
  const { fitView, getNodes, setCenter, getZoom } = useReactFlow();
  const [mode, setMode] = useState('local');
  const [maps, setMaps] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [status, setStatus] = useState('saved');
  const [theme, setTheme] = useState(() => safeGet(THEME_KEY) || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState('');
  const savedRef = useRef('');
  const toastTimer = useRef(null);

  const selected = nodes.find((n) => n.selected) ?? null;

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  // Theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    safeSet(THEME_KEY, theme);
  }, [theme]);

  // Open a map
  const openMap = useCallback(
    async (id) => {
      try {
        const map = await storage.getMap(id);
        setActiveId(map.id);
        setTitle(map.title);
        setNodes(map.nodes ?? []);
        setEdges(map.edges ?? []);
        savedRef.current = snapshot(map.title, map.nodes ?? [], map.edges ?? []);
        setStatus('saved');
        setSidebarOpen(false);
        safeSet(LAST_KEY, map.id);
        requestAnimationFrame(() => fitView({ padding: 0.25, duration: 300 }));
      } catch {
        notify('Could not open that map');
      }
    },
    [fitView, notify],
  );

  // First load: detect API vs local, list maps, reopen the last one
  useEffect(() => {
    (async () => {
      setMode(await storage.detectMode());
      const list = await storage.listMaps();
      setMaps(list);
      setLoaded(true);
      const last = safeGet(LAST_KEY);
      const target = list.find((m) => m.id === last) ?? list[0];
      if (target) openMap(target.id);
    })();
  }, [openMap]);

  // Autosave (debounced)
  const save = useCallback(async () => {
    if (!activeId) return;
    const snap = snapshot(title, nodes, edges);
    if (snap === savedRef.current) return setStatus('saved');
    setStatus('saving');
    try {
      const { title: t, nodes: n, edges: e } = JSON.parse(snap);
      const updated = await storage.updateMap(activeId, { title: t, nodes: n, edges: e });
      savedRef.current = snap;
      setStatus('saved');
      setMaps((list) =>
        [{ id: activeId, title: updated.title, updatedAt: updated.updatedAt }, ...list.filter((m) => m.id !== activeId)],
      );
    } catch {
      setStatus('error');
    }
  }, [activeId, title, nodes, edges]);

  useEffect(() => {
    if (!activeId) return;
    if (snapshot(title, nodes, edges) === savedRef.current) return;
    setStatus('dirty');
    const t = setTimeout(save, 700);
    return () => clearTimeout(t);
  }, [activeId, title, nodes, edges, save]);

  // Map CRUD
  const createMap = async (templateKey) => {
    const tpl = TEMPLATES[templateKey] ?? TEMPLATES.blank;
    const { nodes: n, edges: e } = tpl.build();
    const map = await storage.createMap({ title: tpl.name === 'Blank map' ? 'Untitled map' : tpl.name, nodes: n, edges: e });
    setMaps((list) => [{ id: map.id, title: map.title, updatedAt: map.updatedAt }, ...list]);
    await openMap(map.id);
    notify('Map created');
  };

  const deleteMap = async (id) => {
    await storage.deleteMap(id);
    const rest = maps.filter((m) => m.id !== id);
    setMaps(rest);
    if (id === activeId) {
      setActiveId(null);
      setNodes([]);
      setEdges([]);
      if (rest[0]) openMap(rest[0].id);
    }
    notify('Map deleted');
  };

  // Graph editing
  const onNodesChange = useCallback((changes) => setNodes((ns) => applyNodeChanges(changes, ns)), []);
  const onEdgesChange = useCallback((changes) => setEdges((es) => applyEdgeChanges(changes, es)), []);
  const onConnect = useCallback((c) => setEdges((es) => addEdge({ ...c, type: 'smoothstep' }, es)), []);

  const selectOnly = (list, id) => list.map((n) => ({ ...n, selected: n.id === id }));

  const add = useCallback(
    (kind) => {
      if (!selected) return;
      const fn = kind === 'child' ? addChild : addSibling;
      const r = fn(nodes, edges, selected.id);
      if (!r.node) return;
      const laid = layoutTree(r.nodes, r.edges);
      setNodes(selectOnly(laid, r.node.id));
      setEdges(r.edges);
      setInspectorOpen(true);
      // Glide to the new idea so it is never added off-screen
      const p = laid.find((n) => n.id === r.node.id).position;
      setCenter(p.x + 90, p.y + 21, { zoom: Math.max(getZoom(), 0.7), duration: 250 });
    },
    [selected, nodes, edges, setCenter, getZoom],
  );

  const removeSelected = useCallback(() => {
    const ids = nodes.filter((n) => n.selected).map((n) => n.id);
    const edgeIds = new Set(edges.filter((e) => e.selected).map((e) => e.id));
    if (!ids.length && !edgeIds.size) return;
    const r = removeWithDescendants(nodes, edges.filter((e) => !edgeIds.has(e.id)), ids);
    if (ids.length && !r.removed && !edgeIds.size) return notify('The central idea can’t be deleted');
    setNodes(layoutTree(r.nodes, r.edges));
    setEdges(r.edges);
  }, [nodes, edges, notify]);

  const tidy = useCallback(() => {
    setNodes((ns) => layoutTree(ns, edges));
    requestAnimationFrame(() => fitView({ padding: 0.25, duration: 300 }));
  }, [edges, fitView]);

  // Keep the map in view when the window size changes (e.g. rotating a phone)
  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => fitView({ padding: 0.25, duration: 200 }), 150);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitView]);

  const updateSelected = (patch) =>
    setNodes((ns) => ns.map((n) => (n.id === selected?.id ? { ...n, data: { ...n.data, ...patch } } : n)));

  // Export the whole map as a PNG
  const exportPng = async () => {
    const all = getNodes();
    if (!all.length) return;
    const width = 1600;
    const height = 1000;
    const bounds = getNodesBounds(all);
    const vp = getViewportForBounds(bounds, width, height, 0.2, 2, 0.12);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
    try {
      const url = await toPng(document.querySelector('.react-flow__viewport'), {
        backgroundColor: bg,
        width,
        height,
        style: { width: `${width}px`, height: `${height}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
      });
      const a = document.createElement('a');
      a.download = `${(title || 'mind-map').replace(/[^\w-]+/g, '-').toLowerCase()}.png`;
      a.href = url;
      a.click();
      notify('PNG exported');
    } catch {
      notify('Export failed');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
        return;
      }
      if (isTyping(document.activeElement) || help) return;
      if (e.key === 'Tab' && selected) {
        e.preventDefault();
        add('child');
      } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        add('sibling');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        removeSelected();
      } else if (e.key.toLowerCase() === 't') {
        tidy();
      } else if (e.key.toLowerCase() === 'f') {
        fitView({ padding: 0.25, duration: 300 });
      } else if (e.key === '?') {
        setHelp(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, add, removeSelected, save, fitView, help, tidy]);

  // Escape closes the help dialog
  useEffect(() => {
    if (!help) return;
    const onKey = (e) => e.key === 'Escape' && setHelp(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [help]);

  const childCount = useMemo(() => (selected ? childrenOf(edges, selected.id).length : 0), [selected, edges]);

  return (
    <div className={`app${selected && inspectorOpen ? ' has-inspector' : ''}`}>
      <Sidebar
        maps={maps}
        activeId={activeId}
        mode={mode}
        open={sidebarOpen}
        onSelect={openMap}
        onCreate={createMap}
        onDelete={deleteMap}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}

      <main className="main">
        {activeId ? (
          <>
            <Toolbar
              title={title}
              onTitle={setTitle}
              status={status}
              hasSelection={!!selected}
              theme={theme}
              onMenu={() => setSidebarOpen(true)}
              onAddChild={() => add('child')}
              onAddSibling={() => add('sibling')}
              onDelete={removeSelected}
              onFit={() => fitView({ padding: 0.25, duration: 300 })}
              onTidy={tidy}
              onExport={exportPng}
              onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              onHelp={() => setHelp(true)}
            />
            <div className="canvas">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={() => setInspectorOpen(true)}
                deleteKeyCode={null}
                colorMode={theme}
                fitView
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} />
                <Controls showInteractive={false} position="bottom-left" />
                <MiniMap pannable zoomable position="bottom-right" nodeBorderRadius={10} nodeColor={minimapColor} className="minimap" />
              </ReactFlow>
              <p className="hint">
                Double-click to edit · <kbd>Tab</kbd> child · <kbd>Enter</kbd> sibling · <kbd>?</kbd> shortcuts
              </p>
            </div>
          </>
        ) : (
          loaded && (
            <>
              <button className="icon-btn floating-menu" onClick={() => setSidebarOpen(true)} aria-label="Open maps">
                ☰
              </button>
              <EmptyState onCreate={createMap} />
            </>
          )
        )}
      </main>

      {selected && inspectorOpen && (
        <Inspector
          node={selected}
          childCount={childCount}
          onChange={updateSelected}
          onAddChild={() => add('child')}
          onDelete={removeSelected}
          onClose={() => setInspectorOpen(false)}
        />
      )}

      {help && <ShortcutsDialog onClose={() => setHelp(false)} />}
      <Toast message={toast} />
    </div>
  );
}
