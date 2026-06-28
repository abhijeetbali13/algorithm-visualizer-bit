import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ALL_ALGOS = [
  {id:'bubble-sort',title:'Bubble Sort',to:'/bubble-sort',cat:'Sorting'},
  {id:'selection-sort',title:'Selection Sort',to:'/selection-sort',cat:'Sorting'},
  {id:'insertion-sort',title:'Insertion Sort',to:'/insertion-sort',cat:'Sorting'},
  {id:'merge-sort',title:'Merge Sort',to:'/merge-sort',cat:'Sorting'},
  {id:'quick-sort',title:'Quick Sort',to:'/quick-sort',cat:'Sorting'},
  {id:'heap-sort',title:'Heap Sort',to:'/heap-sort',cat:'Sorting'},
  {id:'dijkstra',title:"Dijkstra's",to:'/dijkstra',cat:'Graph'},
  {id:'bellman-ford',title:'Bellman-Ford',to:'/bellman-ford',cat:'Graph'},
  {id:'floyd-warshall',title:'Floyd-Warshall',to:'/floyd-warshall',cat:'Graph'},
  {id:'prims',title:"Prim's MST",to:'/prims',cat:'Graph'},
  {id:'kruskal',title:"Kruskal's",to:'/kruskal',cat:'Graph'},
  {id:'knapsack',title:'0/1 Knapsack',to:'/knapsack',cat:'DP'},
  {id:'matrix-chain',title:'Matrix Chain',to:'/matrix-chain',cat:'DP'},
  {id:'lcs',title:'LCS',to:'/lcs',cat:'DP'},
  {id:'n-queens',title:'N-Queens',to:'/n-queens',cat:'BT'},
  {id:'fractional-knapsack',title:'Frac. Knapsack',to:'/fractional-knapsack',cat:'Greedy'},
  {id:'huffman',title:'Huffman Coding',to:'/huffman',cat:'Greedy'},
  {id:'activity-selection',title:'Activity Selection',to:'/activity-selection',cat:'Greedy'},
  {id:'horspool',title:'Horspool',to:'/horspool',cat:'String'},
  {id:'boyer-moore',title:'Boyer-Moore',to:'/boyer-moore',cat:'String'},
];

const ROADMAP = [
  {topic:'Sorting Algorithms',subtopics:['Bubble Sort','Selection Sort','Insertion Sort','Merge Sort','Quick Sort','Heap Sort'],color:'#38bdf8'},
  {topic:'Greedy Algorithms',subtopics:['Fractional Knapsack','Huffman Coding','Activity Selection'],color:'#34d399'},
  {topic:'Dynamic Programming',subtopics:['0/1 Knapsack','Matrix Chain Multiplication','Longest Common Subsequence'],color:'#f97316'},
  {topic:'Graph Algorithms',subtopics:["Dijkstra's","Bellman-Ford","Floyd-Warshall","Prim's MST","Kruskal's MST"],color:'#a78bfa'},
  {topic:'Backtracking',subtopics:['N-Queens','Subset Sum','Graph Coloring'],color:'#f43f5e'},
  {topic:'String Matching',subtopics:['Horspool','Boyer-Moore','KMP Algorithm'],color:'#fbbf24'},
];

const CAT_COLORS = {Sorting:'#38bdf8',Graph:'#a78bfa',DP:'#f97316',Greedy:'#34d399',BT:'#f43f5e',String:'#fbbf24'};

function ProgressRing({pct,color,size=72,stroke=6}) {
  const r = (size-stroke*2)/2;
  const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray 0.6s'}}/>
    </svg>
  );
}

export default function Dashboard() {
  const {visited,favorites,quizScores,roadmap,toggleFav,setRoadmap,visitedCount,avgScore,unlockedAchievements,streak}=useApp();
  const total = ALL_ALGOS.length;
  const visitPct = Math.round(visitedCount/total*100);
  const quizPct  = avgScore;
  const roadmapTotal = ROADMAP.reduce((s,r)=>s+r.subtopics.length,0);
  const roadmapDone  = Object.values(roadmap).filter(Boolean).length;
  const roadmapPct   = Math.round(roadmapDone/roadmapTotal*100);

  const recent = ALL_ALGOS.filter(a=>visited[a.id]).sort((a,b)=>(visited[b.id]||0)-(visited[a.id]||0)).slice(0,6);
  const favAlgos = ALL_ALGOS.filter(a=>favorites.includes(a.id));
  const unvisited = ALL_ALGOS.filter(a => !visited[a.id]);
  const recommended = [
    ...unvisited.filter(a => ['bubble-sort','dijkstra','knapsack','merge-sort'].includes(a.id)),
    ...unvisited.filter(a => !['bubble-sort','dijkstra','knapsack','merge-sort'].includes(a.id)),
  ].slice(0, 6);
  const completedCount = ALL_ALGOS.filter(a => visited[a.id]).length;

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Learning Dashboard</h1>
          <p>Track your progress through the VTU ADA syllabus. Every algorithm you open is recorded automatically.</p>
        </div>

        {/* Progress rings */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:36}}>
          {[
            {label:'Algorithms Completed',value:`${completedCount}/${total}`,pct:visitPct,color:'#a78bfa',sub:`${visitPct}% explored`},
            {label:'Quiz Accuracy',value:`${quizPct}%`,pct:quizPct,color:'#22c55e',sub:`${quizScores.length} quizzes taken`},
            {label:'Syllabus Progress',value:`${roadmapDone}/${roadmapTotal}`,pct:roadmapPct,color:'#f97316',sub:'topics marked done'},
            {label:'Learning Streak',value:`${streak||0} 🔥`,pct:Math.min((streak||0)*10,100),color:'#eab308',sub:'consecutive days active'},
          ].map(({label,value,pct,color,sub})=>(
            <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'20px',display:'flex',alignItems:'center',gap:16}}>
              <div style={{position:'relative',flexShrink:0}}>
                <ProgressRing pct={pct} color={color}/>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'JetBrains Mono',fontSize:13,fontWeight:700,color}}>{pct}%</div>
              </div>
              <div>
                <div style={{fontFamily:'JetBrains Mono',fontSize:20,fontWeight:800,color,marginBottom:2}}>{value}</div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{label}</div>
                <div style={{fontSize:11,color:'var(--muted)'}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:36}}>
          {[
            {to:'/graph-lab',label:'🧪 Graph Lab',c:'#a78bfa'},
            {to:'/compare',label:'⚡ Compare Algos',c:'var(--accent)'},
            {to:'/ai-tutor',label:'🤖 AI Tutor',c:'#a78bfa'},
            {to:'/achievements',label:`🏆 Badges (${unlockedAchievements?.length||0})`,c:'#eab308'},
            {to:'/complexity',label:'📈 Complexity',c:'var(--accent)'},
          ].map(({to,label,c})=>(
            <Link key={to} to={to} style={{padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:500,border:`1px solid ${c}44`,background:`${c}10`,color:c,transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background=`${c}20`}
              onMouseLeave={e=>e.currentTarget.style.background=`${c}10`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Recommended */}
        {recommended.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Recommended Next</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
              {recommended.map(a => (
                <Link key={a.id} to={a.to} className="card" style={{ padding: '14px 16px', textDecoration: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{a.title}</div>
                  <div style={{ fontSize: 10, color: CAT_COLORS[a.cat] || 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{a.cat} · Not started</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recently viewed */}
        {recent.length>0&&(
          <div style={{marginBottom:36}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14}}>Recently Viewed</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:10}}>
              {recent.map(a=>(
                <Link key={a.id} to={a.to} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,transition:'border-color 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=CAT_COLORS[a.cat]||'var(--accent)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{a.title}</div>
                    <div style={{fontSize:10,color:CAT_COLORS[a.cat]||'var(--muted)',fontFamily:'JetBrains Mono'}}>{a.cat}</div>
                  </div>
                  <button onClick={e=>{e.preventDefault();toggleFav(a.id);}} style={{background:'none',border:'none',fontSize:16,cursor:'pointer',color:favorites.includes(a.id)?'#eab308':'var(--muted)'}}>
                    {favorites.includes(a.id)?'★':'☆'}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Favorites */}
        {favAlgos.length>0&&(
          <div style={{marginBottom:36}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'#eab308',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>★ Favorites</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {favAlgos.map(a=>(
                <Link key={a.id} to={a.to} style={{padding:'7px 14px',background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.3)',borderRadius:20,fontSize:13,color:'#eab308',transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(234,179,8,0.16)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(234,179,8,0.08)'}>
                  ★ {a.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quiz history */}
        {quizScores.length>0&&(
          <div style={{marginBottom:36}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'#22c55e',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14}}>Quiz History</div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'JetBrains Mono',fontSize:12}}>
                <thead><tr>{['Algorithm','Score','%','Date'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',color:'var(--muted)',fontWeight:500,borderBottom:'1px solid var(--border)'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...quizScores].reverse().slice(0,8).map((q,i)=>{
                    const pct=Math.round(q.score/q.total*100);
                    const col=pct>=80?'#22c55e':pct>=50?'#eab308':'#ef4444';
                    const algo=ALL_ALGOS.find(a=>a.id===q.algoId);
                    return(
                      <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                        <td style={{padding:'10px 14px'}}>{algo?.title||q.algoId}</td>
                        <td style={{padding:'10px 14px',color:col}}>{q.score}/{q.total}</td>
                        <td style={{padding:'10px 14px',color:col,fontWeight:700}}>{pct}%</td>
                        <td style={{padding:'10px 14px',color:'var(--muted)'}}>{new Date(q.date).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Roadmap */}
        <div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>VTU ADA Syllabus Tracker</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
            {ROADMAP.map(s=>{
              const done=s.subtopics.filter(t=>roadmap[t]).length;
              const pct=Math.round(done/s.subtopics.length*100);
              return(
                <div key={s.topic} style={{background:'var(--surface)',border:`1px solid ${s.color}33`,borderRadius:12,padding:18}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontWeight:600,fontSize:14,color:s.color}}>{s.topic}</span>
                    <span style={{fontFamily:'JetBrains Mono',fontSize:12,color:s.color}}>{done}/{s.subtopics.length}</span>
                  </div>
                  <div style={{height:4,background:'var(--border)',borderRadius:2,marginBottom:12,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:s.color,borderRadius:2,transition:'width 0.4s'}}/>
                  </div>
                  {s.subtopics.map(t=>(
                    <label key={t} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:roadmap[t]?'var(--text)':'var(--muted)',marginBottom:6}}>
                      <input type="checkbox" checked={!!roadmap[t]} onChange={e=>setRoadmap(t,e.target.checked)} style={{accentColor:s.color,width:14,height:14,cursor:'pointer'}}/>
                      <span style={{textDecoration:roadmap[t]?'line-through':'none'}}>{t}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
