import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const PRESETS = [
  { name:'Classic', items:[{name:'Book',weight:2,value:3},{name:'Laptop',weight:3,value:4},{name:'Phone',weight:4,value:5},{name:'Watch',weight:5,value:8},{name:'Camera',weight:9,value:10}], capacity:10 },
  { name:'Small',   items:[{name:'A',weight:1,value:1},{name:'B',weight:3,value:4},{name:'C',weight:4,value:5},{name:'D',weight:5,value:7}], capacity:8 },
];

function dpSteps(items, W) {
  const n = items.length;
  const dp = Array.from({length:n+1},()=>Array(W+1).fill(0));
  const steps = [];
  steps.push({ dp:dp.map(r=>[...r]), cell:null, selected:null, msg:'DP table initialized with zeros' });
  for (let i=1;i<=n;i++) {
    for (let w=0;w<=W;w++) {
      if (items[i-1].weight > w) {
        dp[i][w] = dp[i-1][w];
        steps.push({ dp:dp.map(r=>[...r]), cell:[i,w], selected:null, msg:`"${items[i-1].name}" (wt=${items[i-1].weight}) > w=${w} → skip → dp[${i}][${w}]=${dp[i][w]}` });
      } else {
        const take = dp[i-1][w-items[i-1].weight]+items[i-1].value;
        const skip = dp[i-1][w];
        dp[i][w] = Math.max(take,skip);
        steps.push({ dp:dp.map(r=>[...r]), cell:[i,w], selected:null, msg:`"${items[i-1].name}": take(${take}) vs skip(${skip}) → dp[${i}][${w}]=${dp[i][w]}` });
      }
    }
  }
  const sel=[];
  let i=n,w=W;
  while(i>0&&w>0){if(dp[i][w]!==dp[i-1][w]){sel.push(i-1);w-=items[i-1].weight;}i--;}
  steps.push({ dp:dp.map(r=>[...r]), cell:null, selected:sel, msg:`✓ Max value = ${dp[n][W]}. Selected: ${sel.map(s=>items[s].name).join(', ')}` });
  return steps;
}

function naiveSteps(items, W) {
  const n = items.length;
  const total = 1 << n;
  const steps = [];
  let bestVal=0, bestMask=0;
  steps.push({ mask:-1, bestMask:0, bestVal:0, chosen:[], wt:0, val:0, valid:true, msg:`Brute force: check all 2^${n} = ${total} subsets` });
  for (let mask=0;mask<total;mask++) {
    let wt=0,val=0;
    const chosen=[];
    for (let b=0;b<n;b++){if(mask>>b&1){wt+=items[b].weight;val+=items[b].value;chosen.push(b);}}
    const valid=wt<=W, better=valid&&val>bestVal;
    if(better){bestVal=val;bestMask=mask;}
    steps.push({ mask, bestMask, bestVal, chosen, wt, val, valid, better, msg: valid?(better?`Subset {${chosen.map(b=>items[b].name).join(',')}} wt=${wt} val=${val} → NEW BEST ✓`:`{${chosen.length?chosen.map(b=>items[b].name).join(','):'∅'}} wt=${wt} val=${val}`): `{${chosen.length?chosen.map(b=>items[b].name).join(','):'∅'}} wt=${wt} > cap ${W} ✗` });
  }
  steps.push({ mask:-1, bestMask, bestVal, done:true, msg:`✓ Best value=${bestVal}, items={${Array.from({length:n},(_,b)=>bestMask>>b&1?items[b].name:null).filter(Boolean).join(', ')}}` });
  return steps;
}

export default function Knapsack() {
  const [preset, setPreset] = useState(0);
  const [mode, setMode] = useState('dp');
  const [customSet, setCustomSet] = useState(null); // { name, items, capacity } | null
  const [itemsInput, setItemsInput] = useState('');
  const [capacityInput, setCapacityInput] = useState('');
  const [inputError, setInputError] = useState('');

  const modeRef = useRef('dp');
  const presetRef = useRef(0);
  const customRef = useRef(null);

  const allSets = customSet ? [...PRESETS, customSet] : PRESETS;
  const { items, capacity } = allSets[preset];

  const viz = useVisualizer(() => {
    const set = customRef.current && presetRef.current === PRESETS.length ? customRef.current : PRESETS[presetRef.current];
    return modeRef.current === 'dp' ? dpSteps(set.items, set.capacity) : naiveSteps(set.items, set.capacity);
  });
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const switchMode = m => { modeRef.current = m; viz.reset(); setMode(m); };
  const switchPreset = p => { presetRef.current = p; viz.reset(); setPreset(p); };

  // Parse format: "Book:2:3, Laptop:3:4, Phone:4:5" name:weight:value, plus capacity
  const applyCustom = () => {
    const tokens = itemsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const cap = Number(capacityInput.trim());

    if (tokens.length === 0) {
      setInputError('Enter at least one item, e.g. Book:2:3, Laptop:3:4');
      return;
    }
    if (tokens.length > 15) {
      setInputError('Please enter 15 items or fewer (brute force is 2ⁿ).');
      return;
    }
    if (!Number.isFinite(cap) || cap < 1 || cap > 50) {
      setInputError('Capacity must be a number between 1 and 50.');
      return;
    }

    const items = [];
    for (const tok of tokens) {
      const parts = tok.split(':').map(s => s.trim());
      if (parts.length !== 3) {
        setInputError(`"${tok}" is invalid. Use format Name:Weight:Value, e.g. Book:2:3`);
        return;
      }
      const [name, wStr, vStr] = parts;
      const weight = Number(wStr), value = Number(vStr);
      if (!name) {
        setInputError(`Item "${tok}" needs a name.`);
        return;
      }
      if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(weight)) {
        setInputError(`Item "${name}": weight must be a positive integer.`);
        return;
      }
      if (!Number.isFinite(value) || value <= 0) {
        setInputError(`Item "${name}": value must be a positive number.`);
        return;
      }
      if (weight > cap) {
        setInputError(`Item "${name}": weight (${weight}) exceeds capacity (${cap}).`);
        return;
      }
      items.push({ name, weight: Math.round(weight), value: Math.round(value * 100) / 100 });
    }

    setInputError('');
    viz.reset();
    const newSet = { name: 'Custom', items, capacity: Math.round(cap) };
    setCustomSet(newSet);
    customRef.current = newSet;
    presetRef.current = PRESETS.length;
    setPreset(PRESETS.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') applyCustom();
  };

  const dp = current?.dp || null;
  const activeCell = current?.cell || null;
  const selected = current?.selected || null;
  const n = items.length;
  const mask = current?.mask ?? -1;
  const chosen = current?.chosen || [];
  const bestMask = current?.bestMask ?? 0;

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>0/1 Knapsack</h1>
          <p>Maximize value within weight capacity. Compare DP (O(nW)) vs naive brute-force (O(2ⁿ)) that tries every possible subset.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[['dp','Dynamic Programming'],['naive','Naive / Brute Force']].map(([m,label])=>(
                <button key={m} onClick={()=>switchMode(m)} className="btn btn-secondary"
                  style={{ flex:1, background:mode===m?'rgba(0,212,255,0.1)':'', borderColor:mode===m?'var(--accent)':'', color:mode===m?'var(--accent)':'' }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="status-bar">{current ? current.msg : 'Select mode and press ▶ Start'}</div>

            {/* Items */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:16 }}>
              <div className="section-label">Items — capacity = {capacity}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {items.map((item,i) => {
                  const isSelected = mode==='dp' ? selected?.includes(i) : (mask>=0&&(mask>>i&1));
                  const isBest = mode==='naive'&&(bestMask>>i&1)&&current?.done;
                  const hl = isSelected||isBest;
                  return (
                    <div key={i} style={{ background:hl?'rgba(34,197,94,0.1)':'var(--surface2)', border:`1px solid ${hl?'var(--green)':'var(--border)'}`, borderRadius:8, padding:'10px 14px', minWidth:72, transition:'all 0.25s' }}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color:hl?'var(--green)':'var(--text)' }}>{item.name}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>wt {item.weight}</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>val {item.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DP Table */}
            {mode==='dp' && (
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, overflowX:'auto' }}>
                <div className="section-label">dp[item][weight] — fills left-to-right, top-to-bottom</div>
                {dp ? (
                  <table style={{ borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:12 }}>
                    <thead>
                      <tr>
                        <th style={{ padding:'5px 10px', color:'var(--muted)', minWidth:50 }}>i \ w</th>
                        {Array.from({length:capacity+1},(_,w)=><th key={w} style={{ padding:'5px 10px', color:'var(--muted)', minWidth:34, textAlign:'center' }}>{w}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {dp.map((row,i)=>(
                        <tr key={i}>
                          <td style={{ padding:'4px 10px', color:'var(--accent)', fontWeight:700 }}>{i===0?'∅':items[i-1].name}</td>
                          {row.map((val,w)=>{
                            const isAct=activeCell&&activeCell[0]===i&&activeCell[1]===w;
                            return (
                              <td key={w} style={{ padding:'4px 8px', textAlign:'center', background:isAct?'rgba(234,179,8,0.25)':'transparent', color:isAct?'var(--yellow)':val===0?'var(--muted)':'var(--text)', fontWeight:isAct?700:400, border:isAct?'2px solid var(--yellow)':'2px solid transparent', borderRadius:4, transition:'all 0.15s', minWidth:34 }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div style={{ color:'var(--muted)', fontSize:13, padding:'20px 0', textAlign:'center' }}>Table builds during visualization →</div>}
              </div>
            )}

            {/* Naive panel */}
            {mode==='naive' && (
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16 }}>
                <div className="section-label">Current subset evaluation</div>
                {mask>=0 ? (
                  <div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                      <div className="info-chip"><div className="label">Subset #{mask}</div><div className="value">{mask.toString(2).padStart(n,'0')}</div></div>
                      <div className="info-chip"><div className="label">Chosen</div><div className="value">{chosen.length?chosen.map(b=>items[b].name).join(','):'∅'}</div></div>
                      <div className="info-chip"><div className="label">Weight</div><div className="value" style={{ color:current?.valid?'var(--green)':'var(--red)' }}>{current?.wt}/{capacity}</div></div>
                      <div className="info-chip"><div className="label">Value</div><div className="value">{current?.val}</div></div>
                      <div className="info-chip"><div className="label">Best so far</div><div className="value" style={{ color:'var(--accent)' }}>{current?.bestVal}</div></div>
                    </div>
                    {current?.better && <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid var(--green)', borderRadius:6, padding:'6px 12px', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--green)', marginBottom:8 }}>🏆 New best!</div>}
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>Progress: {mask+1} / {1<<n} subsets</div>
                    <div style={{ height:8, background:'var(--surface2)', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${((mask+1)/(1<<n))*100}%`, background:'var(--accent)', borderRadius:4, transition:'width 0.1s' }}/>
                    </div>
                  </div>
                ) : <div style={{ color:'var(--muted)', fontSize:13, padding:'16px 0', textAlign:'center' }}>Subset evaluations appear here →</div>}
              </div>
            )}

            {/* Custom items input */}
            <div className="controls-panel" style={{ marginTop: 16 }}>
              <h3>Custom Items</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <input
                  type="text"
                  value={itemsInput}
                  onChange={(e) => setItemsInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Items as Name:Weight:Value, e.g. Book:2:3, Laptop:3:4"
                  disabled={running}
                  style={{
                    flex: 3,
                    minWidth: 240,
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
                  value={capacityInput}
                  onChange={(e) => setCapacityInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Capacity"
                  disabled={running}
                  style={{
                    flex: 1,
                    minWidth: 90,
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
                Up to 15 items as Name:Weight:Value (positive integers/numbers, weight ≤ capacity). Capacity 1–50. Press Apply or Enter.
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Preset</h3>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {allSets.map((p,i)=>(
                  <button key={i} onClick={()=>switchPreset(i)} className="btn btn-secondary"
                    style={{ flex:'1 1 auto', fontSize:12, background:preset===i?'rgba(0,212,255,0.1)':'', borderColor:preset===i?'var(--accent)':'', color:preset===i?'var(--accent)':'' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">DP Time</div><div className="value">O(n·W)</div></div>
                <div className="info-chip"><div className="label">DP Space</div><div className="value">O(n·W)</div></div>
                <div className="info-chip"><div className="label">Naive Time</div><div className="value">O(2ⁿ)</div></div>
                <div className="info-chip"><div className="label">Naive Space</div><div className="value">O(n)</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              {mode==='dp'?(
                <div className="pseudocode"><span className="kw">for</span> i=1 to n:{'\n'}{'  '}<span className="kw">for</span> w=0 to W:{'\n'}{'    '}<span className="kw">if</span> wt[i]&gt;w:{'\n'}{'      '}dp[i][w]=dp[i-1][w]{'\n'}{'    '}<span className="kw">else</span>:{'\n'}{'      '}dp[i][w]=max({'\n'}{'        '}dp[i-1][w],{'\n'}{'        '}dp[i-1][w-wt[i]]+val[i]){'\n'}<span className="cm">// answer: dp[n][W]</span></div>
              ):(
                <div className="pseudocode">best=0{'\n'}<span className="kw">for</span> mask=0 to 2^n-1:{'\n'}{'  '}wt=val=0{'\n'}{'  '}<span className="kw">for</span> b=0 to n-1:{'\n'}{'    '}<span className="kw">if</span> mask has bit b:{'\n'}{'      '}wt+=wt[b]; val+=val[b]{'\n'}{'  '}<span className="kw">if</span> wt≤W <span className="kw">and</span> val&gt;best:{'\n'}{'    '}best=val</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
