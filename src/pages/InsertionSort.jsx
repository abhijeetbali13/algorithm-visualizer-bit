import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

function randomArray(size = 16) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function generateSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;

  steps.push({ arr: [...a], sorted: 0, key: -1, comparing: -1, inserting: -1, msg: 'Insertion Sort: grow a sorted subarray one element at a time by inserting each new element in the correct position.' });

  for (let i = 1; i < n; i++) {
    const keyVal = a[i];
    steps.push({ arr: [...a], sorted: i - 1, key: i, comparing: -1, inserting: -1, msg: `Pick key = a[${i}] = ${keyVal}. Insert it into the sorted portion [0..${i - 1}].` });

    let j = i - 1;
    while (j >= 0 && a[j] > keyVal) {
      steps.push({ arr: [...a], sorted: i - 1, key: i, comparing: j, inserting: j + 1, msg: `a[${j}]=${a[j]} > key(${keyVal}) → shift a[${j}] right to position ${j + 1}` });
      a[j + 1] = a[j];
      steps.push({ arr: [...a], sorted: i - 1, key: -1, comparing: j, inserting: j + 1, msg: `Shifted ${a[j + 1]} from index ${j} to ${j + 1}` });
      j--;
    }

    a[j + 1] = keyVal;
    steps.push({ arr: [...a], sorted: i, key: -1, comparing: -1, inserting: j + 1, msg: `Insert key ${keyVal} at position ${j + 1}. Sorted portion is now [0..${i}].` });
  }

  steps.push({ arr: [...a], sorted: n - 1, key: -1, comparing: -1, inserting: -1, msg: '✓ Array is fully sorted! Insertion Sort is efficient for small or nearly-sorted arrays.' });
  return steps;
}

export default function InsertionSort() {
  const arrRef = useRef(randomArray());
  const [, setArrKey] = useState(0);
  const viz = useVisualizer(() => generateSteps(arrRef.current));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const generate = () => { viz.reset(); arrRef.current = randomArray(); setArrKey(k => k + 1); };

  const displayArr = current ? current.arr : arrRef.current;
  const maxVal = Math.max(...displayArr, 1);

  const getBarColor = (i) => {
    if (!current) return '#1e6fa8';
    const { sorted, key, comparing, inserting } = current;
    if (i === inserting) return 'var(--accent)';
    if (i === key) return '#f97316';
    if (i === comparing) return 'var(--yellow)';
    if (i <= sorted && i !== key) return 'var(--green)';
    return '#1e3a5f';
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Insertion Sort</h1>
          <p>Build a sorted subarray from left to right. For each new element, shift larger sorted elements right to make room, then insert the element in its correct position.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Press ▶ Start or use Next → to step through'}</div>

            <div className="viz-canvas" style={{ gap: 3, alignItems: 'flex-end', padding: '24px 12px', minHeight: 280 }}>
              {displayArr.map((val, i) => {
                const col = getBarColor(i);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: col === '#1e3a5f' ? 'var(--muted)' : col }}>{val}</span>
                    <div style={{
                      width: '100%', height: `${(val / maxVal) * 220}px`, minHeight: 4,
                      background: col, borderRadius: '3px 3px 0 0',
                      transition: 'height 0.08s, background 0.12s',
                      boxShadow: !['#1e3a5f', '#1e6fa8'].includes(col) ? `0 0 8px ${col}66` : 'none',
                    }} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
              {[['var(--green)', 'Sorted'], ['#f97316', 'Key (being inserted)'], ['var(--yellow)', 'Comparing'], ['var(--accent)', 'Insert position']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
                </div>
              ))}
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
              <h3>Key Property</h3>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                <strong>Stable</strong> sort. Best case <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>O(n)</span> on already-sorted input — makes it ideal for nearly-sorted data or online sorting (data arriving one at a time). Used in practice for small arrays inside Timsort/Introsort.
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                <span className="kw">for</span> i = 1 to n-1:{'\n'}
                {'  '}key = A[i]{'\n'}
                {'  '}j = i - 1{'\n'}
                {'  '}<span className="kw">while</span> j &gt;= 0 <span className="kw">and</span> A[j] &gt; key:{'\n'}
                {'    '}A[j+1] = A[j] <span className="cm">← shift right</span>{'\n'}
                {'    '}j--{'\n'}
                {'  '}A[j+1] = key <span className="cm">← insert</span>{'\n'}
                <span className="cm">// A[0..i] sorted after pass</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}