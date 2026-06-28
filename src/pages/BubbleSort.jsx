import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import CodePanel from '../components/CodePanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import LearningPanel from '../components/LearningPanel';
import QuizPanel from '../components/QuizPanel';
import InputPanel from '../components/InputPanel';
import ExecutionTrace from '../components/ExecutionTrace';
import ExplanationPanel from '../components/ExplanationPanel';
import { useApp } from '../context/useApp';
import { getAlgoMeta } from '../data/algoMeta';
import { randomArray } from '../utils/arrayPresets';

const PSEUDO_LINES = [
  'procedure bubbleSort(A, n):',
  '  for i = 0 to n-2:',
  '    swapped = false',
  '    for j = 0 to n-i-2:',
  '      if A[j] > A[j+1]:',
  '        swap(A[j], A[j+1])',
  '        swapped = true',
  '    if not swapped: break   // early exit',
  '  return A',
];

const JAVA_LINES = [
  'public static void bubbleSort(int[] a) {',
  '  int n = a.length;',
  '  for (int i = 0; i < n-1; i++) {',
  '    boolean swapped = false;',
  '    for (int j = 0; j < n-i-1; j++) {',
  '      if (a[j] > a[j+1]) {',
  '        int tmp = a[j];',
  '        a[j] = a[j+1];',
  '        a[j+1] = tmp;',
  '        swapped = true;',
  '      }',
  '    }',
  '    if (!swapped) break;',
  '  }',
  '}',
];

function generateSteps(arr) {
  const steps = [];
  const a = [...arr];
  const n = a.length;
  let cmps = 0, swaps = 0;

  steps.push({ arr: [...a], comparing: [], sortedFrom: n, swapped: false, pseudoLine: 0, javaLine: 0, cmps, swaps, msg: 'Starting Bubble Sort — will make n-1 passes' });

  for (let i = 0; i < n - 1; i++) {
    let passSwapped = false;
    steps.push({ arr: [...a], comparing: [], sortedFrom: n - i, swapped: false, pseudoLine: 1, javaLine: 2, cmps, swaps, msg: `Pass ${i + 1}: sorted region [${n - i}..${n - 1}]` });

    for (let j = 0; j < n - i - 1; j++) {
      cmps++;
      steps.push({ arr: [...a], comparing: [j, j + 1], sortedFrom: n - i, swapped: false, pseudoLine: 4, javaLine: 5, cmps, swaps, msg: `Compare a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}` });
      if (a[j] > a[j + 1]) {
        swaps++;
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        passSwapped = true;
        steps.push({ arr: [...a], comparing: [j, j + 1], sortedFrom: n - i, swapped: true, pseudoLine: 5, javaLine: 6, cmps, swaps, msg: `${a[j + 1]} > ${a[j]} → Swapped! Now [${a[j]}, ${a[j + 1]}]` });
      }
    }
    if (!passSwapped) {
      steps.push({ arr: [...a], comparing: [], sortedFrom: 0, swapped: false, pseudoLine: 7, javaLine: 12, cmps, swaps, msg: 'No swaps this pass — array already sorted! Early exit.' });
      break;
    }
  }
  steps.push({ arr: [...a], comparing: [], sortedFrom: 0, swapped: false, pseudoLine: 8, javaLine: 14, cmps, swaps, msg: `✓ Sorted! ${cmps} comparisons, ${swaps} swaps.` });
  return steps;
}

const META = getAlgoMeta('bubble-sort');
const TABS = ['Visualizer', 'Pseudocode', 'Java Code', 'Trace', 'Analytics', 'Learn', 'Quiz'];

export default function BubbleSort() {
  const arrRef = useRef(randomArray());
  const [, setArrKey] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [inputErr, setInputErr] = useState('');
  const [tab, setTab] = useState('Visualizer');
  const { markVisited } = useApp();
  const viz = useVisualizer(() => { markVisited('bubble-sort'); return generateSteps(arrRef.current); });
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const generate = () => { viz.reset(); arrRef.current = randomArray(); setInputVal(''); setInputErr(''); setArrKey(k => k + 1); };

  const applyArray = (nums, err) => {
    if (err) { setInputErr(err); return; }
    setInputErr(''); viz.reset(); arrRef.current = nums; setArrKey(k => k + 1);
  };

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
        onStart={start} onPause={pause} onReset={reset} onRestart={viz.restart}
        onPrev={prev} onNext={next} onGenerate={generate} speed={speed}
        onSpeedChange={setSpeed} onJumpTo={jumpTo} />
      <AnalyticsPanel steps={steps} stepIdx={stepIdx} category="sorting" />
    </div>
  );

  const displayArr = current ? current.arr : [];
  const maxVal = Math.max(...displayArr, 1);

  const getBarColor = (i) => {
    if (!current) return 'var(--viz-default)';
    if (current.comparing?.includes(i)) return current.swapped ? 'var(--viz-swap)' : 'var(--viz-compare)';
    if (i >= current.sortedFrom) return 'var(--viz-sorted)';
    return 'var(--viz-default)';
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span className="algo-badge">Sorting</span>
            <span className="algo-meta-line">O(n²) · Stable · In-place</span>
          </div>
          <h1>Bubble Sort</h1>
          <p>Compare adjacent elements and swap if out of order. Each pass bubbles the current maximum to its final position at the right end.</p>
        </div>

        <div className="tab-bar" role="tablist">
          {TABS.map(t => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {tab === 'Visualizer' && (
          <div className="algo-layout">
            <div>
              {/* Custom input */}
              <InputPanel
                value={inputVal}
                onChange={setInputVal}
                onApply={applyArray}
                onPreset={(nums) => applyArray(nums, null)}
                error={inputErr}
                disabled={running}
              />

              <ExplanationPanel
                stepIdx={stepIdx}
                totalSteps={steps.length}
                message={current?.msg}
              />

              <div className="viz-canvas" style={{ gap: 3, alignItems: 'flex-end', padding: '24px 12px', minHeight: 280 }}>
                {displayArr.map((val, i) => {
                  const col = getBarColor(i);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: col === 'var(--viz-default)' ? 'var(--muted)' : col }}>{val}</span>
                      <div style={{ width: '100%', height: `${(val / maxVal) * 230}px`, minHeight: 4, background: col, borderRadius: '3px 3px 0 0', transition: 'height 0.08s, background 0.12s', boxShadow: col !== 'var(--viz-default)' ? `0 0 8px color-mix(in srgb, ${col} 40%, transparent)` : 'none' }} />
                    </div>
                  );
                })}
              </div>

              <div className="viz-legend">
                {[['var(--viz-default)', 'Unsorted'], ['var(--viz-compare)', 'Comparing'], ['var(--viz-swap)', 'Swapping'], ['var(--viz-sorted)', 'Sorted']].map(([c, l]) => (
                  <div key={l} className="viz-legend-item">
                    <div className="viz-legend-swatch" style={{ background: c }} aria-hidden="true" />{l}
                  </div>
                ))}
              </div>
            </div>

            {sidebar}
          </div>
        )}

        {tab === 'Trace' && (
          <div className="algo-layout">
            <ExecutionTrace steps={steps} stepIdx={stepIdx} onJumpTo={jumpTo} maxHeight={480} />
            {sidebar}
          </div>
        )}

        {tab === 'Pseudocode' && (
          <div className="algo-layout">
            <div>
              <div className="status-bar" style={{ marginBottom: 14 }}>{current ? current.msg : 'Run the visualizer to see the active line highlighted'}</div>
              <CodePanel lines={PSEUDO_LINES} activeLine={current?.pseudoLine ?? -1} language="pseudo" />
            </div>
            {sidebar}
          </div>
        )}

        {tab === 'Java Code' && (
          <div className="algo-layout">
            <div>
              <div className="status-bar" style={{ marginBottom: 14 }}>{current ? current.msg : 'Run the visualizer — the active Java line will highlight in sync'}</div>
              <CodePanel lines={JAVA_LINES} activeLine={current?.javaLine ?? -1} language="java" />
            </div>
            {sidebar}
          </div>
        )}

        {tab === 'Analytics' && (
          <div className="algo-layout">
            <AnalyticsPanel steps={steps} stepIdx={stepIdx} category="sorting" />
            {sidebar}
          </div>
        )}

        {tab === 'Learn' && (
          <div style={{ maxWidth: 760 }}>
            <LearningPanel data={META?.learning} />
          </div>
        )}

        {tab === 'Quiz' && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Test your knowledge</div>
            <QuizPanel algoId="bubble-sort" questions={META?.quiz || []} />
          </div>
        )}
      </div>
    </div>
  );
}
