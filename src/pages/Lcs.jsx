import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const PRESETS = [
  { name: 'Classic', s1: 'ABCBDAB', s2: 'BDCAB' },
  { name: 'DNA',     s1: 'AGGTAB',  s2: 'GXTXAYB' },
  { name: 'Short',   s1: 'ABCD',    s2: 'ACDF' },
];

function lcsSteps(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const steps = [];

  steps.push({ dp: dp.map(r => [...r]), cell: null, match: false, msg: `LCS of "${s1}" and "${s2}". Build dp[i][j] = LCS length of s1[0..i-1] and s2[0..j-1].` });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const charMatch = s1[i - 1] === s2[j - 1];
      if (charMatch) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        steps.push({ dp: dp.map(r => [...r]), cell: [i, j], match: true, msg: `s1[${i}]='${s1[i-1]}' == s2[${j}]='${s2[j-1]}' ✓ Match! dp[${i}][${j}] = dp[${i-1}][${j-1}]+1 = ${dp[i][j]}` });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        steps.push({ dp: dp.map(r => [...r]), cell: [i, j], match: false, msg: `s1[${i}]='${s1[i-1]}' ≠ s2[${j}]='${s2[j-1]}'. dp[${i}][${j}] = max(dp[${i-1}][${j}]=${dp[i-1][j]}, dp[${i}][${j-1}]=${dp[i][j-1]}) = ${dp[i][j]}` });
      }
    }
  }

  // Backtrack to find the LCS string
  let lcs = '';
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (s1[i - 1] === s2[j - 1]) { lcs = s1[i - 1] + lcs; i--; j--; }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--;
    else j--;
  }

  steps.push({ dp: dp.map(r => [...r]), cell: null, match: false, lcs, done: true, msg: `✓ LCS length = ${dp[m][n]}. LCS = "${lcs}"` });
  return steps;
}

export default function LCS() {
  const [presetIdx, setPresetIdx] = useState(0);
  const { s1, s2 } = PRESETS[presetIdx];

  const viz = useVisualizer(() => lcsSteps(s1, s2));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const switchPreset = (i) => { viz.reset(); setPresetIdx(i); };

  const dp = current?.dp || null;
  const activeCell = current?.cell || null;
  const isMatch = current?.match || false;
  const lcs = current?.lcs || '';
  const done = current?.done || false;

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Longest Common Subsequence</h1>
          <p>Find the longest sequence of characters that appears in both strings in order (not necessarily contiguous). Classic DP — builds a 2D table where each cell depends on the cell above, left, and diagonally up-left.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Select preset and press ▶ Start'}</div>

            {/* Match highlight */}
            {activeCell && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ background: isMatch ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isMatch ? 'var(--green)' : 'var(--border)'}`, borderRadius: 6, padding: '5px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: isMatch ? 'var(--green)' : 'var(--muted)' }}>
                  {isMatch ? `✓ Match: '${s1[activeCell[0]-1]}' == '${s2[activeCell[1]-1]}'` : `✗ No match: '${s1[activeCell[0]-1]}' ≠ '${s2[activeCell[1]-1]}'`}
                </div>
              </div>
            )}

            {done && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--green)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--green)' }}>
                LCS = "<strong>{lcs}</strong>" (length {lcs.length})
              </div>
            )}

            {/* String display */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              {[['s1', s1, activeCell?.[0]], ['s2', s2, activeCell?.[1]]].map(([label, str, activePos]) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>{label}:</div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {str.split('').map((ch, i) => {
                      const pos = i + 1;
                      const isActive = pos === activePos;
                      const inLCS = done && lcs.includes(ch);
                      return (
                        <div key={i} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, background: isActive ? (isMatch ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)') : inLCS ? 'rgba(0,212,255,0.1)' : 'var(--surface2)', border: `1px solid ${isActive ? (isMatch ? 'var(--green)' : 'var(--yellow)') : inLCS ? 'var(--accent)' : 'var(--border)'}`, color: isActive ? (isMatch ? 'var(--green)' : 'var(--yellow)') : inLCS ? 'var(--accent)' : 'var(--text)', transition: 'all 0.15s' }}>
                          {ch}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* DP table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, overflowX: 'auto' }}>
              <div className="section-label">dp[i][j] — LCS length of s1[0..i-1] and s2[0..j-1]</div>
              {dp ? (
                <table style={{ borderCollapse: 'collapse', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 8px', color: 'var(--muted)', minWidth: 28 }}></th>
                      <th style={{ padding: '4px 8px', color: 'var(--muted)', minWidth: 30 }}>ε</th>
                      {s2.split('').map((ch, j) => (
                        <th key={j} style={{ padding: '4px 8px', color: activeCell?.[1] === j+1 ? 'var(--yellow)' : 'var(--accent)', minWidth: 30 }}>{ch}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dp.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 8px', color: i === 0 ? 'var(--muted)' : activeCell?.[0] === i ? 'var(--yellow)' : 'var(--accent)', fontWeight: 700 }}>{i === 0 ? 'ε' : s1[i - 1]}</td>
                        {row.map((val, j) => {
                          const isActive = activeCell && activeCell[0] === i && activeCell[1] === j;
                          const isAbove  = activeCell && activeCell[0] === i-1 && activeCell[1] === j;
                          const isLeft   = activeCell && activeCell[0] === i && activeCell[1] === j-1;
                          const isDiag   = activeCell && activeCell[0] === i-1 && activeCell[1] === j-1;
                          let bg = 'transparent', col = 'var(--text)', border = '2px solid transparent';
                          if (isActive && isMatch)  { bg = 'rgba(34,197,94,0.25)'; col = 'var(--green)'; border = '2px solid var(--green)'; }
                          else if (isActive)         { bg = 'rgba(234,179,8,0.2)'; col = 'var(--yellow)'; border = '2px solid var(--yellow)'; }
                          else if (isDiag && isMatch){ bg = 'rgba(0,212,255,0.1)'; border = '2px solid rgba(0,212,255,0.3)'; }
                          else if ((isAbove || isLeft) && !isMatch && activeCell) { bg = 'rgba(234,179,8,0.06)'; }
                          return (
                            <td key={j} style={{ padding: '4px 8px', textAlign: 'center', background: bg, color: val === 0 ? 'var(--muted)' : col, border, borderRadius: 4, transition: 'all 0.12s', minWidth: 30, fontWeight: isActive ? 700 : 400 }}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>Table fills during visualization →</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="controls-panel">
              <h3>Preset</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => switchPreset(i)} className="btn btn-secondary"
                    style={{ fontSize: 11, textAlign: 'left', background: presetIdx === i ? 'rgba(0,212,255,0.1)' : '', borderColor: presetIdx === i ? 'var(--accent)' : '', color: presetIdx === i ? 'var(--accent)' : '' }}>
                    {p.name}: "{p.s1}" / "{p.s2}"
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
                <div className="info-chip"><div className="label">Time</div><div className="value">O(m·n)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(m·n)</div></div>
                <div className="info-chip"><div className="label">Approach</div><div className="value">DP</div></div>
                <div className="info-chip"><div className="label">Optimal</div><div className="value">Yes</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                <span className="kw">for</span> i=1 to m:{'\n'}
                {'  '}<span className="kw">for</span> j=1 to n:{'\n'}
                {'    '}<span className="kw">if</span> s1[i]==s2[j]:{'\n'}
                {'      '}dp[i][j]=dp[i-1][j-1]+1{'\n'}
                {'    '}<span className="kw">else</span>:{'\n'}
                {'      '}dp[i][j]=max({'\n'}
                {'        '}dp[i-1][j], dp[i][j-1]){'\n\n'}
                <span className="cm">// Backtrack for actual LCS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}