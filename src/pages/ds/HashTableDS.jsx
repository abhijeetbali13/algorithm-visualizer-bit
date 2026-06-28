import { useState, useRef } from 'react';
import './ds.css';

const TABS = ['Chaining', 'Open Addressing', 'Comparison', 'Applications'];
const PROBE_METHODS = ['Linear', 'Quadratic', 'Double Hash'];
const TABLE_SIZE = 11; // prime for better distribution

/* ───────────── Hash functions ───────────── */
const hashKey = (key, size) => {
  if (typeof key === 'number') return ((key % size) + size) % size;
  let h = 0;
  for (let i = 0; i < String(key).length; i++) {
    h = (h * 31 + String(key).charCodeAt(i)) % size;
  }
  return h;
};

const hash2 = (key, size) => {
  const prev = size > 2 ? size - 2 : 1;
  return prev - (hashKey(key, prev) % prev);
};

/* ───────────── Chaining Table ───────────── */

function ChainingTable({ table, highlight = {} }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {table.map((chain, i) => {
        const isHl = highlight.bucket === i;
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
            {/* Index box */}
            <div style={{ width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius:6, background: isHl?'rgba(0,212,255,0.15)':'var(--surface2)',
              border:`1.5px solid ${isHl?'var(--accent)':'var(--border)'}`,
              fontFamily:'JetBrains Mono', fontSize:12, fontWeight:700,
              color: isHl?'var(--accent)':'var(--muted)', flexShrink:0 }}>{i}</div>

            {/* Chain arrow */}
            <div style={{ fontSize:14, color:'var(--muted)' }}>→</div>

            {/* Chain nodes */}
            {chain.length === 0 ? (
              <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', fontStyle:'italic' }}>null</div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                {chain.map((item, j) => {
                  const isTarget = isHl && highlight.itemIdx === j;
                  const isNew    = isHl && highlight.type === 'insert' && j === chain.length - 1;
                  const isDel    = isHl && highlight.type === 'delete' && highlight.itemIdx === j;
                  const isFound  = isHl && highlight.type === 'search' && highlight.itemIdx === j;
                  const borderC  = isFound?'var(--green)':isDel?'var(--red)':isNew?'var(--accent)':'var(--border)';
                  const bgC      = isFound?'rgba(34,197,94,0.2)':isDel?'rgba(239,68,68,0.15)':isNew?'rgba(0,212,255,0.2)':'var(--surface2)';
                  const textC    = isFound?'var(--green)':isDel?'var(--red)':isNew?'var(--accent)':'var(--text)';
                  return (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <div style={{ padding:'4px 10px', borderRadius:6, border:`1.5px solid ${borderC}`,
                        background:bgC, fontFamily:'JetBrains Mono', fontSize:12, fontWeight:700,
                        color:textC, transition:'all 0.25s', minWidth:36, textAlign:'center',
                        boxShadow:(isNew||isFound)?`0 0 8px ${borderC}44`:'' }}>
                        {item.key !== undefined ? `${item.key}:${item.val}` : item}
                      </div>
                      {j < chain.length - 1 && <div style={{ fontSize:12, color:'var(--muted)' }}>→</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Open Addressing Table ───────────── */
function OATable({ table, highlight = {} }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px, 1fr))', gap:8 }}>
      {table.map((slot, i) => {
        const isHl   = highlight.indices?.includes(i);
        const isFinal = highlight.final === i;
        const isProbe = isHl && !isFinal;
        const isDel  = slot?.deleted;
        const borderC = isFinal?(highlight.type==='search'?'var(--green)':highlight.type==='delete'?'var(--red)':'var(--accent)'):isProbe?'var(--yellow)':'var(--border)';
        const bgC     = isFinal?(highlight.type==='search'?'rgba(34,197,94,0.2)':highlight.type==='delete'?'rgba(239,68,68,0.15)':'rgba(0,212,255,0.2)'):isProbe?'rgba(234,179,8,0.1)':isDel?'rgba(239,68,68,0.06)':'var(--surface2)';
        return (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--muted)' }}>[{i}]</div>
            <div style={{ width:'100%', height:44, display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius:8, border:`2px solid ${borderC}`, background:bgC,
              fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700,
              color: isFinal?(highlight.type==='search'?'var(--green)':highlight.type==='delete'?'var(--red)':'var(--accent)'):isProbe?'var(--yellow)':isDel?'var(--muted)':'var(--text)',
              transition:'all 0.25s', boxShadow:isFinal?`0 0 10px ${borderC}44`:'' }}>
              {slot === null ? <span style={{ color:'var(--muted)', fontSize:12 }}>—</span>
               : isDel ? <span style={{ fontSize:10, color:'var(--muted)' }}>DEL</span>
               : slot.key !== undefined ? <span style={{ fontSize:10 }}>{slot.key}:{slot.val}</span>
               : slot}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Main component ───────────── */

const EMPTY_CHAIN = () => Array.from({ length: TABLE_SIZE }, () => []);
const EMPTY_OA = () => Array(TABLE_SIZE).fill(null);

const SEED_CHAIN = () => {
  const t = EMPTY_CHAIN();
  [{ k:'apple', v:1 }, { k:'banana', v:2 }, { k:'cherry', v:3 }, { k:'date', v:4 }, { k:'elderberry', v:5 }]
    .forEach(({ k, v }) => { const h = hashKey(k.charCodeAt ? k.charCodeAt(0)*7+k.length : k, TABLE_SIZE); t[h % TABLE_SIZE].push({ key: k, val: v }); });
  return t;
};

const SEED_OA = () => {
  const t = EMPTY_OA();
  [{ k:15, v:'A' }, { k:26, v:'B' }, { k:37, v:'C' }, { k:48, v:'D' }].forEach(({ k, v }) => {
    let idx = hashKey(k, TABLE_SIZE);
    while (t[idx] !== null && !t[idx]?.deleted) idx = (idx + 1) % TABLE_SIZE;
    t[idx] = { key: k, val: v };
  });
  return t;
};

export default function HashTableDS() {
  const [tab, setTab] = useState('Chaining');

  // Chaining state
  const [chainTable, setChainTable]   = useState(SEED_CHAIN);
  const [chainHL, setChainHL]         = useState({});
  const [chainLog, setChainLog]       = useState('Hash Table with Chaining: collisions are resolved by storing multiple entries in the same bucket as a linked list.');
  const [chainKey, setChainKey]       = useState('');
  const [chainVal, setChainVal]       = useState('');

  // OA state
  const [oaTable, setOATable]         = useState(SEED_OA);
  const [oaHL, setOAHL]               = useState({});
  const [oaLog, setOALog]             = useState('Open Addressing: all entries stored in the array itself. On collision, probe for the next open slot.');
  const [oaKey, setOAKey]             = useState('');
  const [oaVal, setOAVal]             = useState('');
  const [probeMethod, setProbeMethod] = useState('Linear');

  const flash = (setter, hl, log, duration = 2000) => {
    setter(hl); setChainLog && null;
    setTimeout(() => setter({}), duration);
    return log;
  };

  // ── Chaining ops ──
  const chainInsert = () => {
    const k = chainKey.trim(); const v = chainVal.trim() || '✓';
    if (!k) return;
    const bucket = hashKey(isNaN(Number(k)) ? k.charCodeAt(0)*7+k.length : Number(k), TABLE_SIZE) % TABLE_SIZE;
    const t = chainTable.map(c => [...c]);
    const existIdx = t[bucket].findIndex(item => item.key === k);
    let msg;
    if (existIdx >= 0) {
      t[bucket][existIdx].val = v;
      msg = `Update: key "${k}" already in bucket ${bucket}. Value updated to "${v}". O(1) avg.`;
    } else {
      t[bucket].push({ key: k, val: v });
      msg = `Insert: hash("${k}") = ${bucket}. Appended to chain at bucket ${bucket}. ${t[bucket].length > 1 ? `Collision! Chain length = ${t[bucket].length}.` : 'No collision.'} O(1) avg.`;
    }
    setChainTable(t);
    setChainHL({ bucket, type:'insert', itemIdx: t[bucket].length - 1 });
    setChainLog(msg);
    setChainKey(''); setChainVal('');
    setTimeout(() => setChainHL({}), 2200);
  };

  const chainSearch = () => {
    const k = chainKey.trim(); if (!k) return;
    const bucket = hashKey(isNaN(Number(k)) ? k.charCodeAt(0)*7+k.length : Number(k), TABLE_SIZE) % TABLE_SIZE;
    const chain = chainTable[bucket];
    const idx = chain.findIndex(item => item.key === k);
    setChainHL({ bucket, type:'search', itemIdx: idx });
    setChainLog(idx >= 0
      ? `Search: hash("${k}") = ${bucket}. Found at position ${idx} in chain. Value = "${chain[idx].val}". Compared ${idx+1} element(s). O(1) avg, O(n) worst.`
      : `Search: hash("${k}") = ${bucket}. Key not found in bucket ${bucket}'s chain (${chain.length} element(s) checked). O(1) avg, O(n) worst.`);
    setTimeout(() => setChainHL({}), 2500);
  };

  const chainDelete = () => {
    const k = chainKey.trim(); if (!k) return;
    const bucket = hashKey(isNaN(Number(k)) ? k.charCodeAt(0)*7+k.length : Number(k), TABLE_SIZE) % TABLE_SIZE;
    const chain = chainTable[bucket];
    const idx = chain.findIndex(item => item.key === k);
    if (idx < 0) { setChainLog(`Delete: "${k}" not found in bucket ${bucket}.`); return; }
    setChainHL({ bucket, type:'delete', itemIdx: idx });
    setChainLog(`Delete: hash("${k}") = ${bucket}. Removing from position ${idx} in chain. Chain length: ${chain.length} → ${chain.length - 1}. O(1) avg.`);
    setTimeout(() => {
      const t = chainTable.map(c => [...c]);
      t[bucket].splice(idx, 1);
      setChainTable(t);
      setChainHL({});
    }, 1000);
    setChainKey('');
  };

  // ── OA ops ──
  const getProbeSeq = (key, method, size) => {
    const h = hashKey(isNaN(Number(key)) ? key.charCodeAt(0)*7+key.length : Number(key), size);
    const seq = [];
    for (let i = 0; i < size; i++) {
      let idx;
      if (method === 'Linear')       idx = (h + i) % size;
      else if (method === 'Quadratic') idx = (h + i*i) % size;
      else idx = (h + i * hash2(isNaN(Number(key)) ? key.charCodeAt(0)*7+key.length : Number(key), size)) % size;
      seq.push(idx);
    }
    return { h, seq };
  };

  const oaInsert = () => {
    const k = oaKey.trim(); const v = oaVal.trim() || '✓';
    if (!k) return;
    const { h, seq } = getProbeSeq(k, probeMethod, TABLE_SIZE);
    const t = [...oaTable];
    const probed = [];
    let placed = -1;
    for (let i = 0; i < seq.length; i++) {
      probed.push(seq[i]);
      const slot = t[seq[i]];
      if (slot === null || slot?.deleted) { t[seq[i]] = { key: k, val: v }; placed = seq[i]; break; }
      if (slot.key === k) { t[seq[i]] = { key: k, val: v }; placed = seq[i]; break; }
    }
    if (placed < 0) { setOALog('Table is full!'); return; }
    setOATable(t);
    setOAHL({ indices: probed, final: placed, type:'insert' });
    setOALog(`Insert "${k}": hash = ${h}. ${probeMethod} probing → [${probed.join('→')}]. Placed at [${placed}].${probed.length > 1 ? ` ${probed.length-1} collision(s).` : ' No collision.'}`);
    setOAKey(''); setOAVal('');
    setTimeout(() => setOAHL({}), 2500);
  };

  const oaSearch = () => {
    const k = oaKey.trim(); if (!k) return;
    const { h, seq } = getProbeSeq(k, probeMethod, TABLE_SIZE);
    const probed = [];
    let found = -1;
    for (const idx of seq) {
      const slot = oaTable[idx];
      probed.push(idx);
      if (slot === null) break;
      if (!slot.deleted && slot.key === k) { found = idx; break; }
    }
    setOAHL({ indices: probed, final: found >= 0 ? found : undefined, type:'search' });
    setOALog(found >= 0
      ? `Search "${k}": hash = ${h}. Probed [${probed.join('→')}]. Found at [${found}]. O(1) avg.`
      : `Search "${k}": hash = ${h}. Probed [${probed.join('→')}]. Not found. O(1) avg, O(n) worst.`);
    setTimeout(() => setOAHL({}), 2500);
  };

  const oaDelete = () => {
    const k = oaKey.trim(); if (!k) return;
    const { h, seq } = getProbeSeq(k, probeMethod, TABLE_SIZE);
    const probed = [];
    let found = -1;
    for (const idx of seq) {
      const slot = oaTable[idx];
      probed.push(idx);
      if (slot === null) break;
      if (!slot.deleted && slot.key === k) { found = idx; break; }
    }
    if (found < 0) { setOALog(`Delete "${k}": not found.`); return; }
    setOAHL({ indices: probed, final: found, type:'delete' });
    setOALog(`Delete "${k}": found at [${found}]. Marking as DELETED (tombstone) — can't use null or it breaks the probe chain for other keys.`);
    setTimeout(() => {
      const t = [...oaTable];
      t[found] = { deleted: true };
      setOATable(t);
      setOAHL({});
    }, 1500);
    setOAKey('');
  };

  const loadFactor = (table) => {
    const used = table.flat ? table.flat().length : table.filter(s => s && !s.deleted).length;
    return ((used / TABLE_SIZE) * 100).toFixed(0);
  };

  const oaLF = oaTable.filter(s => s && !s.deleted).length / TABLE_SIZE;

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Hash Table</h1>
          <p>Maps keys to values via a hash function for O(1) average insert, search, and delete. The choice of collision resolution dramatically affects real-world performance. Used in databases, compilers, caches, and virtually every programming language's built-in dictionary.</p>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {TABS.map(t => <button key={t} className={`ds-tab${tab===t?' active':''}`} onClick={() => setTab(t)}>{t}</button>)}
        </div>

        {tab === 'Chaining' && (
          <div className="ds-layout">
            <div>
              <div className="ds-canvas" style={{ overflowX:'auto' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>
                    Table size: {TABLE_SIZE} (prime) · Load factor: {loadFactor(chainTable)}%
                  </span>
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--accent)' }}>
                    Separate Chaining
                  </span>
                </div>
                <ChainingTable table={chainTable} highlight={chainHL} />
              </div>
              <div className="ds-log" style={{ marginTop:10 }}>{chainLog}</div>
              <div style={{ marginTop:12, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:6 }}>Hash Function (for strings):</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--accent)' }}>
                  h(key) = (Σ key[i] × 31^i) mod {TABLE_SIZE}
                </div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', marginTop:4 }}>
                  The modulus is a prime to minimize clustering.
                </div>
              </div>
            </div>

            <div className="ds-ops-panel">
              <h3>Operations</h3>
              <div className="ds-op-group">
                <label>Key</label>
                <input className="ds-input" value={chainKey} onChange={e => setChainKey(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && chainInsert()}
                  placeholder="e.g. apple or 42" />
              </div>
              <div className="ds-op-group">
                <label>Value</label>
                <input className="ds-input" value={chainVal} onChange={e => setChainVal(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && chainInsert()}
                  placeholder="e.g. fruit" />
              </div>
              <button className="btn btn-primary" onClick={chainInsert} style={{ width:'100%' }}>Insert / Update</button>
              <button className="btn btn-secondary" onClick={chainSearch} style={{ width:'100%' }}>Search</button>
              <button className="btn btn-danger" onClick={chainDelete} style={{ width:'100%' }}>Delete</button>
              <button className="btn btn-secondary" onClick={() => { setChainTable(EMPTY_CHAIN()); setChainLog('Table cleared.'); setChainHL({}); }} style={{ width:'100%' }}>
                ↺ Clear Table
              </button>
              <div className="ds-info-box">
                <strong>Chaining:</strong><br/>
                Each bucket holds a linked list. Collisions → append to list.<br/><br/>
                <code>insert</code> O(1) avg<br/>
                <code>search</code> O(1) avg, O(n) worst<br/>
                <code>delete</code> O(1) avg<br/><br/>
                <strong>Load factor α = n/m</strong><br/>
                Average chain length ≈ α. Stay under α = 0.75 for good performance (Java HashMap resizes here).
              </div>
            </div>
          </div>
        )}

        {tab === 'Open Addressing' && (
          <div className="ds-layout">
            <div>
              <div className="ds-canvas">
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                  <span style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>
                    Load factor: {(oaLF * 100).toFixed(0)}% {oaLF > 0.7 ? '⚠️ High!' : '✓'}
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    {PROBE_METHODS.map(m => (
                      <button key={m} className={`ds-tab${probeMethod===m?' active':''}`}
                        style={{ fontSize:11, padding:'4px 10px' }} onClick={() => setProbeMethod(m)}>{m}</button>
                    ))}
                  </div>
                </div>
                <OATable table={oaTable} highlight={oaHL} />
                <div style={{ display:'flex', gap:12, marginTop:10, fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', flexWrap:'wrap' }}>
                  <span><span style={{ color:'var(--accent)' }}>■</span> inserted/found</span>
                  <span><span style={{ color:'var(--yellow)' }}>■</span> probed (collision)</span>
                  <span><span style={{ color:'var(--green)' }}>■</span> search found</span>
                  <span><span style={{ color:'var(--red)' }}>■</span> deleted (tombstone)</span>
                </div>
              </div>
              <div className="ds-log" style={{ marginTop:10 }}>{oaLog}</div>
              <div style={{ marginTop:12, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--accent)', marginBottom:4 }}>Probe Sequence ({probeMethod})</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>
                  {probeMethod==='Linear' ? 'h(k, i) = (h(k) + i) mod m' :
                   probeMethod==='Quadratic' ? 'h(k, i) = (h(k) + i²) mod m' :
                   'h(k, i) = (h₁(k) + i·h₂(k)) mod m'}
                </div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', marginTop:4 }}>
                  {probeMethod==='Linear' ? 'Simple but causes primary clustering (long runs of occupied slots).' :
                   probeMethod==='Quadratic' ? 'Reduces primary clustering but causes secondary clustering.' :
                   'Best distribution. Two probes never follow the same sequence. Needs h₂(k) ≠ 0.'}
                </div>
              </div>
            </div>

            <div className="ds-ops-panel">
              <h3>Operations</h3>
              <div className="ds-op-group">
                <label>Key (number or string)</label>
                <input className="ds-input" value={oaKey} onChange={e => setOAKey(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && oaInsert()}
                  placeholder="e.g. 15 or hello" />
              </div>
              <div className="ds-op-group">
                <label>Value</label>
                <input className="ds-input" value={oaVal} onChange={e => setOAVal(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && oaInsert()}
                  placeholder="e.g. A" />
              </div>
              <button className="btn btn-primary" onClick={oaInsert} style={{ width:'100%' }}
                disabled={oaLF > 0.9}>Insert</button>
              <button className="btn btn-secondary" onClick={oaSearch} style={{ width:'100%' }}>Search</button>
              <button className="btn btn-danger" onClick={oaDelete} style={{ width:'100%' }}>Delete (tombstone)</button>
              <button className="btn btn-secondary" onClick={() => { setOATable(EMPTY_OA()); setOALog('Table cleared.'); setOAHL({}); }} style={{ width:'100%' }}>
                ↺ Clear Table
              </button>
              <div className="ds-info-box">
                <strong>Open Addressing:</strong><br/>
                Everything in the array. On collision, probe next slot.<br/><br/>
                <strong>Deletion problem:</strong><br/>
                Can't use null — it breaks search chains! Use a <code>DELETED</code> tombstone instead.<br/><br/>
                <strong>Load factor &lt; 0.7</strong> recommended. Above 0.9 performance degrades severely.
              </div>
            </div>
          </div>
        )}

        {tab === 'Comparison' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'var(--surface2)' }}>
                    {['', 'Chaining', 'Linear Probing', 'Quadratic Probing', 'Double Hashing'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:h?'var(--accent)':'var(--muted)', borderBottom:'2px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Insert', 'O(1) avg', 'O(1) avg', 'O(1) avg', 'O(1) avg'],
                    ['Search', 'O(1) avg', 'O(1) avg', 'O(1) avg', 'O(1) avg'],
                    ['Delete', 'O(1) avg', 'O(1) + tombstone', 'O(1) + tombstone', 'O(1) + tombstone'],
                    ['Worst case', 'O(n)', 'O(n)', 'O(n)', 'O(n)'],
                    ['Space', 'O(n+m)', 'O(m)', 'O(m)', 'O(m)'],
                    ['Load factor', 'Can exceed 1', '< 0.7', '< 0.5', '< 0.7'],
                    ['Clustering', 'None', 'Primary (bad)', 'Secondary (mild)', 'None'],
                    ['Cache perf.', 'Poor (pointers)', 'Excellent', 'Good', 'Good'],
                    ['Used in', 'Java HashMap', 'Python dict (CPython)', 'Many textbooks', 'Open BSD dict'],
                  ].map(([label, ...vals], ri) => (
                    <tr key={label} style={{ background: ri%2?'transparent':'var(--surface)' }}>
                      <td style={{ padding:'9px 14px', color:'var(--muted)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}><strong style={{ color:'var(--text)' }}>{label}</strong></td>
                      {vals.map((v, i) => (
                        <td key={i} style={{ padding:'9px 14px', color:'var(--text)', borderBottom:'1px solid var(--border)' }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
              {[
                { title:'Why prime table size?', color:'var(--accent)', content:'A prime modulus distributes keys more uniformly across buckets. If m and common step sizes share a factor, the probe sequence may not visit all slots — a prime prevents this.' },
                { title:'The Birthday Problem', color:'var(--yellow)', content:'With n items and m buckets, the first collision is expected at n ≈ √(2m). With 365 slots, expect a collision after ~23 items. This is why load factor matters.' },
                { title:'Why Java uses 0.75?', color:'var(--green)', content:"Java's HashMap defaults to resizing at 75% load. It's an empirically tuned sweet-spot: good memory use with acceptable collision rates. The table doubles in size (rehashing everything — O(n))." },
                { title:'Universal Hashing', color:'#a78bfa', content:'Randomly choosing a hash function from a universal family guarantees O(1) expected operations regardless of input. Used in cryptographic MACs and modern hash maps.' },
              ].map(({ title, color, content }) => (
                <div key={title} style={{ background:'var(--surface)', border:`1px solid var(--border)`, borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color, marginBottom:8 }}>{title}</div>
                  <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>{content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Applications' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {[
              { title:'Database Indexes', icon:'🗄️', color:'var(--accent)', desc:"Hash indexes enable O(1) point queries in databases like PostgreSQL. Not useful for range queries (can't compare hashes), but unbeatable for equality lookups by primary key.", example:'WHERE id = 42 → O(1) via hash index' },
              { title:'Compiler Symbol Table', icon:'⚙️', color:'var(--cat-sorting)', desc:'The compiler stores all variable/function names in a hash table during compilation. Every identifier lookup is a hash table access — needs to be O(1) since it happens millions of times.', example:'int x; → hash("x") → slot' },
              { title:'Python dict / Set', icon:'🐍', color:'#fbbf24', desc:"Python's dict and set are open-addressing hash tables. Since 3.7, dict also preserves insertion order (via a separate dense array). dict is one of CPython's most performance-critical objects.", example:"d['key'] → O(1) average" },
              { title:'DNS Cache', icon:'🌐', color:'var(--cat-graph)', desc:'Your OS caches DNS resolutions in a hash table: hostname → IP address. Sub-millisecond lookup instead of network round-trip. The cache has a TTL and is purged periodically.', example:'google.com → 142.250.x.x' },
              { title:'Blockchain / Merkle Trees', icon:'🔗', color:'var(--cat-greedy)', desc:'Cryptographic hash functions (SHA-256) power blockchains. Merkle trees hash each transaction and combine up the tree — any change to any transaction changes the root hash.', example:'SHA-256(data) → 256-bit fingerprint' },
              { title:'Caching (Memcached/Redis)', icon:'⚡', color:'var(--green)', desc:'Distributed caches like Redis are essentially hash tables over the network. Consistent hashing distributes keys across servers so adding/removing a server only remaps ~K/n keys.', example:"GET 'user:123' → O(1) lookup" },
            ].map(app => (
              <div key={app.title} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:22 }}>{app.icon}</span>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color:app.color }}>{app.title}</div>
                </div>
                <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, marginBottom:10 }}>{app.desc}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:app.color, background:`${app.color}11`, borderRadius:4, padding:'4px 8px' }}>{app.example}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
