import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const groups = [
  { label:'Sorting',     links:[{ to:'/bubble-sort', label:'Bubble Sort' },{ to:'/merge-sort', label:'Merge Sort' },{ to:'/heap-sort', label:'Heap Sort' }] },
  { label:'Graph / MST', links:[{ to:'/dijkstra', label:"Dijkstra's" },{ to:'/prims', label:"Prim's" },{ to:'/kruskal', label:"Kruskal's" }] },
  { label:'DP / BT',     links:[{ to:'/knapsack', label:'Knapsack' },{ to:'/n-queens', label:'N-Queens' }] },
  { label:'Greedy',      links:[{ to:'/huffman', label:'Huffman' }] },
  { label:'Strings',     links:[{ to:'/horspool', label:'Horspool' },{ to:'/boyer-moore', label:'Boyer-Moore' }] },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);

  return (
    <nav style={{ background:'rgba(11,15,26,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:200 }}>
      <div className="page-wrapper" style={{ display:'flex', alignItems:'center', height:56, gap:4 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, marginRight:16, flexShrink:0 }}>
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="var(--accent)" fillOpacity=".15"/>
            <path d="M6 20 L10 8 L14 16 L18 11 L22 20" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontFamily:'JetBrains Mono', fontWeight:700, fontSize:13, color:'var(--text)' }}>AlgoHub</span>
        </Link>

        <div style={{ display:'flex', gap:2, overflowX:'auto', flex:1 }}>
          {groups.map(g => {
            const isActive = g.links.some(l => l.to === pathname);
            return (
              <div key={g.label} style={{ position:'relative' }}
                onMouseEnter={() => setOpen(g.label)}
                onMouseLeave={() => setOpen(null)}>
                <button style={{ padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:500, whiteSpace:'nowrap', color: isActive?'var(--accent)':'var(--muted)', background: isActive?'rgba(0,212,255,0.08)':'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, transition:'color 0.2s' }}>
                  {g.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                {open === g.label && (
                  <div style={{ position:'absolute', top:'100%', left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:6, minWidth:140, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', zIndex:300 }}>
                    {g.links.map(l => (
                      <Link key={l.to} to={l.to} onClick={() => setOpen(null)} style={{ display:'block', padding:'7px 12px', borderRadius:6, fontSize:13, color: pathname===l.to?'var(--accent)':'var(--text)', background: pathname===l.to?'rgba(0,212,255,0.1)':'transparent', fontWeight: pathname===l.to?600:400 }}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
