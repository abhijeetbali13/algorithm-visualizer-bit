import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import AlgoTabWrapper from '../components/AlgoTabWrapper';
import { getAlgoMeta } from '../data/algoMeta';
import { useApp } from '../context/AppContext';

const GRAPHS = [
  {
    name: 'With Neg.',
    nodes: [
      { id:0, label:'A', x:80,  y:190 },
      { id:1, label:'B', x:220, y:80  },
      { id:2, label:'C', x:220, y:300 },
      { id:3, label:'D', x:380, y:80  },
      { id:4, label:'E', x:380, y:300 },
      { id:5, label:'F', x:520, y:190 },
    ],
    // directed edges
    edges: [
      { u:0, v:1, w:6  },
      { u:0, v:2, w:7  },
      { u:1, v:3, w:5  },
      { u:1, v:2, w:8  },
      { u:1, v:4, w:-4 },
      { u:2, v:4, w:9  },
      { u:2, v:3, w:-3 },
      { u:3, v:5, w:3  },
      { u:4, v:5, w:7  },
      { u:4, v:3, w:7  },
    ],
  },
  {
    name: 'Simple',
    nodes: [
      { id:0, label:'S', x:80,  y:190 },
      { id:1, label:'A', x:230, y:80  },
      { id:2, label:'B', x:230, y:300 },
      { id:3, label:'C', x:390, y:80  },
      { id:4, label:'T', x:390, y:300 },
    ],
    edges: [
      { u:0, v:1, w:10 },
      { u:0, v:2, w:6  },
      { u:1, v:3, w:3  },
      { u:2, v:1, w:-4 },
      { u:2, v:4, w:8  },
      { u:3, v:4, w:5  },
    ],
  },
];

function bellmanFordSteps(graph, src) {
  const n = graph.nodes.length;
  const dist = Array(n).fill(Infinity);
  const pred = Array(n).fill(-1);
  dist[src] = 0;
  const steps = [];

  const snap = (msg, checkEdge, relaxed, iter) =>
    steps.push({ dist: [...dist], pred: [...pred], checkEdge: checkEdge || null, relaxed: relaxed || null, iter, msg });

  snap(`Initialize: dist[${graph.nodes[src].label}]=0, all others=∞. Bellman-Ford relaxes ALL edges V−1 times.`, null, null, 0);

  let negativeCycle = false;

  for (let iter = 1; iter <= n - 1; iter++) {
    let anyRelaxed = false;
    snap(`── Iteration ${iter} of ${n - 1}: relax all ${graph.edges.length} edges ──`, null, null, iter);

    for (const edge of graph.edges) {
      const { u, v, w } = edge;
      if (dist[u] === Infinity) {
        snap(`Edge ${graph.nodes[u].label}→${graph.nodes[v].label} (w=${w}): dist[${graph.nodes[u].label}]=∞ → skip`, edge, null, iter);
        continue;
      }
      const newDist = dist[u] + w;
      const better = newDist < dist[v];
      snap(
        `Edge ${graph.nodes[u].label}→${graph.nodes[v].label} (w=${w}): dist[${graph.nodes[u].label}]+${w}=${newDist} vs dist[${graph.nodes[v].label}]=${dist[v] === Infinity ? '∞' : dist[v]} → ${better ? '✓ Relax!' : '✗ No improvement'}`,
        edge, better ? [u, v] : null, iter
      );
      if (better) {
        dist[v] = newDist;
        pred[v] = u;
        anyRelaxed = true;
        snap(`Updated dist[${graph.nodes[v].label}] = ${newDist} (via ${graph.nodes[u].label})`, edge, [u, v], iter);
      }
    }

    if (!anyRelaxed) {
      snap(`No relaxation in iteration ${iter} → converged early! Remaining iterations would change nothing.`, null, null, iter);
      break;
    }
  }

  // Check for negative cycles (V-th relaxation)
  snap(`── Check for negative cycles: try one more relaxation (iteration ${n}) ──`, null, null, n);
  for (const edge of graph.edges) {
    const { u, v, w } = edge;
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      negativeCycle = true;
      snap(`⚠ Negative cycle detected! Edge ${graph.nodes[u].label}→${graph.nodes[v].label} still relaxes on iteration ${n} → dist[${graph.nodes[v].label}] would go from ${dist[v]} to ${dist[u]+w}. Graph contains a negative weight cycle!`, edge, null, n);
      break;
    }
  }

  if (!negativeCycle) {
    snap(`✓ No negative cycles. Final shortest distances from ${graph.nodes[src].label} are correct.`, null, null, n);
  }
  return steps;
}

export default function BellmanFord() {
  
  const META = getAlgoMeta('bellman-ford');
  const { markVisited } = useApp();
  const [graphIdx, setGraphIdx] = useState(0);
  const [src, setSrc] = useState(0);
  const graph = GRAPHS[graphIdx];

  const viz = useVisualizer(() => bellmanFordSteps(graph, src));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const setSrcAndReset = (id) => { viz.reset(); setSrc(id); };
  const setGraphAndReset = (i) => { viz.reset(); setGraphIdx(i); setSrc(0); };

  const dist = current?.dist || null;
  const checkEdge = current?.checkEdge || null;
  const relaxed = current?.relaxed || null;
  const iter = current?.iter ?? 0;

  const getNodeFill = (id) => {
    if (!dist) return '#1e3a5f';
    if (dist[id] === Infinity) return '#1e3a5f';
    if (src === id) return 'var(--accent)';
    return 'var(--green)';
  };

  const getEdgeStyle = (edge) => {
    if (relaxed && relaxed[0] === edge.u && relaxed[1] === edge.v)
      return { stroke: 'var(--green)', strokeWidth: 3.5 };
    if (checkEdge && checkEdge.u === edge.u && checkEdge.v === edge.v)
      return { stroke: 'var(--yellow)', strokeWidth: 2.5 };
    return { stroke: '#1f3355', strokeWidth: 1.5 };
  };

  // Arrow marker helper
  const arrowId = 'bfarrow';

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Bellman-Ford Algorithm</h1>
          <p>Shortest paths from source that works with <strong style={{ color: 'var(--accent)' }}>negative edge weights</strong>. Relaxes all edges V−1 times. Also detects negative weight cycles — something Dijkstra cannot do.</p>
        </div>
        <AlgoTabWrapper algoId="bellman-ford" meta={META} steps={steps||[]} stepIdx={stepIdx||-1} currentMsg={current?.msg||''} onJumpTo={jumpTo}>

        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Select source, then press ▶ Start'}</div>

            {/* Iteration indicator */}
            {iter > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {Array.from({ length: graph.nodes.length }, (_, i) => i + 1).map(i => (
                  <div key={i} style={{ padding: '4px 12px', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: 12, background: iter === i ? 'rgba(0,212,255,0.15)' : 'var(--surface2)', border: `1px solid ${iter === i ? 'var(--accent)' : 'var(--border)'}`, color: iter === i ? 'var(--accent)' : 'var(--muted)' }}>
                    {i <= graph.nodes.length - 1 ? `Iter ${i}` : 'Check'}
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <svg viewBox="0 0 600 380" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <marker id={arrowId} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#1f3355" />
                  </marker>
                  <marker id="arrow-yellow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="var(--yellow)" />
                  </marker>
                  <marker id="arrow-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="var(--green)" />
                  </marker>
                </defs>

                {graph.edges.map((edge, i) => {
                  const nu = graph.nodes[edge.u], nv = graph.nodes[edge.v];
                  const dx = nv.x - nu.x, dy = nv.y - nu.y;
                  const len = Math.sqrt(dx*dx + dy*dy);
                  const ux = dx/len, uy = dy/len;
                  const x1 = nu.x + ux*28, y1 = nu.y + uy*28;
                  const x2 = nv.x - ux*32, y2 = nv.y - uy*32;
                  const mx = (x1+x2)/2, my = (y1+y2)/2;
                  const es = getEdgeStyle(edge);
                  const isRelaxed = relaxed && relaxed[0] === edge.u && relaxed[1] === edge.v;
                  const isCheck = checkEdge && checkEdge.u === edge.u && checkEdge.v === edge.v;
                  const markerId = isRelaxed ? 'arrow-green' : isCheck ? 'arrow-yellow' : arrowId;
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} {...es} markerEnd={`url(#${markerId})`} />
                      <rect x={mx-16} y={my-11} width={32} height={20} rx={4} fill="var(--surface2)" opacity="0.92" />
                      <text x={mx} y={my+5} textAnchor="middle" fill={edge.w < 0 ? 'var(--red)' : 'var(--text)'} fontSize="11" fontFamily="JetBrains Mono" fontWeight={edge.w < 0 ? 700 : 400}>{edge.w}</text>
                    </g>
                  );
                })}

                {graph.nodes.map(node => {
                  const fill = getNodeFill(node.id);
                  const d = dist ? dist[node.id] : null;
                  return (
                    <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => setSrcAndReset(node.id)}>
                      <circle cx={node.x} cy={node.y} r={26} fill={fill} stroke={src === node.id && !current ? 'white' : 'transparent'} strokeWidth={3} />
                      <text x={node.x} y={node.y+5} textAnchor="middle" fill={fill === '#1e3a5f' ? 'var(--muted)' : '#0b0f1a'} fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">{node.label}</text>
                      {d !== null && (
                        <text x={node.x} y={node.y+46} textAnchor="middle" fill={d === Infinity ? '#334' : 'var(--accent)'} fontSize="13" fontFamily="JetBrains Mono" fontWeight="700">
                          {d === Infinity ? '∞' : d}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Distance table */}
            {dist && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {graph.nodes.map(n => (
                  <div key={n.id} style={{ background: dist[n.id] !== Infinity ? 'rgba(34,197,94,0.08)' : 'var(--surface2)', border: `1px solid ${dist[n.id] !== Infinity ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 54, transition: 'all 0.2s' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700 }}>{n.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: dist[n.id] === Infinity ? 'var(--muted)' : 'var(--accent)', fontWeight: 700 }}>{dist[n.id] === Infinity ? '∞' : dist[n.id]}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {[['var(--yellow)', 'Edge being checked'], ['var(--green)', 'Relaxed edge'], ['var(--red)', 'Negative weight']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="controls-panel">
              <h3>Source Node</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {graph.nodes.map(n => (
                  <button key={n.id} onClick={() => setSrcAndReset(n.id)} className="btn btn-secondary"
                    style={{ padding: '5px 12px', background: src === n.id ? 'rgba(0,212,255,0.1)' : '', borderColor: src === n.id ? 'var(--accent)' : '', color: src === n.id ? 'var(--accent)' : '' }}>
                    {n.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {GRAPHS.map((g, i) => (
                  <button key={i} onClick={() => setGraphAndReset(i)} className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 12, background: graphIdx === i ? 'rgba(0,212,255,0.1)' : '', borderColor: graphIdx === i ? 'var(--accent)' : '', color: graphIdx === i ? 'var(--accent)' : '' }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Progress chips */}
            {current && (
              <div className="prog-chips">
                {[['Iteration', current.iter], ['Steps done', stepIdx + 1], ['Progress', `${Math.round((stepIdx+1)/steps.length*100)}%`]].map(([l,v]) => (
                  <div key={l} className="prog-chip">
                    <div className="pval">{v}</div><div className="plbl">{l}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="controls-panel">
              <h3>Java Code</h3>
              <div className="pseudocode" style={{ fontSize: 11 }}>{`public static int[] bellmanFord(
    int V, int[][] edges, int src) {
  int[] dist = new int[V];
  Arrays.fill(dist, Integer.MAX_VALUE);
  dist[src] = 0;
  for (int i = 1; i < V; i++)
    for (int[] e : edges)
      if (dist[e[0]] != Integer.MAX_VALUE
        && dist[e[0]]+e[2] < dist[e[1]])
        dist[e[1]] = dist[e[0]] + e[2];
  // detect negative cycle
  for (int[] e : edges)
    if (dist[e[0]] != Integer.MAX_VALUE
      && dist[e[0]]+e[2] < dist[e[1]])
      throw new RuntimeException("Neg cycle");
  return dist;
}`}</div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed} />
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O(V·E)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(V)</div></div>
                <div className="info-chip"><div className="label">Neg. wts.</div><div className="value">✓ Yes</div></div>
                <div className="info-chip"><div className="label">Neg. cycle</div><div className="value">✓ Detects</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>vs Dijkstra</h3>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                Dijkstra is faster <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>O((V+E) log V)</span> but fails on negative edges. Bellman-Ford is slower <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>O(VE)</span> but handles negative weights and detects negative cycles.
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                dist[src]=0; others=∞{'\n'}
                <span className="kw">for</span> i=1 to V-1:{'\n'}
                {'  '}<span className="kw">for</span> each edge (u,v,w):{'\n'}
                {'    '}<span className="kw">if</span> dist[u]+w &lt; dist[v]:{'\n'}
                {'      '}dist[v] = dist[u]+w{'\n\n'}
                <span className="cm">// Detect negative cycle</span>{'\n'}
                <span className="kw">for</span> each edge (u,v,w):{'\n'}
                {'  '}<span className="kw">if</span> dist[u]+w &lt; dist[v]:{'\n'}
                {'    '}⚠ negative cycle!
              </div>
            </div>
          </div>
        </div>
      </AlgoTabWrapper>
    </div>
    </div>
  );
}
