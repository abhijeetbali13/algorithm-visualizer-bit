import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const GRAPHS = [
  {
    name: 'Graph A',
    nodes: [{ id:0,label:'A',x:90,y:180 },{ id:1,label:'B',x:230,y:80 },{ id:2,label:'C',x:230,y:280 },{ id:3,label:'D',x:380,y:80 },{ id:4,label:'E',x:380,y:280 },{ id:5,label:'F',x:510,y:180 }],
    edges: [{ u:0,v:1,w:4 },{ u:0,v:2,w:3 },{ u:1,v:2,w:2 },{ u:1,v:3,w:7 },{ u:2,v:4,w:5 },{ u:3,v:4,w:1 },{ u:3,v:5,w:6 },{ u:4,v:5,w:8 }],
  },
  {
    name: 'Graph B',
    nodes: [{ id:0,label:'A',x:80,y:160 },{ id:1,label:'B',x:220,y:60 },{ id:2,label:'C',x:360,y:60 },{ id:3,label:'D',x:220,y:260 },{ id:4,label:'E',x:360,y:260 },{ id:5,label:'F',x:490,y:160 }],
    edges: [{ u:0,v:1,w:2 },{ u:0,v:3,w:6 },{ u:1,v:2,w:3 },{ u:1,v:3,w:8 },{ u:1,v:4,w:5 },{ u:2,v:4,w:7 },{ u:2,v:5,w:9 },{ u:3,v:4,w:1 },{ u:4,v:5,w:4 }],
  },
];

// Layout nodes evenly around an ellipse for custom graphs
function layoutNodes(labels) {
  const n = labels.length;
  const cx = 290, cy = 180, rx = 220, ry = 130;
  if (n === 1) return [{ id: 0, label: labels[0], x: cx, y: cy }];
  return labels.map((label, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { id: i, label, x: Math.round(cx + rx * Math.cos(angle)), y: Math.round(cy + ry * Math.sin(angle)) };
  });
}

function primSteps(graph, src) {
  const n = graph.nodes.length;
  const inMST = Array(n).fill(false);
  const key = Array(n).fill(Infinity);   // min edge weight to connect to MST
  const parent = Array(n).fill(-1);
  const mstEdges = [];
  key[src] = 0;
  const steps = [];

  const snap = (msg, current, candidateEdge, reason) =>
    steps.push({ inMST:[...inMST], key:[...key], parent:[...parent], mstEdges:[...mstEdges], current: current??-1, candidateEdge: candidateEdge||null, reason: reason||'', msg });

  snap(`Initialize: key[${graph.nodes[src].label}]=0 (starting node), all others=∞`, src, null, `Source node ${graph.nodes[src].label} starts the MST with cost 0`);

  for (let iter = 0; iter < n; iter++) {
    // pick min key not in MST
    let u = -1;
    for (let i = 0; i < n; i++) { if (!inMST[i] && (u === -1 || key[i] < key[u])) u = i; }
    if (u === -1 || key[u] === Infinity) break;

    inMST[u] = true;
    if (parent[u] !== -1) mstEdges.push([parent[u], u]);
    snap(
      `Add node ${graph.nodes[u].label} to MST (key=${key[u]}). Greedy: smallest cut edge to unvisited nodes.`,
      u, null,
      `key[${graph.nodes[u].label}]=${key[u]} is the minimum among all non-MST nodes`
    );

    for (const { u: eu, v: ev, w } of graph.edges) {
      let nb = -1;
      if (eu === u) nb = ev;
      else if (ev === u) nb = eu;
      if (nb === -1 || inMST[nb]) continue;

      const better = w < key[nb];
      snap(
        `Check edge ${graph.nodes[u].label}–${graph.nodes[nb].label} (w=${w}): current key[${graph.nodes[nb].label}]=${key[nb]===Infinity?'∞':key[nb]}. ${better?`${w} < ${key[nb]===Infinity?'∞':key[nb]} → Update key!`:'No improvement.'}`,
        u, [u, nb],
        better ? `Cheaper edge found: ${graph.nodes[u].label}–${graph.nodes[nb].label} costs ${w}` : `Edge w=${w} ≥ key[${graph.nodes[nb].label}]=${key[nb]===Infinity?'∞':key[nb]}, skip`
      );
      if (better) { key[nb] = w; parent[nb] = u; }
    }
  }

  const totalWeight = mstEdges.reduce((sum, [u,v]) => {
    const e = graph.edges.find(e => (e.u===u&&e.v===v)||(e.u===v&&e.v===u));
    return sum + (e ? e.w : 0);
  }, 0);

  snap(`✓ MST complete! Total weight = ${totalWeight}. Used ${mstEdges.length} edges for ${n} nodes.`, -1, null, `MST has exactly n-1=${n-1} edges`);
  return steps;
}

export default function Prims() {
  const [graphIdx, setGraphIdx] = useState(0);
  const [src, setSrc] = useState(0);
  const [customGraph, setCustomGraph] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const allGraphs = customGraph ? [...GRAPHS, customGraph] : GRAPHS;
  const graph = allGraphs[graphIdx];

  const viz = useVisualizer(() => primSteps(graph, src));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  // Parse format: "A-B:4, A-C:2, B-C:5" → builds nodes from referenced labels
  const applyCustomGraph = () => {
    const tokens = inputValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (tokens.length === 0) {
      setInputError('Enter at least one edge, e.g. A-B:4, B-C:2');
      return;
    }
    if (tokens.length > 20) {
      setInputError('Please enter 20 edges or fewer.');
      return;
    }

    const labelOrder = [];
    const labelSet = new Set();
    const parsedEdges = [];

    for (const tok of tokens) {
      const m = tok.match(/^(\w+)\s*-\s*(\w+)\s*:\s*(-?\d+(\.\d+)?)$/);
      if (!m) {
        setInputError(`"${tok}" is invalid. Use format A-B:weight, e.g. A-B:4`);
        return;
      }
      const [, a, b, wStr] = m;
      const w = Number(wStr);
      if (!Number.isFinite(w) || w < 0) {
        setInputError(`Edge "${tok}": weight must be a non-negative number.`);
        return;
      }
      if (a === b) {
        setInputError(`Edge "${tok}": self-loops aren't allowed.`);
        return;
      }
      [a, b].forEach(l => { if (!labelSet.has(l)) { labelSet.add(l); labelOrder.push(l); } });
      parsedEdges.push({ a, b, w: Math.round(w * 100) / 100 });
    }

    if (labelOrder.length < 2) {
      setInputError('Graph needs at least 2 distinct nodes.');
      return;
    }
    if (labelOrder.length > 9) {
      setInputError('Please use 9 nodes or fewer for a readable layout.');
      return;
    }

    const nodes = layoutNodes(labelOrder);
    const labelToId = Object.fromEntries(nodes.map(n => [n.label, n.id]));
    const edges = parsedEdges.map(({ a, b, w }) => ({ u: labelToId[a], v: labelToId[b], w }));

    setInputError('');
    reset();
    const newGraph = { name: 'Custom', nodes, edges };
    setCustomGraph(newGraph);
    setGraphIdx(allGraphs.length); // index of the new custom graph
    setSrc(0);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') applyCustomGraph();
  };

  const inMST = current?.inMST || [];
  const mstEdges = current?.mstEdges || [];
  const key = current?.key || [];
  const activeCurrent = current?.current ?? -1;
  const candidateEdge = current?.candidateEdge || null;

  const isMSTEdge = (u, v) => mstEdges.some(([a,b]) => (a===u&&b===v)||(a===v&&b===u));
  const isCandidate = (u, v) => candidateEdge && ((candidateEdge[0]===u&&candidateEdge[1]===v)||(candidateEdge[0]===v&&candidateEdge[1]===u));

  const edgeStyle = (u, v) => {
    if (isCandidate(u,v)) return { stroke:'var(--yellow)', strokeWidth:3.5 };
    if (isMSTEdge(u,v))   return { stroke:'var(--green)',  strokeWidth:3 };
    return { stroke:'var(--border)', strokeWidth:1.5 };
  };
  const nodeFill = (id) => {
    if (activeCurrent === id) return 'var(--yellow)';
    if (inMST[id]) return 'var(--green)';
    return '#1e3a5f';
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Prim's Algorithm</h1>
          <p>Build a Minimum Spanning Tree by greedily adding the cheapest edge that connects a new node to the current MST. Similar to Dijkstra but minimizes edge weight, not path distance.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Click a node to set start, then press Start'}</div>
            {current?.reason && (
              <div style={{ background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.25)', borderRadius:8, padding:'8px 14px', marginBottom:12, fontFamily:'JetBrains Mono', fontSize:12, color:'var(--accent)' }}>
                → {current.reason}
              </div>
            )}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16 }}>
              <svg viewBox="0 0 580 360" style={{ width:'100%', height:'auto' }}>
                {graph.edges.map((e,i) => {
                  const nu=graph.nodes[e.u], nv=graph.nodes[e.v];
                  const mx=(nu.x+nv.x)/2, my=(nu.y+nv.y)/2;
                  const es = edgeStyle(e.u,e.v);
                  return (
                    <g key={i}>
                      <line x1={nu.x} y1={nu.y} x2={nv.x} y2={nv.y} {...es}/>
                      <rect x={mx-13} y={my-10} width={26} height={20} rx={4} fill="var(--surface2)" opacity="0.9"/>
                      <text x={mx} y={my+5} textAnchor="middle" fill={es.stroke==='var(--border)'?'var(--muted)':'var(--text)'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">{e.w}</text>
                    </g>
                  );
                })}
                {graph.nodes.map(node => {
                  const fill = nodeFill(node.id);
                  const k = key[node.id];
                  return (
                    <g key={node.id} style={{ cursor:'pointer' }} onClick={() => { reset(); setSrc(node.id); }}>
                      <circle cx={node.x} cy={node.y} r={26} fill={fill} stroke={src===node.id&&!current?'white':'transparent'} strokeWidth={3} opacity="0.95"/>
                      <text x={node.x} y={node.y+5} textAnchor="middle" fill={fill==='#1e3a5f'?'var(--muted)':'#0b0f1a'} fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">{node.label}</text>
                      {k !== undefined && (
                        <text x={node.x} y={node.y+46} textAnchor="middle" fill={k===Infinity?'var(--muted)':'var(--accent)'} fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">{k===Infinity?'∞':k}</text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ display:'flex', gap:14, marginTop:12, flexWrap:'wrap' }}>
              {[['#1e3a5f','Not in MST'],['var(--yellow)','Current node'],['var(--green)','In MST'],['var(--yellow)','Checking edge (yellow)']].map(([c,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--muted)' }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:c }}/>{l}
                </div>
              ))}
            </div>

            {/* Custom graph input */}
            <div className="controls-panel" style={{ marginTop: 16 }}>
              <h3>Custom Graph</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g. A-B:4, A-C:2, B-C:5, C-D:1"
                  disabled={running}
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border, #444)',
                    background: 'var(--bg-input, #1a1a1a)',
                    color: 'var(--fg, #fff)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={applyCustomGraph}
                  disabled={running}
                  className="btn"
                  style={{ padding: '8px 16px' }}
                >
                  Apply
                </button>
              </div>
              {inputError && (
                <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{inputError}</div>
              )}
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
                List edges as Node-Node:Weight, comma-separated (e.g. A-B:4, B-C:2). Up to 9 nodes, 20 edges, non-negative weights.
              </div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Start Node</h3>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                {graph.nodes.map(n => (
                  <button key={n.id} onClick={() => { reset(); setSrc(n.id); }} className="btn btn-secondary"
                    style={{ padding:'5px 12px', fontSize:13, background:src===n.id?'rgba(0,212,255,0.1)':'', borderColor:src===n.id?'var(--accent)':'', color:src===n.id?'var(--accent)':'' }}>
                    {n.label}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {allGraphs.map((g,i) => (
                  <button key={i} onClick={() => { reset(); setGraphIdx(i); setSrc(0); }} className="btn btn-secondary"
                    style={{ flex:'1 1 auto', fontSize:12, background:graphIdx===i?'rgba(0,212,255,0.1)':'', borderColor:graphIdx===i?'var(--accent)':'', color:graphIdx===i?'var(--accent)':'' }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length} onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next} speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O(E log V)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(V+E)</div></div>
                <div className="info-chip"><div className="label">Method</div><div className="value">Greedy</div></div>
                <div className="info-chip"><div className="label">Output</div><div className="value">MST</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">key[src]=0; others=∞{'\n'}inMST[] = false{'\n'}{'\n'}<span className="kw">while</span> not all in MST:{'\n'}  u = min key non-MST node{'\n'}  inMST[u] = true{'\n'}  <span className="kw">for</span> each neighbor v of u:{'\n'}    <span className="kw">if</span> !inMST[v] <span className="kw">and</span> w(u,v)&lt;key[v]:{'\n'}      key[v]=w(u,v){'\n'}      parent[v]=u</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
