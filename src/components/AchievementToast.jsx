import { useApp } from '../context/AppContext';

export default function AchievementToast() {
  const { newAchievement } = useApp();
  if (!newAchievement) return null;
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      background:'linear-gradient(135deg,#1a2236,#111827)',
      border:'1px solid #eab308', borderRadius:14, padding:'16px 20px',
      boxShadow:'0 8px 32px rgba(234,179,8,0.25)',
      display:'flex', alignItems:'center', gap:14, minWidth:280,
      animation:'slideIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{fontSize:32}}>{newAchievement.icon}</div>
      <div>
        <div style={{fontSize:11,color:'#eab308',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>Achievement Unlocked!</div>
        <div style={{fontSize:14,fontWeight:700,color:'#e2e8f0',marginBottom:2}}>{newAchievement.title}</div>
        <div style={{fontSize:12,color:'#64748b'}}>{newAchievement.desc}</div>
      </div>
    </div>
  );
}
