import { useState, useRef } from 'react';
import { useVisualizer } from '../../hooks/useVisualizer';
import StepControls from '../../components/StepControls';
import './ds.css';

/* ───────────────────────── Linear node renderers (Singly / Doubly) ───────────────────────── */

function SLLNode({ value, highlight, isHead, isTail, isLast }) {
  const col = {
    new:     'var(--accent)',
    found:   'var(--green)',
    deleted: 'var(--red)',
    current: 'var(--yellow)',
  }[highlight] || 'var(--border)';

  return (
    <div style={{ display:'flex', alignItems:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
        {(isHead || isTail) && (
          <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:col==='var(--border)'?'var(--accent)':col, fontWeight:700 }}>
            {isHead && isTail ? 'HEAD=TAIL' : isHead ? 'HEAD' : 'TAIL'}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center' }}>
          <div style={{ width:52, height:46, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'6px 0 0 6px', border:`2px solid ${col}`, borderRight:'1px solid var(--border)', background: highlight ? `${col}22` : 'var(--surface2)', fontFamily:'JetBrains Mono', fontSize:15, fontWeight:700, color: highlight ? col : 'var(--text)', transition:'all 0.25s' }}>
            {value}
          </div>
          <div style={{ width:30, height:46, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'0 6px 6px 0', border:`2px solid ${col}`, borderLeft:'1px solid var(--border)', background: 'var(--code-bg)', fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', transition:'all 0.25s' }}>
            {isLast ? 'null' : '→'}
          </div>
        </div>
        <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--muted)' }}>node</div>
      </div>
      {!isLast && (
        <svg width="28" height="20" style={{ flexShrink:0 }}>
          <line x1="0" y1="10" x2="22" y2="10" stroke="var(--muted)" strokeWidth="1.5"/>
          <polygon points="18,6 26,10 18,14" fill="var(--muted)"/>
        </svg>
      )}
    </div>
  );
}

function DLLNode({ value, highlight, isHead, isTail, isLast, isFirst }) {
  const col = { new:'var(--accent)', found:'var(--green)', deleted:'var(--red)', current:'var(--yellow)' }[highlight] || 'var(--border)';
  return (
    <div style={{ display:'flex', alignItems:'center' }}>
      {!isFirst && (
        <svg width="28" height="20" style={{ flexShrink:0 }}>
          <line x1="6" y1="10" x2="28" y2="10" stroke="var(--muted)" strokeWidth="1.5"/>
          <polygon points="10,6 2,10 10,14" fill="var(--muted)"/>
        </svg>
      )}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
        {(isHead || isTail) && (
          <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--accent)', fontWeight:700 }}>
            {isHead && isTail ? 'HEAD=TAIL' : isHead ? 'HEAD' : 'TAIL'}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center' }}>
          <div style={{ width:28, height:46, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'6px 0 0 6px', border:`2px solid ${col}`, borderRight:'1px solid var(--border)', background:'var(--code-bg)', fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}>
            {isFirst?'null':'←'}
          </div>
          <div style={{ width:52, height:46, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${col}`, borderLeft:'none', borderRight:'none', background: highlight?`${col}22`:'var(--surface2)', fontFamily:'JetBrains Mono', fontSize:15, fontWeight:700, color: highlight?col:'var(--text)', transition:'all 0.25s' }}>
            {value}
          </div>
          <div style={{ width:28, height:46, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'0 6px 6px 0', border:`2px solid ${col}`, borderLeft:'1px solid var(--border)', background:'var(--code-bg)', fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}>
            {isLast?'null':'→'}
          </div>
        </div>
        <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--muted)' }}>node</div>
      </div>
      {!isLast && (
        <svg width="28" height="20" style={{ flexShrink:0 }}>
          <line x1="0" y1="10" x2="22" y2="10" stroke="var(--muted)" strokeWidth="1.5"/>
          <polygon points="18,6 26,10 18,14" fill="var(--muted)"/>
        </svg>
      )}
    </div>
  );
}

/* ───────────────────────── Circular ring renderer ─────────────────────────
   Nodes are arranged evenly around a circle so the "last node points back to
   the first" relationship is visually obvious (a real loop), instead of a
   text label bolted onto a straight line.                                    */

function ringLayout(n, cx = 230, cy = 158) {
  const radius = n <= 1 ? 0 : Math.max(85, Math.min(150, 70 + n * 12));
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const angle = (-90 + i * (360 / n)) * Math.PI / 180;
    nodes.push({ i, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), angle });
  }
  const edges = [];
  if (n >= 2) {
    for (let i = 0; i < n; i++) {
      const a = nodes[i], b = nodes[(i + 1) % n];
      let bAngle = b.angle;
      if (bAngle <= a.angle) bAngle += Math.PI * 2;
      const midAngle = (a.angle + bAngle) / 2;
      const ctrlR = radius * 1.32;
      edges.push({ from: i, to: (i + 1) % n, ctrl: [cx + ctrlR * Math.cos(midAngle), cy + ctrlR * Math.sin(midAngle)] });
    }
  }
  return { radius, cx, cy, nodes, edges };
}

function pointOnSegment(x1, y1, x2, y2, dist) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [x1 + (dx / len) * dist, y1 + (dy / len) * dist];
}

function RingList({ values, highlights }) {
  const n = values.length;
  const colFor = (hl) => ({ new:'var(--accent)', found:'var(--green)', deleted:'var(--red)', current:'var(--yellow)' }[hl] || 'var(--accent)');

  if (n === 0) {
    return <div style={{ color:'var(--muted)', fontFamily:'JetBrains Mono', fontSize:13, padding:'40px 0', textAlign:'center' }}>Empty list — HEAD = null</div>;
  }

  if (n === 1) {
    const col = colFor(highlights[0]);
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 0' }}>
        <svg viewBox="0 0 200 170" style={{ width:220, height:'auto' }}>
          <path d="M 100 60 C 150 20, 150 90, 105 78" fill="none" stroke={col} strokeWidth="2" strokeDasharray="5,3"/>
          <polygon points="100,72 112,76 102,86" fill={col} />
          <circle cx="100" cy="100" r="34" fill={highlights[0] ? `${col}33` : 'var(--surface2)'} stroke={col} strokeWidth="2.5"/>
          <text x="100" y="106" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="16" fontWeight="700" fill={highlights[0] ? col : 'var(--text)'}>{values[0]}</text>
        </svg>
        <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--accent)' }}>HEAD = TAIL — next points to itself</div>
      </div>
    );
  }

  const { radius, cx, cy, nodes, edges } = ringLayout(n);
  const boxW = 60;
  const viewW = cx * 2, viewH = cy + radius + 70;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <svg viewBox={`0 0 ${viewW} ${viewH}`} style={{ width:'100%', maxWidth:520, height:'auto' }}>
        {edges.map((e, idx) => {
          const a = nodes[e.from], b = nodes[e.to];
          const start = pointOnSegment(a.x, a.y, e.ctrl[0], e.ctrl[1], boxW * 0.62);
          const end   = pointOnSegment(b.x, b.y, e.ctrl[0], e.ctrl[1], boxW * 0.68);
          const isWrap = e.from === n - 1 && e.to === 0;
          const stroke = isWrap ? 'var(--accent)' : 'var(--muted)';
          const dash = isWrap ? '6,4' : 'none';
          const dx = end[0] - e.ctrl[0], dy = end[1] - e.ctrl[1];
          const ang = Math.atan2(dy, dx);
          const ax1 = end[0] - 9 * Math.cos(ang - 0.4), ay1 = end[1] - 9 * Math.sin(ang - 0.4);
          const ax2 = end[0] - 9 * Math.cos(ang + 0.4), ay2 = end[1] - 9 * Math.sin(ang + 0.4);
          return (
            <g key={idx}>
              <path d={`M ${start[0]} ${start[1]} Q ${e.ctrl[0]} ${e.ctrl[1]} ${end[0]} ${end[1]}`}
                fill="none" stroke={stroke} strokeWidth={isWrap ? 2 : 1.5} strokeDasharray={dash} opacity={isWrap ? 0.9 : 0.55}/>
              <polygon points={`${end[0]},${end[1]} ${ax1},${ay1} ${ax2},${ay2}`} fill={stroke} opacity={isWrap ? 0.9 : 0.55}/>
            </g>
          );
        })}
        {nodes.map((nd) => {
          const hl = highlights[nd.i];
          const col = colFor(hl);
          const isHead = nd.i === 0, isTail = nd.i === n - 1;
          return (
            <g key={nd.i}>
              <rect x={nd.x - boxW/2} y={nd.y - 22} width={boxW} height={44} rx="8"
                fill={hl ? `${col}28` : 'var(--surface2)'} stroke={col} strokeWidth={hl ? 2.5 : 2} style={{ transition:'all 0.25s' }}/>
              <text x={nd.x} y={nd.y + 5} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="15" fontWeight="700" fill={hl ? col : 'var(--text)'}>
                {values[nd.i]}
              </text>
              {(isHead || isTail) && (
                <text x={nd.x} y={nd.y - 30} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" fill={isHead ? 'var(--accent)' : '#a78bfa'}>
                  {isHead && isTail ? 'HEAD=TAIL' : isHead ? 'HEAD' : 'TAIL'}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--accent)', marginTop:4, textAlign:'center' }}>
        ⟲ dashed loop = TAIL.next → HEAD (the "circular" link) · no null terminator anywhere
      </div>
    </div>
  );
}

/* ───────────────────────── Step builders (pure) ───────────────────────── */

const mk = (list, highlights, msg) => ({ list: [...list], highlights: { ...highlights }, msg });

function buildAddFirst(list, v) {
  const steps = [];
  steps.push(mk(list, {}, `Create new node(${v}).`));
  if (list.length) steps.push(mk(list, { 0: 'current' }, `new.next = HEAD → links to existing node(${list[0]}).`));
  const result = [v, ...list];
  steps.push(mk(result, { 0: 'new' }, `HEAD = new node(${v}). Old HEAD shifted to index 1. O(1).`));
  return { steps, result };
}

function buildAddLast(list, v, type) {
  const steps = [];
  const result = [...list, v];
  if (type === 'Doubly') {
    if (list.length) steps.push(mk(list, { [list.length - 1]: 'current' }, `TAIL pointer known directly → new.prev = TAIL(${list[list.length-1]}).`));
    steps.push(mk(result, { [list.length]: 'new' }, `TAIL.next = new node(${v}). TAIL = new node. O(1) — thanks to the maintained tail pointer.`));
  } else {
    for (let i = 0; i < list.length; i++) {
      const atEnd = i === list.length - 1;
      steps.push(mk(list, { [i]: 'current' },
        `Traverse: at node(${list[i]}) — .next ${atEnd ? (type === 'Circular' ? 'points back to HEAD (this is TAIL)' : 'is null (this is TAIL)') : `points to node(${list[i+1]})...`}`));
    }
    steps.push(mk(result, { [list.length]: 'new' },
      `Reached the end. ${list.length ? 'Old TAIL' : 'HEAD'}.next = new node(${v}). ${type === 'Circular' ? 'new node.next = HEAD (wraps around).' : 'new.next = null.'} O(n) without a tail pointer.`));
  }
  return { steps, result };
}

function buildAddAtIndex(list, v, idx) {
  if (idx === 0) return buildAddFirst(list, v);
  const steps = [];
  for (let i = 0; i < idx; i++) {
    steps.push(mk(list, { [i]: 'current' }, `Traverse: at node[${i}]=${list[i]}, move to .next...`));
  }
  const result = [...list.slice(0, idx), v, ...list.slice(idx)];
  steps.push(mk(result, { [idx - 1]: 'current', [idx]: 'new' },
    `node[${idx-1}].next = new node(${v}); new node.next = old node[${idx}]=${list[idx]}. O(n) to walk to position.`));
  return { steps, result };
}

function buildDeleteFirst(list) {
  const steps = [];
  const val = list[0];
  steps.push(mk(list, { 0: 'deleted' }, `temp = HEAD(${val}).`));
  const result = list.slice(1);
  steps.push(mk(result, {}, `HEAD = HEAD.next. Node(${val}) freed. O(1).`));
  return { steps, result };
}

function buildDeleteLast(list, type) {
  const steps = [];
  const val = list[list.length - 1];
  if (type === 'Doubly') {
    steps.push(mk(list, { [list.length - 1]: 'deleted' }, `temp = TAIL(${val}). TAIL = TAIL.prev directly — O(1).`));
  } else {
    for (let i = 0; i < list.length - 1; i++) {
      steps.push(mk(list, { [i]: 'current' }, `Traverse: at node[${i}]=${list[i]}, need the SECOND-LAST node...`));
    }
    steps.push(mk(list, { [list.length - 1]: 'deleted', [list.length - 2]: 'current' },
      `Found second-last node(${list[list.length-2]}). Will set its .next = null.`));
  }
  const result = list.slice(0, -1);
  steps.push(mk(result, {}, `Removed TAIL(${val}). ${type === 'Doubly' ? 'New TAIL.next = null.' : 'Second-last node is the new TAIL.'} O(${type === 'Doubly' ? '1' : 'n'}).`));
  return { steps, result };
}

function buildDeleteAtIndex(list, idx) {
  if (idx === 0) return buildDeleteFirst(list);
  if (idx === list.length - 1) return buildDeleteLast(list, 'Singly');
  const steps = [];
  const val = list[idx];
  for (let i = 0; i < idx; i++) {
    steps.push(mk(list, { [i]: 'current' }, `Traverse: at node[${i}]=${list[i]}, move to .next...`));
  }
  steps.push(mk(list, { [idx - 1]: 'current', [idx]: 'deleted' },
    `node[${idx-1}].next = node[${idx}].next — bypassing node[${idx}]=${val}.`));
  const result = [...list.slice(0, idx), ...list.slice(idx + 1)];
  steps.push(mk(result, {}, `Deleted ${val}. Link fixed, node freed. O(n).`));
  return { steps, result };
}

function buildSearch(list, v) {
  const steps = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i] === v) {
      steps.push(mk(list, { [i]: 'found' }, `Checking node[${i}]=${list[i]} == ${v} ✓ Found!`));
      return { steps, result: list };
    }
    steps.push(mk(list, { [i]: 'current' }, `Checking node[${i}]=${list[i]} ≠ ${v}, move to next...`));
  }
  steps.push(mk(list, {}, `${v} not found. Traversed all ${list.length} nodes. O(n).`));
  return { steps, result: list };
}

function buildTraverse(list) {
  const steps = [];
  for (let i = 0; i < list.length; i++) {
    steps.push(mk(list, { [i]: 'current' }, `Visiting node[${i}] = ${list[i]}${i===list.length-1 ? ' (last node)' : ''}`));
  }
  steps.push(mk(list, {}, `Traversal complete. Visited all ${list.length} nodes in order. O(n).`));
  return { steps, result: list };
}

/* ───────────────────────── Main component ───────────────────────── */

const TYPES = ['Singly', 'Doubly', 'Circular'];
const OPS = ['Overview', 'Add First', 'Add Last', 'Add at Index', 'Delete First', 'Delete Last', 'Delete at Index', 'Search', 'Traverse'];
const DEFAULT_LIST = [10, 20, 30, 40];

export default function LinkedListDS() {
  // custom initial values state
  const [customInit, setCustomInit] = useState('10, 20, 30, 40');
  const [customInitErr, setCustomInitErr] = useState('');
  const [type, setType] = useState('Singly');
  const [list, setList] = useState(DEFAULT_LIST);
  const [op, setOp] = useState('Overview');
  const [idleMsg, setIdleMsg] = useState('Select an operation, then press ▶ Play (or step with Next →).');
  const [inputVal, setInputVal] = useState('');
  const [inputIdx, setInputIdx] = useState('');
  const [customInput, setCustomInput] = useState('10, 20, 30, 40');

  const pendingSteps = useRef([]);
  const viz = useVisualizer(() => pendingSteps.current);
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const run = (builderResult, doneMsg) => {
    pendingSteps.current = builderResult.steps;
    setList(builderResult.result);
    reset();
    start();
    if (doneMsg) setIdleMsg(doneMsg);
  };

  const switchType = (t) => { setType(t); setOp('Overview'); setList(DEFAULT_LIST); reset(); setIdleMsg('Select an operation, then press ▶ Play (or step with Next →).'); };
  const switchOp = (o) => { setOp(o); reset(); };

  const loadCustom = () => {
    const vals = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!vals.length) { setIdleMsg('Enter comma-separated numbers, e.g. 5, 12, 8'); return; }
    setList(vals.slice(0, 12));
    reset();
    setIdleMsg(`Loaded custom list: [${vals.slice(0,12).join(', ')}]`);
  };

  // applyCustomInit: loads the customInit input field as the new list
  const applyCustomInit = () => {
    setCustomInitErr('');
    const vals = customInit.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 999);
    if (vals.length < 2 || vals.length > 10) {
      setCustomInitErr('Enter 2–10 integers, each 1–999 (comma-separated).');
      return;
    }
    setList(vals);
    reset();
    setIdleMsg(`Loaded: [${vals.join(', ')}]`);
  };

  // resetList: resets the list to the default values
  const resetList = () => {
    setList(DEFAULT_LIST);
    setCustomInit('10, 20, 30, 40');
    setCustomInitErr('');
    reset();
    setIdleMsg('List reset to default [10, 20, 30, 40].');
  };

  const addFirst = () => { const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a value.'); run(buildAddFirst(list, v)); setInputVal(''); };
  const addLast  = () => { const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a value.'); run(buildAddLast(list, v, type)); setInputVal(''); };
  const addAtIdx = () => {
    const v = parseInt(inputVal), i = parseInt(inputIdx);
    if (isNaN(v) || isNaN(i) || i < 0 || i > list.length) return setIdleMsg('Invalid value or index.');
    run(buildAddAtIndex(list, v, i)); setInputVal(''); setInputIdx('');
  };
  const deleteFirst = () => { if (!list.length) return setIdleMsg('List is empty!'); run(buildDeleteFirst(list)); };
  const deleteLast  = () => { if (!list.length) return setIdleMsg('List is empty!'); run(buildDeleteLast(list, type)); };
  const deleteAtIdx = () => {
    const i = parseInt(inputIdx);
    if (isNaN(i) || i < 0 || i >= list.length) return setIdleMsg('Invalid index.');
    run(buildDeleteAtIndex(list, i)); setInputIdx('');
  };
  const search = () => { const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a value.'); run(buildSearch(list, v)); };
  const traverse = () => { if (!list.length) return setIdleMsg('List is empty!'); run(buildTraverse(list)); };

  const reset_ = () => { setList(DEFAULT_LIST); reset(); setIdleMsg('List reset.'); setInputVal(''); setInputIdx(''); };

  const displayList = current ? current.list : list;
  const displayHL = current ? current.highlights : {};
  const displayMsg = current ? current.msg : idleMsg;

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Linked List</h1>
          <p>A sequence of nodes where each node stores data and a pointer to the next node. Unlike arrays, nodes are scattered in memory — no random access, but efficient insertions/deletions at any position.</p>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {TYPES.map(t => (
            <button key={t} className={`ds-tab${type===t?' active':''}`} onClick={() => switchType(t)}>
              {t} Linked List
            </button>
          ))}
        </div>

              {/* ── Custom initial values ── */}
      <div className="controls-panel" style={{ marginBottom:16 }}>
        <h3>Load Custom Values</h3>
        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Enter comma-separated numbers to pre-load the linked list with your own values.</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <input type="text" value={customInit} onChange={e => setCustomInit(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') applyCustomInit(); }}
            placeholder="e.g. 10, 25, 7, 42, 18"
            style={{ flex:1, minWidth:200, padding:'7px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'JetBrains Mono', fontSize:12 }} />
          <button className="btn btn-primary" onClick={applyCustomInit}>Load</button>
          <button className="btn btn-secondary" onClick={resetList}>↺ Reset</button>
        </div>
        {customInitErr && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{customInitErr}</div>}
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>2–10 integers, each 1–999. Works for all three list types (Singly, Doubly, Circular).</div>
      </div>
      <div className="ds-tabs">
          {OPS.map(o => <button key={o} className={`ds-tab${op===o?' active':''}`} onClick={() => switchOp(o)}>{o}</button>)}
        </div>

        <div className="ds-layout">
          <div>
            <div className="ds-canvas" style={{ overflowX: type==='Circular' ? 'visible' : 'auto', minHeight: type==='Circular' ? 320 : 130 }}>
              {displayList.length === 0
                ? <div style={{ color:'var(--muted)', fontFamily:'JetBrains Mono', fontSize:13 }}>Empty list — HEAD = null</div>
                : type === 'Circular'
                  ? <RingList values={displayList} highlights={displayHL} />
                  : (
                    <>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--accent)', marginBottom:8 }}>
                        HEAD → {displayList[0]}
                        {type === 'Doubly' && ` ← TAIL → ${displayList[displayList.length-1]}`}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', flexWrap:'nowrap', gap:0 }}>
                        {type === 'Singly' && displayList.map((v, i) => (
                          <SLLNode key={i} value={v} highlight={displayHL[i]} isHead={i===0} isTail={i===displayList.length-1} isLast={i===displayList.length-1}/>
                        ))}
                        {type === 'Doubly' && displayList.map((v, i) => (
                          <DLLNode key={i} value={v} highlight={displayHL[i]} isHead={i===0} isTail={i===displayList.length-1} isFirst={i===0} isLast={i===displayList.length-1}/>
                        ))}
                      </div>
                    </>
                  )
              }
            </div>

            <div className="ds-log" style={{ marginTop:12 }}>{displayMsg}</div>

            {/* Overview panels */}
            {op === 'Overview' && (
              <div style={{ marginTop:16 }}>
                {type === 'Singly' && (
                  <>
                    <div className="ds-info-box" style={{ marginBottom:12 }}>
                      Each node: <code>data | next→</code><br/>
                      <strong>HEAD</strong> points to first node. The last node has <code>next = null</code>.<br/>
                      No backward traversal possible.
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      {[['Add First','O(1)'],['Add Last','O(n)'],['Delete First','O(1)'],['Delete Last','O(n)'],['Search','O(n)'],['Access by index','O(n)']].map(([o,c])=>(
                        <div key={o} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:12, color:'var(--text)' }}>{o}</span>
                          <span style={{ fontFamily:'JetBrains Mono', fontSize:12, color:c==='O(1)'?'var(--green)':'var(--yellow)' }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {type === 'Doubly' && (
                  <>
                    <div className="ds-info-box" style={{ marginBottom:12 }}>
                      Each node: <code>←prev | data | next→</code><br/>
                      Can traverse <strong>both forward and backward</strong>.<br/>
                      Extra memory for <code>prev</code> pointer. <strong>TAIL</strong> pointer maintained.
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      {[['Add First','O(1)'],['Add Last','O(1)'],['Delete First','O(1)'],['Delete Last','O(1)'],['Delete at index','O(n)'],['Search','O(n)']].map(([o,c])=>(
                        <div key={o} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:12, color:'var(--text)' }}>{o}</span>
                          <span style={{ fontFamily:'JetBrains Mono', fontSize:12, color:c==='O(1)'?'var(--green)':'var(--yellow)' }}>{c}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {type === 'Circular' && (
                  <div className="ds-info-box">
                    Same as singly but <strong>TAIL.next → HEAD</strong> (no null terminator) — see the dashed loop in the diagram above.<br/><br/>
                    <strong>Use cases:</strong> Round-robin scheduling, music playlists, multiplayer games (turn rotation).<br/><br/>
                    <strong>Caution:</strong> Must track size or check for HEAD to avoid infinite loop during traversal.
                  </div>
                )}

                <div className="ds-op-group" style={{ marginTop:14 }}>
                  <label>Custom list (comma-separated, max 12)</label>
                  <div className="ds-input-row">
                    <input className="ds-input" value={customInput} onChange={e=>setCustomInput(e.target.value)} placeholder="e.g. 5, 12, 8, 1"/>
                    <button className="btn btn-secondary" onClick={loadCustom}>Load</button>
                  </div>
                </div>
              </div>
            )}

            {op === 'Traverse' && (
              <div style={{ marginTop:12 }}>
                <div className="ds-info-box">
                  Start at HEAD, follow <code>.next</code> pointers until <code>null</code> (or back to HEAD for circular).<br/>
                  Time: O(n) — must visit every node. Press ▶ Play to animate, or step with Next →.
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="ds-ops-panel">
            {op === 'Overview' && (
              <>
                <h3>Key Differences vs Array</h3>
                <div className="ds-info-box">
                  ✓ <strong>Dynamic size</strong> — no pre-allocation<br/>
                  ✓ <strong>O(1) insert/delete</strong> at known position<br/>
                  ✗ <strong>No random access</strong> — must traverse<br/>
                  ✗ <strong>Extra memory</strong> for pointers<br/>
                  ✗ <strong>Not cache-friendly</strong> — scattered in memory
                </div>
                <button className="btn btn-secondary" onClick={reset_} style={{ width:'100%' }}>↺ Reset</button>
              </>
            )}

            {(op === 'Add First' || op === 'Add Last') && (
              <>
                <h3>{op}</h3>
                <div className="ds-op-group">
                  <label>Value</label>
                  <input className="ds-input" type="number" value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="e.g. 99"/>
                </div>
                <button className="btn btn-primary" onClick={op==='Add First'?addFirst:addLast} style={{ width:'100%' }} disabled={running}>
                  ▶ {op}
                </button>
                <div className="ds-info-box">
                  {op==='Add First'
                    ? <>1. Create new node<br/>2. new.next = HEAD<br/>3. HEAD = new node<br/><strong>O(1)</strong></>
                    : type==='Doubly'
                      ? <>1. Create new node<br/>2. new.prev = TAIL<br/>3. TAIL.next = new<br/>4. TAIL = new<br/><strong>O(1) with tail pointer</strong></>
                      : <>1. Traverse to TAIL<br/>2. TAIL.next = new node<br/>3. Update TAIL<br/><strong>O(n)</strong></>
                  }
                </div>
              </>
            )}

            {op === 'Add at Index' && (
              <>
                <h3>Add at Index</h3>
                <div className="ds-op-group">
                  <label>Value</label>
                  <input className="ds-input" type="number" value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="value"/>
                </div>
                <div className="ds-op-group">
                  <label>Index (0 to {list.length})</label>
                  <input className="ds-input" type="number" value={inputIdx} onChange={e=>setInputIdx(e.target.value)} placeholder="index"/>
                </div>
                <button className="btn btn-primary" onClick={addAtIdx} style={{ width:'100%' }} disabled={running}>▶ Insert</button>
                <div className="ds-info-box">
                  1. Traverse to node[index-1]<br/>
                  2. new.next = node[index-1].next<br/>
                  3. node[index-1].next = new<br/>
                  <strong>O(n)</strong> — traversal to position
                </div>
              </>
            )}

            {(op === 'Delete First' || op === 'Delete Last') && (
              <>
                <h3>{op}</h3>
                <button className="btn btn-danger" onClick={op==='Delete First'?deleteFirst:deleteLast} style={{ width:'100%' }} disabled={running}>
                  ▶ {op}
                </button>
                <div className="ds-info-box">
                  {op==='Delete First'
                    ? <>1. temp = HEAD<br/>2. HEAD = HEAD.next<br/>3. free(temp)<br/><strong>O(1)</strong></>
                    : type==='Doubly'
                      ? <>1. temp = TAIL<br/>2. TAIL = TAIL.prev<br/>3. TAIL.next = null<br/>4. free(temp)<br/><strong>O(1) with tail pointer</strong></>
                      : <>1. Traverse to second-last<br/>2. second-last.next = null<br/>3. Update TAIL<br/><strong>O(n)</strong></>
                  }
                </div>
              </>
            )}

            {op === 'Delete at Index' && (
              <>
                <h3>Delete at Index</h3>
                <div className="ds-op-group">
                  <label>Index (0 to {Math.max(list.length-1,0)})</label>
                  <input className="ds-input" type="number" value={inputIdx} onChange={e=>setInputIdx(e.target.value)} placeholder="index"/>
                </div>
                <button className="btn btn-danger" onClick={deleteAtIdx} style={{ width:'100%' }} disabled={running}>▶ Delete</button>
                <div className="ds-info-box">
                  1. Traverse to node[index-1]<br/>
                  2. node[index-1].next = node[index].next<br/>
                  {type==='Doubly' && <>3. node[index+1].prev = node[index-1]<br/></>}
                  3. free(node[index])<br/>
                  <strong>O(n)</strong>
                </div>
              </>
            )}

            {op === 'Search' && (
              <>
                <h3>Search</h3>
                <div className="ds-op-group">
                  <label>Value to find</label>
                  <input className="ds-input" type="number" value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="value"/>
                </div>
                <button className="btn btn-primary" onClick={search} style={{ width:'100%' }} disabled={running}>▶ Search — O(n)</button>
                <div className="ds-info-box">
                  Traverse from HEAD, compare the data at each node until found or null reached. No binary search possible — no random access. <strong>Always O(n)</strong>.
                </div>
              </>
            )}

            {op === 'Traverse' && (
              <>
                <h3>Traverse</h3>
                <button className="btn btn-primary" onClick={traverse} style={{ width:'100%' }} disabled={running}>▶ Traverse All</button>
                <div className="ds-info-box">
                  Visit every node from HEAD to TAIL, following <code>.next</code> pointers. O(n).
                </div>
              </>
            )}

            {steps.length > 0 && (
              <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
                onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
                speed={speed} onSpeedChange={setSpeed} />
            )}

            {op !== 'Overview' && (
              <button className="btn btn-secondary" onClick={reset_} style={{ width:'100%', marginTop: steps.length>0?0:'auto' }}>↺ Reset List</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
