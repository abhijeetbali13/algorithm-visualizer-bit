import { useState, useRef, useEffect } from 'react';
import { INPUT_PRESETS, applyPreset, parseCustomArray } from '../utils/arrayPresets';

function rnd(n = 20) { return Array.from({ length: n }, () => Math.floor(Math.random() * 85) + 10); }

function genBubble(arr) {
  const a=[...arr],n=a.length,steps=[];let cmps=0,swaps=0;
  steps.push({arr:[...a],hi:n,c:null,sp:null,cmps,swaps,msg:'Ready'});
  for(let i=0;i<n-1;i++){
    for(let j=0;j<n-i-1;j++){
      cmps++;
      steps.push({arr:[...a],hi:n-i,c:[j,j+1],sp:null,cmps,swaps,msg:`Compare [${j}]=${a[j]} & [${j+1}]=${a[j+1]}`});
      if(a[j]>a[j+1]){swaps++;[a[j],a[j+1]]=[a[j+1],a[j]];steps.push({arr:[...a],hi:n-i,c:null,sp:[j,j+1],cmps,swaps,msg:`Swap`});}
    }
  }
  steps.push({arr:[...a],hi:0,c:null,sp:null,cmps,swaps,msg:'Done ✓',done:true});return steps;
}
function genSelection(arr) {
  const a=[...arr],n=a.length,steps=[];let cmps=0,swaps=0;
  steps.push({arr:[...a],sorted:-1,min:-1,cj:-1,sp:null,cmps,swaps,msg:'Ready'});
  for(let i=0;i<n-1;i++){
    let mi=i;
    for(let j=i+1;j<n;j++){cmps++;steps.push({arr:[...a],sorted:i-1,min:mi,cj:j,sp:null,cmps,swaps,msg:`[${j}]=${a[j]} vs min ${a[mi]}`});if(a[j]<a[mi])mi=j;}
    if(mi!==i){swaps++;steps.push({arr:[...a],sorted:i-1,min:mi,cj:-1,sp:[i,mi],cmps,swaps,msg:`Swap ${a[i]}↔${a[mi]}`});[a[i],a[mi]]=[a[mi],a[i]];}
    steps.push({arr:[...a],sorted:i,min:-1,cj:-1,sp:null,cmps,swaps,msg:`a[${i}]=${a[i]} placed`});
  }
  steps.push({arr:[...a],sorted:n-1,min:-1,cj:-1,sp:null,cmps,swaps,msg:'Done ✓',done:true});return steps;
}
function genInsertion(arr) {
  const a=[...arr],n=a.length,steps=[];let cmps=0,swaps=0;
  steps.push({arr:[...a],si:0,key:-1,cj:-1,cmps,swaps,msg:'Ready'});
  for(let i=1;i<n;i++){
    const kv=a[i];let j=i-1;
    steps.push({arr:[...a],si:i-1,key:i,cj:-1,cmps,swaps,msg:`Key=${kv}`});
    while(j>=0&&a[j]>kv){cmps++;swaps++;steps.push({arr:[...a],si:i-1,key:i,cj:j,cmps,swaps,msg:`Shift ${a[j]}`});a[j+1]=a[j];j--;}
    a[j+1]=kv;steps.push({arr:[...a],si:i,key:-1,cj:-1,cmps,swaps,msg:`Insert ${kv} at ${j+1}`});
  }
  steps.push({arr:[...a],si:n-1,key:-1,cj:-1,cmps,swaps,msg:'Done ✓',done:true});return steps;
}
function genQuick(arr) {
  const a=[...arr],steps=[],sorted=new Set();let cmps=0,swaps=0;
  function part(lo,hi){
    const pv=a[hi];let i=lo-1;
    steps.push({arr:[...a],piv:hi,lo,hi,pi:i,pj:lo,sp:null,sorted:[...sorted],cmps,swaps,msg:`Partition [${lo}..${hi}] pivot=${pv}`});
    for(let j=lo;j<hi;j++){cmps++;steps.push({arr:[...a],piv:hi,lo,hi,pi:i,pj:j,sp:null,sorted:[...sorted],cmps,swaps,msg:`${a[j]}≤${pv}?`});
      if(a[j]<=pv){i++;if(i!==j){swaps++;steps.push({arr:[...a],piv:hi,lo,hi,pi:i,pj:j,sp:[i,j],sorted:[...sorted],cmps,swaps,msg:`Swap`});[a[i],a[j]]=[a[j],a[i]];}}}
    const pp=i+1;swaps++;[a[pp],a[hi]]=[a[hi],a[pp]];sorted.add(pp);
    steps.push({arr:[...a],piv:pp,lo,hi,pi:pp,pj:pp,sp:null,sorted:[...sorted],cmps,swaps,msg:`Pivot ${a[pp]} at final pos ${pp}`});
    return pp;
  }
  function qs(lo,hi){if(lo>=hi){if(lo===hi)sorted.add(lo);return;}const p=part(lo,hi);qs(lo,p-1);qs(p+1,hi);}
  steps.push({arr:[...a],piv:-1,lo:0,hi:arr.length-1,pi:-1,pj:-1,sp:null,sorted:[...sorted],cmps,swaps,msg:'Ready'});
  qs(0,a.length-1);
  steps.push({arr:[...a],piv:-1,lo:0,hi:a.length-1,pi:-1,pj:-1,sp:null,sorted:Array.from({length:a.length},(_,k)=>k),cmps,swaps,msg:'Done ✓',done:true});
  return steps;
}

const ALGOS = {
  bubble:    { label:'Bubble Sort',    gen:genBubble,    cx:{best:'O(n)',avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'Yes'} },
  selection: { label:'Selection Sort', gen:genSelection, cx:{best:'O(n²)',avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'No'} },
  insertion: { label:'Insertion Sort', gen:genInsertion, cx:{best:'O(n)',avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'Yes'} },
  quick:     { label:'Quick Sort',     gen:genQuick,     cx:{best:'O(n log n)',avg:'O(n log n)',worst:'O(n²)',space:'O(log n)',stable:'No'} },
};

function getColor(id, i, s) {
  if (!s) return '#1e3a5f';
  if (s.done) return 'var(--green)';
  if (id==='bubble'){
    if(s.sp?.includes(i)) return 'var(--red)';
    if(s.c?.includes(i)) return 'var(--yellow)';
    if(s.hi!==undefined&&i>=s.hi) return 'var(--green)';
    return '#1e3a5f';
  }
  if (id==='selection'){
    if(s.sp?.includes(i)) return 'var(--red)';
    if(i===s.min) return 'var(--accent)';
    if(i===s.cj) return 'var(--yellow)';
    if(s.sorted>=i) return 'var(--green)';
    return '#1e3a5f';
  }
  if (id==='insertion'){
    if(i===s.key) return '#f97316';
    if(i===s.cj) return 'var(--yellow)';
    if(s.si>=i&&i!==s.key) return 'var(--green)';
    return '#1e3a5f';
  }
  if (id==='quick'){
    if(s.sorted?.includes(i)) return 'var(--green)';
    if(s.sp?.includes(i)) return 'var(--red)';
    if(i===s.piv) return '#f97316';
    if(i===s.pi) return 'var(--accent)';
    if(i===s.pj) return 'var(--yellow)';
    if(s.lo>=0&&i>=s.lo&&i<=s.hi) return '#1e4a6a';
    return '#141e2e';
  }
  return '#1e3a5f';
}

function SortViz({ arr, step, algoId, label, color }) {
  const max = Math.max(...arr, 1);
  return (
    <div>
      <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, marginBottom:8, color }}>
        {label}
      </div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 8px 0', display:'flex', alignItems:'flex-end', gap:2, height:190, overflow:'hidden' }}>
        {arr.map((v,i) => {
          const col = getColor(algoId, i, step);
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0, height:'100%', justifyContent:'flex-end', paddingBottom:4 }}>
              <div style={{ width:'100%', height:`${(v/max)*155}px`, minHeight:3, background:col, borderRadius:'2px 2px 0 0', transition:'height 0.06s, background 0.1s' }} />
              <div style={{ fontSize:8, color: col==='#1e3a5f'||col==='#141e2e'?'transparent':col, fontFamily:'JetBrains Mono', marginTop:1 }}>{v}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
        {step && [['Comparisons', step.cmps], ['Swaps', step.swaps]].map(([l,v]) => (
          <div key={l} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px' }}>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>{l}: </span>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color }}>{v}</span>
          </div>
        ))}
      </div>
      {step && (
        <div style={{ marginTop:6, fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', minHeight:28, padding:'4px 8px', background:'var(--surface2)', borderRadius:6 }}>{step.msg}</div>
      )}
    </div>
  );
}

const COLORS = { bubble:'#38bdf8', selection:'#f97316', insertion:'#a78bfa', quick:'#f43f5e' };

export default function Compare() {
  const [algo1, setAlgo1] = useState('bubble');
  const [algo2, setAlgo2] = useState('quick');
  const [arr, setArr]     = useState(() => rnd());
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');
  const [steps1, setSteps1] = useState([]);
  const [steps2, setSteps2] = useState([]);
  const [idx1, setIdx1]   = useState(-1);
  const [idx2, setIdx2]   = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(220);
  const [winner, setWinner] = useState(null);
  const [finished1, setFinished1] = useState(false);
  const [finished2, setFinished2] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(null);
  const timerRef = useRef(null);

  const hardReset = () => {
    clearInterval(timerRef.current);
    setRunning(false); setIdx1(-1); setIdx2(-1); setSteps1([]); setSteps2([]);
    setWinner(null); setFinished1(false); setFinished2(false); setElapsedMs(null);
  };
  const newRandom = () => { hardReset(); setCustomInput(''); setCustomError(''); setArr(rnd()); };

  const applyPresetArr = (id) => {
    hardReset();
    const next = applyPreset(id, arr);
    setArr(next);
    setCustomInput(next.join(', '));
    setCustomError('');
  };

  const applyCustom = () => {
    const result = parseCustomArray(customInput, { minLen: 4, maxLen: 28, minVal: 1, maxVal: 999 });
    if (result.error) { setCustomError(result.error); return; }
    setCustomError(''); hardReset(); setArr(result.values);
  };

  const run = () => {
    hardReset();
    setTimeout(() => {
      const s1 = ALGOS[algo1].gen(arr);
      const s2 = ALGOS[algo2].gen(arr);
      setSteps1(s1); setSteps2(s2);
      let i1 = 0, i2 = 0, f1 = false, f2 = false;
      setIdx1(0); setIdx2(0); setRunning(true);
      const t0 = performance.now();
      timerRef.current = setInterval(() => {
        let advanced = false;
        if (i1 < s1.length - 1) { i1++; setIdx1(i1); advanced = true; }
        else if (!f1) { f1 = true; setFinished1(true); }
        if (i2 < s2.length - 1) { i2++; setIdx2(i2); advanced = true; }
        else if (!f2) { f2 = true; setFinished2(true); }
        if (f1 && f2) {
          clearInterval(timerRef.current); setRunning(false);
          setElapsedMs(Math.round(performance.now() - t0));
          const c1 = s1[s1.length-1]?.cmps ?? 0, c2 = s2[s2.length-1]?.cmps ?? 0;
          if (c1 < c2) setWinner(algo1);
          else if (c2 < c1) setWinner(algo2);
          else setWinner('tie');
        }
      }, speed);
    }, 50);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const s1 = steps1[idx1] || null;
  const s2 = steps2[idx2] || null;
  const final1 = steps1[steps1.length-1];
  const final2 = steps2[steps2.length-1];

  const sel = (val, setter, label) => (
    <div>
      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:5, fontFamily:'JetBrains Mono' }}>{label}</div>
      <select value={val} onChange={e => { hardReset(); setter(e.target.value); }}
        style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'JetBrains Mono', fontSize:13, width:'100%' }}>
        {Object.entries(ALGOS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Side-by-Side Comparison</h1>
          <p>Pick two sorting algorithms, load your own array or use random, then watch them race. See exactly which one makes fewer comparisons and swaps on the same input.</p>
        </div>

        {/* Setup row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16, alignItems:'end' }}>
          {sel(algo1, setAlgo1, 'Algorithm 1')}
          {sel(algo2, setAlgo2, 'Algorithm 2')}
          <div>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:5, fontFamily:'JetBrains Mono' }}>Custom array (optional)</div>
            <div style={{ display:'flex', gap:6 }}>
              <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && applyCustom()}
                placeholder="e.g. 45,12,67,3" style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'JetBrains Mono', fontSize:12 }} />
              <button className="btn btn-secondary" onClick={applyCustom} style={{ padding:'8px 12px', flexShrink:0 }}>Set</button>
            </div>
            {customError && <div style={{ color:'var(--red)', fontSize:11, marginTop:4 }}>{customError}</div>}
          </div>
        </div>

        {/* Input presets */}
        <div className="input-preset-grid" style={{ marginBottom: 16 }}>
          {INPUT_PRESETS.map(p => (
            <button key={p.id} type="button" className="input-preset-btn" onClick={() => applyPresetArr(p.id)} disabled={running}>
              <span className="input-preset-icon">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
          <button className="btn btn-primary" onClick={run} disabled={running} style={{ padding:'9px 24px', fontSize:14 }}>
            {running ? '⏳ Running...' : '▶ Run Race'}
          </button>
          <button className="btn btn-secondary" onClick={hardReset} disabled={running}>↺ Reset</button>
          <button className="btn btn-secondary" onClick={newRandom} disabled={running}>⟳ New Random Array</button>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <span style={{ fontSize:12, color:'var(--muted)', fontFamily:'JetBrains Mono' }}>Speed:</span>
            <input type="range" min={50} max={600} step={50} value={speed}
              onChange={e => setSpeed(Number(e.target.value))} disabled={running}
              style={{ accentColor:'var(--accent)', width:100 }} />
            <span style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', minWidth:28 }}>
              {speed<=100?'Fast':speed<=350?'Med':'Slow'}
            </span>
          </div>
        </div>

        {/* Current array preview */}
        <div style={{ marginBottom:16, padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8 }}>
          <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>Array ({arr.length} elements): </span>
          <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--text)' }}>[{arr.slice(0,20).join(', ')}{arr.length>20?'…':''}]</span>
        </div>

        {/* Winner banner */}
        {winner && (
          <div style={{ padding:'14px 20px', borderRadius:10, marginBottom:20, textAlign:'center', fontFamily:'JetBrains Mono', fontWeight:700, fontSize:14,
            background: winner==='tie' ? 'rgba(100,116,139,0.12)' : `${COLORS[winner]}18`,
            border: `1.5px solid ${winner==='tie'?'var(--muted)':COLORS[winner]}`,
            color: winner==='tie' ? 'var(--muted)' : COLORS[winner] }}>
            {winner === 'tie'
              ? '🤝 Tie — both made the same number of comparisons on this input.'
              : `🏆 ${ALGOS[winner].label} wins — fewer comparisons on this input!`}
            {elapsedMs != null && <div style={{ fontSize: 12, fontWeight: 500, marginTop: 6, opacity: 0.85 }}>Animation completed in {elapsedMs}ms</div>}
          </div>
        )}

        {/* Side-by-side visualizers */}
        <div className="cmp-grid" style={{ marginBottom:20 }}>
          <SortViz arr={s1?s1.arr:arr} step={s1} algoId={algo1} label={ALGOS[algo1].label} color={COLORS[algo1]} />
          <SortViz arr={s2?s2.arr:arr} step={s2} algoId={algo2} label={ALGOS[algo2].label} color={COLORS[algo2]} />
        </div>

        {/* Final stats table — only when both finished */}
        {final1 && final2 && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.1em', color:'var(--muted)', textTransform:'uppercase', marginBottom:14 }}>Final results — same {arr.length}-element array</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:13 }}>
              <thead>
                <tr>
                  <th style={{ padding:'8px 14px', textAlign:'left', color:'var(--muted)', fontWeight:500, borderBottom:'1px solid var(--border)' }}>Metric</th>
                  <th style={{ padding:'8px 14px', textAlign:'center', color:COLORS[algo1], borderBottom:'1px solid var(--border)' }}>{ALGOS[algo1].label}</th>
                  <th style={{ padding:'8px 14px', textAlign:'center', color:COLORS[algo2], borderBottom:'1px solid var(--border)' }}>{ALGOS[algo2].label}</th>
                </tr>
              </thead>
              <tbody>
                {[['Total steps', steps1.length, steps2.length], ['Comparisons', final1.cmps, final2.cmps], ['Swaps / Shifts', final1.swaps, final2.swaps], ['Est. memory (O)', ALGOS[algo1].cx.space, ALGOS[algo2].cx.space], ['Animation time', elapsedMs != null ? `${elapsedMs}ms` : '—', elapsedMs != null ? `${elapsedMs}ms` : '—']].map(([label, v1, v2]) => (
                  <tr key={label} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 14px', color:'var(--muted)' }}>{label}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700, color: v1<=v2 ? 'var(--green)' : 'var(--red)', fontSize:15 }}>{v1}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700, color: v2<=v1 ? 'var(--green)' : 'var(--red)', fontSize:15 }}>{v2}</td>
                  </tr>
                ))}
                {/* Big-O row */}
                {[['Best case', 'best'], ['Average case', 'avg'], ['Worst case', 'worst'], ['Space', 'space'], ['Stable', 'stable']].map(([label, key]) => (
                  <tr key={key} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 14px', color:'var(--muted)' }}>{label}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center', color: key==='stable'&&ALGOS[algo1].cx[key]==='Yes'?'var(--green)':key==='stable'?'var(--red)':'var(--text)', fontFamily:'JetBrains Mono', fontSize:12 }}>{ALGOS[algo1].cx[key]}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center', color: key==='stable'&&ALGOS[algo2].cx[key]==='Yes'?'var(--green)':key==='stable'?'var(--red)':'var(--text)', fontFamily:'JetBrains Mono', fontSize:12 }}>{ALGOS[algo2].cx[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
