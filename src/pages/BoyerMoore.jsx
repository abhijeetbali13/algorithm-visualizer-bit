import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const PRESETS = [
  { text: 'BESS_KNEW_ABOUT_BAOBABS', pattern: 'BAOBAB' },
  { text: 'ABCBABCABCABC',           pattern: 'ABCABC' },
  { text: 'TRUSTHEREHERE',           pattern: 'HERE'   },
];

/* ─────────────────────────────────────────────
   STANDARD version  (what most implementations use)
   d1 = max(1,  j - lastOcc(badChar))
   d2 = goodSuffix[j+1]
   shift = max(d1, d2)   always
───────────────────────────────────────────── */
function buildBadCharStd(pattern) {
  const t = {};
  for (let i = 0; i < pattern.length; i++) t[pattern[i]] = i;
  return t;
}

function buildGoodSuffix(pattern) {
  const m = pattern.length;
  const shift = new Array(m + 1).fill(0);
  const bpos = new Array(m + 1).fill(0);

  let i = m;
  let j = m + 1;
  bpos[i] = j;

  while (i > 0) {
    while (j <= m && pattern[i - 1] !== pattern[j - 1]) {
      if (shift[j] === 0) {
        shift[j] = j - i;
      }
      j = bpos[j];
    }
    i--;
    j--;
    bpos[i] = j;
  }

  j = bpos[0];

  for (i = 0; i <= m; i++) {
    if (shift[i] === 0) {
      shift[i] = j;
    }
    if (i === j) {
      j = bpos[j];
    }
  }

  return shift;
}

function standardSteps(text, pattern) {
  const n = text.length, m = pattern.length;
  const badChar    = buildBadCharStd(pattern);
  const goodSuffix = buildGoodSuffix(pattern);

  const steps = [];
  const matches = [];

  steps.push({ alignAt:-1, textPos:-1, patPos:-1, k:0, badChar, goodSuffix, matches:[], d1:null, d2:null, finalShift:null, chosen:null, msg:`Build t1 (bad char) and d2 (good suffix) tables for "${pattern}". Shift = max(d1, d2).` });

  let s = 0;
  while (s <= n - m) {
    let j = m - 1;
    while (j >= 0 && pattern[j] === text[s + j]) j--;

    if (j < 0) {
  matches.push(s);

  const shift = Math.max(1, goodSuffix[0]);

  steps.push({
    alignAt:s,
    textPos:s+m-1,
    patPos:-1,
    k:m,
    badChar,
    goodSuffix,
    matches:[...matches],
    d1:null,
    d2:shift,
    finalShift:shift,
    chosen:'match',
    msg:`✓ Full match at index ${s}! Shift by goodSuffix[0]=${shift}`
  });

  s += shift;
} else {
      const k = m - 1 - j;           // number of chars matched from right
      const c = text[s + j];
      const t1c = badChar[c] ?? -1;
      const d1 = Math.max(1, j - t1c);   // standard: j - lastOcc, not t1(c)-k
      const d2 = Math.max(1, goodSuffix[j + 1]);
const finalShift = Math.max(1, d1, d2);
      const chosen = d1 >= d2 ? 'd1' : 'd2';

      steps.push({
        alignAt:s, textPos:s+j, patPos:j, k,
        badChar, goodSuffix, matches:[...matches],
        d1, d2, finalShift, chosen,
        msg:`Mismatch at j=${j}: text[${s+j}]='${c}' ≠ pat[${j}]='${pattern[j]}'. k=${k} matched. d1=max(1,${j}-t1('${c}')(${t1c}))=${d1}, d2=goodSuffix[${j+1}]=${d2}. Shift=max(${d1},${d2})=${finalShift} via ${chosen}.`,
      });
      s += finalShift;
    }
  }
  steps.push({ alignAt:-1, textPos:-1, patPos:-1, k:0, badChar, goodSuffix, matches:[...matches], d1:null, d2:null, finalShift:null, chosen:null, msg:`✓ Done. ${matches.length} match(es) at: [${matches.join(', ')}]` });
  return steps;
}

/* ─────────────────────────────────────────────
   TEXTBOOK version  (from your notes)
   t1(c) = shift table (Horspool-style, last occurrence from right)
   d1 = max{ t1(c) - k, 1 }
   d  = d1           if k = 0
   d  = max(d1, d2)  if k > 0
───────────────────────────────────────────── */
function buildT1(pattern) {
  // t1(c) = distance of last occurrence of c from right end
  // For chars not in pattern, t1 = m (pattern length)
  const m = pattern.length;
  const t = {};
  // last occurrence index from left
  for (let i = 0; i < m - 1; i++) t[pattern[i]] = i;  // exclude last char
  // convert to distance from right: t1(c) = m - 1 - lastIdx
  const t1 = {};
  for (const [c, idx] of Object.entries(t)) t1[c] = m - 1 - idx;
  return t1; // t1(c) = number of positions to shift based on bad char
}

function buildD2Table(pattern) {
  // d2[k] for k=1..m: shift when k chars matched from right
  // This is the good-suffix shift indexed by k (matched count)
  const gs = buildGoodSuffix(pattern);
  const m = pattern.length;
  // gs[j+1] is used when mismatch at position j, k = m-1-j matched
  // so d2[k] = gs[m - k]  (since j = m-1-k → j+1 = m-k)
  const d2 = Array(m + 1).fill(m);
  for (let k = 0; k <= m; k++) {
    d2[k] = gs[m - k];
  }
  return d2;
}

function textbookSteps(text, pattern) {
  const n = text.length, m = pattern.length;
  const t1  = buildT1(pattern);
  const d2k = buildD2Table(pattern);
  const steps = [];
  const matches = [];

  steps.push({ alignAt:-1, textPos:-1, patPos:-1, k:0, t1, d2k, matches:[], d1:null, d2:null, finalShift:null, kIsZero:true, msg:`Build t1 (bad char) table and d2 (good suffix) table. d = d1 if k=0, else max(d1,d2). d1 = max{t1(c)-k, 1}` });

  let s = 0;
  while (s <= n - m) {
    let j = m - 1;
    while (j >= 0 && pattern[j] === text[s + j]) j--;

    if (j < 0) {
      matches.push(s);
      const shift = d2k[m]; // full match shift
      steps.push({ alignAt:s, textPos:s+m-1, patPos:-1, k:m, t1, d2k, matches:[...matches], d1:null, d2:shift, finalShift:shift, kIsZero:false, msg:`✓ Full match at index ${s}! Shift by d2[${m}]=${shift}` });
      s += Math.max(1, shift);
    } else {
      const k = m - 1 - j;           // matched chars from right
      const c = text[s + j];
      const t1c = t1[c] ?? m;         // t1(c): default m if char not in pattern
      const d1raw = t1c - k;
      const d1 = Math.max(d1raw, 1);
      const d2 = d2k[k];
      const kIsZero = k === 0;
      const finalShift = kIsZero ? d1 : Math.max(d1, d2);
      const chosen = kIsZero ? 'd1 only (k=0)' : d1 >= d2 ? 'd1' : 'd2';

      steps.push({
        alignAt:s, textPos:s+j, patPos:j, k,
        t1, d2k, matches:[...matches],
        d1, d2, finalShift, kIsZero, chosen,
        msg: kIsZero
          ? `k=0 (first char mismatch). c='${c}', t1('${c}')=${t1c}. d1=max{${t1c}-0,1}=${d1}. Since k=0 → d=d1=${d1}.`
          : `k=${k} matched chars. c='${c}', t1('${c}')=${t1c}. d1=max{${t1c}-${k},1}=${d1}. d2[k=${k}]=${d2}. d=max(${d1},${d2})=${finalShift} via ${chosen}.`,
      });
      s += finalShift;
    }
  }
  steps.push({ alignAt:-1, textPos:-1, patPos:-1, k:0, t1, d2k, matches:[...matches], d1:null, d2:null, finalShift:null, kIsZero:true, msg:`✓ Done. ${matches.length} match(es) at: [${matches.join(', ')}]` });
  return steps;
}

/* ─────────────────────────────────────────────  COMPONENT  ── */
export default function BoyerMoore() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [variant, setVariant]     = useState('textbook'); // 'standard' | 'textbook'
  const [custom, setCustom] = useState(null); // { text, pattern } | null
  const [textInput, setTextInput] = useState('');
  const [patternInput, setPatternInput] = useState('');
  const [inputError, setInputError] = useState('');

  const { text, pattern } = custom !== null ? custom : PRESETS[presetIdx];

  const stdViz = useVisualizer(() => standardSteps(text, pattern));
  const tbViz  = useVisualizer(() => textbookSteps(text, pattern));
  const viz    = variant === 'standard' ? stdViz : tbViz;

  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const switchVariant = v => { stdViz.reset(); tbViz.reset(); setVariant(v); };
  const switchPreset  = i => { stdViz.reset(); tbViz.reset(); setCustom(null); setPresetIdx(i); };

  const applyCustom = () => {
    const t = textInput.trim();
    const p = patternInput.trim();

    if (t.length === 0 || p.length === 0) {
      setInputError('Enter both a text and a pattern.');
      return;
    }
    if (p.length < 1 || p.length > 12) {
      setInputError('Pattern must be 1–12 characters.');
      return;
    }
    if (p.length > t.length) {
      setInputError('Pattern cannot be longer than the text.');
      return;
    }
    if (t.length > 60) {
      setInputError('Text must be 60 characters or fewer.');
      return;
    }

    setInputError('');
    stdViz.reset();
    tbViz.reset();
    setCustom({ text: t, pattern: p });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') applyCustom();
  };

  /* ── shared display values ── */
  const alignAt  = current?.alignAt  ?? -1;
  const textPos  = current?.textPos  ?? -1;
  const patPos   = current?.patPos   ?? -1;
  const matches  = current?.matches  || [];
  const d1       = current?.d1       ?? null;
  const d2       = current?.d2       ?? null;
  const finalShift = current?.finalShift ?? null;
  const chosen   = current?.chosen   ?? null;
  const k        = current?.k        ?? 0;
  const kIsZero  = current?.kIsZero  ?? true;

  /* ── tables ── */
  const badCharStd = current?.badChar || buildBadCharStd(pattern);
  const goodSuffix = current?.goodSuffix || buildGoodSuffix(pattern);
  const t1Table    = current?.t1  || buildT1(pattern);
  const d2kTable   = current?.d2k || buildD2Table(pattern);

  const getCellStyle = (i) => {
    if (matches.some(m => i >= m && i < m + pattern.length))
      return { background:'rgba(34,197,94,0.2)', border:'1px solid var(--green)', color:'var(--green)' };
    if (alignAt >= 0 && i >= alignAt && i < alignAt + pattern.length) {
      if (i === textPos && patPos >= 0)
        return { background:'rgba(239,68,68,0.2)', border:'1px solid var(--red)', color:'var(--red)' };
      return { background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.25)', color:'var(--text)' };
    }
    return { background:'transparent', border:'1px solid transparent', color:'var(--text)' };
  };

  const matchedPatPos = new Set();
  if (alignAt >= 0 && patPos >= 0)
    for (let kk = patPos + 1; kk < pattern.length; kk++) matchedPatPos.add(kk);

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Boyer-Moore Algorithm</h1>
          <p>Right-to-left pattern matching with two heuristics. Choose the standard formulation or the textbook version (from notes) where <strong style={{color:'var(--accent)'}}>d1 = max{'{'} t1(c)−k, 1 {'}'}</strong> and <strong style={{color:'var(--accent)'}}>d = d1 if k=0, else max(d1,d2)</strong>.</p>
        </div>

        {/* Variant tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[['textbook','Textbook (Notes version)'],['standard','Standard implementation']].map(([v,label])=>(
            <button key={v} onClick={()=>switchVariant(v)} className="btn btn-secondary"
              style={{ flex:1, background:variant===v?'rgba(0,212,255,0.1)':'', borderColor:variant===v?'var(--accent)':'', color:variant===v?'var(--accent)':'' }}>
              {label}
            </button>
          ))}
        </div>

        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Press ▶ Start or use Next → to step through'}</div>

            {/* ── Validity / shift decision chip ── */}
            {d1 !== null && (
              <div style={{ marginBottom:12 }}>
                {/* k display */}
                <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                  <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 14px', fontFamily:'JetBrains Mono', fontSize:13 }}>
                    <span style={{ color:'var(--muted)' }}>k (matched) = </span>
                    <span style={{ color: k===0?'var(--muted)':'var(--green)', fontWeight:700 }}>{k}</span>
                  </div>
                  {variant==='textbook' && (
                    <div style={{ background: kIsZero?'rgba(234,179,8,0.1)':'rgba(34,197,94,0.1)', border:`1px solid ${kIsZero?'var(--yellow)':'var(--green)'}`, borderRadius:6, padding:'5px 14px', fontFamily:'JetBrains Mono', fontSize:12, color:kIsZero?'var(--yellow)':'var(--green)' }}>
                      {kIsZero ? 'k=0 → d = d1 only' : 'k>0 → d = max(d1, d2)'}
                    </div>
                  )}
                </div>

                {/* d1 / d2 / result boxes */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:100, background:chosen==='d1'||chosen==='d1 only (k=0)'?'rgba(234,179,8,0.15)':'var(--surface2)', border:`2px solid ${chosen==='d1'||chosen==='d1 only (k=0)'?'var(--yellow)':'var(--border)'}`, borderRadius:8, padding:'10px 14px', fontFamily:'JetBrains Mono', transition:'all 0.2s' }}>
                    <div style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>
                      {variant==='textbook' ? 'd1 = max{t1(c)−k, 1}' : 'd1 = max(1, j−t1(c))'}
                    </div>
                    <div style={{ fontSize:24, fontWeight:700, color:chosen==='d1'||chosen==='d1 only (k=0)'?'var(--yellow)':'var(--text)' }}>{d1}</div>
                  </div>
                  {(!kIsZero || variant==='standard') && (
                    <div style={{ flex:1, minWidth:100, background:chosen==='d2'?'rgba(167,139,250,0.15)':'var(--surface2)', border:`2px solid ${chosen==='d2'?'#a78bfa':'var(--border)'}`, borderRadius:8, padding:'10px 14px', fontFamily:'JetBrains Mono', transition:'all 0.2s' }}>
                      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>d2 = good suffix</div>
                      <div style={{ fontSize:24, fontWeight:700, color:chosen==='d2'?'#a78bfa':'var(--text)' }}>{d2}</div>
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:100, background:'rgba(0,212,255,0.1)', border:'2px solid var(--accent)', borderRadius:8, padding:'10px 14px', fontFamily:'JetBrains Mono' }}>
                    <div style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>
                      {variant==='textbook' ? (kIsZero ? 'd = d1' : 'd = max(d1,d2)') : 'd = max(d1,d2)'}
                    </div>
                    <div style={{ fontSize:24, fontWeight:700, color:'var(--accent)' }}>{finalShift}</div>
                    <div style={{ fontSize:10, color:'var(--accent)', marginTop:2 }}>← {chosen}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Text alignment */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20, overflowX:'auto' }}>
              <div className="section-label">Right-to-left matching ← — pattern slides right on mismatch</div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:13 }}>
                <div style={{ display:'flex', gap:2, marginBottom:4 }}>
                  {text.split('').map((_,i)=><div key={i} style={{ width:26, textAlign:'center', fontSize:9, color:'var(--muted)' }}>{i}</div>)}
                </div>
                <div style={{ display:'flex', gap:2, marginBottom:8 }}>
                  {text.split('').map((ch,i)=>{
                    const st=getCellStyle(i);
                    return <div key={i} style={{ width:26, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, fontWeight:i===textPos?700:400, transition:'all 0.15s', ...st }}>{ch}</div>;
                  })}
                </div>
                {alignAt>=0 && (
                  <div style={{ display:'flex', gap:2, paddingLeft:`${alignAt*28}px` }}>
                    {pattern.split('').map((ch,i)=>{
                      const isMismatch=i===patPos, isMatched=matchedPatPos.has(i), isFullMatch=matches.some(m=>alignAt===m);
                      return <div key={i} style={{ width:26, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, background:isFullMatch?'rgba(34,197,94,0.2)':isMismatch?'rgba(239,68,68,0.2)':isMatched?'rgba(167,139,250,0.2)':'rgba(0,212,255,0.07)', border:`2px solid ${isFullMatch?'var(--green)':isMismatch?'var(--red)':isMatched?'#a78bfa':'rgba(0,212,255,0.3)'}`, color:isFullMatch?'var(--green)':isMismatch?'var(--red)':isMatched?'#a78bfa':'var(--accent)', fontWeight:700 }}>{ch}</div>;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Two tables */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14 }}>
              {/* t1 / bad char table */}
              <div style={{ background:'var(--surface)', border:`1px solid ${chosen==='d1'||chosen==='d1 only (k=0)'?'var(--yellow)':'var(--border)'}`, borderRadius:'var(--radius-lg)', padding:14, transition:'border-color 0.2s' }}>
                <div className="section-label" style={{ color:chosen==='d1'||chosen==='d1 only (k=0)'?'var(--yellow)':'var(--muted)' }}>
                  {variant==='textbook'?'t1(c) — Bad Symbol Table':'t1(c) — Bad Char Table'}
                  {(chosen==='d1'||chosen==='d1 only (k=0)') && ' ← used'}
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:6 }}>
                  {(variant==='textbook' ? Object.entries(t1Table) : Object.entries(badCharStd)).map(([ch,val])=>{
                    const isActive = current?.textPos>=0 && text[current.textPos]===ch;
                    return (
                      <div key={ch} style={{ background:isActive?'rgba(234,179,8,0.15)':'var(--surface2)', border:`1px solid ${isActive?'var(--yellow)':'var(--border)'}`, borderRadius:5, padding:'5px 9px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:40 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:isActive?'var(--yellow)':'var(--accent)' }}>'{ch}'</div>
                        <div style={{ fontSize:13, fontWeight:700, color:isActive?'var(--yellow)':'var(--text)', marginTop:1 }}>{val}</div>
                      </div>
                    );
                  })}
                  <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:5, padding:'5px 9px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:40 }}>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>other</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginTop:1 }}>{pattern.length}</div>
                  </div>
                </div>
                <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'JetBrains Mono' }}>
                  {variant==='textbook' ? 'd1 = max{t1(c)−k, 1}' : 'd1 = max(1, j − t1(c))'}
                </div>
              </div>

              {/* d2 good suffix table */}
              <div style={{ background:'var(--surface)', border:`1px solid ${chosen==='d2'?'#a78bfa':'var(--border)'}`, borderRadius:'var(--radius-lg)', padding:14, transition:'border-color 0.2s' }}>
                <div className="section-label" style={{ color:chosen==='d2'?'#a78bfa':'var(--muted)' }}>
                  {variant==='textbook' ? 'd2[k] — Good Suffix Table' : 'goodSuffix[j+1]'}
                  {chosen==='d2' && ' ← used'}
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:6, maxHeight:120, overflowY:'auto' }}>
                  {variant==='textbook'
                    ? Array.from({length: pattern.length+1},(_,i)=>{
                        const isActive = current && !kIsZero && k===i;
                        return (
                          <div key={i} style={{ background:isActive?'rgba(167,139,250,0.15)':'var(--surface2)', border:`1px solid ${isActive?'#a78bfa':'var(--border)'}`, borderRadius:5, padding:'5px 9px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:38 }}>
                            <div style={{ fontSize:10, color:isActive?'#a78bfa':'var(--muted)' }}>k={i}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:isActive?'#a78bfa':'var(--text)', marginTop:1 }}>{d2kTable[i]}</div>
                          </div>
                        );
                      })
                    : Array.from({length: pattern.length+1},(_,i)=>{
                        const isActive = patPos>=0 && i===patPos+1;
                        return (
                          <div key={i} style={{ background:isActive?'rgba(167,139,250,0.15)':'var(--surface2)', border:`1px solid ${isActive?'#a78bfa':'var(--border)'}`, borderRadius:5, padding:'5px 9px', fontFamily:'JetBrains Mono', textAlign:'center', minWidth:38 }}>
                            <div style={{ fontSize:10, color:isActive?'#a78bfa':'var(--muted)' }}>j={i}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:isActive?'#a78bfa':'var(--text)', marginTop:1 }}>{goodSuffix[i]}</div>
                          </div>
                        );
                      })
                  }
                </div>
                <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'JetBrains Mono' }}>
                  {variant==='textbook' ? 'd2[k]: shift for k matched suffix chars' : 'goodSuffix[j+1]: shift on mismatch at j'}
                </div>
              </div>
            </div>

            {/* Custom text/pattern input */}
            <div className="controls-panel" style={{ marginTop: 16 }}>
              <h3>Custom Text & Pattern</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Text, e.g. ABCBABCABCABC"
                  disabled={running}
                  style={{
                    flex: 2,
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
                <input
                  type="text"
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pattern, e.g. ABCABC"
                  disabled={running}
                  style={{
                    flex: 1,
                    minWidth: 120,
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
                  onClick={applyCustom}
                  disabled={running}
                  className="btn"
                  style={{ padding: '8px 16px' }}
                >
                  Apply
                </button>
              </div>
              {inputError && (
                <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 4 }}>{inputError}</div>
              )}
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                Text ≤60 chars, pattern 1–12 chars and no longer than the text. Press Apply or Enter.
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Preset</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {PRESETS.map((p,i)=>(
                  <button key={i} onClick={()=>switchPreset(i)} className="btn btn-secondary"
                    style={{ fontSize:11, textAlign:'left', background:(custom===null && presetIdx===i)?'rgba(0,212,255,0.1)':'', borderColor:(custom===null && presetIdx===i)?'var(--accent)':'', color:(custom===null && presetIdx===i)?'var(--accent)':'' }}>
                    pat: "{p.pattern}"
                  </button>
                ))}
              </div>
              <div style={{ marginTop:8, fontFamily:'JetBrains Mono', fontSize:11 }}>
                <div style={{ color:'var(--muted)' }}>Text:</div>
                <div style={{ color:'var(--text)', wordBreak:'break-all', marginTop:2 }}>{text}</div>
                <div style={{ color:'var(--muted)', marginTop:4 }}>Pattern:</div>
                <div style={{ color:'var(--accent)', fontWeight:700, marginTop:2 }}>{pattern}</div>
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed}/>
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
              {variant==='textbook' ? (
                <div className="pseudocode">
                  <span className="cm">// d = d1 if k=0</span>{'\n'}
                  <span className="cm">// d = max(d1,d2) if k&gt;0</span>{'\n'}
                  <span className="cm">// d1 = max(t1(c)-k, 1)</span>{'\n\n'}
                  s=0{'\n'}
                  <span className="kw">while</span> s ≤ n-m:{'\n'}
                  {'  '}j=m-1; k=0{'\n'}
                  {'  '}<span className="kw">while</span> j≥0 <span className="kw">and</span> match: j--; k++{'\n'}
                  {'  '}<span className="kw">if</span> k==m: match at s{'\n'}
                  {'  '}<span className="kw">else</span>:{'\n'}
                  {'    '}d1=max(t1(c)-k, 1){'\n'}
                  {'    '}<span className="kw">if</span> k==0: d=d1{'\n'}
                  {'    '}<span className="kw">else</span>: d=max(d1, d2[k]){'\n'}
                  {'    '}s += d
                </div>
              ) : (
                <div className="pseudocode">
                  s=0{'\n'}
                  <span className="kw">while</span> s ≤ n-m:{'\n'}
                  {'  '}j=m-1{'\n'}
                  {'  '}<span className="kw">while</span> j≥0 <span className="kw">and</span> match: j--{'\n'}
                  {'  '}<span className="kw">if</span> j&lt;0: match at s{'\n'}
                  {'  '}<span className="kw">else</span>:{'\n'}
                  {'    '}d1=max(1, j-t1(c)){'\n'}
                  {'    '}d2=goodSuffix[j+1]{'\n'}
                  {'    '}s += max(d1, d2)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
