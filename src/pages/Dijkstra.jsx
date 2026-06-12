import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const GRAPHS = [
  {
    name: 'Graph A',
    nodes: [{ id:0,label:'A',x:80,y:170 },{ id:1,label:'B',x:220,y:70 },{ id:2,label:'C',x:220,y:270 },{ id:3,label:'D',x:370,y:70 },{ id:4,label:'E',x:370,y:270 },{ id:5,label:'F',x:510,y:170 }],
    edges: [{ u:0,v:1,w:4 },{ u:0,v:2,w:2 },{ u:1,v:2,w:5 },{ u:1,v:3,w:10 },{ u:2,v:4,w:3 },{ u:3,v:5,w:11 },{ u:4,v:3,w:4 },{ u:4,v:5,w:1 }],
  },
  {
    name: 'Graph B',
    nodes: [{ id:0,label:'S',x:70,y:190 },{ id:1,label:'A',x:200,y:80 },{ id:2,label:'B',x:200,y:290 },{ id:3,label:'C',x:350,y:80 },{ id:4,label:'D',x:350,y:290 },{ id:5,label:'T',x:490,y:190 }],
    edges: [{ u:0,v:1,w:7 },{ u:0,v:2,w:9 },{ u:1,v:3,w:6 },{ u:1,v:2,w:3 },{ u:2,v:4,w:5 },{ u:3,v:5,w:2 },{ u:4,v:5,w:4 },{ u:3,v:4,w:1 }],
  },
];

function dijkstraSteps(graph, src) {
  const n = graph.nodes.length;
  const dist = Array(n).fill(Infinity);
  const visited = Array(n).fill(false);
  dist[src] = 0;
  const steps = [];

  const snap = (msg, current, relaxEdge, reason) =>
    steps.push({ dist: [...dist], visited: [...visited], current: current ?? -1, relaxEdge: relaxEdge || null, reason: reason || '', msg });

  snap(`Initialize: dist[${graph.nodes[src].label}]=0, all others=∞`, -1, null, '');

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    for (let i = 0; i < n; i++) { if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i; }
    if (u === -1 || dist[u] === Infinity) break;
    visited[u] = true;

    snap(
      `Pick node ${graph.nodes[u].label} — smallest unvisited distance (${dist[u]}). Greedy rule: this shortest known path must be final.`,
      u, null,
      `dist[${graph.nodes[u].label}]=${dist[u]} is minimum among all unvisited nodes`
    );

    for (const { u: eu, v: ev, w } of graph.edges) {
      let nb = eu === u ? ev : ev === u ? eu : -1;
      if (nb === -1 || visited[nb]) continue;
      const newD = dist[u] + w;
      const oldD = dist[nb] === Infinity ? '∞' : dist[nb];
      const better = newD < dist[nb];

      snap(
        `Edge ${graph.nodes[u].label}→${graph.nodes[nb].label} (w=${w}): ${dist[u]}+${w}=${newD} vs current dist[${graph.nodes[nb].label}]=${oldD} → ${better ? '✓ Update!' : '✗ No improvement'}`,
        u, [u, nb],
        better ? `Relax: new dist ${newD} < old ${oldD}` : `Skip: ${newD} ≥ ${oldD}`
      );
      if (better) {
        dist[nb] = newD;
        snap(`Updated dist[${graph.nodes[nb].label}] = ${newD} (path via ${graph.nodes[u].label})`, u, [u, nb], `Shortest path to ${graph.nodes[nb].label} is now ${newD}`);
      }
    }
  }
  snap(`✓ Done! All shortest paths from ${graph.nodes[src].label} computed.`, -1, null, '');
  return steps;
}

export default function Dijkstra() {
  const [graphIdx, setGraphIdx] = useState(0);
  const srcRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const graph = GRAPHS[graphIdx];
  const viz = useVisualizer(() => dijkstraSteps(graph, srcRef.current));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const setSrc = (id) => { viz.reset(); srcRef.current = id; forceUpdate(x => x + 1); };
  const setGraph = (i) => { viz.reset(); setGraphIdx(i); srcRef.current = 0; };

  const dist = current?.dist || null;
  const visited = current?.visited || [];
  const relaxEdge = current?.relaxEdge || null;
  const activeCurrent = current?.current ?? -1;

  const getNodeFill = id => activeCurrent === id ? 'var(--yellow)' : visited[id] ? 'var(--green)' : '#1e3a5f';
  const getEdgeStyle = (u, v) => {
    if (relaxEdge && ((relaxEdge[0] === u && relaxEdge[1] === v) || (relaxEdge[0] === v && relaxEdge[1] === u)))
      return { stroke: 'var(--yellow)', strokeWidth: 3.5 };
    if (visited[u] && visited[v]) return { stroke: 'var(--green)', strokeWidth: 2.5 };
    return { stroke: '#1f3355', strokeWidth: 1.5 };
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Dijkstra's Algorithm</h1>
          <p>Shortest paths from source to all nodes. Every step explains why a node is chosen and whether an edge relaxation improves the distance.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Click a node to set source, then press ▶ Start'}</div>
            {current?.reason && (
              <div style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--accent)' }}>
                → {current.reason}
              </div>
            )}

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <svg viewBox="0 0 580 360" style={{ width: '100%', height: 'auto' }}>
                {graph.edges.map((e, i) => {
                  const nu = graph.nodes[e.u], nv = graph.nodes[e.v];
                  const mx = (nu.x + nv.x) / 2, my = (nu.y + nv.y) / 2;
                  const es = getEdgeStyle(e.u, e.v);
                  return (
                    <g key={i}>
                      <line x1={nu.x} y1={nu.y} x2={nv.x} y2={nv.y} {...es} />
                      <rect x={mx - 14} y={my - 11} width={28} height={20} rx={4} fill="var(--surface2)" opacity="0.95" />
                      <text x={mx} y={my + 5} textAnchor="middle" fill="var(--text)" fontSize="11" fontFamily="JetBrains Mono">{e.w}</text>
                    </g>
                  );
                })}
                {graph.nodes.map(node => {
                  const fill = getNodeFill(node.id);
                  const d = dist ? dist[node.id] : null;
                  return (
                    <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => setSrc(node.id)}>
                      <circle cx={node.x} cy={node.y} r={27} fill={fill}
                        stroke={srcRef.current === node.id && !current ? 'white' : 'transparent'} strokeWidth={3} />
                      <text x={node.x} y={node.y + 5} textAnchor="middle"
                        fill={fill === '#1e3a5f' ? 'var(--muted)' : '#0b0f1a'} fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">{node.label}</text>
                      {d !== null && (
                        <text x={node.x} y={node.y + 48} textAnchor="middle"
                          fill={d === Infinity ? '#334' : 'var(--accent)'} fontSize="13" fontFamily="JetBrains Mono" fontWeight="700">
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
                  <div key={n.id} style={{ background: visited[n.id] ? 'rgba(34,197,94,0.1)' : 'var(--surface2)', border: `1px solid ${visited[n.id] ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 56, transition: 'all 0.2s' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700 }}>{n.label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: dist[n.id] === Infinity ? 'var(--muted)' : 'var(--accent)', fontWeight: 700 }}>{dist[n.id] === Infinity ? '∞' : dist[n.id]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="controls-panel">
              <h3>Source Node</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {graph.nodes.map(n => (
                  <button key={n.id} onClick={() => setSrc(n.id)} className="btn btn-secondary"
                    style={{ padding: '5px 12px', background: srcRef.current === n.id ? 'rgba(0,212,255,0.1)' : '', borderColor: srcRef.current === n.id ? 'var(--accent)' : '', color: srcRef.current === n.id ? 'var(--accent)' : '' }}>
                    {n.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {GRAPHS.map((g, i) => (
                  <button key={i} onClick={() => setGraph(i)} className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 12, background: graphIdx === i ? 'rgba(0,212,255,0.1)' : '', borderColor: graphIdx === i ? 'var(--accent)' : '', color: graphIdx === i ? 'var(--accent)' : '' }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed} />
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O((V+E) log V)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(V)</div></div>
                <div className="info-chip"><div className="label">Method</div><div className="value">Greedy</div></div>
                <div className="info-chip"><div className="label">Neg. wt.</div><div className="value">No</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                dist[src]=0; others=∞{'\n'}
                <span className="kw">while</span> unvisited nodes:{'\n'}
                {'  '}u = argmin(dist){'\n'}
                {'  '}mark u visited{'\n'}
                {'  '}<span className="kw">for</span> neighbor v of u:{'\n'}
                {'    '}<span className="kw">if</span> dist[u]+w &lt; dist[v]:{'\n'}
                {'      '}dist[v] = dist[u]+w
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
