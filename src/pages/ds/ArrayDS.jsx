import { useState } from 'react';
import './ds.css';

const DEFAULT_ARRAY = [12, 35, 7, 48, 91, 23, 56];
const OPS = ['Overview', 'Insert', 'Delete', 'Search', 'Update', '2D Array'];

function ArrayCell({ value, index, highlight, label }) {
  const colors = {
    found:   { bg:'rgba(34,197,94,0.2)',   border:'var(--green)',  text:'var(--green)'  },
    current: { bg:'rgba(234,179,8,0.2)',   border:'var(--yellow)', text:'var(--yellow)' },
    new:     { bg:'rgba(0,212,255,0.2)',   border:'var(--accent)', text:'var(--accent)' },
    deleted: { bg:'rgba(239,68,68,0.15)', border:'var(--red)',    text:'var(--red)'    },
    normal:  { bg:'var(--surface2)',       border:'var(--border)', text:'var(--text)'   },
  };
  const c = colors[highlight] || colors.normal;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ width:52, height:52, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:`2px solid ${c.border}`, background:c.bg, fontFamily:'JetBrains Mono', fontSize:15, fontWeight:700, color:c.text, transition:'all 0.25s', boxShadow: highlight&&highlight!=='normal'?`0 0 10px ${c.border}44`:'' }}>
        {value}
      </div>
      <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}>[{index}]</div>
      {label && <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:c.border, fontWeight:700 }}>{label}</div>}
    </div>
  );
}

export default function ArrayDS() {
  const [arr, setArr] = useState([...DEFAULT_ARRAY]);
  const [tab, setTab] = useState('Overview');
  const [log, setLog] = useState('Welcome! Use the custom input below to load your own array, then pick an operation.');
  const [highlights, setHighlights] = useState({});
  const [inputVal, setInputVal] = useState('');
  const [inputIdx, setInputIdx] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Custom array input state
  const [customArrInput, setCustomArrInput] = useState('');
  const [customArrError, setCustomArrError] = useState('');

  const flash = (hl, msg, duration = 1800) => {
    setHighlights(hl); setLog(msg);
    setTimeout(() => setHighlights({}), duration);
  };

  const applyCustomArray = () => {
    const nums = customArrInput.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && s.trim() !== '');
    if (nums.length < 1) { setCustomArrError('Enter at least 1 number, comma-separated'); return; }
    if (nums.length > 16) { setCustomArrError('Max 16 elements'); return; }
    setCustomArrError('');
    setArr(nums);
    setHighlights({});
    setSearchResult(null);
    setLog(`✓ Loaded custom array: [${nums.join(', ')}]`);
  };

  const resetArr = () => {
    setArr([...DEFAULT_ARRAY]);
    setHighlights({}); setSearchResult(null);
    setCustomArrInput(''); setCustomArrError('');
    setLog('Array reset to default.');
  };

  const insertEnd = () => {
    const v = parseInt(inputVal);
    if (isNaN(v)) return setLog('Enter a valid number.');
    if (arr.length >= 16) return setLog('Array full (max 16).');
    const idx = arr.length;
    setArr(a => [...a, v]);
    flash({ [idx]: 'new' }, `Inserted ${v} at end → index [${idx}]. O(1) operation.`);
    setInputVal('');
  };

  const insertAt = () => {
    const v = parseInt(inputVal), i = parseInt(inputIdx);
    if (isNaN(v) || isNaN(i) || i < 0 || i > arr.length) return setLog('Invalid value or index.');
    if (arr.length >= 16) return setLog('Array full (max 16).');
    const newArr = [...arr.slice(0,i), v, ...arr.slice(i)];
    setArr(newArr);
    const hl = {}; hl[i] = 'new';
    for (let k = i+1; k < newArr.length; k++) hl[k] = 'current';
    flash(hl, `Inserted ${v} at [${i}]. Elements [${i+1}..${newArr.length-1}] shifted right. O(n).`);
    setInputVal(''); setInputIdx('');
  };

  const deleteEnd = () => {
    if (!arr.length) return setLog('Array is empty!');
    const last = arr[arr.length-1];
    flash({ [arr.length-1]: 'deleted' }, `Deleting last element ${last}...`, 600);
    setTimeout(() => { setArr(a => a.slice(0,-1)); setLog(`Deleted ${last} from end. O(1).`); }, 650);
  };

  const deleteAt = () => {
    const i = parseInt(inputIdx);
    if (isNaN(i) || i < 0 || i >= arr.length) return setLog('Invalid index.');
    const val = arr[i];
    flash({ [i]: 'deleted' }, `Deleting ${val} at [${i}]...`, 600);
    setTimeout(() => {
      const newArr = [...arr.slice(0,i), ...arr.slice(i+1)];
      setArr(newArr);
      const hl = {};
      for (let k = i; k < newArr.length; k++) hl[k] = 'current';
      setHighlights(hl);
      setLog(`Deleted ${val} at [${i}]. Elements shifted left. O(n).`);
      setTimeout(() => setHighlights({}), 1500);
    }, 650);
    setInputIdx('');
  };

  const linearSearch = () => {
    const v = parseInt(inputVal);
    if (isNaN(v)) return setLog('Enter a number to search.');
    let i = 0;
    const step = () => {
      if (i >= arr.length) { setHighlights({}); setLog(`${v} not found after ${arr.length} comparisons. O(n).`); setSearchResult(null); return; }
      setHighlights({ [i]: arr[i]===v ? 'found' : 'current' });
      setLog(`Checking [${i}]: arr[${i}]=${arr[i]} ${arr[i]===v ? `== ${v} ✓ FOUND at index ${i}!` : `≠ ${v}, continue...`}`);
      if (arr[i]===v) { setSearchResult(i); return; }
      i++; setTimeout(step, 420);
    };
    setSearchResult(null); step();
  };

  const updateAt = () => {
    const v = parseInt(inputVal), i = parseInt(inputIdx);
    if (isNaN(v) || isNaN(i) || i < 0 || i >= arr.length) return setLog('Invalid value or index.');
    const old = arr[i];
    const newArr = [...arr]; newArr[i] = v;
    setArr(newArr);
    flash({ [i]: 'new' }, `Updated arr[${i}]: ${old} → ${v}. Direct access O(1).`);
    setInputVal(''); setInputIdx('');
  };

  const inp = (val, setter, placeholder, type='number', width=80) => (
    <input className="ds-input" type={type} value={val} onChange={e => setter(e.target.value)}
      placeholder={placeholder} style={{ width }} />
  );

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Arrays</h1>
          <p>Contiguous block of memory. O(1) access by index. The foundation of all data structures.</p>
        </div>

        {/* ── Custom array input ── */}
        <div className="controls-panel" style={{ marginBottom:20 }}>
          <h3>Custom Array Input</h3>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input type="text" value={customArrInput} onChange={e => setCustomArrInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && applyCustomArray()}
              placeholder="e.g. 15, 3, 42, 8, 77" className="ds-input" style={{ flex:1, minWidth:200 }} />
            <button className="btn btn-primary" onClick={applyCustomArray}>Load Array</button>
            <button className="btn btn-secondary" onClick={resetArr}>↺ Reset Default</button>
          </div>
          {customArrError && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{customArrError}</div>}
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>Comma-separated integers, 1–16 elements. Current array: [{arr.join(', ')}]</div>
        </div>

        <div className="ds-tabs">
          {OPS.map(o => (
            <button key={o} className={`ds-tab${tab===o?' active':''}`}
              onClick={() => { setTab(o); setHighlights({}); setSearchResult(null); }}>{o}</button>
          ))}
        </div>

        <div className="ds-layout">
          <div>
            {tab !== '2D Array' ? (
              <>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:8 }}>
                  Memory: contiguous block · base + index × 4 bytes = element address
                </div>
                <div className="ds-canvas" style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', minHeight:130 }}>
                  {arr.length === 0
                    ? <div style={{ color:'var(--muted)', fontSize:13, fontFamily:'JetBrains Mono', margin:'auto' }}>Empty array</div>
                    : arr.map((v,i) => <ArrayCell key={i} value={v} index={i} highlight={highlights[i]} label={searchResult===i?'FOUND':null}/>)
                  }
                </div>
                <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                  {arr.map((_,i) => (
                    <div key={i} style={{ width:52, textAlign:'center', fontFamily:'JetBrains Mono', fontSize:9, color:'var(--muted)' }}>
                      0x{(1000 + i*4).toString(16).toUpperCase()}
                    </div>
                  ))}
                </div>
                <div className="ds-log" style={{ marginTop:12 }}>{log}</div>
                {tab === 'Overview' && (
                  <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {[
                      ['Access arr[i]','O(1)','Direct: base + i×size','var(--green)'],
                      ['Search (linear)','O(n)','Scan until found','var(--yellow)'],
                      ['Insert at end','O(1)*','Amortized append','var(--accent)'],
                      ['Insert at index','O(n)','Shift elements right','var(--red)'],
                      ['Delete at end','O(1)','No shifting needed','var(--accent)'],
                      ['Delete at index','O(n)','Shift elements left','var(--red)'],
                    ].map(([op,comp,desc,col]) => (
                      <div key={op} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontFamily:'JetBrains Mono', fontSize:12 }}>{op}</span>
                          <span style={{ fontFamily:'JetBrains Mono', fontSize:12, fontWeight:700, color:col }}>{comp}</span>
                        </div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:12 }}>
                  2D Array — matrix[row][col] stored in row-major order
                </div>
                <div className="ds-canvas">
                  <div style={{ display:'inline-flex', flexDirection:'column', gap:6 }}>
                    {[[1,2,3],[4,5,6],[7,8,9]].map((row,r) => (
                      <div key={r} style={{ display:'flex', gap:6 }}>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', width:20, display:'flex', alignItems:'center' }}>r{r}</div>
                        {row.map((val,c) => (
                          <div key={c} style={{ width:52, height:52, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'2px solid var(--border)', background:'var(--surface2)', fontFamily:'JetBrains Mono', fontSize:15, fontWeight:700, flexDirection:'column', gap:2 }}>
                            {val}
                            <div style={{ fontSize:8, color:'var(--muted)' }}>[{r}][{c}]</div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:6, paddingLeft:26 }}>
                      {[0,1,2].map(c => <div key={c} style={{ width:52, textAlign:'center', fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}>c{c}</div>)}
                    </div>
                  </div>
                  <div style={{ marginTop:16, fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)', lineHeight:1.8 }}>
                    <div>Row-major: <span style={{ color:'var(--accent)' }}>[1][2][3][4][5][6][7][8][9]</span></div>
                    <div>Address = base + (r × cols + c) × size</div>
                    <div>matrix[1][2] → base + (1×3+2) × 4 = base+20</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ds-ops-panel">
            {tab === 'Overview' && (
              <>
                <h3>Properties</h3>
                <div className="ds-info-box">
                  <strong>Fixed size</strong> (static) or dynamic (ArrayList).<br/>
                  <strong>Contiguous memory</strong> — cache friendly.<br/>
                  <strong>Index starts at 0.</strong><br/>
                  <code>int arr[5]</code> → 5×4 = 20 bytes.
                </div>
              </>
            )}
            {tab === 'Insert' && (
              <>
                <h3>Insert</h3>
                <div className="ds-op-group"><label>Value</label>{inp(inputVal, setInputVal, 'e.g. 42')}</div>
                <button className="btn btn-primary" onClick={insertEnd} style={{ width:'100%' }}>Insert at End — O(1)</button>
                <div className="ds-op-group"><label>Index (0 to {arr.length})</label>{inp(inputIdx, setInputIdx, `0–${arr.length}`)}</div>
                <button className="btn btn-secondary" onClick={insertAt} style={{ width:'100%' }}>Insert at Index — O(n)</button>
                <div className="ds-info-box">
                  <strong>End:</strong> place at next slot.<br/>
                  <strong>Index:</strong> shift elements right, then insert.
                </div>
              </>
            )}
            {tab === 'Delete' && (
              <>
                <h3>Delete</h3>
                <button className="btn btn-danger" onClick={deleteEnd} style={{ width:'100%' }}>Delete Last — O(1)</button>
                <div className="ds-op-group"><label>Index to delete (0–{arr.length-1})</label>{inp(inputIdx, setInputIdx, `0–${arr.length-1}`)}</div>
                <button className="btn btn-danger" onClick={deleteAt} style={{ width:'100%' }}>Delete at Index — O(n)</button>
                <div className="ds-info-box">
                  <strong>Last:</strong> decrement size.<br/>
                  <strong>Index:</strong> shift elements left.
                </div>
              </>
            )}
            {tab === 'Search' && (
              <>
                <h3>Linear Search</h3>
                <div className="ds-op-group"><label>Value to find</label>{inp(inputVal, setInputVal, 'e.g. 48')}</div>
                <button className="btn btn-primary" onClick={linearSearch} style={{ width:'100%' }}>Search — O(n)</button>
                <div className="ds-info-box">
                  Scans left to right. <strong>Binary search</strong> is O(log n) but needs a sorted array.
                </div>
              </>
            )}
            {tab === 'Update' && (
              <>
                <h3>Update</h3>
                <div className="ds-op-group"><label>Index (0–{arr.length-1})</label>{inp(inputIdx, setInputIdx, `0–${arr.length-1}`)}</div>
                <div className="ds-op-group"><label>New Value</label>{inp(inputVal, setInputVal, 'new value')}</div>
                <button className="btn btn-primary" onClick={updateAt} style={{ width:'100%' }}>Update arr[i] — O(1)</button>
                <div className="ds-info-box">
                  <code>arr[i] = newVal</code> — direct address, no traversal. Always O(1).
                </div>
              </>
            )}
            {tab === '2D Array' && (
              <>
                <h3>2D Array</h3>
                <div className="ds-info-box">
                  Also called a <strong>matrix</strong>.<br/><br/>
                  <code>int m[rows][cols]</code><br/><br/>
                  <strong>Access:</strong> O(1)<br/>
                  <strong>Memory:</strong> rows × cols × size<br/><br/>
                  Used for: images, grids, DP tables, adjacency matrices.
                </div>
              </>
            )}
            <button className="btn btn-secondary" onClick={resetArr} style={{ width:'100%', marginTop:'auto' }}>↺ Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
