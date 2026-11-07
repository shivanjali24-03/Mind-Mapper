import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import MindNode from './components/MindNode.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toolbar from './components/Toolbar.jsx';
import Inspector from './components/Inspector.jsx';
import { EmptyState, ShortcutsDialog, Toast } from './components/Overlays.jsx';
// Loaded on demand: most sessions never open these, so they stay out of the first download
const Tour = lazy(() => import('./components/Tour.jsx'));
const TemplateGallery = lazy(() => import('./components/Templates.jsx').then((m) => ({ default: m.TemplateGallery })));
import { buildDemoMaps } from './lib/demoData.js';
import { TEMPLATES, addChild, addSibling, childrenOf, layoutTree, removeWithDescendants } from './lib/mapOps.js';
import * as storage from './api/storage.js';
import { storageKey } from './env.js';
import { canRedo, canUndo, emptyHistory, record, redo, undo } from './lib/history.js';
import { fileName, parseFile, toFile } from './lib/mapFile.js';
import { descendants, hiddenIds, revealNode, searchNodes } from './lib/mapView.js';
import { ViewContext } from './components/viewContext.js';
import SearchBar from './components/SearchBar.jsx';

const nodeTypes = { mind: MindNode };
const MINIMAP_COLORS = { violet: '#8b5cf6', cyan: '#06b6d4', pink: '#ec4899', amber: '#f59e0b', emerald: '#10b981', slate: '#64748b' };
const minimapColor = (n) => MINIMAP_COLORS[n.data?.color] ?? '#8b5cf6';
const defaultEdgeOptions = { type: 'smoothstep', className: 'mind-edge' };
const LAST_KEY = storageKey('last');
const THEME_KEY = storageKey('theme');
const SEEDED_KEY = storageKey('seeded');
const TOUR_KEY = storageKey('tourDone');

// Only persist what matters, so selection or measuring doesn't trigger saves
const cleanGraph = (nodes, edges) => ({
  nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
  edges: edges.map(({ id, source, target, type }) => ({ id, source, target, type })),
});
const snapshot = (title, nodes, edges) => JSON.stringify({ title, ...cleanGraph(nodes, edges) });

// The part of the map that undo/redo restores (not the title, not selection)
const graphSnapshot = (nodes, edges) => JSON.stringify(cleanGraph(nodes, edges));

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
  const [tourOpen, setTourOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [toast, setToast] = useState('');
  const savedRef = useRef('');
  // Undo/redo: `stableRef` is the last settled state; changes settle after a short pause
  const [history, setHistory] = useState(emptyHistory);
  const stableRef = useRef('');
  const settleTimer = useRef(null);
  const latest = useRef({ nodes: [], edges: [] });
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
        clearTimeout(settleTimer.current);
        stableRef.current = graphSnapshot(map.nodes ?? [], map.edges ?? []);
        setHistory(emptyHistory());
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

  const seedDemo = useCallback(async () => {
    for (const m of buildDemoMaps().reverse()) await storage.createMap(m);
    safeSet(SEEDED_KEY, '1');
    return storage.listMaps();
  }, []);

  // First load: detect API vs local, add demo maps for first-time visitors, reopen the last map
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in development
    started.current = true;
    (async () => {
      setMode(await storage.detectMode());
      let list = await storage.listMaps();
      if (!list.length && !safeGet(SEEDED_KEY)) list = await seedDemo();
      setMaps(list);
      setLoaded(true);
      const last = safeGet(LAST_KEY);
      const target = list.find((m) => m.id === last) ?? list[0];
      if (target) await openMap(target.id);
      // Show the guided tour once, after the map has settled on screen
      if (!safeGet(TOUR_KEY)) setTimeout(() => setTourOpen(true), 700);
    })();
  }, [openMap, seedDemo]);

  const loadDemo = async () => {
    const list = await seedDemo();
    setMaps(list);
    await openMap(list[0].id);
    notify('Demo maps added');
  };

  const closeTour = useCallback(() => {
    setTourOpen(false);
    safeSet(TOUR_KEY, '1');
  }, []);

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

  // ---- Export & import ----
  const download = (href, name) => {
    const a = document.createElement('a');
    a.download = name;
    a.href = href;
    a.click();
  };

  // Render the whole map (not just the visible part) to a PNG data URL
  const renderPng = async () => {
    const all = getNodes();
    const width = 1600;
    const height = 1000;
    const vp = getViewportForBounds(getNodesBounds(all), width, height, 0.2, 2, 0.12);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
    const { toPng } = await import('html-to-image'); // only loaded when exporting
    const url = await toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: bg,
      width,
      height,
      pixelRatio: 2,
      style: { width: `${width}px`, height: `${height}px`, transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
    });
    return { url, width, height };
  };

  const exportAs = async (kind) => {
    if (!getNodes().length) return;
    try {
      if (kind === 'json') {
        const blob = new Blob([toFile({ title, nodes, edges })], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        download(href, fileName(title, 'json'));
        setTimeout(() => URL.revokeObjectURL(href), 1000);
      } else {
        const { url, width, height } = await renderPng();
        if (kind === 'png') download(url, fileName(title, 'png'));
        else {
          const { jsPDF } = await import('jspdf'); // only loaded when exporting a PDF
          const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [width, height + 60] });
          pdf.setFontSize(22);
          pdf.text(title || 'Mind map', 32, 40);
          pdf.addImage(url, 'PNG', 0, 60, width, height);
          pdf.save(fileName(title, 'pdf'));
        }
      }
      notify(`${kind.toUpperCase()} exported`);
    } catch {
      notify('Export failed');
    }
  };

  const importFile = async (file) => {
    try {
      const map = parseFile(await file.text());
      const created = await storage.createMap(map);
      setMaps((list) => [{ id: created.id, title: created.title, updatedAt: created.updatedAt }, ...list]);
      await openMap(created.id);
      notify(`Imported "${created.title}"`);
    } catch (err) {
      notify(err.message || 'Import failed');
    }
  };

  // ---- Collapse & search ----
  const hidden = useMemo(() => hiddenIds(nodes, edges), [nodes, edges]);
  const viewNodes = useMemo(() => (hidden.size ? nodes.map((n) => (hidden.has(n.id) ? { ...n, hidden: true } : n)) : nodes), [nodes, hidden]);
  const viewEdges = useMemo(() => (hidden.size ? edges.map((e) => (hidden.has(e.target) ? { ...e, hidden: true } : e)) : edges), [edges, hidden]);

  const toggleCollapse = useCallback(
    (id) => {
      setNodes((ns) => {
        const toggled = ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n));
        const nowHidden = hiddenIds(toggled, edges);
        return layoutTree(toggled.map((n) => (nowHidden.has(n.id) && n.selected ? { ...n, selected: false } : n)), edges);
      });
    },
    [edges],
  );

  const matches = useMemo(() => searchNodes(nodes, query), [nodes, query]);
  const currentMatch = matches.length ? matches[Math.min(matchIndex, matches.length - 1)] : null;

  const goToMatch = useCallback(
    (i) => {
      if (!matches.length) return;
      const idx = (i + matches.length) % matches.length;
      setMatchIndex(idx);
      const id = matches[idx];
      let next = latest.current.nodes;
      if (hiddenIds(next, edges).has(id)) {
        next = layoutTree(revealNode(next, edges, id), edges);
        setNodes(next);
      }
      const p = next.find((n) => n.id === id)?.position;
      if (p) setCenter(p.x + 90, p.y + 21, { zoom: Math.max(getZoom(), 0.9), duration: 300 });
    },
    [matches, edges, setCenter, getZoom],
  );

  const onQuery = (q) => {
    setQuery(q);
    setMatchIndex(0);
  };
  useEffect(() => {
    if (searchOpen && query.trim() && matches.length) goToMatch(0);
    // jump to the first result whenever the query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const viewInfo = useMemo(() => {
    const childCounts = {};
    for (const e of edges) childCounts[e.source] = (childCounts[e.source] ?? 0) + 1;
    const hiddenCounts = {};
    for (const n of nodes) if (n.data.collapsed) hiddenCounts[n.id] = descendants(edges, n.id).size;
    return { childCounts, hiddenCounts, matches: new Set(searchOpen ? matches : []), currentMatch: searchOpen ? currentMatch : null, toggleCollapse };
  }, [nodes, edges, matches, currentMatch, searchOpen, toggleCollapse]);

  // ---- Undo / redo ----
  latest.current = { nodes, edges };

  // Record a history step once the map has been still for 400 ms,
  // so a whole drag or a burst of typing becomes a single undo step
  useEffect(() => {
    if (!activeId) return;
    const current = graphSnapshot(nodes, edges);
    if (current === stableRef.current) return;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const previous = stableRef.current;
      stableRef.current = current;
      setHistory((h) => record(h, previous));
    }, 400);
    return () => clearTimeout(settleTimer.current);
  }, [activeId, nodes, edges]);

  const settleNow = useCallback(() => {
    clearTimeout(settleTimer.current);
    const current = graphSnapshot(latest.current.nodes, latest.current.edges);
    if (current === stableRef.current) return history;
    const h = record(history, stableRef.current);
    stableRef.current = current;
    return h;
  }, [history]);

  const restore = useCallback((snap) => {
    const g = JSON.parse(snap);
    stableRef.current = snap;
    setNodes(g.nodes);
    setEdges(g.edges);
  }, []);

  const doUndo = useCallback(() => {
    const r = undo(settleNow(), stableRef.current);
    setHistory(r.history);
    if (r.snapshot) restore(r.snapshot);
  }, [settleNow, restore]);

  const doRedo = useCallback(() => {
    const r = redo(settleNow(), stableRef.current);
    setHistory(r.history);
    if (r.snapshot) restore(r.snapshot);
  }, [settleNow, restore]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && activeId) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (isTyping(document.activeElement) || help || tourOpen || galleryOpen) return; // inputs keep their own text undo
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        doRedo();
        return;
      }
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
  }, [selected, add, removeSelected, save, fitView, help, tidy, tourOpen, galleryOpen, doUndo, doRedo, activeId]);

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
        onNewMap={() => {
          setSidebarOpen(false);
          setGalleryOpen(true);
        }}
        onDelete={deleteMap}
        onClose={() => setSidebarOpen(false)}
        onLoadDemo={loadDemo}
        onImport={importFile}
        onTour={() => {
          setSidebarOpen(false);
          setTourOpen(true);
        }}
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
              canUndo={canUndo(history)}
              canRedo={canRedo(history)}
              onUndo={doUndo}
              onRedo={doRedo}
              onSearch={() => setSearchOpen(true)}
              onExport={exportAs}
              onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              onHelp={() => setHelp(true)}
              onTour={() => setTourOpen(true)}
            />
            <div className="canvas" data-tour="canvas">
              <ViewContext.Provider value={viewInfo}>
              <ReactFlow
                nodes={viewNodes}
                edges={viewEdges}
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
              </ViewContext.Provider>
              {searchOpen && (
                <SearchBar
                  query={query}
                  onQuery={onQuery}
                  count={matches.length}
                  index={Math.min(matchIndex, Math.max(matches.length - 1, 0))}
                  onPrev={() => goToMatch(matchIndex - 1)}
                  onNext={() => goToMatch(matchIndex + 1)}
                  onClose={() => {
                    setSearchOpen(false);
                    setQuery('');
                  }}
                />
              )}
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
              <EmptyState onCreate={createMap} onLoadDemo={loadDemo} onTour={() => setTourOpen(true)} />
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
      <Suspense fallback={null}>
      {galleryOpen && (
        <TemplateGallery
          onPick={(key) => {
            setGalleryOpen(false);
            createMap(key);
          }}
          onClose={() => setGalleryOpen(false)}
        />
      )}
      {tourOpen && <Tour open={tourOpen} onClose={closeTour} />}
      </Suspense>
      <Toast message={toast} />
    </div>
  );
}
