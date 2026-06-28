import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import AlgoTabWrapper from '../components/AlgoTabWrapper';
import { getAlgoMeta } from '../data/algoMeta';
import { useApp } from '../context/AppContext';

const PRESETS = [
  { name: 'Classic 4',   dims: [10, 30, 5, 60], label: 'A(10×30) B(30×5) C(5×60)' },
  { name: '5 Matrices',  dims: [40, 20, 30, 10, 30], label: 'A B C D (4 matrices)' },
  { name: 'Textbook',    dims: [30, 35, 15, 5, 10, 20, 25], label: 'A₁..A₆ (6 matrices)' },
];

function mcmSteps(dims) {
  const n = dims.length - 1; // number of matrices
  // m[i][j] = min multiplications for A_i..A_j
  const m = Array.from({ length: n }, () => Array(n).fill(0));
  const s = Array.from({ length: n }, () => Array(n).fill(0));
  const steps = [];

  const matName = (i) => `A${i + 1}`;
  const dimStr  = (i) => `${dims[i]}×${dims[i + 1]}`;

  steps.push({ m: m.map(r => [...r]), s: s.map(r => [...r]), cell: null, chain: null, split: null, msg: `${n} matrices: ${Array.from({length:n},(_,i)=>matName(i)+'('+dimStr(i)+')').join(', ')}. Find parenthesization minimizing scalar multiplications.` });

  // chain length l
  for (let l = 2; l <= n; l++) {
    steps.push({ m: m.map(r=>[...r]), s: s.map(r=>[...r]), cell: null, chain: l, split: null, msg: `── Chain length ${l}: compute cost for all chains of ${l} consecutive matrices ──` });

    for (let i = 0; i <= n - l; i++) {
      const j = i + l - 1;
      m[i][j] = Infinity;

      steps.push({ m: m.map(r=>[...r]), s: s.map(r=>[...r]), cell: [i,j], chain: l, split: null, msg: `m[${i+1}][${j+1}]: find best split for ${matName(i)}..${matName(j)}` });

      for (let k = i; k < j; k++) {
        const cost = m[i][k] + m[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1];
        const better = cost < m[i][j];

        steps.push({
          m: m.map(r=>[...r]), s: s.map(r=>[...r]), cell: [i,j], chain: l, split: k,
          cost, prevBest: m[i][j] === Infinity ? '∞' : m[i][j],
          msg: `Split at k=${k+1}: (${matName(i)}..${matName(k)})(${matName(k+1)}..${matName(j)}) = m[${i+1}][${k+1}]+m[${k+2}][${j+1}]+${dims[i]}×${dims[k+1]}×${dims[j+1]} = ${m[i][k]}+${m[k+1][j]}+${dims[i]*dims[k+1]*dims[j+1]} = ${cost} ${better ? '← NEW BEST' : '(not better)'}`,
        });

        if (better) {
          m[i][j] = cost;
          s[i][j] = k;
          steps.push({ m: m.map(r=>[...r]), s: s.map(r=>[...r]), cell: [i,j], chain: l, split: k, cost, msg: `m[${i+1}][${j+1}] updated to ${cost}, best split = k=${k+1}` });
        }
      }
      steps.push({ m: m.map(r=>[...r]), s: s.map(r=>[...r]), cell: [i,j], chain: l, split: s[i][j], cost: m[i][j], msg: `m[${i+1}][${j+1}] = ${m[i][j]}, optimal split at k=${s[i][j]+1}` });
    }
  }

  // Build optimal parenthesization string
  function buildParen(i, j) {
    if (i === j) return matName(i);
    return `(${buildParen(i, s[i][j])} × ${buildParen(s[i][j]+1, j)})`;
  }
  const paren = buildParen(0, n-1);

  steps.push({ m: m.map(r=>[...r]), s: s.map(r=>[...r]), cell: null, chain: null, split: null, done: true, paren, totalCost: m[0][n-1], msg: `✓ Min multiplications = ${m[0][n-1]}. Optimal: ${paren}` });
  return steps;
}

export default function MatrixChain() {
  
  const META = getAlgoMeta('matrix-chain');
  const { markVisited } = useApp();
  const [presetIdx, setPresetIdx] = useState(0);
  const [customDims, setCustomDims] = useState('');
  const [customError, setCustomError] = useState('');
  const [activeDims, setActiveDims] = useState(null);
  const dims = activeDims || PRESETS[presetIdx].dims;
  const n = dims.length - 1;

  const viz = useVisualizer(() => mcmSteps(dims));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const switchPreset = (i) => { viz.reset(); setPresetIdx(i); setActiveDims(null); setCustomDims(''); setCustomError(''); };

  const applyCustom = () => {
    const nums = customDims.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (nums.length < 3) { setCustomError('Enter at least 3 dimensions (for 2 matrices)'); return; }
    if (nums.length > 8) { setCustomError('Max 7 dimensions (6 matrices)'); return; }
    setCustomError(''); viz.reset(); setActiveDims(nums);
  };

  const m = current?.m || Array.from({length:n},()=>Array(n).fill(0));
  const activeCell = current?.cell || null;
  const activeSplit = current?.split ?? null;

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Matrix Chain Multiplication</h1>
          <p>Find the most efficient way to parenthesize a chain of matrices to minimize scalar multiplications. Classic DP problem — the order of multiplication matters enormously.</p>
        </div>
        <AlgoTabWrapper algoId="matrix-chain" meta={META} steps={steps||[]} stepIdx={stepIdx||-1} currentMsg={current?.msg||''} onJumpTo={jumpTo}>

        <div className="algo-layout">
          <div>
            {/* Custom input */}
            <div className="controls-panel" style={{ marginBottom: 14 }}>
              <h3>Custom Dimensions</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="text" placeholder="e.g. 10,30,5,60,20" value={customDims}
                  onChange={e => setCustomDims(e.target.value)} onKeyDown={e => e.key==='Enter'&&applyCustom()}
                  style={{ flex: 1, minWidth: 160, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                <button className="btn btn-primary" onClick={applyCustom} style={{ padding: '6px 14px', fontSize: 12 }}>Apply</button>
                {activeDims && <button className="btn btn-secondary" onClick={() => { setActiveDims(null); setCustomDims(''); viz.reset(); }} style={{ padding: '6px 10px', fontSize: 11 }}>Clear</button>}
              </div>
              {customError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{customError}</div>}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Comma-separated p values. n+1 values = n matrices. E.g. 10,30,5 → A(10×30) × B(30×5).</div>
            </div>
            <div className="status-bar">{current ? current.msg : 'Select preset and press ▶ Start'}</div>

            {/* Matrix dimensions */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14 }}>
              <div className="section-label">Matrix Dimensions</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Array.from({length:n},(_,i)=>(
                  <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 12px', fontFamily:'JetBrains Mono', fontSize:12 }}>
                    <span style={{ color:'var(--accent)', fontWeight:700 }}>A{i+1}</span>
                    <span style={{ color:'var(--muted)' }}> {dims[i]}×{dims[i+1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost chip for current split */}
            {current?.cost !== undefined && activeCell && (
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                <div style={{ background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:8, padding:'8px 14px', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--accent)' }}>
                  Current cell: m[{activeCell[0]+1}][{activeCell[1]+1}]
                </div>
                {activeSplit !== null && (
                  <div style={{ background:'rgba(234,179,8,0.08)', border:'1px solid var(--yellow)', borderRadius:8, padding:'8px 14px', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--yellow)' }}>
                    Split k={activeSplit+1} → cost = {current.cost}
                  </div>
                )}
              </div>
            )}
            {current?.done && (
              <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid var(--green)', borderRadius:8, padding:'10px 16px', marginBottom:12, fontFamily:'JetBrains Mono', fontSize:13, color:'var(--green)' }}>
                ✓ Optimal parenthesization: {current.paren}
              </div>
            )}

            {/* m table */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, overflowX:'auto' }}>
              <div className="section-label">m[i][j] — minimum multiplications for A_i to A_j</div>
              <table style={{ borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ padding:'5px 10px', color:'var(--muted)', minWidth:40 }}>i\j</th>
                    {Array.from({length:n},(_,j)=><th key={j} style={{ padding:'5px 10px', color:'var(--accent)', minWidth:70, textAlign:'center' }}>A{j+1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {m.map((row,i)=>(
                    <tr key={i}>
                      <td style={{ padding:'5px 10px', color:'var(--accent)', fontWeight:700 }}>A{i+1}</td>
                      {row.map((val,j)=>{
                        const isActive = activeCell && activeCell[0]===i && activeCell[1]===j;
                        const isDiag = i===j;
                        const isAboveDiag = j>i;
                        const isSplit = activeSplit !== null && activeCell && i===activeCell[0] && j===activeCell[1];
                        return (
                          <td key={j} style={{ padding:'5px 10px', textAlign:'center', background: isActive?'rgba(234,179,8,0.22)': isDiag?'rgba(0,212,255,0.05)':'transparent', color: isActive?'var(--yellow)': isDiag?'var(--muted)': !isAboveDiag?'transparent': val===0&&!isDiag?'var(--muted)':'var(--text)', fontWeight: isActive?700:400, border: isActive?'2px solid var(--yellow)':'2px solid transparent', borderRadius:4, transition:'all 0.15s', minWidth:70 }}>
                            {isDiag ? '0' : isAboveDiag ? (val===0?'':'   '+val) : '─'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:8, fontFamily:'JetBrains Mono' }}>
                Diagonal = 0 (single matrix). Fill by increasing chain length (anti-diagonals).
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Preset</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {PRESETS.map((p,i)=>(
                  <button key={i} onClick={()=>switchPreset(i)} className="btn btn-secondary"
                    style={{ fontSize:11, textAlign:'left', background:presetIdx===i?'rgba(0,212,255,0.1)':'', borderColor:presetIdx===i?'var(--accent)':'', color:presetIdx===i?'var(--accent)':'' }}>
                    {p.name}: {p.label}
                  </button>
                ))}
              </div>
            </div>
            {current && (
              <div className="prog-chips">
                {[['Chain len', current.chain ?? '—'], ['Steps', stepIdx+1], ['Progress', `${Math.round((stepIdx+1)/steps.length*100)}%`]].map(([l,v])=>(
                  <div key={l} className="prog-chip"><div className="pval">{v}</div><div className="plbl">{l}</div></div>
                ))}
              </div>
            )}
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Java Code</h3>
              <div className="pseudocode" style={{ fontSize: 10 }}>{`public static int matrixChain(int[] p) {
  int n = p.length - 1;
  int[][] m = new int[n][n];
  for (int l = 2; l <= n; l++)
    for (int i = 0; i <= n-l; i++) {
      int j = i+l-1;
      m[i][j] = Integer.MAX_VALUE;
      for (int k = i; k < j; k++) {
        int cost = m[i][k]+m[k+1][j]
          + p[i]*p[k+1]*p[j+1];
        if (cost < m[i][j]) m[i][j]=cost;
      }
    }
  return m[0][n-1];
}`}</div>
            </div>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O(n³)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(n²)</div></div>
                <div className="info-chip"><div className="label">Approach</div><div className="value">DP</div></div>
                <div className="info-chip"><div className="label">Optimal</div><div className="value">Yes</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Key Idea</h3>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
                For every chain A_i..A_j, try every split point k. Cost of splitting at k: <span style={{ color:'var(--accent)', fontFamily:'JetBrains Mono' }}>m[i][k] + m[k+1][j] + p_i × p_k+1 × p_j+1</span>. Take the minimum.
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                <span className="cm">// m[i][i] = 0 for all i</span>{'\n'}
                <span className="kw">for</span> l=2 to n:{'\n'}
                {'  '}<span className="kw">for</span> i=0 to n-l:{'\n'}
                {'    '}j = i+l-1{'\n'}
                {'    '}m[i][j] = ∞{'\n'}
                {'    '}<span className="kw">for</span> k=i to j-1:{'\n'}
                {'      '}cost = m[i][k]+m[k+1][j]{'\n'}
                {'             '}+ p[i]×p[k+1]×p[j+1]{'\n'}
                {'      '}<span className="kw">if</span> cost &lt; m[i][j]:{'\n'}
                {'        '}m[i][j]=cost; s[i][j]=k
              </div>
            </div>
          </div>
        </div>
      </AlgoTabWrapper>
      </div>
    </div>
  );
}
