import { useState, useRef } from 'react';
import { useVisualizer } from '../../hooks/useVisualizer';
import StepControls from '../../components/StepControls';
import './ds.css';

const TABS = ['Min Heap', 'Max Heap', 'Heap Sort', 'Applications'];

/* ───────────── Heap logic helpers ───────────── */

const parent = (i) => Math.floor((i - 1) / 2);
const left   = (i) => 2 * i + 1;
const right  = (i) => 2 * i + 2;

function buildMinHeap(arr) {
  const h = [...arr];
  for (let i = Math.floor(h.length / 2) - 1; i >= 0; i--) heapifyDownMin(h, i, h.length);
  return h;
}
function buildMaxHeap(arr) {
  const h = [...arr];
  for (let i = Math.floor(h.length / 2) - 1; i >= 0; i--) heapifyDownMax(h, i, h.length);
  return h;
}
function heapifyDownMin(h, i, size) {
  let smallest = i;
  const l = left(i), r = right(i);
  if (l < size && h[l] < h[smallest]) smallest = l;
  if (r < size && h[r] < h[smallest]) smallest = r;
  if (smallest !== i) { [h[i], h[smallest]] = [h[smallest], h[i]]; heapifyDownMin(h, smallest, size); }
}
function heapifyDownMax(h, i, size) {
  let largest = i;
  const l = left(i), r = right(i);
  if (l < size && h[l] > h[largest]) largest = l;
  if (r < size && h[r] > h[largest]) largest = r;
  if (largest !== i) { [h[i], h[largest]] = [h[largest], h[i]]; heapifyDownMax(h, largest, size); }
}

/* ───────────── Step builders ───────────── */

function buildInsertSteps(heap, val, isMin) {
  const steps = [];
  const h = [...heap, val];
  const inserted = h.length - 1;
  steps.push({ heap: [...h], hl: { [inserted]: 'new' },
    msg: `Insert ${val} at index ${inserted} (last position). Heap size: ${h.length}.` });

  let i = inserted;
  while (i > 0) {
    const p = parent(i);
    const shouldSwap = isMin ? h[i] < h[p] : h[i] > h[p];
    steps.push({ heap: [...h], hl: { [i]: 'current', [p]: 'compare' },
      msg: `Compare ${h[i]} with parent ${h[p]}. ${shouldSwap ? (isMin?'Smaller':'Larger')+' → swap!' : 'No swap needed.'}` });
    if (!shouldSwap) break;
    [h[i], h[p]] = [h[p], h[i]];
    steps.push({ heap: [...h], hl: { [p]: 'new', [i]: 'compare' },
      msg: `Swapped ${h[p]} ↔ ${h[i]}. Bubble up continues…` });
    i = p;
  }
  steps.push({ heap: [...h], hl: { [i]: 'found' },
    msg: `${val} is now in correct position at index ${i}. ${isMin?'Min':'Max'} heap property restored. O(log n).` });
  return { steps, result: h };
}

function buildExtractSteps(heap, isMin) {
  if (!heap.length) return { steps: [{ heap: [], hl: {}, msg: 'Heap is empty!' }], result: [] };
  const steps = [];
  const h = [...heap];
  const root = h[0];
  steps.push({ heap: [...h], hl: { 0: 'deleted' },
    msg: `Extract ${isMin?'minimum':'maximum'}: ${root} (always the root at index 0). O(1) to read.` });
  const last = h.pop();
  if (h.length === 0) {
    steps.push({ heap: [], hl: {}, msg: `${root} removed. Heap is now empty.` });
    return { steps, result: [] };
  }
  h[0] = last;
  steps.push({ heap: [...h], hl: { 0: 'new' },
    msg: `Move last element (${last}) to root position. Heap size shrinks by 1.` });

  let i = 0;
  while (true) {
    const l = left(i), r = right(i);
    let target = i;
    if (isMin) {
      if (l < h.length && h[l] < h[target]) target = l;
      if (r < h.length && h[r] < h[target]) target = r;
    } else {
      if (l < h.length && h[l] > h[target]) target = l;
      if (r < h.length && h[r] > h[target]) target = r;
    }
    const hl = {};
    hl[i] = 'current';
    if (l < h.length) hl[l] = 'compare';
    if (r < h.length) hl[r] = 'compare';
    steps.push({ heap: [...h], hl,
      msg: `Heapify-down: ${h[i]} vs children [${l<h.length?h[l]:'—'}, ${r<h.length?h[r]:'—'}]. ${target===i?'Already '+isMin?'smallest':'largest'+', stop.':'Swap with '+(isMin?'smallest':'largest')+' child.'}` });
    if (target === i) break;
    [h[i], h[target]] = [h[target], h[i]];
    steps.push({ heap: [...h], hl: { [target]: 'new', [i]: 'compare' },
      msg: `Swapped ${h[target]} ↔ ${h[i]}. Continue heapify-down…` });
    i = target;
  }
  steps.push({ heap: [...h], hl: {}, msg: `Extract complete. Removed: ${root}. ${isMin?'Min':'Max'} heap property restored. O(log n).` });
  return { steps, result: h };
}

function buildHeapSortSteps(arr) {
  const steps = [];
  const h = [...arr];
  // Phase 1: build max heap
  steps.push({ heap: [...h], sorted: [], phase: 'build', hl: {},
    msg: `Phase 1: Build a Max Heap from [${arr.join(', ')}]. Start heapifying from the last non-leaf node.` });
  for (let i = Math.floor(h.length / 2) - 1; i >= 0; i--) {
    steps.push({ heap: [...h], sorted: [], phase: 'build', hl: { [i]: 'current' },
      msg: `Heapify-down from index ${i} (value ${h[i]}).` });
    let j = i;
    while (true) {
      const l = left(j), r = right(j);
      let largest = j;
      if (l < h.length && h[l] > h[largest]) largest = l;
      if (r < h.length && h[r] > h[largest]) largest = r;
      if (largest === j) break;
      [h[j], h[largest]] = [h[largest], h[j]];
      steps.push({ heap: [...h], sorted: [], phase: 'build', hl: { [j]: 'compare', [largest]: 'new' },
        msg: `Swap ${h[j]} ↔ ${h[largest]} to maintain max-heap.` });
      j = largest;
    }
  }
  steps.push({ heap: [...h], sorted: [], phase: 'build', hl: { 0: 'found' },
    msg: `Max Heap built! Root = ${h[0]} (maximum element). Phase 2: Extract max repeatedly.` });

  // Phase 2: extract
  const sorted = [];
  let sortSize = h.length;
  while (sortSize > 1) {
    const max = h[0];
    [h[0], h[sortSize - 1]] = [h[sortSize - 1], h[0]];
    sortSize--;
    sorted.unshift(max);
    steps.push({ heap: [...h], sorted: [...sorted], phase: 'extract', hl: { 0: 'new', [sortSize]: 'deleted' }, sortSize,
      msg: `Move root (${max}) to sorted position. Heap size → ${sortSize}. Sorted suffix: [${sorted.join(', ')}].` });
    let j = 0;
    while (true) {
      const l = left(j), r = right(j);
      let largest = j;
      if (l < sortSize && h[l] > h[largest]) largest = l;
      if (r < sortSize && h[r] > h[largest]) largest = r;
      if (largest === j) break;
      [h[j], h[largest]] = [h[largest], h[j]];
      steps.push({ heap: [...h], sorted: [...sorted], phase: 'extract', hl: { [j]: 'compare', [largest]: 'new' }, sortSize,
        msg: `Restore heap: swap ${h[j]} ↔ ${h[largest]}.` });
      j = largest;
    }
  }
  sorted.unshift(h[0]);
  steps.push({ heap: [...h], sorted, phase: 'done', hl: {}, sortSize: 0,
    msg: `Heap Sort complete! Sorted array: [${sorted.join(', ')}]. O(n log n) time, O(1) space.` });
  return steps;
}

/* ───────────── SVG tree renderer ───────────── */

function heapTreeLayout(size) {
  const nodes = [];
  for (let i = 0; i < size; i++) {
    const depth = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, depth) - 1);
    const nodesInLevel = Math.pow(2, depth);
    const maxDepth = Math.floor(Math.log2(size));
    const spread = 520 / nodesInLevel;
    const x = spread * (posInLevel + 0.5);
    const y = 44 + depth * 68;
    nodes.push({ idx: i, x, y, depth });
  }
  return nodes;
}

const HL_COLORS = {
  new:     { fill: 'var(--accent)', text: '#0b0f1a' },
  current: { fill: 'var(--yellow)', text: '#0b0f1a' },
  compare: { fill: '#a78bfa', text: '#0b0f1a' },
  deleted: { fill: 'var(--red)', text: '#fff' },
  found:   { fill: 'var(--green)', text: '#0b0f1a' },
  sorted:  { fill: 'var(--green)', text: '#0b0f1a' },
};

function HeapTree({ heap, hl = {}, sortSize = heap.length }) {
  const n = heap.length;
  if (n === 0) return (
    <div style={{ textAlign:'center', color:'var(--muted)', fontFamily:'JetBrains Mono', fontSize:13, padding:'40px 0' }}>
      Heap is empty
    </div>
  );
  const layout = heapTreeLayout(n);
  const svgH = 44 + Math.floor(Math.log2(n)) * 68 + 60;
  return (
    <svg viewBox={`0 0 520 ${svgH}`} style={{ width:'100%', height:'auto', minWidth: Math.min(520, 280) }}>
      {/* Edges */}
      {layout.map(({ idx, x, y }) => {
        const l = 2*idx+1, r = 2*idx+2;
        return [
          l < n && <line key={`l${idx}`} x1={x} y1={y} x2={layout[l].x} y2={layout[l].y} stroke="var(--border)" strokeWidth="1.5"/>,
          r < n && <line key={`r${idx}`} x1={x} y1={y} x2={layout[r].x} y2={layout[r].y} stroke="var(--border)" strokeWidth="1.5"/>,
        ];
      })}
      {/* Nodes */}
      {layout.map(({ idx, x, y }) => {
        const isSorted = idx >= sortSize;
        const hlKey = isSorted ? 'sorted' : hl[idx];
        const colors = HL_COLORS[hlKey] || { fill: 'var(--surface2)', text: 'var(--text)' };
        return (
          <g key={idx}>
            <circle cx={x} cy={y} r={22} fill={colors.fill} stroke={hlKey ? colors.fill : 'var(--border)'}
              strokeWidth={hlKey ? 2 : 1} style={{ transition:'fill 0.3s' }}/>
            <text x={x} y={y+5} textAnchor="middle" fill={colors.text}
              fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">{heap[idx]}</text>
            <text x={x} y={y+38} textAnchor="middle" fill="var(--muted)" fontSize="9" fontFamily="JetBrains Mono">[{idx}]</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────── Array view ───────────── */
function HeapArray({ heap, hl = {}, sortSize = heap.length }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
      {heap.map((v, i) => {
        const isSorted = i >= sortSize;
        const hlKey = isSorted ? 'sorted' : hl[i];
        const colors = HL_COLORS[hlKey] || { fill: 'var(--surface2)', text: 'var(--text)' };
        return (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius:6, background:colors.fill, border:`2px solid ${hlKey?colors.fill:'var(--border)'}`,
              fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color:colors.text,
              transition:'all 0.3s', boxShadow:hlKey?`0 0 8px ${colors.fill}55`:'' }}>{v}</div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--muted)' }}>[{i}]</div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Main component ───────────── */

const DEFAULT_MIN = [3, 9, 5, 14, 12, 8, 7, 20, 17, 11];
const DEFAULT_MAX = [20, 14, 17, 8, 12, 9, 11, 3, 7, 5];

export default function HeapDS() {
  const [tab, setTab] = useState('Min Heap');
  const [isMin, setIsMin]   = useState(true);
  const [heap, setHeap]     = useState([...DEFAULT_MIN]);
  const [inputVal, setInputVal] = useState('');
  const [idleMsg, setIdleMsg]   = useState('A heap is a complete binary tree stored as an array. Select an operation to begin.');
  const [customInput, setCustomInput] = useState('');
  const [customErr, setCustomErr] = useState('');
  const [sortInput, setSortInput] = useState('64, 34, 25, 12, 22, 11, 90');

  const pendingSteps = useRef([]);
  const viz = useVisualizer(() => pendingSteps.current);
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  // Switch heap type
  const switchType = (min) => {
    setIsMin(min);
    const arr = min ? [...DEFAULT_MIN] : [...DEFAULT_MAX];
    setHeap(arr);
    reset();
    setIdleMsg(`Switched to ${min ? 'Min' : 'Max'} Heap. Root is always the ${min ? 'smallest' : 'largest'} element.`);
  };

  const displayHeap = current?.heap !== undefined ? current.heap : heap;
  const displayHl   = current?.hl || {};
  const displayMsg  = current ? current.msg : idleMsg;
  const sortSize    = current?.sortSize !== undefined ? current.sortSize : displayHeap.length;

  const run = (stepsFn, newHeap) => {
    pendingSteps.current = stepsFn;
    if (newHeap !== undefined) setHeap(newHeap);
    reset(); start();
  };

  const doInsert = () => {
    const v = parseInt(inputVal);
    if (isNaN(v)) return setIdleMsg('Enter a valid integer.');
    const { steps: s, result } = buildInsertSteps(heap, v, isMin);
    run(s, result);
    setInputVal('');
  };

  const doExtract = () => {
    if (!heap.length) return setIdleMsg('Heap is empty!');
    const { steps: s, result } = buildExtractSteps(heap, isMin);
    run(s, result);
  };

  const doCustomBuild = () => {
    const nums = customInput.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    if (nums.length < 2) { setCustomErr('Enter at least 2 numbers'); return; }
    if (nums.length > 15) { setCustomErr('Max 15 elements'); return; }
    setCustomErr('');
    const built = isMin ? buildMinHeap(nums) : buildMaxHeap(nums);
    setHeap(built);
    reset();
    setIdleMsg(`${isMin?'Min':'Max'} Heap built from [${nums.join(', ')}]. Heapify runs in O(n).`);
    setCustomInput('');
  };

  const doHeapSort = () => {
    const arr = sortInput.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)).slice(0, 12);
    if (arr.length < 2) return;
    const s = buildHeapSortSteps(arr);
    pendingSteps.current = s;
    reset(); start();
  };

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Heap</h1>
          <p>A complete binary tree satisfying the heap property: in a Min Heap, every parent ≤ its children. Enables O(1) min/max access and O(log n) insert/extract. The backbone of priority queues and Heap Sort.</p>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t} className={`ds-tab${tab===t?' active':''}`} onClick={() => { setTab(t); reset();
              if (t==='Min Heap') switchType(true);
              if (t==='Max Heap') switchType(false);
            }}>{t}</button>
          ))}
        </div>

        {(tab === 'Min Heap' || tab === 'Max Heap') && (
          <div className="ds-layout">
            {/* Left: visualization */}
            <div>
              <div className="ds-canvas" style={{ minHeight: 320 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>
                    Tree View — size: {displayHeap.length}
                  </span>
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color: isMin?'var(--accent)':'var(--yellow)' }}>
                    {isMin ? 'MIN HEAP' : 'MAX HEAP'} — root = {displayHeap[0] ?? '—'}
                  </span>
                </div>
                <HeapTree heap={displayHeap} hl={displayHl} sortSize={sortSize} />
              </div>

              <div className="ds-canvas" style={{ marginTop:12 }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:4 }}>
                  Array representation (index 0 = root)
                </div>
                <HeapArray heap={displayHeap} hl={displayHl} sortSize={sortSize} />
                <div style={{ marginTop:8, fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}>
                  For node at i → parent: ⌊(i-1)/2⌋ · left child: 2i+1 · right child: 2i+2
                </div>
              </div>

              <div className="ds-log" style={{ marginTop:10 }}>{displayMsg}</div>

              <div style={{ display:'flex', gap:12, marginTop:8, fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', flexWrap:'wrap' }}>
                {[['new','inserting/placed'],['current','heapifying'],['compare','comparing'],['deleted','extracted'],['found','final position']].map(([k,l])=>(
                  <span key={k}><span style={{ color: HL_COLORS[k]?.fill || 'var(--border)' }}>●</span> {l}</span>
                ))}
              </div>
            </div>

            {/* Right: ops panel */}
            <div className="ds-ops-panel">
              <h3>{isMin ? 'Min' : 'Max'} Heap Operations</h3>

              <div className="ds-op-group">
                <label>Value to insert</label>
                <div className="ds-input-row">
                  <input className="ds-input" type="number" value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && doInsert()}
                    placeholder="e.g. 4" />
                  <button className="btn btn-primary" onClick={doInsert} disabled={running || heap.length >= 15}>Insert</button>
                </div>
              </div>

              <button className="btn btn-danger" onClick={doExtract} disabled={running || !heap.length} style={{ width:'100%' }}>
                ▼ Extract {isMin ? 'Min' : 'Max'}
              </button>

              <button className="btn btn-secondary" onClick={() => { setHeap(isMin ? [...DEFAULT_MIN] : [...DEFAULT_MAX]); reset(); setIdleMsg('Heap reset.'); }} style={{ width:'100%' }}>
                ↺ Reset Heap
              </button>

              <div className="ds-op-group">
                <label>Build heap from values</label>
                <div className="ds-input-row">
                  <input className="ds-input" value={customInput} onChange={e => setCustomInput(e.target.value)}
                    placeholder="e.g. 5,3,8,1,9" />
                  <button className="btn btn-secondary" onClick={doCustomBuild} disabled={running}>Build</button>
                </div>
                {customErr && <div style={{ fontSize:11, color:'var(--red)' }}>{customErr}</div>}
              </div>

              <div className="ds-info-box">
                <strong>Complexities</strong><br/>
                <code>insert</code> O(log n) — bubble up<br/>
                <code>extract {isMin?'min':'max'}</code> O(log n) — heapify down<br/>
                <code>peek {isMin?'min':'max'}</code> O(1) — always root<br/>
                <code>build heap</code> O(n) — Floyd's algorithm<br/><br/>
                <strong>{isMin?'Min Heap':'Max Heap'} property:</strong><br/>
                {isMin ? 'Every parent ≤ its children. Root is the minimum.' : 'Every parent ≥ its children. Root is the maximum.'}
              </div>

              {steps.length > 0 && (
                <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
                  onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
                  speed={speed} onSpeedChange={setSpeed} />
              )}
            </div>
          </div>
        )}

        {tab === 'Heap Sort' && (
          <div className="ds-layout">
            <div>
              {current ? (
                <>
                  <div className="ds-canvas" style={{ minHeight: 320 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>
                        {current.phase === 'build' ? '📐 Phase 1: Building Max Heap' : current.phase === 'extract' ? '📤 Phase 2: Extracting Max Repeatedly' : '✅ Sorted!'}
                      </span>
                    </div>
                    <HeapTree heap={current.heap} hl={current.hl} sortSize={current.sortSize ?? current.heap.length} />
                  </div>
                  {current.sorted?.length > 0 && (
                    <div className="ds-canvas" style={{ marginTop:12 }}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:6 }}>Sorted output (built right to left):</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {current.sorted.map((v, i) => (
                          <div key={i} style={{ width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
                            borderRadius:6, background:'rgba(34,197,94,0.2)', border:'2px solid var(--green)',
                            fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color:'var(--green)' }}>{v}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="ds-log" style={{ marginTop:10 }}>{current.msg}</div>
                </>
              ) : (
                <div className="ds-canvas" style={{ minHeight:280, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                  <div style={{ color:'var(--muted)', fontFamily:'JetBrains Mono', fontSize:14 }}>Enter values below and click Run Heap Sort</div>
                </div>
              )}
            </div>

            <div className="ds-ops-panel">
              <h3>Heap Sort</h3>
              <div className="ds-op-group">
                <label>Array to sort (comma-separated)</label>
                <input className="ds-input" value={sortInput} onChange={e => setSortInput(e.target.value)} placeholder="e.g. 64, 34, 25, 12" />
              </div>
              <button className="btn btn-primary" onClick={doHeapSort} disabled={running} style={{ width:'100%' }}>
                ▶ Run Heap Sort
              </button>
              <div className="ds-info-box">
                <strong>Algorithm:</strong><br/>
                1. Build Max Heap from array → O(n)<br/>
                2. Swap root (max) with last element<br/>
                3. Reduce heap size by 1<br/>
                4. Heapify-down from root → O(log n)<br/>
                5. Repeat steps 2–4<br/><br/>
                <strong>Complexity:</strong><br/>
                Time: O(n log n) — always<br/>
                Space: O(1) — in-place!<br/><br/>
                <strong>vs Merge Sort:</strong> Same O(n log n) but in-place. However, poor cache performance due to non-sequential memory access.
              </div>
              {steps.length > 0 && (
                <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
                  onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
                  speed={speed} onSpeedChange={setSpeed} />
              )}
            </div>
          </div>
        )}

        {tab === 'Applications' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {[
              { title:'Priority Queue', icon:'⚡', color:'var(--accent)', desc:'A priority queue is the canonical use-case. Hospital ER triage, CPU task scheduling, event simulation — all use a heap as the underlying structure.', complexity:'O(log n) insert/extract, O(1) peek' },
              { title:"Dijkstra's Algorithm", icon:'🗺️', color:'var(--cat-graph)', desc:"The min-heap is the priority queue Dijkstra uses to always process the closest unvisited vertex next. Without it, Dijkstra's would be O(V²) instead of O((V+E)log V).", complexity:'Heap reduces: O(V²) → O((V+E)log V)' },
              { title:"Prim's MST", icon:'🌲', color:'var(--cat-greedy)', desc:"Prim's minimum spanning tree algorithm uses a min-heap to efficiently pick the cheapest edge crossing the cut at each step.", complexity:'O(E log V) with a binary heap' },
              { title:'Heap Sort', icon:'📊', color:'var(--cat-sorting)', desc:'In-place O(n log n) sorting. Build a max-heap then extract the maximum n times. The only comparison sort that is both in-place AND guaranteed O(n log n).', complexity:'O(n log n) time, O(1) space' },
              { title:'Median of Stream', icon:'📈', color:'var(--cat-dp)', desc:'Use a max-heap for the lower half and a min-heap for the upper half. Balance them to get the median in O(1). Classic interview problem.', complexity:'O(log n) insert, O(1) median' },
              { title:'Top-K Elements', icon:'🏆', color:'var(--yellow)', desc:'Maintain a min-heap of size K. For each new element, if it beats the heap min, pop and push. Result is the K largest in O(n log K) — much better than sorting.', complexity:'O(n log K) vs O(n log n) sort' },
              { title:'Job Scheduling', icon:'🏭', color:'var(--cat-backtrack)', desc:'OS schedulers use priority queues (heaps) to pick the highest-priority runnable process. Linux CFS uses a red-black tree (similar idea, more balanced).', complexity:'O(log n) insert/extract' },
              { title:'Huffman Coding', icon:'🗜️', color:'var(--cat-string)', desc:'Building the Huffman tree starts by repeatedly extracting the two nodes with minimum frequency — exactly what a min-heap does efficiently.', complexity:'O(n log n) total tree construction' },
            ].map(app => (
              <div key={app.title} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:22 }}>{app.icon}</span>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color:app.color }}>{app.title}</div>
                </div>
                <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, marginBottom:8 }}>{app.desc}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color: app.color, background:`${app.color}11`, borderRadius:4, padding:'4px 8px', display:'inline-block' }}>{app.complexity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
