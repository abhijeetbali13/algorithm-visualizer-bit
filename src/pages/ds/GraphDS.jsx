import { useState, useRef, useMemo } from 'react';
import { useVisualizer } from '../../hooks/useVisualizer';
import StepControls from '../../components/StepControls';
import './ds.css';

const TABS = ['Overview', 'Adjacency Matrix', 'Adjacency List', 'BFS', 'DFS', 'Applications'];

const DEFAULT_NODES = [
  { id:0, label:'A', x:120, y:80  },
  { id:1, label:'B', x:280, y:60  },
  { id:2, label:'C', x:400, y:140 },
  { id:3, label:'D', x:340, y:270 },
  { id:4, label:'E', x:180, y:290 },
  { id:5, label:'F', x:60,  y:210 },
];
const DEFAULT_EDGES = [[0,1],[0,5],[1,2],[1,4],[2,3],[3,4],[4,5]];

function circularPositions(n) {
  const cx = 230, cy = 170, r = Math.max(80, Math.min(150, 60 + n * 10));
  return Array.from({ length: n }, (_, i) => {
    const angle = (-90 + i * (360 / n)) * Math.PI / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

function parseGraphInput(text) {
  const pairs = text.split(',').map(s => s.trim()).filter(Boolean);
  const labelToIdx = new Map();
  const edges = [];
  for (const p of pairs) {
    const parts = p.split('-').map(s => s.trim()).filter(Boolean);
    if (parts.length !== 2) continue;
    const [a, b] = parts;
    if (!labelToIdx.has(a)) labelToIdx.set(a, labelToIdx.size);
    if (!labelToIdx.has(b)) labelToIdx.set(b, labelToIdx.size);
    const u = labelToIdx.get(a), v = labelToIdx.get(b);
    if (u === v) continue;
    if (!edges.some(([x,y]) => (x===u&&y===v)||(x===v&&y===u))) edges.push([u,v]);
  }
  if (labelToIdx.size < 2 || labelToIdx.size > 10 || !edges.length) return null;
  const positions = circularPositions(labelToIdx.size);
  const nodes = Array.from(labelToIdx.entries()).map(([label,id]) => ({ id, label, x: positions[id].x, y: positions[id].y }));
  return { nodes, edges };
}

function buildAdj(nodes, edges) {
  const N = nodes.length;
  const matrix = Array.from({ length:N }, () => Array(N).fill(0));
  const list = Array.from({ length:N }, () => []);
  edges.forEach(([u,v]) => { matrix[u][v]=matrix[v][u]=1; list[u].push(v); list[v].push(u); });
  return { matrix, list };
}

/* ───────────────────────── Step builders ───────────────────────── */

function buildBFS(nodes, list, startNode) {
  const steps = [];
  const visitOrder = [];
  const q = [startNode];
  const vis = new Set([startNode]);
  steps.push({ visited:[], current:startNode, queue:[...q], msg:`BFS start at ${nodes[startNode].label}: enqueue it. Queue: [${nodes[startNode].label}]` });

  while (q.length) {
    const u = q.shift();
    visitOrder.push(u);
    steps.push({ visited:[...visitOrder], current:u, queue:[...q], msg:`Dequeue & visit ${nodes[u].label}. Explore its neighbors...` });
    const neighbors = [...list[u]].sort((a,b)=>a-b);
    for (const v of neighbors) {
      if (!vis.has(v)) {
        vis.add(v); q.push(v);
        steps.push({ visited:[...visitOrder], current:u, queue:[...q], msg:`${nodes[u].label} → ${nodes[v].label}: unvisited, enqueue. Queue: [${q.map(x=>nodes[x].label).join(', ')}]` });
      } else {
        steps.push({ visited:[...visitOrder], current:u, queue:[...q], msg:`${nodes[u].label} → ${nodes[v].label}: already visited, skip.` });
      }
    }
  }
  steps.push({ visited:[...visitOrder], current:-1, queue:[], msg:`BFS complete! Order: ${visitOrder.map(x=>nodes[x].label).join(' → ')}` });
  return steps;
}

function buildDFS(nodes, list, startNode) {
  const steps = [];
  const visitOrder = [];
  const vis = new Set();

  const dfs = (u, stk) => {
    vis.add(u); visitOrder.push(u);
    steps.push({ visited:[...visitOrder], current:u, stack:[...stk], msg:`Visit ${nodes[u].label}. Call-stack depth: ${stk.length+1}.` });
    const neighbors = [...list[u]].sort((a,b)=>a-b);
    for (const v of neighbors) {
      if (!vis.has(v)) {
        steps.push({ visited:[...visitOrder], current:u, stack:[...stk,u], msg:`${nodes[u].label} → ${nodes[v].label}: unvisited, recurse deeper.` });
        dfs(v, [...stk, u]);
      } else {
        steps.push({ visited:[...visitOrder], current:u, stack:[...stk], msg:`${nodes[u].label} → ${nodes[v].label}: already visited, backtrack.` });
      }
    }
    steps.push({ visited:[...visitOrder], current:u, stack:[...stk], msg:`Backtrack from ${nodes[u].label} → return to ${stk.length?nodes[stk[stk.length-1]].label:'start'}.` });
  };

  dfs(startNode, []);
  steps.push({ visited:[...visitOrder], current:-1, stack:[], msg:`DFS complete! Order: ${visitOrder.map(x=>nodes[x].label).join(' → ')}` });
  return steps;
}

function buildMatrixSteps(nodes, edges) {
  const N = nodes.length;
  const matrix = Array.from({ length:N }, () => Array(N).fill(0));
  const steps = [];
  steps.push({ matrix: matrix.map(r=>[...r]), cell:null, msg:`Start with an N×N matrix of all 0s (N=${N}).` });
  edges.forEach(([u,v]) => {
    matrix[u][v] = 1; matrix[v][u] = 1;
    steps.push({ matrix: matrix.map(r=>[...r]), cell:[u,v], msg:`Edge ${nodes[u].label}-${nodes[v].label} → set matrix[${nodes[u].label}][${nodes[v].label}] = 1 and matrix[${nodes[v].label}][${nodes[u].label}] = 1 (undirected, so symmetric).` });
  });
  steps.push({ matrix: matrix.map(r=>[...r]), cell:null, msg:`Matrix complete. O(V²) space regardless of edge count — wasteful here since the graph is sparse.` });
  return steps;
}

function buildListSteps(nodes, edges) {
  const N = nodes.length;
  const list = Array.from({ length:N }, () => []);
  const steps = [];
  steps.push({ list: list.map(l=>[...l]), highlight:null, msg:`Start with N empty lists, one per vertex (N=${N}).` });
  edges.forEach(([u,v]) => {
    list[u].push(v); list[v].push(u);
    steps.push({ list: list.map(l=>[...l]), highlight:[u,v], msg:`Edge ${nodes[u].label}-${nodes[v].label} → append ${nodes[v].label} to ${nodes[u].label}'s list, and append ${nodes[u].label} to ${nodes[v].label}'s list.` });
  });
  steps.push({ list: list.map(l=>[...l]), highlight:null, msg:`List complete. O(V+E) space — only stores what actually exists, efficient for sparse graphs.` });
  return steps;
}

/* ───────────────────────── Main component ───────────────────────── */

export default function GraphDS() {
  const [graphBuildInput, setGraphBuildInput] = useState('');
  const [graphBuildErr, setGraphBuildErr]     = useState('');
  const [tab, setTab] = useState('Overview');
  const [graphData, setGraphData] = useState({ nodes: DEFAULT_NODES, edges: DEFAULT_EDGES });
  const [startNode, setStart] = useState(0);
  const [customInput, setCustomInput] = useState('A-B, A-F, B-C, B-E, C-D, D-E, E-F');
  const [graphError, setGraphError] = useState('');
  const [idleMsg, setIdleMsg] = useState('Press ▶ Run to animate, or step manually with Next →.');

  const { nodes, edges } = graphData;
  const { matrix: adjMatrix, list: adjList } = useMemo(() => buildAdj(nodes, edges), [nodes, edges]);

  const pendingSteps = useRef([]);
  const viz = useVisualizer(() => pendingSteps.current);
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const switchTab = (t) => { setTab(t); reset(); setIdleMsg('Press ▶ Run to animate, or step manually with Next →.'); };

  const loadCustomGraph = () => {
    const parsed = parseGraphInput(customInput);
    if (!parsed) { setGraphError('Invalid input. Use format: A-B, B-C, C-A (2-10 distinct nodes, at least 1 edge).'); return; }
    setGraphData(parsed);
    setStart(0);
    reset();
    setGraphError('');
    setIdleMsg(`Loaded custom graph: ${parsed.nodes.length} nodes, ${parsed.edges.length} edges.`);
  };
  const loadDefaultGraph = () => {
    setGraphData({ nodes: DEFAULT_NODES, edges: DEFAULT_EDGES });
    setStart(0); reset(); setGraphError('');
    setIdleMsg('Loaded the default sample graph.');
  };

  // applyCustomGraph: alias using the graphBuildInput field
  const applyCustomGraph = () => {
    setGraphBuildErr('');
    const parsed = parseGraphInput(graphBuildInput);
    if (!parsed) {
      setGraphBuildErr('Invalid input. Use format: A-B, B-C, C-A (2–10 nodes, at least 1 edge).');
      return;
    }
    setGraphData(parsed);
    setStart(0);
    reset();
    setIdleMsg(`Loaded: ${parsed.nodes.length} nodes, ${parsed.edges.length} edges.`);
  };

  // resetGraph: reset to default graph
  const resetGraph = () => {
    setGraphData({ nodes: DEFAULT_NODES, edges: DEFAULT_EDGES });
    setGraphBuildInput('');
    setGraphBuildErr('');
    setStart(0); reset();
    setIdleMsg('Reset to default graph.');
  };

  const runBFS = () => { pendingSteps.current = buildBFS(nodes, adjList, startNode); reset(); start(); };
  const runDFS = () => { pendingSteps.current = buildDFS(nodes, adjList, startNode); reset(); start(); };
  const runMatrixBuild = () => { pendingSteps.current = buildMatrixSteps(nodes, edges); reset(); start(); };
  const runListBuild = () => { pendingSteps.current = buildListSteps(nodes, edges); reset(); start(); };

  const visitedArr = (tab==='BFS'||tab==='DFS') ? (current ? current.visited : []) : [];
  const visitedSet = new Set(visitedArr);
  const curNode = (tab==='BFS'||tab==='DFS') ? (current ? current.current : -1) : -1;
  const bfsQueue = tab==='BFS' ? (current ? current.queue : []) : [];
  const dfsStack = tab==='DFS' ? (current ? current.stack : []) : [];

  const matStep = tab==='Adjacency Matrix' ? current : null;
  const dispMatrix = matStep ? matStep.matrix : adjMatrix;
  const matCell = matStep ? matStep.cell : null;

  const listStep = tab==='Adjacency List' ? current : null;
  const dispList = listStep ? listStep.list : adjList;
  const listHL = listStep ? listStep.highlight : null;

  const nodeColor = (id) => {
    if (id === curNode) return 'var(--yellow)';
    if (visitedSet.has(id)) return 'var(--green)';
    return '#1e3a5f';
  };
  const edgeHighlighted = (u, v) => visitedSet.has(u) && visitedSet.has(v);

  const displayMsg = current ? current.msg : idleMsg;

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Graphs</h1>
          <p>A non-linear data structure of vertices (nodes) connected by edges. Used to model networks, maps, social connections, dependencies, and much more.</p>
        </div>

              {/* ── Custom graph builder ── */}
      <div className="controls-panel" style={{ marginBottom:16 }}>
        <h3>Build Your Own Graph</h3>
        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>
          Type edges as <span style={{ fontFamily:'JetBrains Mono', color:'var(--accent)' }}>A-B, B-C, C-D</span> (undirected).
          Nodes are named by the letters you use — up to 10 nodes.
          Then run BFS or DFS from any node.
        </p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <input type="text" value={graphBuildInput} onChange={e => setGraphBuildInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') applyCustomGraph(); }}
            placeholder="e.g. A-B, B-C, C-D, D-A, A-C"
            style={{ flex:1, minWidth:240, padding:'7px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'JetBrains Mono', fontSize:12 }} />
          <button className="btn btn-primary" onClick={applyCustomGraph}>Build Graph</button>
          <button className="btn btn-secondary" onClick={resetGraph}>↺ Default Graph</button>
        </div>
        {graphBuildErr && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{graphBuildErr}</div>}
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>
          Format: <span style={{ fontFamily:'JetBrains Mono' }}>NODE-NODE</span> pairs separated by commas. Example: <span style={{ fontFamily:'JetBrains Mono', color:'var(--accent)' }}>A-B, B-C, C-A</span> makes a triangle.
        </div>
      </div>
      <div className="ds-tabs">
          {TABS.map(t => <button key={t} className={`ds-tab${tab===t?' active':''}`} onClick={()=>switchTab(t)}>{t}</button>)}
        </div>

        <div className="ds-layout">
          <div>
            <div className="ds-canvas" style={{ minHeight:320 }}>
              <svg viewBox="0 0 480 340" style={{ width:'100%', height:'auto' }}>
                {edges.map(([u,v],i)=>(
                  <line key={i}
                    x1={nodes[u].x} y1={nodes[u].y} x2={nodes[v].x} y2={nodes[v].y}
                    stroke={edgeHighlighted(u,v)?'var(--green)':'#1f3355'}
                    strokeWidth={edgeHighlighted(u,v)?2.5:1.5}
                    style={{ transition:'stroke 0.3s' }}
                  />
                ))}
                {nodes.map(node=>(
                  <g key={node.id} style={{ cursor:'pointer' }} onClick={()=>{ if(!running){ setStart(node.id); reset(); }}}>
                    <circle cx={node.x} cy={node.y} r={24}
                      fill={nodeColor(node.id)}
                      stroke={startNode===node.id&&!running?'white':'transparent'}
                      strokeWidth={3}
                      style={{ transition:'fill 0.3s' }}
                    />
                    <text x={node.x} y={node.y+5} textAnchor="middle"
                      fill={nodeColor(node.id)==='#1e3a5f'?'var(--muted)':'#0b0f1a'}
                      fontSize="15" fontWeight="700" fontFamily="JetBrains Mono">
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
              {(tab==='BFS'||tab==='DFS') && (
                <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', textAlign:'center', marginTop:4 }}>
                  Click any node to set start · Yellow = current · Green = visited
                </div>
              )}
            </div>

            <div className="ds-log" style={{ marginTop:10 }}>{displayMsg}</div>

            {tab==='Adjacency Matrix' && (
              <div style={{ marginTop:16 }}>
                <div className="section-label" style={{ marginBottom:10 }}>Adjacency Matrix — O(V²) space</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:13 }}>
                    <thead>
                      <tr>
                        <th style={{ padding:'6px 14px', color:'var(--muted)' }}></th>
                        {nodes.map(n=><th key={n.id} style={{ padding:'6px 14px', color:'var(--accent)' }}>{n.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {dispMatrix.map((row,i)=>(
                        <tr key={i}>
                          <td style={{ padding:'6px 14px', color:'var(--accent)', fontWeight:700 }}>{nodes[i].label}</td>
                          {row.map((val,j)=>{
                            const isActiveCell = matCell && ((matCell[0]===i&&matCell[1]===j)||(matCell[0]===j&&matCell[1]===i));
                            return (
                              <td key={j} style={{ padding:'6px 14px', textAlign:'center', background: isActiveCell?'rgba(234,179,8,0.25)':val?'rgba(0,212,255,0.12)':'transparent', color: isActiveCell?'var(--yellow)':val?'var(--accent)':'var(--muted)', borderRadius:4, border: isActiveCell?'1px solid var(--yellow)':val?'1px solid rgba(0,212,255,0.3)':'1px solid transparent', transition:'all 0.2s' }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ds-info-box" style={{ marginTop:12 }}>
                  matrix[i][j] = 1 if an edge exists between i and j, else 0.<br/>
                  <strong>Space:</strong> O(V²). <strong>Edge check:</strong> O(1). <strong>Find neighbors:</strong> O(V).<br/>
                  Best for <strong>dense graphs</strong>.
                </div>
              </div>
            )}

            {tab==='Adjacency List' && (
              <div style={{ marginTop:16 }}>
                <div className="section-label" style={{ marginBottom:10 }}>Adjacency List — O(V+E) space</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {dispList.map((neighbors,i)=>{
                    const rowActive = listHL && (listHL[0]===i || listHL[1]===i);
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:36, height:36, borderRadius:6, border:`2px solid ${rowActive?'var(--yellow)':'var(--accent)'}`, background: rowActive?'rgba(234,179,8,0.15)':'rgba(0,212,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:14, fontWeight:700, color: rowActive?'var(--yellow)':'var(--accent)', transition:'all 0.2s' }}>
                          {nodes[i].label}
                        </div>
                        <span style={{ color:'var(--muted)' }}>→</span>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {neighbors.map((nb,k)=>(
                            <div key={k} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'JetBrains Mono', fontSize:13, color:'var(--text)' }}>
                              {nodes[nb].label}
                            </div>
                          ))}
                          <div style={{ padding:'4px 10px', borderRadius:6, fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)' }}>→ null</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="ds-info-box" style={{ marginTop:12 }}>
                  Each vertex stores a list of its neighbors.<br/>
                  <strong>Space:</strong> O(V+E). <strong>Edge check:</strong> O(degree). <strong>Find neighbors:</strong> O(degree).<br/>
                  Best for <strong>sparse graphs</strong>.
                </div>
              </div>
            )}

            {(tab==='BFS'||tab==='DFS') && (
              <div style={{ marginTop:14 }}>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', flex:1 }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:6 }}>{tab==='BFS'?'QUEUE':'CALL STACK'}</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', minHeight:32 }}>
                      {(tab==='BFS'?bfsQueue:dfsStack).map((id,i)=>(
                        <div key={i} style={{ padding:'3px 10px', borderRadius:4, background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', fontFamily:'JetBrains Mono', fontSize:13, color:'var(--accent)' }}>
                          {nodes[id].label}
                        </div>
                      ))}
                      {(tab==='BFS'?bfsQueue:dfsStack).length===0 && <span style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)' }}>empty</span>}
                    </div>
                  </div>
                  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', flex:1 }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:6 }}>VISITED ORDER</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', minHeight:32 }}>
                      {visitedArr.map((id,i)=>(
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:2 }}>
                          <div style={{ padding:'3px 10px', borderRadius:4, background:'rgba(34,197,94,0.1)', border:'1px solid var(--green)', fontFamily:'JetBrains Mono', fontSize:13, color:'var(--green)' }}>
                            {nodes[id].label}
                          </div>
                          {i<visitedArr.length-1&&<span style={{ color:'var(--muted)', fontSize:11 }}>→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab==='Applications' && (
              <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  ['Social Networks','Nodes = users, edges = friendships. Find the shortest connection path.'],
                  ['GPS / Maps','Cities = nodes, roads = edges. Shortest-path algorithms route you.'],
                  ['Web Crawling','Pages = nodes, hyperlinks = edges. BFS crawls the web level by level.'],
                  ['Dependency Resolution','Build systems and package managers run topological sort on a DAG.'],
                  ['Network Flow','Max-flow problems: bandwidth allocation, traffic routing.'],
                  ['Recommendation','"Friends of friends" — graph traversal powers suggestions.'],
                ].map(([t,d])=>(
                  <div key={t} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--accent)', marginBottom:4 }}>{t}</div>
                    <div style={{ fontSize:12, color:'var(--muted)' }}>{d}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="ds-ops-panel">
            {tab==='Overview' && (
              <>
                <h3>Graph Types</h3>
                <div className="ds-info-box">
                  <strong>Directed (Digraph):</strong> edges have a direction A→B<br/>
                  <strong>Undirected:</strong> edges are bidirectional A↔B<br/>
                  <strong>Weighted:</strong> edges carry costs/distances<br/>
                  <strong>DAG:</strong> Directed Acyclic Graph — no cycles<br/>
                  <strong>Connected:</strong> every node reachable from any node
                </div>
                <h3>Terminology</h3>
                <div className="ds-info-box">
                  <strong>Vertex/Node:</strong> an entity in the graph<br/>
                  <strong>Edge:</strong> a connection between two vertices<br/>
                  <strong>Degree:</strong> number of edges touching a vertex<br/>
                  <strong>Path:</strong> a sequence of connected vertices<br/>
                  <strong>Cycle:</strong> a path that starts and ends at the same vertex
                </div>
              </>
            )}

            {tab !== 'Overview' && tab !== 'Applications' && (
              <>
                <h3>Graph data</h3>
                <div className="ds-op-group">
                  <label>Custom edges (e.g. A-B, B-C, C-A)</label>
                  <input className="ds-input" value={customInput} onChange={e=>setCustomInput(e.target.value)} placeholder="A-B, B-C, C-A"/>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-secondary" onClick={loadCustomGraph} style={{ flex:1 }} disabled={running}>Load Graph</button>
                  <button className="btn btn-secondary" onClick={loadDefaultGraph} style={{ flex:1 }} disabled={running}>Default</button>
                </div>
                {graphError && <div style={{ color:'var(--red)', fontSize:12, fontFamily:'JetBrains Mono' }}>{graphError}</div>}
              </>
            )}

            {tab==='Adjacency Matrix' && (
              <>
                <button className="btn btn-primary" onClick={runMatrixBuild} disabled={running} style={{ width:'100%' }}>
                  {running ? '▶ Building...' : '▶ Animate Build'}
                </button>
                <div className="ds-info-box">
                  <strong>✓ Pros:</strong><br/>
                  O(1) edge lookup<br/>
                  Simple to implement<br/><br/>
                  <strong>✗ Cons:</strong><br/>
                  O(V²) space — wasteful for sparse graphs<br/>
                  O(V) to find all neighbors
                </div>
              </>
            )}
            {tab==='Adjacency List' && (
              <>
                <button className="btn btn-primary" onClick={runListBuild} disabled={running} style={{ width:'100%' }}>
                  {running ? '▶ Building...' : '▶ Animate Build'}
                </button>
                <div className="ds-info-box">
                  <strong>✓ Pros:</strong><br/>
                  O(V+E) space<br/>
                  O(degree) neighbor lookup<br/>
                  Efficient for sparse graphs<br/><br/>
                  <strong>✗ Cons:</strong><br/>
                  O(degree) edge check (not O(1))
                </div>
              </>
            )}
            {(tab==='BFS'||tab==='DFS') && (
              <>
                <h3>Start Node</h3>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                  {nodes.map(n=>(
                    <button key={n.id} onClick={()=>{if(!running){setStart(n.id);reset();}}} className="btn btn-secondary"
                      style={{ padding:'5px 12px', fontSize:13, background:startNode===n.id?'rgba(0,212,255,0.1)':'', borderColor:startNode===n.id?'var(--accent)':'', color:startNode===n.id?'var(--accent)':'' }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={tab==='BFS'?runBFS:runDFS} disabled={running} style={{ width:'100%' }}>
                  {running ? '▶ Running...' : `▶ Run ${tab}`}
                </button>
                <div className="ds-info-box">
                  {tab==='BFS'
                    ? <><strong>BFS</strong> uses a <strong>Queue</strong>.<br/>Visits level by level.<br/>Finds the <strong>shortest path</strong> in an unweighted graph.<br/>Time: O(V+E)</>
                    : <><strong>DFS</strong> uses a <strong>Stack</strong> (recursion).<br/>Goes as deep as possible first.<br/>Used for cycle detection, topological sort.<br/>Time: O(V+E)</>
                  }
                </div>
              </>
            )}
            {tab==='Applications' && (
              <div className="ds-info-box">
                <strong>Current demo graph:</strong><br/>
                {nodes.length} vertices ({nodes.map(n=>n.label).join(', ')})<br/>
                {edges.length} undirected edges<br/><br/>
                Switch to BFS/DFS tabs to see traversal on this exact graph.
              </div>
            )}

            {steps.length > 0 && (
              <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
                onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
                speed={speed} onSpeedChange={setSpeed} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
