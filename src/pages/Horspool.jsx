import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const PRESETS = [
  { text: 'ABCBABCABCABC', pattern: 'ABCABC' },
  { text: 'HELLO WORLD HELLO', pattern: 'HELLO' },
  { text: 'AABAACAADAABAAABAA', pattern: 'AABA' },
];

function buildShiftTable(pattern) {
  const m = pattern.length;
  const table = {};
  for (let i = 0; i < m - 1; i++) {
    table[pattern[i]] = m - 1 - i;
  }
  return table;
}

function horspoolSteps(text, pattern) {
  const n = text.length, m = pattern.length;
  const shiftTable = buildShiftTable(pattern);
  const steps = [];
  const matches = [];

  steps.push({
    textPos: -1, alignAt: -1, compareIdx: -1,
    shiftTable, matches: [],
    shiftAmount: null, shiftChar: null,
    msg: `Build shift table for pattern "${pattern}" (length ${m})`,
  });

  let i = m - 1;
  while (i < n) {
    let k = 0;
    while (k < m && pattern[m - 1 - k] === text[i - k]) k++;

    const alignAt = i - m + 1;

    if (k === m) {
      matches.push(alignAt);
      steps.push({ textPos:i, alignAt, compareIdx:-1, shiftTable, matches:[...matches], shiftAmount:null, shiftChar:null, msg:`✓ Match found at index ${alignAt}!` });
      i += m; // shift by pattern length on match (simplified)
    } else {
      const mismatchChar = text[i];
      const shift = shiftTable[mismatchChar] ?? m;
      steps.push({
        textPos:i, alignAt, compareIdx: m-1-k,
        shiftTable, matches:[...matches],
        shiftAmount:shift, shiftChar:mismatchChar,
        msg:`Mismatch at text[${i}]='${mismatchChar}'. Shift table['${mismatchChar}']=${shift===m?`(not in pattern)→${m}`:shift} → shift right by ${shift}`,
      });
      i += shift;
    }
  }

  steps.push({ textPos:-1, alignAt:-1, compareIdx:-1, shiftTable, matches:[...matches], shiftAmount:null, shiftChar:null, msg:`✓ Done. Found ${matches.length} match${matches.length!==1?'es':''} at: [${matches.join(', ')}]` });
  return steps;
}

export default function Horspool() {
  const [presetIdx, setPresetIdx] = useState(0);
  const { text, pattern } = PRESETS[presetIdx];
  const viz = useVisualizer(() => horspoolSteps(text, pattern));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const shiftTable = current?.shiftTable || buildShiftTable(pattern);
  const alignAt    = current?.alignAt ?? -1;
  const textPos    = current?.textPos ?? -1;
  const matches    = current?.matches || [];

  const getCellColor = (i) => {
    if (matches.some(m => i >= m && i < m + pattern.length)) return 'var(--green)';
    if (alignAt >= 0 && i >= alignAt && i < alignAt + pattern.length) {
      const pi = i - alignAt;
      const ti = i;
      if (ti === textPos && current?.compareIdx !== -1) {
        return pattern[pattern.length-1 - (current?.compareIdx||0)] === text[i] ? '#a78bfa' : 'var(--red)';
      }
      return '#1e3a5f';
    }
    return 'transparent';
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Horspool Algorithm</h1>
          <p>A simplified Boyer-Moore variant for string searching. Uses a shift table to skip large portions of text on mismatch, matching right-to-left against the pattern.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Select preset and press Start'}</div>

            {/* Text + pattern alignment */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20, overflowX:'auto' }}>
              <div className="section-label">Text alignment — pattern slides right on mismatches</div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:14, marginBottom:16 }}>
                {/* Index row */}
                <div style={{ display:'flex', gap:2, marginBottom:4 }}>
                  {text.split('').map((_,i) => (
                    <div key={i} style={{ width:28, textAlign:'center', fontSize:10, color:'var(--muted)' }}>{i}</div>
                  ))}
                </div>
                {/* Text row */}
                <div style={{ display:'flex', gap:2, marginBottom:8 }}>
                  {text.split('').map((ch,i) => {
                    const bg = getCellColor(i);
                    const isAlignEnd = i === textPos;
                    return (
                      <div key={i} style={{ width:28, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, background:bg, border:`2px solid ${isAlignEnd && bg!=='transparent' ? 'var(--yellow)':bg==='transparent'?'transparent':'var(--border)'}`, color:bg==='transparent'?'var(--text)':'white', fontWeight:isAlignEnd?700:400, transition:'all 0.15s' }}>
                        {ch}
                      </div>
                    );
                  })}
                </div>
                {/* Pattern row */}
                {alignAt >= 0 && (
                  <div style={{ display:'flex', gap:2, paddingLeft: `${alignAt * 30}px` }}>
                    {pattern.split('').map((ch,i) => {
                      const matched = matches.some(m => alignAt===m);
                      return (
                        <div key={i} style={{ width:28, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, background: matched?'rgba(34,197,94,0.2)':'rgba(0,212,255,0.1)', border:`2px solid ${matched?'var(--green)':'var(--accent)'}`, color: matched?'var(--green)':'var(--accent)', fontWeight:600, fontSize:14 }}>
                          {ch}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Shift arrow */}
              {current?.shiftAmount && (
                <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, fontFamily:'JetBrains Mono', fontSize:13 }}>
                  <span style={{ color:'var(--muted)' }}>Shift by</span>
                  <span style={{ color:'var(--yellow)', fontWeight:700 }}>{current.shiftAmount}</span>
                  <span style={{ color:'var(--muted)' }}>because text[{textPos}]='{current.shiftChar}'</span>
                </div>
              )}
            </div>

            {/* Shift table */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginTop:16 }}>
              <div className="section-label">Shift Table — shift(c) = how far to move on char c</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                {Object.entries(shiftTable).map(([ch, shift]) => {
                  const isActive = current?.shiftChar === ch;
                  return (
                    <div key={ch} style={{ background: isActive?'rgba(234,179,8,0.15)':'var(--surface2)', border:`1px solid ${isActive?'var(--yellow)':'var(--border)'}`, borderRadius:6, padding:'8px 12px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:52 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: isActive?'var(--yellow)':'var(--accent)' }}>'{ch}'</div>
                      <div style={{ fontSize:16, fontWeight:700, color: isActive?'var(--yellow)':'var(--text)', marginTop:2 }}>{shift}</div>
                    </div>
                  );
                })}
                <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:52 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--muted)' }}>other</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginTop:2 }}>{pattern.length}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', fontFamily:'JetBrains Mono' }}>
                Formula: shift(c) = m-1-lastIndex(c) for c in pattern[0..m-2], else m
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
                <div className="info-chip"><div className="label">Preprocess</div><div className="value">O(m+σ)</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode"><span className="cm">// Build shift table</span>{'\n'}<span className="kw">for</span> i=0 to m-2:{'\n'}  table[pat[i]] = m-1-i{'\n'}<span className="cm">// Search</span>{'\n'}i = m-1{'\n'}<span className="kw">while</span> i &lt; n:{'\n'}  k=0{'\n'}  <span className="kw">while</span> k&lt;m <span className="kw">and</span> pat[m-1-k]==txt[i-k]:{'\n'}    k++{'\n'}  <span className="kw">if</span> k==m: match at i-m+1{'\n'}  i += table[txt[i]] ?? m</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
