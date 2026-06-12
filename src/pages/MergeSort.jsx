import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

function randomArray(size = 8) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
}

function generateSteps(arr) {
  const steps = [];
  const workArr = [...arr];
  const n = arr.length;

  // Build flat tree
  const treeNodes = [];
  function buildTree(l, r, depth, parentIdx) {
    const idx = treeNodes.length;
    treeNodes.push({ l, r, depth, parentIdx });
    if (l < r) {
      const mid = Math.floor((l + r) / 2);
      buildTree(l, mid, depth + 1, idx);
      buildTree(mid + 1, r, depth + 1, idx);
    }
    return idx;
  }
  buildTree(0, n - 1, 0, -1);

  const nodeStates = Array(treeNodes.length).fill('idle');

  function snap(msg, hlNode, comparePair, mergeRange) {
    steps.push({
      arr: [...workArr],
      treeNodes: treeNodes.map(t => ({ ...t })),
      nodeStates: [...nodeStates],
      highlight: hlNode !== undefined ? hlNode : -1,
      comparePair: comparePair || null,
      mergeRange: mergeRange || null,
      msg,
    });
  }

  function findRightChild(nodeIdx) {
    const node = treeNodes[nodeIdx];
    if (node.l >= node.r) return -1;
    const mid = Math.floor((node.l + node.r) / 2);
    let cnt = 0;
    function count(l, r) { cnt++; if (l < r) { const m = Math.floor((l + r) / 2); count(l, m); count(m + 1, r); } }
    count(node.l, mid);
    return nodeIdx + cnt + 1;
  }

  function solve(l, r, nodeIdx) {
    nodeStates[nodeIdx] = 'active';
    snap(`Splitting [${workArr.slice(l, r + 1).join(', ')}] → indices [${l}..${r}]`, nodeIdx);

    if (l >= r) {
      nodeStates[nodeIdx] = 'sorted';
      snap(`Base case: single element [${workArr[l]}]`, nodeIdx);
      return;
    }

    const mid = Math.floor((l + r) / 2);
    const leftChild = nodeIdx + 1;
    const rightChild = findRightChild(nodeIdx);

    solve(l, mid, leftChild);
    solve(mid + 1, r, rightChild);

    nodeStates[nodeIdx] = 'merging';
    const L = workArr.slice(l, mid + 1);
    const R = workArr.slice(mid + 1, r + 1);
    snap(`Merging: [${L.join(', ')}] + [${R.join(', ')}]`, nodeIdx, null, [l, r]);

    let i = 0, j = 0, k = l;
    while (i < L.length && j < R.length) {
      snap(`Compare ${L[i]} vs ${R[j]} → pick ${L[i] <= R[j] ? L[i] : R[j]}`, nodeIdx, [l + i, mid + 1 + j], [l, r]);
      if (L[i] <= R[j]) { workArr[k++] = L[i++]; }
      else { workArr[k++] = R[j++]; }
      snap(`Placed ${workArr[k - 1]} → partial: [${workArr.slice(l, k).join(', ')}]`, nodeIdx, null, [l, r]);
    }
    while (i < L.length) { workArr[k++] = L[i++]; snap(`Copy left: ${workArr[k - 1]}`, nodeIdx, null, [l, r]); }
    while (j < R.length) { workArr[k++] = R[j++]; snap(`Copy right: ${workArr[k - 1]}`, nodeIdx, null, [l, r]); }

    nodeStates[nodeIdx] = 'sorted';
    snap(`✓ Merged [${l}..${r}] = [${workArr.slice(l, r + 1).join(', ')}]`, nodeIdx, null, [l, r]);
  }

  snap('Initial array — press Start to watch the recursion tree build');
  solve(0, n - 1, 0);
  snap('✓ Array fully sorted!');
  return steps;
}

function getTreePositions(treeNodes) {
  const W = 560, H = 200;
  const maxDepth = Math.max(...treeNodes.map(t => t.depth), 0);
  const byDepth = {};
  treeNodes.forEach((n, i) => { if (!byDepth[n.depth]) byDepth[n.depth] = []; byDepth[n.depth].push(i); });
  const pos = [];
  Object.entries(byDepth).forEach(([d, nodes]) => {
    const dd = parseInt(d);
    nodes.forEach((idx, posInRow) => {
      pos[idx] = {
        x: (W / (nodes.length + 1)) * (posInRow + 1),
        y: 22 + (dd / Math.max(maxDepth, 1)) * (H - 44),
      };
    });
  });
  return pos;
}

const nodeColor = s => ({ active: 'var(--yellow)', merging: '#a78bfa', sorted: 'var(--green)' }[s] || '#1e3a5f');

export default function MergeSort() {
  const arrRef = useRef(randomArray());
  const [, setArrKey] = useState(0);

  const viz = useVisualizer(() => generateSteps(arrRef.current));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const generate = () => { viz.reset(); arrRef.current = randomArray(); setArrKey(k => k + 1); };

  const displayArr = current ? current.arr : arrRef.current;
  const maxVal = Math.max(...displayArr, 1);
  const treeNodes = current?.treeNodes || [];
  const nodeStates = current?.nodeStates || [];
  const positions = treeNodes.length > 0 ? getTreePositions(treeNodes) : [];

  const getBarColor = (i) => {
    if (!current) return '#1e6fa8';
    if (current.comparePair?.includes(i)) return 'var(--yellow)';
    if (current.mergeRange && i >= current.mergeRange[0] && i <= current.mergeRange[1]) return '#a78bfa';
    return '#1e6fa8';
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Merge Sort</h1>
          <p>Divide recursively into halves, then merge sorted halves back up. The recursion tree below shows every split and merge in real time.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Press ▶ Start or use Next → to step manually'}</div>

            <div className="viz-canvas" style={{ gap: 6, alignItems: 'flex-end', padding: '20px 12px', minHeight: 200 }}>
              {displayArr.map((val, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)' }}>{val}</span>
                  <div style={{
                    width: '100%', height: `${(val / maxVal) * 150}px`, minHeight: 4,
                    background: getBarColor(i), borderRadius: '3px 3px 0 0',
                    transition: 'height 0.08s, background 0.12s',
                    boxShadow: getBarColor(i) !== '#1e6fa8' ? `0 0 8px ${getBarColor(i)}88` : 'none',
                  }} />
                </div>
              ))}
            </div>

            {/* Recursion Tree */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginTop: 16 }}>
              <div className="section-label">Recursion Tree — each node shows its subarray</div>
              {treeNodes.length > 0 ? (
                <svg viewBox="0 0 560 200" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  {treeNodes.map((node, idx) => {
                    if (node.parentIdx === -1 || !positions[idx] || !positions[node.parentIdx]) return null;
                    return <line key={'e' + idx} x1={positions[node.parentIdx].x} y1={positions[node.parentIdx].y} x2={positions[idx].x} y2={positions[idx].y} stroke="var(--border)" strokeWidth="1.5" />;
                  })}
                  {treeNodes.map((node, idx) => {
                    if (!positions[idx]) return null;
                    const { x, y } = positions[idx];
                    const state = nodeStates[idx] || 'idle';
                    const isHl = current?.highlight === idx;
                    const subArr = displayArr.slice(node.l, node.r + 1);
                    const label = subArr.length <= 4 ? subArr.join(',') : subArr.slice(0, 2).join(',') + '..' + subArr[subArr.length - 1];
                    const fill = nodeColor(state);
                    return (
                      <g key={idx}>
                        <rect x={x - 30} y={y - 14} width={60} height={28} rx={6}
                          fill={fill} stroke={isHl ? 'white' : 'transparent'} strokeWidth={2}
                          opacity={state === 'idle' ? 0.4 : 1} />
                        <text x={x} y={y + 5} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono"
                          fill={state === 'idle' ? 'var(--muted)' : '#0b0f1a'} fontWeight={isHl ? 700 : 500}>{label}</text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                  ↑ Tree appears once visualization starts
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                {[['var(--yellow)', 'Splitting'], ['#a78bfa', 'Merging'], ['var(--green)', 'Sorted'], ['#1e3a5f', 'Pending']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: c, border: '1px solid var(--border)' }} />{l}
                  </div>
                ))}
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
                <div className="info-chip"><div className="label">Best</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Worst</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(n)</div></div>
                <div className="info-chip"><div className="label">Stable</div><div className="value">Yes</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                <span className="fn">mergeSort</span>(A, l, r):{'\n'}
                {'  '}<span className="kw">if</span> l &gt;= r: return{'\n'}
                {'  '}mid = (l+r)/2{'\n'}
                {'  '}<span className="fn">mergeSort</span>(A, l, mid){'\n'}
                {'  '}<span className="fn">mergeSort</span>(A, mid+1, r){'\n'}
                {'  '}<span className="fn">merge</span>(A, l, mid, r)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
