import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const PRESETS = [
  { text: 'ABCBABCABCABC', pattern: 'ABCABC' },
  { text: 'TRUSTHEREHERE', pattern: 'HERE' },
  { text: 'AABABAABABAAB', pattern: 'ABAB' },
];

function buildBadChar(pattern) {
  const table = {};
  for (let i = 0; i < pattern.length; i++) table[pattern[i]] = i;
  return table;
}

function boyerMooreSteps(text, pattern) {
  const n = text.length, m = pattern.length;
  const badChar = buildBadChar(pattern);
  const steps = [];
  const matches = [];

  steps.push({ alignAt:-1, textPos:-1, patPos:-1, badChar, matches:[], shiftAmount:null, shiftReason:'', msg:`Build bad-character table for "${pattern}"` });

  let s = 0;
  while (s <= n - m) {
    let j = m - 1;

    // right-to-left match
    while (j >= 0 && pattern[j] === text[s + j]) j--;

    if (j < 0) {
      matches.push(s);
      steps.push({ alignAt:s, textPos:s+m-1, patPos:-1, badChar, matches:[...matches], shiftAmount:null, shiftReason:'', msg:`✓ Match at index ${s}!` });
      const shift = m;
      s += shift;
    } else {
      const badCh = text[s + j];
      const bcShift = Math.max(1, j - (badChar[badCh] ?? -1));
      steps.push({
        alignAt:s, textPos:s+j, patPos:j, badChar, matches:[...matches],
        shiftAmount:bcShift, shiftReason:'bad char',
        msg:`Mismatch: text[${s+j}]='${badCh}' ≠ pattern[${j}]='${pattern[j]}'. Bad-char shift: j(${j}) - lastOccurrence('${badCh}' in pattern=${badChar[badCh]??-1}) = ${bcShift}`,
      });
      s += bcShift;
    }
  }

  steps.push({ alignAt:-1, textPos:-1, patPos:-1, badChar, matches:[...matches], shiftAmount:null, shiftReason:'', msg:`✓ Done. ${matches.length} match${matches.length!==1?'es':''} found at: [${matches.join(', ')}]` });
  return steps;
}

export default function BoyerMoore() {
  const [presetIdx, setPresetIdx] = useState(0);
  const { text, pattern } = PRESETS[presetIdx];
  const viz = useVisualizer(() => boyerMooreSteps(text, pattern));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const badChar  = current?.badChar  || buildBadChar(pattern);
  const alignAt  = current?.alignAt  ?? -1;
  const textPos  = current?.textPos  ?? -1;
  const patPos   = current?.patPos   ?? -1;
  const matches  = current?.matches  || [];

  const getCellStyle = (i) => {
    if (matches.some(m => i >= m && i < m + pattern.length))
      return { background:'rgba(34,197,94,0.2)', border:'1px solid var(--green)', color:'var(--green)' };
    if (alignAt >= 0 && i >= alignAt && i < alignAt + pattern.length) {
      if (i === textPos && patPos >= 0)
        return { background:'rgba(239,68,68,0.2)', border:'1px solid var(--red)', color:'var(--red)' };
      return { background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', color:'var(--text)' };
    }
    return { background:'transparent', border:'1px solid transparent', color:'var(--text)' };
  };

  // Which pattern positions matched (right-to-left from mismatch)
  const matchedPatPositions = new Set();
  if (alignAt >= 0 && patPos >= 0) {
    for (let k = patPos + 1; k < pattern.length; k++) matchedPatPositions.add(k);
  }

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Boyer-Moore Algorithm</h1>
          <p>Efficient string search scanning right-to-left within the pattern. Uses the Bad Character rule: on mismatch, skip based on the last occurrence of the bad character in the pattern.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Select preset and press Start'}</div>

            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20, overflowX:'auto' }}>
              <div className="section-label">Pattern slides right; matching goes right-to-left ←</div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:14 }}>
                {/* Index row */}
                <div style={{ display:'flex', gap:2, marginBottom:4 }}>
                  {text.split('').map((_,i) => <div key={i} style={{ width:28, textAlign:'center', fontSize:10, color:'var(--muted)' }}>{i}</div>)}
                </div>
                {/* Text */}
                <div style={{ display:'flex', gap:2, marginBottom:8 }}>
                  {text.split('').map((ch,i) => {
                    const st = getCellStyle(i);
                    const isActive = i === textPos;
                    return (
                      <div key={i} style={{ width:28, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, fontWeight:isActive?700:400, transition:'all 0.15s', ...st, border:isActive&&patPos>=0?'2px solid var(--red)':st.border }}>
                        {ch}
                      </div>
                    );
                  })}
                </div>
                {/* Pattern */}
                {alignAt >= 0 && (
                  <div style={{ display:'flex', gap:2, paddingLeft:`${alignAt*30}px` }}>
                    {pattern.split('').map((ch,i) => {
                      const isMismatch = i === patPos;
                      const isMatched  = matchedPatPositions.has(i);
                      const isMatch    = matches.some(m => alignAt===m);
                      return (
                        <div key={i} style={{ width:28, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, background: isMatch?'rgba(34,197,94,0.2)':isMismatch?'rgba(239,68,68,0.2)':isMatched?'rgba(167,139,250,0.2)':'rgba(0,212,255,0.08)', border:`2px solid ${isMatch?'var(--green)':isMismatch?'var(--red)':isMatched?'#a78bfa':'var(--accent)'}`, color: isMatch?'var(--green)':isMismatch?'var(--red)':isMatched?'#a78bfa':'var(--accent)', fontWeight:700 }}>
                          {ch}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {current?.shiftAmount && (
                <div style={{ marginTop:10, fontFamily:'JetBrains Mono', fontSize:13, color:'var(--yellow)' }}>
                  → Shift by <strong>{current.shiftAmount}</strong> ({current.shiftReason})
                </div>
              )}
            </div>

            {/* Bad char table */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginTop:16 }}>
              <div className="section-label">Bad Character Table — last occurrence index in pattern</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                {Object.entries(badChar).map(([ch, idx]) => {
                  const isActive = current?.textPos >= 0 && text[current.textPos] === ch;
                  return (
                    <div key={ch} style={{ background:isActive?'rgba(234,179,8,0.15)':'var(--surface2)', border:`1px solid ${isActive?'var(--yellow)':'var(--border)'}`, borderRadius:6, padding:'8px 12px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:52 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:isActive?'var(--yellow)':'var(--accent)' }}>'{ch}'</div>
                      <div style={{ fontSize:16, fontWeight:700, color:isActive?'var(--yellow)':'var(--text)', marginTop:2 }}>{idx}</div>
                    </div>
                  );
                })}
                <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:52 }}>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>other</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginTop:2 }}>-1</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'JetBrains Mono' }}>
                Shift = max(1, j − lastOcc(badChar)) where j = mismatch position in pattern
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Preset</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {PRESETS.map((p,i) => (
                  <button key={i} onClick={() => { reset(); setPresetIdx(i); }} className="btn btn-secondary"
                    style={{ fontSize:11, textAlign:'left', background:presetIdx===i?'rgba(0,212,255,0.1)':'', borderColor:presetIdx===i?'var(--accent)':'', color:presetIdx===i?'var(--accent)':'' }}>
                    Pattern: "{p.pattern}"
                  </button>
                ))}
              </div>
              <div style={{ marginTop:8, fontFamily:'JetBrains Mono', fontSize:12 }}>
                <div style={{ color:'var(--muted)', marginBottom:2 }}>Text:</div>
                <div style={{ color:'var(--text)', wordBreak:'break-all' }}>{text}</div>
                <div style={{ color:'var(--muted)', marginTop:6, marginBottom:2 }}>Pattern:</div>
                <div style={{ color:'var(--accent)', fontWeight:700 }}>{pattern}</div>
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length} onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next} speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Best</div><div className="value">O(n/m)</div></div>
                <div className="info-chip"><div className="label">Worst</div><div className="value">O(nm)</div></div>
                <div className="info-chip"><div className="label">Avg</div><div className="value">O(n)</div></div>
                <div className="info-chip"><div className="label">Preproc.</div><div className="value">O(m+σ)</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode"><span className="cm">// Bad char table</span>{'\n'}<span className="kw">for</span> i=0 to m-1:{'\n'}  bc[pat[i]] = i{'\n'}<span className="cm">// Search (right-to-left)</span>{'\n'}s = 0{'\n'}<span className="kw">while</span> s &lt;= n-m:{'\n'}  j = m-1{'\n'}  <span className="kw">while</span> j&gt;=0 <span className="kw">and</span> pat[j]==txt[s+j]: j--{'\n'}  <span className="kw">if</span> j&lt;0: match at s{'\n'}  <span className="kw">else</span>: s += max(1, j-bc[txt[s+j]])</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
