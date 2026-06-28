import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import AlgoTabWrapper from '../components/AlgoTabWrapper';
import { getAlgoMeta } from '../data/algoMeta';
import { useApp } from '../context/AppContext';

const INF = 99999;

const GRAPHS = [
  {
    name: 'Graph A',
    nodes: [{ id:0,label:'A',x:100,y:180 },{ id:1,label:'B',x:270,y:80 },{ id:2,label:'C',x:430,y:80 },{ id:3,label:'D',x:270,y:280 },{ id:4,label:'E',x:430,y:280 }],
    edges: [
      { u:0,v:1,w:3 },{ u:0,v:3,w:8 },{ u:1,v:2,w:1 },
      { u:1,v:3,w:4 },{ u:2,v:4,w:2 },{ u:3,v:2,w:-5 },
      { u:4,v:0,w:3 },
    ],
  },
  {
    name: 'Graph B',
    nodes: [{ id:0,label:'1',x:120,y:180 },{ id:1,label:'2',x:290,y:80 },{ id:2,label:'3',x:460,y:180 },{ id:3,label:'4',x:290,y:280 }],
    edges: [
      { u:0,v:1,w:5 },{ u:0,v:3,w:10 },{ u:1,v:2,w:3 },
      { u:2,v:3,w:1 },{ u:3,v:0,w:2 },{ u:1,v:3,w:8 },
    ],
  },
];

function floydWarshallSteps(graph) {
  const n = graph.nodes.length;
  // init dist matrix
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => {
    if (i === j) return 0;
    const e = graph.edges.find(e => (e.u === i && e.v === j));
    return e ? e.w : INF;
  }));
  const next = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? i : (graph.edges.find(e => e.u === i && e.v === j) ? j : -1)));
  const steps = [];

  const snap = (msg, k, i, j, updated) =>
    steps.push({ dist: dist.map(r => [...r]), k, i, j, updated: updated || false, msg });

  snap('Initialize dist matrix. Direct edges = edge weights, no edge = ∞, diagonal = 0.', -1, -1, -1, false);

  for (let k = 0; k < n; k++) {
    snap(`── Intermediate node k=${graph.nodes[k].label}: check if going through ${graph.nodes[k].label} improves any path ──`, k, -1, -1, false);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const via = dist[i][k] === INF || dist[k][j] === INF ? INF : dist[i][k] + dist[k][j];
        const better = via < dist[i][j];
        snap(
          `dist[${graph.nodes[i].label}][${graph.nodes[j].label}]: current=${dist[i][j] === INF ? '∞' : dist[i][j]}, via ${graph.nodes[k].label}=${dist[i][k] === INF ? '∞' : dist[i][k]}+${dist[k][j] === INF ? '∞' : dist[k][j]}=${via === INF ? '∞' : via} → ${better ? `✓ Update to ${via}` : '✗ No improvement'}`,
          k, i, j, better
        );
        if (better) {
          dist[i][j] = via;
          next[i][j] = next[i][k];
          snap(`Updated dist[${graph.nodes[i].label}][${graph.nodes[j].label}] = ${via} (route via ${graph.nodes[k].label})`, k, i, j, true);
        }
      }
    }
  }

  // Check negative cycles
  let negCycle = false;
  for (let i = 0; i < n; i++) {
    if (dist[i][i] < 0) { negCycle = true; break; }
  }
  snap(negCycle ? '⚠ Negative cycle detected! dist[i][i] < 0 for some node.' : '✓ All-pairs shortest paths complete!', -1, -1, -1, false);
  return steps;
}

export default function FloydWarshall() {
  
  const META = getAlgoMeta('floyd-warshall');
  const { markVisited } = useApp();
  const [graphIdx, setGraphIdx] = useState(0);
  const graph = GRAPHS[graphIdx];

  const viz = useVisualizer(() => floydWarshallSteps(graph));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const setGraphAndReset = (i) => { viz.reset(); setGraphIdx(i); };

  const dist = current?.dist || null;
  const activeK = current?.k ?? -1;
  const activeI = current?.i ?? -1;
  const activeJ = current?.j ?? -1;
  const updated  = current?.updated || false;
  const n = graph.nodes.length;

  const getNodeFill = (id) => {
    if (id === activeK) return 'var(--accent)';
    if (id === activeI || id === activeJ) return 'var(--yellow)';
    return '#1e3a5f';
  };

  const getEdgeStyle = (u, v) => {
    if (activeI === u && activeJ === v) return { stroke: updated ? 'var(--green)' : 'var(--yellow)', strokeWidth: 3 };
    if (activeK !== -1 && ((u === activeI && v === activeK) || (u === activeK && v === activeJ))) return { stroke: 'rgba(0,212,255,0.5)', strokeWidth: 2 };
    return { stroke: '#1f3355', strokeWidth: 1.5 };
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Floyd-Warshall Algorithm</h1>
          <p>Computes <strong style={{ color: 'var(--accent)' }}>all-pairs shortest paths</strong> in a weighted graph (including negative edges). For each intermediate node k, check if going through k improves the path between every pair (i, j).</p>
        </div>
        <AlgoTabWrapper algoId="floyd-warshall" meta={META} steps={steps||[]} stepIdx={stepIdx||-1} currentMsg={current?.msg||''} onJumpTo={jumpTo}>

        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Press ▶ Start to run all-pairs shortest paths'}</div>

            {activeK >= 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid var(--accent)', borderRadius: 6, padding: '5px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--accent)' }}>
                  k = {graph.nodes[activeK]?.label} (intermediate)
                </div>
                {activeI >= 0 && (
                  <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid var(--yellow)', borderRadius: 6, padding: '5px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--yellow)' }}>
                    Checking {graph.nodes[activeI]?.label} → {graph.nodes[activeJ]?.label}
                  </div>
                )}
                {updated && (
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--green)', borderRadius: 6, padding: '5px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--green)' }}>
                    ✓ Updated!
                  </div>
                )}
              </div>
            )}

            {/* Graph */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <svg viewBox="0 0 560 360" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <marker id="fw-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#1f3355"/></marker>
                  <marker id="fw-arrow-y" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="var(--yellow)"/></marker>
                  <marker id="fw-arrow-g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="var(--green)"/></marker>
                  <marker id="fw-arrow-a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="rgba(0,212,255,0.7)"/></marker>
                </defs>
                {graph.edges.map((e, i) => {
                  const nu = graph.nodes[e.u], nv = graph.nodes[e.v];
                  const dx = nv.x-nu.x, dy = nv.y-nu.y, len = Math.sqrt(dx*dx+dy*dy);
                  const ux = dx/len, uy = dy/len;
                  const x1 = nu.x+ux*28, y1 = nu.y+uy*28, x2 = nv.x-ux*32, y2 = nv.y-uy*32;
                  const mx = (x1+x2)/2, my = (y1+y2)/2;
                  const es = getEdgeStyle(e.u, e.v);
                  const markerId = es.stroke === 'var(--green)' ? 'fw-arrow-g' : es.stroke === 'var(--yellow)' ? 'fw-arrow-y' : es.stroke.includes('212') ? 'fw-arrow-a' : 'fw-arrow';
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} {...es} markerEnd={`url(#${markerId})`} />
                      <rect x={mx-15} y={my-10} width={30} height={20} rx={4} fill="var(--surface2)" opacity="0.92"/>
                      <text x={mx} y={my+5} textAnchor="middle" fill={e.w < 0 ? 'var(--red)' : 'var(--text)'} fontSize="11" fontFamily="JetBrains Mono" fontWeight={e.w<0?700:400}>{e.w}</text>
                    </g>
                  );
                })}
                {graph.nodes.map(node => {
                  const fill = getNodeFill(node.id);
                  return (
                    <g key={node.id}>
                      <circle cx={node.x} cy={node.y} r={26} fill={fill} opacity="0.95"/>
                      <text x={node.x} y={node.y+5} textAnchor="middle" fill={fill==='#1e3a5f'?'var(--muted)':'#0b0f1a'} fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">{node.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Distance matrix */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginTop: 14, overflowX: 'auto' }}>
              <div className="section-label">Distance Matrix dist[i][j]</div>
              {dist ? (
                <table style={{ borderCollapse: 'collapse', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '5px 12px', color: 'var(--muted)' }}>i \ j</th>
                      {graph.nodes.map(n => <th key={n.id} style={{ padding: '5px 12px', color: 'var(--accent)', minWidth: 52, textAlign: 'center' }}>{n.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {dist.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 12px', color: 'var(--accent)', fontWeight: 700 }}>{graph.nodes[i].label}</td>
                        {row.map((val, j) => {
                          const isActive = i === activeI && j === activeJ;
                          const isViaRow = i === activeI && j === activeK;
                          const isViaCol = i === activeK && j === activeJ;
                          let bg = 'transparent', color = val === INF ? '#334' : 'var(--text)', border = '2px solid transparent';
                          if (i === j) { bg = 'rgba(0,212,255,0.05)'; color = 'var(--muted)'; }
                          if (isViaRow || isViaCol) { bg = 'rgba(0,212,255,0.08)'; border = '2px solid rgba(0,212,255,0.2)'; }
                          if (isActive && updated) { bg = 'rgba(34,197,94,0.2)'; color = 'var(--green)'; border = '2px solid var(--green)'; }
                          else if (isActive) { bg = 'rgba(234,179,8,0.2)'; color = 'var(--yellow)'; border = '2px solid var(--yellow)'; }
                          return (
                            <td key={j} style={{ padding: '4px 12px', textAlign: 'center', background: bg, color, border, borderRadius: 4, transition: 'all 0.15s', minWidth: 52, fontWeight: isActive ? 700 : 400 }}>
                              {val === INF ? '∞' : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>Matrix fills during visualization →</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="controls-panel">
              <h3>Graph</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {GRAPHS.map((g, i) => (
                  <button key={i} onClick={() => setGraphAndReset(i)} className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 12, background: graphIdx === i ? 'rgba(0,212,255,0.1)' : '', borderColor: graphIdx === i ? 'var(--accent)' : '', color: graphIdx === i ? 'var(--accent)' : '' }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            {current && (
              <div className="prog-chips">
                {[['Intermediate k', activeK >= 0 ? graph.nodes[activeK]?.label : '—'], ['Steps', stepIdx+1], ['Progress', `${Math.round((stepIdx+1)/steps.length*100)}%`]].map(([l,v])=>(
                  <div key={l} className="prog-chip"><div className="pval">{v}</div><div className="plbl">{l}</div></div>
                ))}
              </div>
            )}
            <div className="controls-panel">
              <h3>Java Code</h3>
              <div className="pseudocode" style={{ fontSize: 11 }}>{`public static int[][] floydWarshall(
    int[][] graph) {
  int V = graph.length;
  int[][] dist = new int[V][V];
  for (int[] r : dist)
    Arrays.fill(r, Integer.MAX_VALUE/2);
  for (int i=0;i<V;i++) dist[i][i]=0;
  for (int i=0;i<V;i++)
    for (int j=0;j<V;j++)
      if (graph[i][j]!=0)
        dist[i][j]=graph[i][j];
  for (int k=0;k<V;k++)
    for (int i=0;i<V;i++)
      for (int j=0;j<V;j++)
        dist[i][j]=Math.min(dist[i][j],
          dist[i][k]+dist[k][j]);
  return dist;
}`}</div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed} />
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O(V³)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(V²)</div></div>
                <div className="info-chip"><div className="label">Neg. wts.</div><div className="value">✓ Yes</div></div>
                <div className="info-chip"><div className="label">All pairs</div><div className="value">✓ Yes</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>vs Dijkstra</h3>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                Run Dijkstra V times → <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>O(V·E·log V)</span>. Floyd-Warshall is simpler: <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>O(V³)</span>. Better when V is small or graph is dense. Handles negative weights too.
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                <span className="cm">// Init: dist[i][j] = edge or ∞</span>{'\n'}
                <span className="cm">// dist[i][i] = 0</span>{'\n\n'}
                <span className="kw">for</span> k = 0 to V-1:{'\n'}
                {'  '}<span className="kw">for</span> i = 0 to V-1:{'\n'}
                {'    '}<span className="kw">for</span> j = 0 to V-1:{'\n'}
                {'      '}<span className="kw">if</span> dist[i][k]+dist[k][j]{'\n'}
                {'            '}&lt; dist[i][j]:{'\n'}
                {'        '}dist[i][j] ={'\n'}
                {'          '}dist[i][k]+dist[k][j]
              </div>
            </div>
          </div>
        </div>
      </AlgoTabWrapper>
    </div>
    </div>
  );
}