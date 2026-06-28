import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import AlgoTabWrapper from '../components/AlgoTabWrapper';
import { getAlgoMeta } from '../data/algoMeta';
import { useApp } from '../context/AppContext';

const PRESETS = [
  {
    name: 'Classic',
    items: [
      { name: 'Gold',   weight: 10, value: 60 },
      { name: 'Silver', weight: 20, value: 100 },
      { name: 'Bronze', weight: 30, value: 120 },
    ],
    capacity: 50,
  },
  {
  name: 'College Demo',
  items: [
    { name:'Laptop',  weight:15, value:300 },
    { name:'Camera',  weight:10, value:180 },
    { name:'Tablet',  weight:12, value:200 },
    { name:'Phone',   weight:8,  value:140 },
    { name:'Speaker', weight:20, value:250 },
    { name:'Watch',   weight:5,  value:90 },
  ],
  capacity: 40,
},
  {
    name: 'Extended',
    items: [
      { name: 'A', weight: 2,  value: 10 },
      { name: 'B', weight: 3,  value: 5  },
      { name: 'C', weight: 5,  value: 15 },
      { name: 'D', weight: 7,  value: 7  },
      { name: 'E', weight: 1,  value: 6  },
    ],
    capacity: 10,
  },
];

function fractionalKnapsackSteps(items, capacity) {
  const steps = [];
  // sort by value/weight ratio descending
  const sorted = items.map((item, idx) => ({
    ...item, idx,
    ratio: item.value / item.weight,
  })).sort((a, b) => b.ratio - a.ratio);

  steps.push({
    sorted: [...sorted], taken: Array(items.length).fill(0), remaining: capacity,
    currentIdx: -1, totalValue: 0,
    msg: `Sort items by value/weight ratio (greedy criterion): ${sorted.map(s => `${s.name}(${(s.ratio).toFixed(1)})`).join(' > ')}`,
  });

  let remaining = capacity;
  let totalValue = 0;
  const taken = Array(items.length).fill(0);

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    if (remaining <= 0) break;

    steps.push({
      sorted: [...sorted], taken: [...taken], remaining, currentIdx: i, totalValue,
      msg: `Consider "${item.name}": ratio=${item.ratio.toFixed(2)}, weight=${item.weight}, value=${item.value}. Remaining capacity=${remaining}.`,
    });

    if (item.weight <= remaining) {
      taken[item.idx] = 1;
      remaining -= item.weight;
      totalValue += item.value;
      steps.push({
        sorted: [...sorted], taken: [...taken], remaining, currentIdx: i, totalValue,
        msg: `Take ALL of "${item.name}" (weight=${item.weight} ≤ ${item.weight + remaining}). Value += ${item.value}. Total value = ${totalValue}. Remaining = ${remaining}.`,
      });
    } else {
      const fraction = remaining / item.weight;
      const fractionalValue = fraction * item.value;
      taken[item.idx] = fraction;
      totalValue += fractionalValue;
      steps.push({
        sorted: [...sorted], taken: [...taken], remaining: 0, currentIdx: i, totalValue,
        msg: `Take ${(fraction * 100).toFixed(1)}% of "${item.name}" (only ${remaining} capacity left). Value += ${fractionalValue.toFixed(2)}. Total = ${totalValue.toFixed(2)}. Knapsack FULL.`,
      });
      remaining = 0;
    }
  }

  steps.push({
    sorted: [...sorted], taken: [...taken], remaining, currentIdx: -1, totalValue, done: true,
    msg: `✓ Optimal total value = ${totalValue.toFixed(2)}. Fractional Knapsack always gives optimal solution via greedy!`,
  });
  return steps;
}

export default function FractionalKnapsack() {
  
  const META = getAlgoMeta('fractional-knapsack');
  const { markVisited } = useApp();
  const [presetIdx, setPresetIdx] = useState(0);
  const [customCap, setCustomCap] = useState('');
  const [customError, setCustomError] = useState('');
  const [activeCap, setActiveCap] = useState(null);
  const { items, capacity: presetCap } = PRESETS[presetIdx];
  const capacity = activeCap !== null ? activeCap : presetCap;

  const viz = useVisualizer(() => fractionalKnapsackSteps(items, capacity));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const switchPreset = (i) => { viz.reset(); setPresetIdx(i); setActiveCap(null); setCustomCap(''); setCustomError(''); };

  const applyCustomCap = () => {
    const c = parseInt(customCap);
    if (!c || c <= 0 || c > 10000) { setCustomError('Enter a positive capacity (1–10000)'); return; }
    setCustomError(''); viz.reset(); setActiveCap(c);
  };

  const sorted    = current?.sorted    || [];
  const taken     = current?.taken     || Array(items.length).fill(0);
  const remaining = current?.remaining ?? capacity;
  const totalValue = current?.totalValue ?? 0;
  const currentIdx = current?.currentIdx ?? -1;
  const done = current?.done || false;

  const filledCapacity = capacity - remaining;
  const fillPct = (filledCapacity / capacity) * 100;

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Fractional Knapsack</h1>
          <p>Unlike 0/1 Knapsack, items can be <strong style={{ color: 'var(--accent)' }}>broken into fractions</strong>. The greedy approach — always pick the highest value/weight ratio item — gives the provably optimal solution.</p>
        </div>
        <AlgoTabWrapper algoId="fractional-knapsack" meta={META} steps={steps||[]} stepIdx={stepIdx||-1} currentMsg={current?.msg||''} onJumpTo={jumpTo}>

        <div className="algo-layout">
          <div>
            {/* Custom capacity input */}
            <div className="controls-panel" style={{ marginBottom: 14 }}>
              <h3>Custom Capacity</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" placeholder="e.g. 50" value={customCap} onChange={e => setCustomCap(e.target.value)}
                  style={{ width: 90, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 13 }} />
                <button className="btn btn-primary" onClick={applyCustomCap} style={{ padding: '6px 14px', fontSize: 12 }}>Apply</button>
                {activeCap !== null && <button className="btn btn-secondary" onClick={() => { setActiveCap(null); setCustomCap(''); viz.reset(); }} style={{ padding: '6px 10px', fontSize: 11 }}>Clear</button>}
              </div>
              {customError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{customError}</div>}
              {activeCap !== null && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>✓ Capacity set to {activeCap}</div>}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Using items from the selected preset. Change preset to vary items.</div>
            </div>
            {current && (
              <div className="prog-chips">
                {[['Items taken', current.taken?.filter(t=>t>0).length ?? 0], ['Value so far', (current.totalValue??0).toFixed(1)], ['Progress', `${Math.round((stepIdx+1)/steps.length*100)}%`]].map(([l,v])=>(
                  <div key={l} className="prog-chip"><div className="pval" style={{ fontSize:15 }}>{v}</div><div className="plbl">{l}</div></div>
                ))}
              </div>
            )}
            <div className="status-bar">{current ? current.msg : 'Press ▶ Start or step through'}</div>
            <div
            style={{
                background:'var(--surface)',
                border:'1px solid var(--border)',
                borderRadius:'var(--radius-lg)',
                padding:'14px',
                marginBottom:'14px'
            }}
            >
            <div className="section-label">
                Current Decision
            </div>

            <div
                style={{
                fontFamily:'JetBrains Mono',
                fontSize:'14px',
                fontWeight:'700',
                color:'var(--accent)'
                }}
            >
                {
                currentIdx >= 0
                    ? `Considering: ${sorted[currentIdx]?.name}`
                    : 'Waiting to start...'
                }
            </div>

            <div
                style={{
                marginTop:'6px',
                fontSize:'12px',
                color:'var(--muted)'
                }}
            >
                {
                currentIdx >= 0
                    ? `Ratio = ${sorted[currentIdx]?.ratio?.toFixed(2)}`
                    : 'Press Start'
                }
            </div>
            </div>
            {/* Knapsack fill visualization */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 14 }}>
              <div className="section-label">Knapsack (capacity = {capacity})</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ flex: 1, height: 36, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: done ? 'var(--green)' : 'var(--accent)', borderRadius: 8, transition: 'width 0.3s', opacity: 0.8 }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: 13, color: 'white', fontWeight: 700 }}>
                    {filledCapacity.toFixed(1)} / {capacity}
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: done ? 'var(--green)' : 'var(--accent)', minWidth: 80, textAlign: 'right' }}>
                  {totalValue.toFixed(2)} val
                </div>
              </div>
              <table style={{
                width:'100%',
                borderCollapse:'collapse',
                marginBottom:'20px'
                }}>
                <thead>
                    <tr>
                    <th>Item</th>
                    <th>Weight</th>
                    <th>Value</th>
                    <th>Ratio</th>
                    <th>Taken</th>
                    </tr>
                </thead>
                <tbody>
                    {(sorted.length > 0
                    ? sorted
                    : items.map((item,i)=>({
                        ...item,
                        idx:i,
                        ratio:item.value/item.weight
                    }))
                    ).map(item => {
                    const t = taken[item.idx] || 0;

                    return (
                        <tr key={item.idx}>
                        <td>{item.name}</td>
                        <td>{item.weight}</td>
                        <td>{item.value}</td>
                        <td>{item.ratio.toFixed(2)}</td>
                        <td>
                            {t===0
                            ? 'No'
                            : t===1
                                ? 'Full'
                                : `${(t*100).toFixed(1)}%`}
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>

              {/* Items sorted by ratio */}
              <div className="section-label" style={{ marginTop: 8 }}>Items sorted by value/weight ratio ↓</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(sorted.length > 0 ? sorted : items.map((item, i) => ({ ...item, idx: i, ratio: item.value / item.weight }))).map((item, si) => {
                  const t = taken[item.idx] || 0;
                  const isCurrent = si === currentIdx;
                  const isFull = t === 1;
                  const isFrac = t > 0 && t < 1;
                  let borderCol = 'var(--border)';
                  if (isFull) borderCol = 'var(--green)';
                  else if (isFrac) borderCol = 'var(--accent)';
                  else if (isCurrent) borderCol = 'var(--yellow)';
                  return (
                    <div key={item.idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: `2px solid ${borderCol}`, borderRadius: 8, padding: '10px 14px', transition: 'all 0.2s' }}>
                      <div style={{ minWidth: 80 }}>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: isCurrent ? 'var(--yellow)' : 'var(--text)' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>wt:{item.weight} val:{item.value}</div>
                      </div>
                      <div style={{ flex: 1, height: 20, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ height: '100%', width: `${t * 100}%`, background: isFull ? 'var(--green)' : 'var(--accent)', borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: t > 0 ? (isFull ? 'var(--green)' : 'var(--accent)') : 'var(--muted)', minWidth: 56, textAlign: 'right' }}>
                        {t === 0 ? '—' : t === 1 ? '100%' : `${(t * 100).toFixed(1)}%`}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)', minWidth: 60, textAlign: 'right' }}>
                        ratio: <span style={{ color: 'var(--accent)' }}>{item.ratio.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compare with 0/1 */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14 }}>
              <div className="section-label">Why greedy works here but NOT for 0/1 Knapsack</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
                In <strong style={{ color: 'var(--accent)' }}>Fractional</strong>: we can always fill the exact remaining space → greedy is optimal.<br />
                In <strong style={{ color: 'var(--red)' }}>0/1 Knapsack</strong>: items are indivisible → greedy may leave wasted capacity → DP needed.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="controls-panel">
              <h3>Preset</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => switchPreset(i)} className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 12, background: presetIdx === i ? 'rgba(0,212,255,0.1)' : '', borderColor: presetIdx === i ? 'var(--accent)' : '', color: presetIdx === i ? 'var(--accent)' : '' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed} />
            <div className="controls-panel">
              <h3>Java Code</h3>
              <div className="pseudocode" style={{ fontSize: 10 }}>{`public static double fracKnapsack(
    int cap, int[] wt, int[] val) {
  int n = wt.length;
  Integer[] idx = IntStream.range(0,n)
    .boxed().toArray(Integer[]::new);
  Arrays.sort(idx,(a,b)->Double.compare(
    (double)val[b]/wt[b],
    (double)val[a]/wt[a]));
  double total=0; int rem=cap;
  for (int i : idx) {
    if (rem==0) break;
    int take = Math.min(wt[i], rem);
    total += (double)take*val[i]/wt[i];
    rem -= take;
  }
  return total;
}`}</div>
            </div>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Sort</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Greed</div><div className="value">O(n)</div></div>
                <div className="info-chip"><div className="label">Total</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Optimal</div><div className="value">Yes ✓</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                sort items by val/wt ↓{'\n'}
                remaining = W{'\n'}
                totalVal = 0{'\n\n'}
                <span className="kw">for</span> each item in sorted:{'\n'}
                {'  '}<span className="kw">if</span> item.wt ≤ remaining:{'\n'}
                {'    '}take all of item{'\n'}
                {'    '}remaining -= item.wt{'\n'}
                {'  '}<span className="kw">else</span>:{'\n'}
                {'    '}frac = remaining/item.wt{'\n'}
                {'    '}take frac of item{'\n'}
                {'    '}break <span className="cm">← knapsack full</span>
              </div>
            </div>
          </div>
        </div>
      </AlgoTabWrapper>
    </div>
    </div>
  );
}