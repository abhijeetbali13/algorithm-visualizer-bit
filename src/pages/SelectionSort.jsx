import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import CodePanel from '../components/CodePanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import LearningPanel from '../components/LearningPanel';
import QuizPanel from '../components/QuizPanel';
import { useApp } from '../context/AppContext';
import { getAlgoMeta } from '../data/algoMeta';

const PSEUDO = [
  'procedure selectionSort(A, n):',
  '  for i = 0 to n-2:',
  '    minIdx = i',
  '    for j = i+1 to n-1:',
  '      if A[j] < A[minIdx]:',
  '        minIdx = j',
  '    if minIdx ≠ i:',
  '      swap(A[i], A[minIdx])',
  '  return A',
];
const JAVA = [
  'public static void selectionSort(int[] a) {',
  '  int n = a.length;',
  '  for (int i = 0; i < n-1; i++) {',
  '    int minIdx = i;',
  '    for (int j = i+1; j < n; j++) {',
  '      if (a[j] < a[minIdx])',
  '        minIdx = j;',
  '    }',
  '    if (minIdx != i) {',
  '      int tmp = a[i];',
  '      a[i] = a[minIdx];',
  '      a[minIdx] = tmp;',
  '    }',
  '  }',
  '}',
];

function rnd(n=16){ return Array.from({length:n},()=>Math.floor(Math.random()*85)+10); }

function generateSteps(arr) {
  const a=[...arr], n=a.length, steps=[];
  let cmps=0, swaps=0;
  steps.push({arr:[...a],cur:-1,minIdx:-1,comparing:-1,sortedUpto:-1,swapPair:null,cmps,swaps,pl:0,jl:0,msg:'Starting Selection Sort'});
  for(let i=0;i<n-1;i++){
    let minIdx=i;
    steps.push({arr:[...a],cur:i,minIdx,comparing:-1,sortedUpto:i-1,swapPair:null,cmps,swaps,pl:2,jl:3,msg:`Pass ${i+1}: min starts at a[${i}]=${a[i]}`});
    for(let j=i+1;j<n;j++){
      cmps++;
      steps.push({arr:[...a],cur:i,minIdx,comparing:j,sortedUpto:i-1,swapPair:null,cmps,swaps,pl:4,jl:5,msg:`Compare a[${j}]=${a[j]} with min a[${minIdx}]=${a[minIdx]}`});
      if(a[j]<a[minIdx]){ minIdx=j; steps.push({arr:[...a],cur:i,minIdx,comparing:j,sortedUpto:i-1,swapPair:null,cmps,swaps,pl:5,jl:6,msg:`New min: a[${j}]=${a[j]}`}); }
    }
    if(minIdx!==i){
      swaps++;
      steps.push({arr:[...a],cur:i,minIdx,comparing:-1,sortedUpto:i-1,swapPair:[i,minIdx],cmps,swaps,pl:7,jl:9,msg:`Swap a[${i}]=${a[i]} ↔ a[${minIdx}]=${a[minIdx]}`});
      [a[i],a[minIdx]]=[a[minIdx],a[i]];
      steps.push({arr:[...a],cur:-1,minIdx:-1,comparing:-1,sortedUpto:i,swapPair:null,cmps,swaps,pl:7,jl:11,msg:`a[${i}]=${a[i]} placed correctly`});
    } else {
      steps.push({arr:[...a],cur:-1,minIdx:-1,comparing:-1,sortedUpto:i,swapPair:null,cmps,swaps,pl:6,jl:8,msg:`a[${i}]=${a[i]} already minimum, no swap`});
    }
  }
  steps.push({arr:[...a],cur:-1,minIdx:-1,comparing:-1,sortedUpto:n-1,swapPair:null,cmps,swaps,pl:8,jl:14,msg:`✓ Sorted! ${cmps} comparisons, ${swaps} swaps`});
  return steps;
}

const META = getAlgoMeta('selection-sort');
const TABS = ['Visualizer','Pseudocode','Java Code','Analytics','Learn','Quiz'];

export default function SelectionSort() {
  const arrRef=useRef(rnd()); const [,setK]=useState(0);
  const [inp,setInp]=useState(''); const [err,setErr]=useState('');
  const [tab,setTab]=useState('Visualizer');
  const {markVisited}=useApp();
  const viz=useVisualizer(()=>{ markVisited('selection-sort'); return generateSteps(arrRef.current); });
  const {current,steps,stepIdx,running,speed,setSpeed,start,pause,prev,next,reset,jumpTo}=viz;

  const generate=()=>{ viz.reset(); arrRef.current=rnd(); setInp(''); setErr(''); setK(k=>k+1); };
  const applyCustom=()=>{
    const nums=inp.split(',').map(s=>Number(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=999);
    if(nums.length<2){setErr('Enter at least 2 numbers (1–999)');return;}
    if(nums.length>24){setErr('Max 24');return;}
    setErr(''); viz.reset(); arrRef.current=nums; setK(k=>k+1);
  };

  const displayArr=current?current.arr:[];
  const maxVal=Math.max(...displayArr,1);
  const getColor=(i)=>{
    if(!current) return '#1e3a5f';
    const {cur,minIdx,comparing,sortedUpto,swapPair}=current;
    if(swapPair?.includes(i)) return 'var(--red)';
    if(i===minIdx) return 'var(--accent)';
    if(i===comparing) return 'var(--yellow)';
    if(sortedUpto>=i) return 'var(--green)';
    if(i===cur) return 'var(--orange)';
    return '#1e3a5f';
  };

  const controls=(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
        onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
        onGenerate={generate} speed={speed} onSpeedChange={setSpeed} onJumpTo={jumpTo}/>
      <div className="controls-panel">
        <h3>Complexity</h3>
        <div className="info-grid">
          {[['Best','O(n²)'],['Worst','O(n²)'],['Space','O(1)'],['Stable','No'],['Swaps','≤ n−1'],['In-place','Yes']].map(([l,v])=>(
            <div key={l} className="info-chip"><div className="label">{l}</div><div className="value">{v}</div></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="algo-page"><div className="page-wrapper">
      <div className="algo-header">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <span style={{background:'rgba(0,212,255,0.1)',border:'1px solid var(--accent)',color:'var(--accent)',padding:'2px 10px',borderRadius:20,fontSize:11,fontFamily:'JetBrains Mono'}}>Sorting</span>
          <span style={{fontSize:12,color:'var(--muted)',fontFamily:'JetBrains Mono'}}>O(n²) · Not Stable · ≤n−1 Swaps</span>
        </div>
        <h1>Selection Sort</h1>
        <p>Each pass scans the unsorted portion to find the minimum, then swaps it into position. Always exactly n−1 passes — but never more than n−1 swaps total.</p>
      </div>

      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',marginBottom:24,overflowX:'auto'}}>
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:'10px 18px',fontSize:13,fontWeight:tab===t?600:400,background:'none',border:'none',borderBottom:`2px solid ${tab===t?'var(--accent)':'transparent'}`,color:tab===t?'var(--accent)':'var(--muted)',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>{t}</button>)}
      </div>

      {tab==='Visualizer'&&<div className="algo-layout">
        <div>
          <div className="controls-panel" style={{marginBottom:14}}>
            <h3>Custom Array</h3>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&applyCustom()} placeholder="e.g. 45,12,67,3,90,23" disabled={running} style={{flex:1,minWidth:180,padding:'7px 10px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text)',fontFamily:'JetBrains Mono',fontSize:13}}/>
              <button className="btn btn-primary" onClick={applyCustom} disabled={running} style={{padding:'7px 16px'}}>Apply</button>
            </div>
            {err&&<div style={{color:'var(--red)',fontSize:12,marginTop:6}}>{err}</div>}
          </div>
          <div className="status-bar">{current?current.msg:'Press ▶ Start or step through'}</div>
          <div className="viz-canvas" style={{gap:3,alignItems:'flex-end',padding:'24px 12px',minHeight:280}}>
            {displayArr.map((val,i)=>{const col=getColor(i); return(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                <span style={{fontFamily:'JetBrains Mono',fontSize:10,color:col==='#1e3a5f'?'var(--muted)':col}}>{val}</span>
                <div style={{width:'100%',height:`${(val/maxVal)*230}px`,minHeight:4,background:col,borderRadius:'3px 3px 0 0',transition:'height 0.08s,background 0.12s',boxShadow:col!=='#1e3a5f'?`0 0 8px ${col}55`:''}}/>
              </div>
            );})}
          </div>
          <div style={{display:'flex',gap:14,marginTop:10,flexWrap:'wrap'}}>
            {[['#1e3a5f','Unsorted'],['var(--orange)','Pass start (i)'],['var(--accent)','Current min'],['var(--yellow)','Comparing'],['var(--red)','Swapping'],['var(--green)','Sorted']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}><div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}</div>
            ))}
          </div>
        </div>
        {controls}
      </div>}

      {tab==='Pseudocode'&&<div className="algo-layout">
        <div><div className="status-bar" style={{marginBottom:14}}>{current?current.msg:'Run the visualizer to see active line'}</div><CodePanel lines={PSEUDO} activeLine={current?.pl??-1} language="pseudo"/></div>
        {controls}
      </div>}

      {tab==='Java Code'&&<div className="algo-layout">
        <div><div className="status-bar" style={{marginBottom:14}}>{current?current.msg:'Run the visualizer to see active Java line'}</div><CodePanel lines={JAVA} activeLine={current?.jl??-1} language="java"/></div>
        {controls}
      </div>}

      {tab==='Analytics'&&<div className="algo-layout">
        <div><AnalyticsPanel steps={steps} stepIdx={stepIdx}/></div>
        {controls}
      </div>}

      {tab==='Learn'&&<div style={{maxWidth:760}}><LearningPanel data={META?.learning}/></div>}
      {tab==='Quiz'&&<div style={{maxWidth:680}}><div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:20}}>Test your knowledge</div><QuizPanel algoId="selection-sort" questions={META?.quiz||[]}/></div>}
    </div></div>
  );
}
