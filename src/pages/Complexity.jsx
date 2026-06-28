import { useState } from 'react';

const SORTING = [
  { name:'Bubble',    best:'O(n)',       avg:'O(n²)',        worst:'O(n²)',       space:'O(1)',      stable:'Yes', color:'#38bdf8', fn: n => n*n,             label:'O(n²)' },
  { name:'Selection', best:'O(n²)',      avg:'O(n²)',        worst:'O(n²)',       space:'O(1)',      stable:'No',  color:'#f97316', fn: n => n*n,             label:'O(n²)' },
  { name:'Insertion', best:'O(n)',       avg:'O(n²)',        worst:'O(n²)',       space:'O(1)',      stable:'Yes', color:'#a78bfa', fn: n => n*n * 0.5,       label:'O(n²)*' },
  { name:'Merge',     best:'O(n log n)', avg:'O(n log n)',   worst:'O(n log n)', space:'O(n)',      stable:'Yes', color:'#34d399', fn: n => n*Math.log2(n||1),label:'O(n log n)' },
  { name:'Quick',     best:'O(n log n)', avg:'O(n log n)',   worst:'O(n²)',      space:'O(log n)', stable:'No',  color:'#f43f5e', fn: n => n*Math.log2(n||1),label:'O(n log n)' },
  { name:'Heap',      best:'O(n log n)', avg:'O(n log n)',   worst:'O(n log n)', space:'O(1)',      stable:'No',  color:'#fb923c', fn: n => n*Math.log2(n||1),label:'O(n log n)' },
];

const GRAPH = [
  { name:"Dijkstra",     time:'O((V+E)logV)', space:'O(V)',   note:'No negative weights',    color:'#34d399', fn: n => n*Math.log2(n||1)*1.5, label:"O((V+E)logV)" },
  { name:'Bellman-Ford', time:'O(V·E)',        space:'O(V)',   note:'Handles negative weights',color:'#f43f5e', fn: n => n*n*0.8,               label:'O(V·E)' },
  { name:'Floyd-Warshall',time:'O(V³)',        space:'O(V²)', note:'All-pairs shortest paths',color:'#a78bfa', fn: n => n*n*n * 0.15,          label:'O(V³)' },
  { name:"Prim's",       time:'O(E log V)',    space:'O(V)',  note:'MST greedy',              color:'#22d3ee', fn: n => n*Math.log2(n||1)*1.2, label:'O(E logV)' },
  { name:"Kruskal's",    time:'O(E log E)',    space:'O(V+E)',note:'MST Union-Find',          color:'#4ade80', fn: n => n*Math.log2(n||1)*1.3, label:'O(E logE)' },
];

const NS = Array.from({ length: 20 }, (_, i) => i + 1);

function GrowthChart({ data, title, highlightIdx, onHover, pointer }) {
  const vals = data.map(d => NS.map(n => d.fn(n)));
  const maxV  = Math.max(...vals.flat(), 1);

  // SVG line chart — one polyline per algorithm
  const W = 520, H = 180, PADL = 32, PADB = 24, PADT = 12, PADR = 12;
  const chartW = W - PADL - PADR;
  const chartH = H - PADB - PADT;

  const toX = i => PADL + (i / (NS.length - 1)) * chartW;
  const toY = v => PADT + chartH - (v / maxV) * chartH;

  const pointerX = pointer !== null ? toX(pointer) : null;

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20 }}>
      <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase', marginBottom:12 }}>{title}</div>

      {/* Legend */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:12 }}>
        {data.map((d, i) => (
          <div key={i} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}
            style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', opacity: highlightIdx === null || highlightIdx === i ? 1 : 0.35, transition:'opacity 0.15s' }}>
            <div style={{ width:24, height:3, borderRadius:2, background:d.color }} />
            <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color: highlightIdx === i ? d.color : 'var(--muted)' }}>{d.name}</span>
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <div style={{ overflowX:'auto' }}>
        <svg width={W} height={H} style={{ display:'block', userSelect:'none', cursor:'crosshair' }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - PADL;
            const idx = Math.round((x / chartW) * (NS.length - 1));
            if (idx >= 0 && idx < NS.length) onHover(highlightIdx, idx);
          }}
          onMouseLeave={() => onHover(highlightIdx, null)}>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = PADT + chartH * (1 - f);
            return (
              <g key={f}>
                <line x1={PADL} y1={y} x2={W - PADR} y2={y} stroke="var(--border)" strokeWidth={0.8} />
                <text x={PADL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--muted)" fontFamily="JetBrains Mono">
                  {Math.round(maxV * f)}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {[0, 4, 9, 14, 19].map(i => (
            <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--muted)" fontFamily="JetBrains Mono">
              n={NS[i]}
            </text>
          ))}

          {/* Lines */}
          {data.map((d, di) => {
            const points = NS.map((n, i) => `${toX(i)},${toY(d.fn(n))}`).join(' ');
            const isHl = highlightIdx === null || highlightIdx === di;
            return (
              <polyline key={di} points={points} fill="none"
                stroke={d.color} strokeWidth={isHl ? 2.5 : 1}
                opacity={isHl ? 1 : 0.2} style={{ transition:'all 0.15s' }} />
            );
          })}

          {/* Pointer line + dots */}
          {pointer !== null && (
            <>
              <line x1={pointerX} y1={PADT} x2={pointerX} y2={H - PADB} stroke="var(--text)" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
              {data.map((d, di) => {
                const y = toY(d.fn(NS[pointer]));
                const isHl = highlightIdx === null || highlightIdx === di;
                return (
                  <g key={di}>
                    <circle cx={pointerX} cy={y} r={isHl ? 5 : 3} fill={d.color} opacity={isHl ? 1 : 0.3} />
                    {isHl && highlightIdx === di && (
                      <text x={pointerX + 7} y={y + 4} fontSize={9} fill={d.color} fontFamily="JetBrains Mono">
                        {Math.round(d.fn(NS[pointer]))}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={pointerX} y={H - PADB + 18} textAnchor="middle" fontSize={9} fill="var(--text)" fontFamily="JetBrains Mono">n={NS[pointer]}</text>
            </>
          )}
        </svg>
      </div>

      {/* Tooltip row */}
      {pointer !== null && (
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:10 }}>
          {data.map((d, i) => {
            const isHl = highlightIdx === null || highlightIdx === i;
            return (
              <div key={i} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${d.color}`, background:`${d.color}14`, opacity: isHl ? 1 : 0.3, transition:'opacity 0.15s' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:d.color }}>{d.name} → </span>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:d.color }}>{Math.round(d.fn(NS[pointer]))}</span>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}> ops</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Complexity() {
  const [sortHl, setSortHl]     = useState(null);
  const [sortPtr, setSortPtr]   = useState(null);
  const [graphHl, setGraphHl]   = useState(null);
  const [graphPtr, setGraphPtr] = useState(null);

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Complexity Reference</h1>
          <p>Hover a legend item to isolate an algorithm. Move your mouse across the chart to see exact operation counts at each n.</p>
        </div>

        <GrowthChart data={SORTING} title="Sorting algorithms — operations vs n (hover to explore)"
          highlightIdx={sortHl} pointer={sortPtr}
          onHover={(hl, ptr) => { setSortHl(hl ?? sortHl); if (ptr !== undefined) setSortPtr(ptr); }} />

        <GrowthChart data={GRAPH} title="Graph algorithms — operations vs n (nodes/edges)"
          highlightIdx={graphHl} pointer={graphPtr}
          onHover={(hl, ptr) => { setGraphHl(hl ?? graphHl); if (ptr !== undefined) setGraphPtr(ptr); }} />

        {/* Full tables */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20, overflowX:'auto' }}>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase', marginBottom:12 }}>Sorting — detailed breakdown</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:12 }}>
            <thead>
              <tr>{['Algorithm','Best','Average','Worst','Space','Stable'].map(h =>
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'var(--muted)', fontWeight:500, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {SORTING.map((r,i) => (
                <tr key={i} onMouseEnter={() => setSortHl(i)} onMouseLeave={() => setSortHl(null)}
                  style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', background: sortHl===i?`${r.color}0a`:'' }}>
                  <td style={{ padding:'8px 12px', color:r.color, fontWeight:700 }}>{r.name}</td>
                  <td style={{ padding:'8px 12px', color:'var(--green)' }}>{r.best}</td>
                  <td style={{ padding:'8px 12px', color:'var(--yellow)' }}>{r.avg}</td>
                  <td style={{ padding:'8px 12px', color:'var(--red)' }}>{r.worst}</td>
                  <td style={{ padding:'8px 12px' }}>{r.space}</td>
                  <td style={{ padding:'8px 12px', color:r.stable==='Yes'?'var(--green)':'var(--red)' }}>{r.stable}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:10 }}>💡 Hover a row to highlight it in the chart above.</div>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20, overflowX:'auto' }}>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase', marginBottom:12 }}>Graph algorithms</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:12 }}>
            <thead>
              <tr>{['Algorithm','Time','Space','Notes'].map(h =>
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'var(--muted)', fontWeight:500, borderBottom:'1px solid var(--border)' }}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {GRAPH.map((r,i) => (
                <tr key={i} onMouseEnter={() => setGraphHl(i)} onMouseLeave={() => setGraphHl(null)}
                  style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', background: graphHl===i?`${r.color}0a`:'' }}>
                  <td style={{ padding:'8px 12px', color:r.color, fontWeight:700 }}>{r.name}</td>
                  <td style={{ padding:'8px 12px', color:'var(--yellow)' }}>{r.time}</td>
                  <td style={{ padding:'8px 12px' }}>{r.space}</td>
                  <td style={{ padding:'8px 12px', color:'var(--muted)' }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20, overflowX:'auto' }}>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase', marginBottom:12 }}>DP & Greedy</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:12 }}>
            <thead>
              <tr>{['Algorithm','Time','Space','Notes'].map(h =>
                <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'var(--muted)', fontWeight:500, borderBottom:'1px solid var(--border)' }}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {[
                ['0/1 Knapsack','O(nW)','O(nW)','n items, W capacity'],
                ['Matrix Chain','O(n³)','O(n²)','n matrices'],
                ['LCS','O(mn)','O(mn)','m, n = string lengths'],
                ['Fractional Knapsack','O(n log n)','O(n)','Greedy — sort by ratio'],
                ['Huffman Coding','O(n log n)','O(n)','n distinct characters'],
                ['Activity Selection','O(n log n)','O(n)','Greedy — sort by finish time'],
              ].map(([name,...rest],i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'8px 12px', color:'var(--accent)', fontWeight:700 }}>{name}</td>
                  {rest.map((v,j) => <td key={j} style={{ padding:'8px 12px', color: j===0?'var(--yellow)': j===2?'var(--muted)':'' }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase', marginBottom:12 }}>Big-O growth — slowest to fastest</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[['O(1)','#22c55e'],['O(log n)','#4ade80'],['O(n)','#86efac'],['O(n log n)','#eab308'],['O(n²)','#f97316'],['O(n³)','#ef4444'],['O(2ⁿ)','#b91c1c'],['O(n!)','#7f1d1d']].map(([t,c]) => (
              <div key={t} style={{ padding:'6px 14px', borderRadius:8, background:`${c}18`, border:`1px solid ${c}`, color:c, fontFamily:'JetBrains Mono', fontSize:12, fontWeight:700 }}>{t}</div>
            ))}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:12, lineHeight:1.8 }}>
            An algorithm with <span style={{ color:'var(--red)', fontFamily:'JetBrains Mono' }}>O(n²)</span> on n=1000 inputs does ~1,000,000 operations.
            An <span style={{ color:'#22c55e', fontFamily:'JetBrains Mono' }}>O(n log n)</span> one does only ~10,000.
            That's a 100× difference — it's the gap between fast and too slow.
          </div>
        </div>
      </div>
    </div>
  );
}
