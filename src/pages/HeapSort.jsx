import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

function randomArray(size = 10) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

function heapSortSteps(arr) {
  const a = [...arr];
  const n = a.length;
  const steps = [];

  const snap = (msg, heapSize, highlight, swapPair, phase) =>
    steps.push({ arr:[...a], heapSize, highlight:highlight||[], swapPair:swapPair||null, phase, msg });

  snap('Start: build max-heap from the array', n, [], null, 'build');

  // Build max-heap
  for (let i = Math.floor(n/2)-1; i >= 0; i--) {
    snap(`Heapify down from index ${i} (value=${a[i]})`, n, [i], null, 'build');
    heapifyDown(a, n, i, steps, snap, n, 'build');
  }
  snap('Max-heap built! Root is largest element', n, [0], null, 'build');

  // Extract one by one
  for (let size = n; size > 1; size--) {
    snap(`Extract max: swap root (${a[0]}) with last heap element (${a[size-1]})`, size, [0, size-1], [0, size-1], 'extract');
    [a[0], a[size-1]] = [a[size-1], a[0]];
    snap(`${a[size-1]} is placed at final position ${size-1}. Heap size = ${size-1}`, size-1, [size-1], null, 'extract');
    if (size-1 > 1) {
      snap(`Restore heap property: heapify down from root`, size-1, [0], null, 'heapify');
      heapifyDown(a, size-1, 0, steps, snap, size-1, 'heapify');
    }
  }

  snap('✓ Array is fully sorted!', 0, Array.from({length:n},(_,i)=>i), null, 'done');
  return steps;
}

function heapifyDown(a, heapSize, i, steps, snap, hs, phase) {
  let largest = i;
  const l = 2*i+1, r = 2*i+2;
  if (l < heapSize && a[l] > a[largest]) largest = l;
  if (r < heapSize && a[r] > a[largest]) largest = r;
  if (largest !== i) {
    snap(`a[${i}]=${a[i]} < a[${largest}]=${a[largest]} → swap`, hs, [i, largest], [i, largest], phase);
    [a[i], a[largest]] = [a[largest], a[i]];
    snap(`Swapped. Continue heapify down from ${largest}`, hs, [largest], null, phase);
    heapifyDown(a, heapSize, largest, steps, snap, hs, phase);
  } else {
    snap(`a[${i}]=${a[i]} ≥ children — heap property satisfied`, hs, [i], null, phase);
  }
}

// Compute tree positions for array-based binary heap
function getNodePositions(n) {
  const positions = [];

  const maxDepth = Math.floor(Math.log2(n));

  const width = Math.max(
    800,
    Math.pow(2, maxDepth) * 120
  );

  const levelGap = 110;

  const height = Math.max(
    300,
    (maxDepth + 1) * levelGap + 100
  );

  for (let i = 0; i < n; i++) {
    const depth = Math.floor(Math.log2(i + 1));

    const posInRow =
      i - (Math.pow(2, depth) - 1);

    const nodesInRow =
      Math.pow(2, depth);

    positions.push({
      x:
        width *
        (posInRow + 1) /
        (nodesInRow + 1),

      y:
        60 + depth * levelGap
    });
  }

  return {
    positions,
    width,
    height
  };
}

export default function HeapSort() {
  const [array, setArray] = useState(() => randomArray());
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const generate = () => {
    viz.reset();
    setArray(randomArray());
    setInputValue('');
    setInputError('');
  };

  const applyCustomArray = () => {
    const parts = inputValue
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (parts.length < 2) {
      setInputError('Enter at least 2 numbers, separated by commas.');
      return;
    }
    if (parts.length > 15) {
      setInputError('Please enter 15 numbers or fewer (tree gets too wide otherwise).');
      return;
    }

    const nums = [];
    for (const p of parts) {
      const num = Number(p);
      if (!Number.isFinite(num)) {
        setInputError(`"${p}" is not a valid number.`);
        return;
      }
      if (num < 1 || num > 999) {
        setInputError('Numbers must be between 1 and 999.');
        return;
      }
      nums.push(Math.round(num));
    }

    setInputError('');
    viz.reset();
    setArray(nums);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') applyCustomArray();
  };

  const viz = useVisualizer(() => heapSortSteps(array));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const displayArr = current?.arr || array;
  const heapSize   = current?.heapSize ?? array.length;
  const highlight  = current?.highlight || [];
  const swapPair   = current?.swapPair  || null;
  const phase      = current?.phase || '';
  const n = displayArr.length;
  const {
  positions,
  height: treeHeight,
  width: treeWidth
} = getNodePositions(n);
  const maxVal = Math.max(...displayArr, 1);

  const nodeColor = (i) => {
    if (i >= heapSize) return 'var(--green)';
    if (swapPair?.includes(i)) return 'var(--red)';
    if (highlight.includes(i)) return 'var(--yellow)';
    return 'var(--accent)';
  };

  const phaseLabels = { build:'Building max-heap', extract:'Extracting max', heapify:'Restoring heap', done:'Sorted!' };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Heap Sort</h1>
          <p>Build a max-heap from the array, then repeatedly extract the maximum to produce a sorted array. In-place, O(n log n) guaranteed. Visualized as a binary tree.</p>
        </div>
        <div className="algo-layout">
          <div>
            {phase && (
              <div style={{ background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:8, padding:'6px 14px', marginBottom:8, fontFamily:'JetBrains Mono', fontSize:12, color:'var(--accent)', display:'inline-block' }}>
                Phase: {phaseLabels[phase]||phase}
              </div>
            )}
            <div className="status-bar">{current ? current.msg : 'Press Start or step through manually'}</div>

            {/* Binary tree visualization */}
            <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 16
                }}
              >
                <div className="section-label">
                  Binary Heap Tree
                </div>

                <div
                  style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    maxHeight: '550px'
                  }}
                >
                  <svg
                    viewBox={`0 0 ${treeWidth} ${treeHeight}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  >
                    {displayArr.map((_, i) => {
                      const l = 2 * i + 1;
                      const r = 2 * i + 2;

                      return (
                        <g key={`e${i}`}>
                          {l < n && (
                            <line
                              x1={positions[i].x}
                              y1={positions[i].y}
                              x2={positions[l].x}
                              y2={positions[l].y}
                              stroke={
                                l >= heapSize
                                  ? 'var(--green)'
                                  : 'var(--border)'
                              }
                              strokeWidth="2"
                            />
                          )}

                          {r < n && (
                            <line
                              x1={positions[i].x}
                              y1={positions[i].y}
                              x2={positions[r].x}
                              y2={positions[r].y}
                              stroke={
                                r >= heapSize
                                  ? 'var(--green)'
                                  : 'var(--border)'
                              }
                              strokeWidth="2"
                            />
                          )}
                        </g>
                      );
                    })}

                    {displayArr.map((val, i) => {
                      const fill = nodeColor(i);

                      return (
                        <g key={i}>
                          <circle
                            cx={positions[i].x}
                            cy={positions[i].y}
                            r="30"
                            fill={fill}
                            opacity={i >= heapSize ? 0.7 : 1}
                          />

                          <text
                            x={positions[i].x}
                            y={positions[i].y + 7}
                            textAnchor="middle"
                            fontSize="18"
                            fontWeight="700"
                            fill="#0b0f1a"
                          >
                            {val}
                          </text>

                          <text
                            x={positions[i].x}
                            y={positions[i].y + 48}
                            textAnchor="middle"
                            fontSize="12"
                            fill="var(--muted)"
                          >
                            [{i}]
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

            {/* Array bars */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 16px', marginTop:16, display:'flex', alignItems:'flex-end', gap:4, minHeight:120 }}>
              {displayArr.map((val,i) => {
                const inHeap = i < heapSize;
                const isSwap = swapPair?.includes(i);
                const isHL   = highlight.includes(i);
                let bg = inHeap ? 'var(--accent)' : 'var(--green)';
                if (isSwap) bg = 'var(--red)';
                else if (isHL && inHeap) bg = 'var(--yellow)';
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}>{val}</div>
                    <div style={{ width:'100%', height:`${(val/maxVal)*80}px`, minHeight:4, background:bg, borderRadius:'2px 2px 0 0', transition:'height 0.1s, background 0.15s' }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display:'flex', gap:14, marginTop:10, flexWrap:'wrap' }}>
              {[['var(--accent)','In heap'],['var(--yellow)','Highlighted'],['var(--red)','Swapping'],['var(--green)','Sorted']].map(([c,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--muted)' }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:c }}/>{l}
                </div>
              ))}
            </div>

            {/* Custom input */}
            <div className="controls-panel" style={{ marginTop: 16 }}>
              <h3>Custom Array</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g. 45, 12, 78, 3, 56"
                  disabled={running}
                  style={{
                    flex: 1,
                    minWidth: 200,
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
                  onClick={applyCustomArray}
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
                Enter 2–15 comma-separated numbers (1–999) and click Apply or press Enter.
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length} onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next} onGenerate={generate} speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Best</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Worst</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(1)</div></div>
                <div className="info-chip"><div className="label">Stable</div><div className="value">No</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode"><span className="cm">// Phase 1: Build max-heap</span>{'\n'}<span className="kw">for</span> i=n/2-1 downto 0:{'\n'}  <span className="fn">heapifyDown</span>(A, n, i){'\n'}{'\n'}<span className="cm">// Phase 2: Sort</span>{'\n'}<span className="kw">for</span> size=n downto 2:{'\n'}  swap(A[0], A[size-1]){'\n'}  <span className="fn">heapifyDown</span>(A, size-1, 0){'\n'}{'\n'}<span className="fn">heapifyDown</span>(A, sz, i):{'\n'}  largest=i; l=2i+1; r=2i+2{'\n'}  <span className="kw">if</span> A[l]&gt;A[largest]: largest=l{'\n'}  <span className="kw">if</span> A[r]&gt;A[largest]: largest=r{'\n'}  <span className="kw">if</span> largest≠i:{'\n'}    swap(A[i],A[largest]){'\n'}    <span className="fn">heapifyDown</span>(A,sz,largest)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
