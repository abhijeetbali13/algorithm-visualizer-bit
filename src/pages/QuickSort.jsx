import { useState, useRef } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import CodePanel from '../components/CodePanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import LearningPanel from '../components/LearningPanel';
import QuizPanel from '../components/QuizPanel';
import { useApp } from '../context/AppContext';
import { getAlgoMeta } from '../data/algoMeta';

const PSEUDO=[
  'procedure quickSort(A, lo, hi):',
  '  if lo < hi:',
  '    p = partition(A, lo, hi)',
  '    quickSort(A, lo, p-1)',
  '    quickSort(A, p+1, hi)',
  'procedure partition(A, lo, hi):',
  '  pivot = A[hi]',
  '  i = lo - 1',
  '  for j = lo to hi-1:',
  '    if A[j] <= pivot:',
  '      i++; swap(A[i], A[j])',
  '  swap(A[i+1], A[hi])',
  '  return i+1',
];
const JAVA=[
  'static void quickSort(int[] a, int lo, int hi) {',
  '  if (lo < hi) {',
  '    int p = partition(a, lo, hi);',
  '    quickSort(a, lo, p-1);',
  '    quickSort(a, p+1, hi);',
  '  }',
  '}',
  'static int partition(int[] a, int lo, int hi) {',
  '  int pivot = a[hi], i = lo-1;',
  '  for (int j = lo; j < hi; j++) {',
  '    if (a[j] <= pivot) {',
  '      int t=a[++i]; a[i]=a[j]; a[j]=t;',
  '    }',
  '  }',
  '  int t=a[i+1]; a[i+1]=a[hi]; a[hi]=t;',
  '  return i+1;',
  '}',
];

function rnd(n=16){ return Array.from({length:n},()=>Math.floor(Math.random()*85)+10); }

function generateSteps(arr) {
  const a=[...arr], steps=[], sorted=new Set();
  let cmps=0, swaps=0;

  function snap(msg,piv,lo,hi,pi,pj,sp,pl,jl){
    steps.push({arr:[...a],piv,lo,hi,pi,pj,sp:sp||null,sorted:[...sorted],cmps,swaps,pl,jl,msg});
  }
  function partition(lo,hi){
    const pv=a[hi];
    snap(`Partition [${lo}..${hi}] — pivot=a[${hi}]=${pv}`,hi,lo,hi,lo-1,lo,null,6,8);
    let i=lo-1;
    for(let j=lo;j<hi;j++){
      cmps++;
      snap(`a[${j}]=${a[j]} ≤ pivot(${pv})?`,hi,lo,hi,i,j,null,9,10);
      if(a[j]<=pv){
        i++;
        if(i!==j){ swaps++; snap(`Yes → swap a[${i}] ↔ a[${j}]`,hi,lo,hi,i,j,[i,j],10,11); [a[i],a[j]]=[a[j],a[i]]; snap(`Swapped`,hi,lo,hi,i,j,null,10,11); }
        else snap(`Yes, already in place`,hi,lo,hi,i,j,null,10,11);
      } else snap(`No, skip`,hi,lo,hi,i,j,null,8,9);
    }
    const pp=i+1; swaps++;
    snap(`Place pivot at ${pp}`,hi,lo,hi,pp,pp,[pp,hi],11,14);
    [a[pp],a[hi]]=[a[hi],a[pp]];
    sorted.add(pp);
    snap(`Pivot ${a[pp]} final at [${pp}]`,pp,lo,hi,pp,pp,null,12,15);
    return pp;
  }
  function qs(lo,hi){
    if(lo>=hi){ if(lo===hi)sorted.add(lo); return; }
    snap(`quickSort([${lo}..${hi}])`,hi,lo,hi,-1,-1,null,1,1);
    const p=partition(lo,hi);
    qs(lo,p-1); qs(p+1,hi);
  }

  snap('Initial — pivot will be last element of each partition',-1,0,arr.length-1,-1,-1,null,0,0);
  qs(0,a.length-1);
  steps.push({arr:[...a],piv:-1,lo:0,hi:a.length-1,pi:-1,pj:-1,sp:null,sorted:Array.from({length:a.length},(_,k)=>k),cmps,swaps,pl:0,jl:0,msg:`✓ Sorted! ${cmps} comparisons, ${swaps} swaps`});
  return steps;
}

const META = getAlgoMeta('quick-sort');
const TABS = ['Visualizer','Pseudocode','Java Code','Analytics','Learn','Quiz'];

export default function QuickSort() {
  const arrRef=useRef(rnd()); const [,setK]=useState(0);
  const [inp,setInp]=useState(''); const [err,setErr]=useState('');
  const [tab,setTab]=useState('Visualizer');
  const {markVisited}=useApp();
  const viz=useVisualizer(()=>{ markVisited('quick-sort'); return generateSteps(arrRef.current); });
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
    const {piv,lo,hi,pi,pj,sp,sorted}=current;
    if(sorted?.includes(i)) return 'var(--green)';
    if(sp?.includes(i)) return 'var(--red)';
    if(i===piv) return 'var(--orange)';
    if(i===pi) return 'var(--accent)';
    if(i===pj) return 'var(--yellow)';
    if(lo>=0&&i>=lo&&i<=hi) return '#1e4a6a';
    return '#141e2e';
  };

  const controls=(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
        onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
        onGenerate={generate} speed={speed} onSpeedChange={setSpeed} onJumpTo={jumpTo}/>
      {current?.piv>=0&&<div style={{padding:'8px 12px',background:'rgba(249,115,22,0.1)',border:'1px solid var(--orange)',borderRadius:8,fontFamily:'JetBrains Mono',fontSize:12,color:'var(--orange)'}}>
        Pivot: {displayArr[current.piv]} at [{current.piv}] · Range [{current.lo}..{current.hi}]
      </div>}
      <div className="controls-panel">
        <h3>Complexity</h3>
        <div className="info-grid">
          {[['Best','O(n log n)'],['Average','O(n log n)'],['Worst','O(n²)'],['Space','O(log n)'],['Stable','No'],['In-place','Yes']].map(([l,v])=>(
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
          <span style={{fontSize:12,color:'var(--muted)',fontFamily:'JetBrains Mono'}}>O(n log n) avg · O(n²) worst · Not Stable · Lomuto partition</span>
        </div>
        <h1>Quick Sort</h1>
        <p>Choose pivot (last element), partition so all ≤ pivot go left and all &gt; pivot go right, place pivot at its final position, then recursively sort both sides. Fastest in practice for random data.</p>
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
            <div style={{fontSize:11,color:'var(--muted)',marginTop:5}}>Tip: try 1,2,3,4,5,6 (sorted) to see worst-case O(n²) behaviour</div>
          </div>
          <div className="status-bar">{current?current.msg:'Press ▶ Start or step through'}</div>
          <div className="viz-canvas" style={{gap:3,alignItems:'flex-end',padding:'24px 12px',minHeight:280}}>
            {displayArr.map((val,i)=>{const col=getColor(i); return(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                <span style={{fontFamily:'JetBrains Mono',fontSize:10,color:col==='#141e2e'?'transparent':col}}>{val}</span>
                <div style={{width:'100%',height:`${(val/maxVal)*230}px`,minHeight:4,background:col,borderRadius:'3px 3px 0 0',transition:'height 0.08s,background 0.12s',boxShadow:!['#1e3a5f','#141e2e','#1e4a6a'].includes(col)?`0 0 8px ${col}55`:''}}/>
              </div>
            );})}
          </div>
          <div style={{display:'flex',gap:14,marginTop:10,flexWrap:'wrap'}}>
            {[['var(--orange)','Pivot'],['var(--yellow)','j (scanning)'],['var(--accent)','i (boundary)'],['var(--red)','Swapping'],['var(--green)','Sorted'],['#1e4a6a','Active range']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}><div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}</div>
            ))}
          </div>
        </div>
        {controls}
      </div>}

      {tab==='Pseudocode'&&<div className="algo-layout"><div><div className="status-bar" style={{marginBottom:14}}>{current?current.msg:'Run visualizer to see active line'}</div><CodePanel lines={PSEUDO} activeLine={current?.pl??-1} language="pseudo"/></div>{controls}</div>}
      {tab==='Java Code'&&<div className="algo-layout"><div><div className="status-bar" style={{marginBottom:14}}>{current?current.msg:'Run visualizer to see active Java line'}</div><CodePanel lines={JAVA} activeLine={current?.jl??-1} language="java"/></div>{controls}</div>}
      {tab==='Analytics'&&<div className="algo-layout"><div><AnalyticsPanel steps={steps} stepIdx={stepIdx}/></div>{controls}</div>}
      {tab==='Learn'&&<div style={{maxWidth:760}}><LearningPanel data={META?.learning}/></div>}
      {tab==='Quiz'&&<div style={{maxWidth:680}}><div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:20}}>Test your knowledge</div><QuizPanel algoId="quick-sort" questions={META?.quiz||[]}/></div>}
    </div></div>
  );
}
