import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

function randomArray(size = 18) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function generateSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ arr: [...a], comparing: [j, j + 1], sortedFrom: n - i, swapped: false, msg: `Pass ${i + 1}: Compare a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ arr: [...a], comparing: [j, j + 1], sortedFrom: n - i, swapped: true, msg: `${a[j + 1]} > ${a[j]} → Swap! Now [${a[j]}, ${a[j + 1]}]` });
      }
    }
  }
  steps.push({ arr: [...a], comparing: [], sortedFrom: 0, swapped: false, msg: '✓ Array is fully sorted!' });
  return steps;
}

export default function BubbleSort() {
  const arrRef = useRef(randomArray());
  const [arrKey, setArrKey] = useState(0); // force re-render on new array
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const viz = useVisualizer(() => generateSteps(arrRef.current));

  const generate = () => {
    viz.reset();
    arrRef.current = randomArray();
    setInputValue('');
    setInputError('');
    setArrKey(k => k + 1);
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
    if (parts.length > 30) {
      setInputError('Please enter 30 numbers or fewer.');
      return;
    }

    const nums = [];
    for (const p of parts) {
      const n = Number(p);
      if (!Number.isFinite(n)) {
        setInputError(`"${p}" is not a valid number.`);
        return;
      }
      if (n < 1 || n > 999) {
        setInputError('Numbers must be between 1 and 999.');
        return;
      }
      nums.push(Math.round(n));
    }

    setInputError('');
    viz.reset();
    arrRef.current = nums;
    setArrKey(k => k + 1);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') applyCustomArray();
  };

  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;
  const displayArr = current ? current.arr : arrRef.current;
  const maxVal = Math.max(...displayArr, 1);

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Bubble Sort</h1>
          <p>Compare adjacent elements and swap if out of order. Each pass "bubbles" the largest unsorted element to its correct final position.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">
              {current ? current.msg : 'Press ▶ Start or use Next → to step through manually'}
            </div>

            {/* Bar chart */}
            <div className="viz-canvas" style={{ gap: 3, alignItems: 'flex-end', padding: '24px 12px', minHeight: 280 }}>
              {displayArr.map((val, i) => {
                const isComparing = current?.comparing?.includes(i);
                const isSorted = current ? i >= current.sortedFrom : false;
                const isSwapped = isComparing && current?.swapped;
                let bg = '#1e6fa8';
                if (isSorted) bg = 'var(--green)';
                else if (isSwapped) bg = 'var(--red)';
                else if (isComparing) bg = 'var(--yellow)';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: isComparing ? bg : 'var(--muted)' }}>{val}</span>
                    <div style={{
                      width: '100%',
                      height: `${(val / maxVal) * 220}px`,
                      minHeight: 4,
                      background: bg,
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.08s ease, background 0.12s ease',
                      boxShadow: isComparing ? `0 0 8px ${bg}88` : 'none',
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[['#1e6fa8', 'Unsorted'], ['var(--yellow)', 'Comparing'], ['var(--red)', 'Swapping'], ['var(--green)', 'Sorted']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
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
                Enter 2–30 comma-separated numbers (1–999) and click Apply or press Enter.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              onGenerate={generate} speed={speed} onSpeedChange={setSpeed} />
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Best</div><div className="value">O(n)</div></div>
                <div className="info-chip"><div className="label">Average</div><div className="value">O(n²)</div></div>
                <div className="info-chip"><div className="label">Worst</div><div className="value">O(n²)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(1)</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                <span className="kw">for</span> i = 0 to n-2:{'\n'}
                {'  '}<span className="kw">for</span> j = 0 to n-i-2:{'\n'}
                {'    '}<span className="kw">if</span> A[j] &gt; A[j+1]:{'\n'}
                {'      '}swap(A[j], A[j+1]){'\n'}
                <span className="cm">// Sorted suffix grows right</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
