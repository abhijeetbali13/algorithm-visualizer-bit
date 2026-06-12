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

function kruskalSteps(graph) {
  const n = graph.nodes.length;
  const sorted = [...graph.edges].sort((a,b) => a.w - b.w);
  const parent = Array.from({length:n},(_,i)=>i);
  const rank   = Array(n).fill(0);
  const mstEdges = [];
  const steps = [];

  function find(x) { if(parent[x]!==x) parent[x]=find(parent[x]); return parent[x]; }
  function union(x,y) {
    const px=find(x), py=find(y);
    if(px===py) return false;
    if(rank[px]<rank[py]) parent[px]=py;
    else if(rank[px]>rank[py]) parent[py]=px;
    else { parent[py]=px; rank[px]++; }
    return true;
  }

  const snap = (msg, checkEdge, accepted, reason) =>
    steps.push({ parent:[...parent].map((_,i)=>find(i)), mstEdges:[...mstEdges], sortedEdges:[...sorted], checkEdge:checkEdge??-1, accepted:accepted??null, reason:reason||'', msg });

  snap(`Sort all ${sorted.length} edges by weight: [${sorted.map(e=>e.w).join(', ')}]`, -1, null, 'Kruskal: process edges cheapest first');

  sorted.forEach((edge, idx) => {
    const pu = find(edge.u), pv = find(edge.v);
    const cycle = pu === pv;
    snap(
      `Consider edge ${graph.nodes[edge.u].label}–${graph.nodes[edge.v].label} (w=${edge.w}): ${cycle?'SKIP — adding would create a cycle':'ACCEPT — connects two different components'}`,
      idx, null,
      cycle
        ? `find(${graph.nodes[edge.u].label})=find(${graph.nodes[edge.v].label})=${pu} → same component, cycle detected`
        : `find(${graph.nodes[edge.u].label})=${pu} ≠ find(${graph.nodes[edge.v].label})=${pv} → safe to add`
    );
    if (!cycle) {
      union(edge.u, edge.v);
      mstEdges.push(idx);
      snap(`Added edge ${graph.nodes[edge.u].label}–${graph.nodes[edge.v].label} to MST (w=${edge.w}). MST edges: ${mstEdges.length}`, idx, true, `Union components: merge ${pu} and ${pv}`);
    } else {
      snap(`Skipped edge ${graph.nodes[edge.u].label}–${graph.nodes[edge.v].label} — cycle`, idx, false, `Same component root=${pu}, skip to prevent cycle`);
    }
  });

  const totalW = mstEdges.reduce((s,i) => s+sorted[i].w, 0);
  snap(`✓ MST complete! ${mstEdges.length} edges, total weight = ${totalW}`, -1, null, `n-1=${n-1} edges span all ${n} nodes`);
  return steps;
}

export default function Kruskal() {
  const [graphIdx, setGraphIdx] = useState(0);
  const graph = GRAPHS[graphIdx];
  const viz = useVisualizer(() => kruskalSteps(graph));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const mstEdgeIdxs = current?.mstEdges || [];
  const checkEdge   = current?.checkEdge ?? -1;
  const sortedEdges = current?.sortedEdges || graph.edges;
  const components  = current?.parent || [];

  // color map for components
  const compColors = ['#00d4ff','#a78bfa','#22c55e','#fbbf24','#f87171','#fb923c'];

  const edgeStyle = (graphEdgeIdx) => {
    const sortedIdx = sortedEdges.findIndex(e => {
      const ge = graph.edges[graphEdgeIdx];
      return e.u===ge.u && e.v===ge.v && e.w===ge.w;
    });
    if (mstEdgeIdxs.includes(sortedIdx)) return { stroke:'var(--green)', strokeWidth:3.5 };
    if (checkEdge === sortedIdx) return { stroke:'var(--yellow)', strokeWidth:3 };
    return { stroke:'var(--border)', strokeWidth:1.5 };
  };

  const nodeColor = (id) => {
    if (!components.length) return '#1e3a5f';
    return compColors[components[id] % compColors.length] + '40';
  };
  const nodeBorder = (id) => {
    if (!components.length) return 'transparent';
    return compColors[components[id] % compColors.length];
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Kruskal's Algorithm</h1>
          <p>Build a Minimum Spanning Tree by sorting all edges and greedily adding the cheapest edge that doesn't create a cycle. Uses Union-Find to detect cycles efficiently.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Press Start to sort edges and build MST'}</div>
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
                  const es = edgeStyle(i);
                  return (
                    <g key={i}>
                      <line x1={nu.x} y1={nu.y} x2={nv.x} y2={nv.y} {...es}/>
                      <rect x={mx-13} y={my-10} width={26} height={20} rx={4} fill="var(--surface2)" opacity="0.9"/>
                      <text x={mx} y={my+5} textAnchor="middle" fill="var(--text)" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">{e.w}</text>
                    </g>
                  );
                })}
                {graph.nodes.map(node => (
                  <g key={node.id}>
                    <circle cx={node.x} cy={node.y} r={26} fill={nodeColor(node.id)} stroke={nodeBorder(node.id)} strokeWidth={2.5} opacity="0.95"/>
                    <text x={node.x} y={node.y+5} textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">{node.label}</text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Sorted edge list */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginTop:16 }}>
              <div className="section-label">Edges sorted by weight (processing order)</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {sortedEdges.map((e,i) => {
                  const isMST = mstEdgeIdxs.includes(i);
                  const isCheck = checkEdge === i;
                  const wasRejected = current?.accepted === false && checkEdge === i;
                  return (
                    <div key={i} style={{ background: isMST?'rgba(34,197,94,0.12)': isCheck?'rgba(234,179,8,0.12)':'var(--surface2)', border:`1px solid ${isMST?'var(--green)':isCheck?'var(--yellow)':'var(--border)'}`, borderRadius:6, padding:'6px 12px', fontFamily:'JetBrains Mono', fontSize:12, opacity: wasRejected?0.5:1 }}>
                      <span style={{ color: isMST?'var(--green)': isCheck?'var(--yellow)':'var(--text)' }}>
                        {graph.nodes[e.u].label}–{graph.nodes[e.v].label}
                      </span>
                      <span style={{ color:'var(--muted)', marginLeft:4 }}>({e.w})</span>
                      {isMST && <span style={{ color:'var(--green)', marginLeft:4 }}>✓</span>}
                      {wasRejected && <span style={{ color:'var(--red)', marginLeft:4 }}>✗</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Graph</h3>
              <div style={{ display:'flex', gap:6, marginBottom:0 }}>
                {GRAPHS.map((g,i) => (
                  <button key={i} onClick={() => { reset(); setGraphIdx(i); }} className="btn btn-secondary"
                    style={{ flex:1, fontSize:12, background:graphIdx===i?'rgba(0,212,255,0.1)':'', borderColor:graphIdx===i?'var(--accent)':'', color:graphIdx===i?'var(--accent)':'' }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length} onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next} speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O(E log E)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(V+E)</div></div>
                <div className="info-chip"><div className="label">Data Str.</div><div className="value">Union-Find</div></div>
                <div className="info-chip"><div className="label">Output</div><div className="value">MST</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">sort edges by weight{'\n'}DSU = each node own set{'\n'}{'\n'}<span className="kw">for</span> each edge (u,v,w):{'\n'}  <span className="kw">if</span> find(u) ≠ find(v):{'\n'}    add (u,v) to MST{'\n'}    union(u, v){'\n'}  <span className="cm">// else: skip (cycle)</span>{'\n'}{'\n'}<span className="cm">// stop when |MST|=n-1</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
