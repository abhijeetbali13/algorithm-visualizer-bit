import { useApp } from '../context/AppContext';

export default function Achievements() {
  const { ACHIEVEMENTS, unlockedAchievements, lockedAchievements, streak, visitedCount, avgScore, quizScores } = useApp();
  const pct = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100);

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <span style={{background:'rgba(234,179,8,0.1)',border:'1px solid #eab308',color:'#eab308',padding:'2px 10px',borderRadius:20,fontSize:11,fontFamily:'JetBrains Mono'}}>Gamification</span>
          </div>
          <h1>Achievements</h1>
          <p>Unlock badges by exploring algorithms, acing quizzes, and building streaks. Every badge is earned, not given.</p>
        </div>

        {/* Progress ring row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:16,marginBottom:40}}>
          {[
            {label:'Badges Earned', value:`${unlockedAchievements.length}/${ACHIEVEMENTS.length}`, color:'#eab308', sub:`${pct}% complete`},
            {label:'Day Streak',    value:streak||0,   color:'#f97316', sub:'consecutive days'},
            {label:'Algos Explored',value:visitedCount, color:'var(--accent)', sub:'algorithms opened'},
            {label:'Avg Quiz Score', value:avgScore+'%', color:'#22c55e', sub:`${quizScores.length} quizzes taken`},
          ].map(({label,value,color,sub})=>(
            <div key={label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'20px 16px',textAlign:'center'}}>
              <div style={{fontFamily:'JetBrains Mono',fontSize:28,fontWeight:800,color,marginBottom:4}}>{value}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{label}</div>
              <div style={{fontSize:11,color:'var(--muted)'}}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div style={{marginBottom:36}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontFamily:'JetBrains Mono',fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Overall Completion</span>
            <span style={{fontFamily:'JetBrains Mono',fontSize:11,color:'#eab308'}}>{pct}%</span>
          </div>
          <div style={{height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#f97316,#eab308)',borderRadius:4,transition:'width 0.6s'}}/>
          </div>
        </div>

        {/* Unlocked */}
        {unlockedAchievements.length>0&&(
          <>
            <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'#22c55e',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>
              ✓ Unlocked ({unlockedAchievements.length})
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14,marginBottom:36}}>
              {unlockedAchievements.map(a=>(
                <div key={a.id} style={{background:'linear-gradient(135deg,rgba(234,179,8,0.08),rgba(249,115,22,0.04))',border:'1px solid rgba(234,179,8,0.4)',borderRadius:12,padding:'18px 20px',display:'flex',alignItems:'center',gap:14}}>
                  <div style={{fontSize:36,flexShrink:0}}>{a.icon}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'#eab308',marginBottom:4}}>{a.title}</div>
                    <div style={{fontSize:12,color:'var(--muted)'}}>{a.desc}</div>
                    <div style={{fontSize:10,color:'#22c55e',fontFamily:'JetBrains Mono',marginTop:6}}>✓ UNLOCKED</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Locked */}
        {lockedAchievements.length>0&&(
          <>
            <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>
              🔒 Locked ({lockedAchievements.length})
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
              {lockedAchievements.map(a=>(
                <div key={a.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px',display:'flex',alignItems:'center',gap:14,opacity:0.55}}>
                  <div style={{fontSize:36,flexShrink:0,filter:'grayscale(1)'}}>{a.icon}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{a.title}</div>
                    <div style={{fontSize:12,color:'var(--muted)'}}>{a.desc}</div>
                    <div style={{fontSize:10,color:'var(--border)',fontFamily:'JetBrains Mono',marginTop:6}}>🔒 LOCKED</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
