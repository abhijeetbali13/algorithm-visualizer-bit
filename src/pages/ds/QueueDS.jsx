import { useState, useRef } from 'react';
import { useVisualizer } from '../../hooks/useVisualizer';
import StepControls from '../../components/StepControls';
import './ds.css';

const TYPES = ['Simple Queue', 'Circular Queue', 'Deque (Double-ended)'];
const OPS   = ['Overview', 'Enqueue', 'Dequeue', 'Peek', 'Applications'];
const PALETTE = ['#00d4ff', '#a78bfa', '#22c55e', '#f97316', '#eab308', '#ef4444', '#34d399', '#f472b6'];

function QueueCell({ value, highlight, label }) {
  const colors = {
    front:   { bg:'rgba(0,212,255,0.2)',  border:'var(--accent)', text:'var(--accent)'  },
    rear:    { bg:'rgba(167,139,250,0.2)',border:'#a78bfa',       text:'#a78bfa'        },
    enqueue: { bg:'rgba(34,197,94,0.2)',  border:'var(--green)',  text:'var(--green)'   },
    dequeue: { bg:'rgba(239,68,68,0.15)',border:'var(--red)',     text:'var(--red)'     },
    current: { bg:'rgba(234,179,8,0.18)',border:'var(--yellow)',  text:'var(--yellow)'  },
  };
  const c = colors[highlight] || { bg:'var(--surface2)', border:'var(--border)', text:'var(--text)' };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      {label && <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:c.border, fontWeight:700 }}>{label}</div>}
      <div style={{ width:54, height:50, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:`2px solid ${c.border}`, background:c.bg, fontFamily:'JetBrains Mono', fontSize:16, fontWeight:700, color:c.text, transition:'all 0.25s', boxShadow: highlight?`0 0 8px ${c.border}44`:'' }}>
        {value}
      </div>
    </div>
  );
}

/* ───────────────────────── Step builders: core ops ───────────────────────── */

function buildEnqueue(queue, v, side = 'rear') {
  const result = side === 'rear' ? [...queue, v] : [v, ...queue];
  const idx = side === 'rear' ? queue.length : 0;
  const steps = [
    { queue: [...queue], hl: {}, msg: `Create new slot for ${v}.` },
    { queue: result, hl: { [idx]: 'enqueue' }, msg: `ENQUEUE ${v} at ${side.toUpperCase()}. O(1).` },
  ];
  return { steps, result };
}

function buildDequeue(queue, side = 'front') {
  const val = side === 'front' ? queue[0] : queue[queue.length - 1];
  const idx = side === 'front' ? 0 : queue.length - 1;
  const result = side === 'front' ? queue.slice(1) : queue.slice(0, -1);
  const steps = [
    { queue: [...queue], hl: { [idx]: 'dequeue' }, msg: `Read ${side.toUpperCase()} = ${val}. About to remove...` },
    { queue: result, hl: {}, msg: `DEQUEUE → removed ${val} from ${side.toUpperCase()}. O(1).` },
  ];
  return { steps, result };
}

function buildPeek(queue) {
  const steps = [{ queue: [...queue], hl: { 0: 'front' }, msg: `FRONT element is ${queue[0]}. Queue unchanged. O(1).` }];
  return { steps, result: queue };
}

/* ───────────────────────── Step builder: Round Robin CPU Scheduling ───────────────────────── */

function buildRoundRobin(bursts, quantum) {
  const n = bursts.length;
  const remaining = bursts.map(b => b);
  let q = Array.from({ length: n }, (_, i) => i);
  let time = 0;
  const gantt = [];
  const completion = Array(n).fill(null);
  const steps = [];

  steps.push({ queue: [...q], current: null, time, gantt: [...gantt],
    msg: `All ${n} processes arrive at t=0 and join the ready queue: [${q.map(i => 'P' + (i + 1)).join(', ')}]. Quantum = ${quantum}.` });

  let guard = 0;
  while (q.length && guard++ < 500) {
    const pid = q.shift();
    const run = Math.min(quantum, remaining[pid]);
    const start = time, end = time + run;
    gantt.push({ pid, start, end });
    remaining[pid] -= run;
    time = end;
    steps.push({ queue: [...q], current: pid, time, gantt: [...gantt],
      msg: `Dequeue P${pid + 1} (front of queue). Run on CPU for ${run} unit(s): [${start} → ${end}]. Remaining burst: ${remaining[pid]}.` });
    if (remaining[pid] > 0) {
      q.push(pid);
      steps.push({ queue: [...q], current: null, time, gantt: [...gantt],
        msg: `P${pid + 1} still has ${remaining[pid]} unit(s) left → quantum expired, re-enqueue at REAR. Queue: [${q.map(i => 'P' + (i + 1)).join(', ')}]` });
    } else {
      completion[pid] = time;
      steps.push({ queue: [...q], current: null, time, gantt: [...gantt],
        msg: `P${pid + 1} has 0 remaining burst → COMPLETE at t=${time}. ✓` });
    }
  }

  const turnaround = completion.map(c => c);
  const waiting = turnaround.map((t, i) => t - bursts[i]);
  const avgTAT = turnaround.reduce((a, b) => a + b, 0) / n;
  const avgWT = waiting.reduce((a, b) => a + b, 0) / n;

  steps.push({ queue: [], current: null, time, gantt: [...gantt],
    msg: `All processes finished at t=${time}. Average waiting time = ${avgWT.toFixed(2)}, average turnaround time = ${avgTAT.toFixed(2)}.` });

  return { steps, gantt, completion, waiting, turnaround, avgWT, avgTAT };
}

/* ───────────────────────── Main component ───────────────────────── */

export default function QueueDS() {
  const [queueInitInput, setQueueInitInput] = useState('');
  const [queueInitErr, setQueueInitErr]     = useState('');
  const [type, setType]       = useState('Simple Queue');
  const [queue, setQueue]     = useState([15, 28, 7, 42]);
  const [tab, setTab]         = useState('Overview');
  const [idleMsg, setIdleMsg] = useState('Select an operation, then press ▶ Play.');
  const [inputVal, setInput]  = useState('');
  const [burstsInput, setBurstsInput] = useState('5, 3, 8');
  const [quantum, setQuantum] = useState(3);
  const [rrResult, setRrResult] = useState(null);

  const pendingSteps = useRef([]);
  const viz = useVisualizer(() => pendingSteps.current);
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const run = (builderResult) => {
    pendingSteps.current = builderResult.steps;
    if (Array.isArray(builderResult.result)) setQueue(builderResult.result);
    reset();
    start();
  };

  const enqueue = () => { const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a valid number.'); run(buildEnqueue(queue, v, 'rear')); setInput(''); };
  const dequeue = () => { if (!queue.length) return setIdleMsg('Queue Underflow! Queue is empty.'); run(buildDequeue(queue, 'front')); };
  const peek    = () => { if (!queue.length) return setIdleMsg('Queue is empty!'); run(buildPeek(queue)); };
  const enqueueFront = () => { const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a value.'); run(buildEnqueue(queue, v, 'front')); setInput(''); };
  const dequeueRear  = () => { if (!queue.length) return setIdleMsg('Queue is empty!'); run(buildDequeue(queue, 'rear')); };

  const reset_ = () => { setQueue([15,28,7,42]); reset(); setIdleMsg('Queue reset.'); setInput(''); };
  const applyCustomQueue = () => {
    const items = queueInitInput.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length < 1) { setQueueInitErr('Enter at least 1 value'); return; }
    if (items.length > 8) { setQueueInitErr('Max 8 items'); return; }
    setQueueInitErr(''); setQueueInitInput('');
    setQueue(items);
    setTab('Overview');
    setIdleMsg('Custom queue loaded. Use Enqueue / Dequeue to interact.');
  };
  const clearQueue = () => { setQueue([]); setIdleMsg('Queue cleared.'); };
  const switchType = (t) => { setType(t); setTab('Overview'); setQueue([15,28,7,42]); reset(); setIdleMsg('Select an operation, then press ▶ Play.'); };
  const switchTab = (t) => { setTab(t); reset(); };

  const runScheduler = () => {
    const bursts = burstsInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0).slice(0, 6);
    const q = parseInt(quantum);
    if (bursts.length < 2) return setIdleMsg('Enter at least 2 burst times, e.g. 5, 3, 8');
    if (isNaN(q) || q < 1) return setIdleMsg('Quantum must be a positive number.');
    const result = buildRoundRobin(bursts, q);
    pendingSteps.current = result.steps;
    setRrResult(result);
    reset();
    start();
  };

  const isFront = (i) => i === 0;
  const isRear  = (i) => i === queue.length - 1;
  const dispQueue = current ? current.queue : queue;
  const dispHL = current ? current.hl : {};
  const getHL = (i) => { if (dispHL[i]) return dispHL[i]; if (isFront(i)) return 'front'; if (isRear(i)) return 'rear'; return null; };
  const getLabel = (i) => { const both = isFront(i) && isRear(i); if (both) return 'FRONT=REAR'; if (isFront(i)) return 'FRONT'; if (isRear(i)) return 'REAR'; return null; };
  const displayMsg = current ? current.msg : idleMsg;

  const rrCurrent = tab === 'Applications' ? current : null;
  const rrQueue = rrCurrent ? rrCurrent.queue : [];
  const rrGantt = rrCurrent ? rrCurrent.gantt : (rrResult ? rrResult.gantt : []);
  const rrTime = rrCurrent ? rrCurrent.time : 0;
  const rrActivePid = rrCurrent ? rrCurrent.current : null;
  const maxTime = rrGantt.length ? Math.max(...rrGantt.map(g => g.end)) : 1;

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Queue</h1>
          <p>FIFO — First In, First Out. Like a real queue/line: the first person to join is the first to leave. Elements enter from REAR and leave from FRONT.</p>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {TYPES.map(t => (
            <button key={t} className={`ds-tab${type===t?' active':''}`} onClick={() => switchType(t)}>{t}</button>
          ))}
        </div>

              {/* ── Custom queue input ── */}
      <div className="controls-panel" style={{ marginBottom:16 }}>
        <h3>Load Custom Queue</h3>
        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Pre-fill the queue with your own values (front → rear, left → right).</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <input type="text" value={queueInitInput} onChange={e => setQueueInitInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') applyCustomQueue(); }}
            placeholder="e.g. 15, 28, 7, 42 (front to rear)"
            style={{ flex:1, minWidth:200, padding:'7px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'JetBrains Mono', fontSize:12 }} />
          <button className="btn btn-primary" onClick={applyCustomQueue}>Load</button>
          <button className="btn btn-secondary" onClick={clearQueue}>↺ Clear Queue</button>
        </div>
        {queueInitErr && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{queueInitErr}</div>}
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>2–8 values. Leftmost becomes FRONT, rightmost becomes REAR.</div>
      </div>
      <div className="ds-tabs">
          {OPS.map(o => <button key={o} className={`ds-tab${tab===o?' active':''}`} onClick={()=>switchTab(o)}>{o}</button>)}
        </div>

        <div className="ds-layout">
          <div>
            {tab !== 'Applications' && (
              <div className="ds-canvas" style={{ flexDirection:'column', gap:16, minHeight:160 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)' }}>
                  <span style={{ color:'var(--red)' }}>← DEQUEUE (FRONT)</span>
                  <span style={{ color:'var(--green)' }}>ENQUEUE (REAR) →</span>
                </div>

                {dispQueue.length === 0
                  ? <div style={{ color:'var(--muted)', fontFamily:'JetBrains Mono', fontSize:13, padding:'20px 0', textAlign:'center' }}>Queue is empty</div>
                  : (
                    <div style={{ display:'flex', alignItems:'flex-end', gap:4, flexWrap:'wrap' }}>
                      {dispQueue.map((v, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:0 }}>
                          {i === 0 && (
                            <svg width="28" height="20">
                              <line x1="0" y1="10" x2="22" y2="10" stroke="var(--red)" strokeWidth="2" strokeDasharray="4"/>
                              <polygon points="2,6 10,10 2,14" fill="var(--red)"/>
                            </svg>
                          )}
                          <QueueCell value={v} highlight={getHL(i)} label={getLabel(i)} />
                          {i < dispQueue.length - 1 && (
                            <svg width="20" height="20"><line x1="0" y1="10" x2="14" y2="10" stroke="var(--border)" strokeWidth="1.5"/></svg>
                          )}
                          {i === dispQueue.length - 1 && (
                            <svg width="28" height="20">
                              <line x1="6" y1="10" x2="28" y2="10" stroke="var(--green)" strokeWidth="2" strokeDasharray="4"/>
                              <polygon points="18,6 26,10 18,14" fill="var(--green)"/>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                }

                {type === 'Circular Queue' && (
                  <div style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)', lineHeight:1.8 }}>
                    <span style={{ color:'var(--accent)' }}>Circular Queue:</span> REAR wraps around to index 0 when the underlying array is full.<br/>
                    front = (front + 1) % capacity &nbsp;|&nbsp; rear = (rear + 1) % capacity<br/>
                    Fixes the "False Full" problem of a simple queue — reuses freed slots instead of wasting them.
                  </div>
                )}

                {type === 'Deque (Double-ended)' && (
                  <div style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)', lineHeight:1.8 }}>
                    <span style={{ color:'var(--accent)' }}>Deque:</span> Insert and delete from BOTH ends.<br/>
                    Supports: addFront, addRear, removeFront, removeRear — all O(1).<br/>
                    Used in: sliding window maximum, palindrome check, browser history.
                  </div>
                )}
              </div>
            )}

            {tab !== 'Applications' && <div className="ds-log" style={{ marginTop:12 }}>{displayMsg}</div>}

            {tab === 'Overview' && (
              <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {(type === 'Simple Queue' || type === 'Circular Queue') && [
                  ['Enqueue (rear)', 'O(1)', 'Add at rear'],
                  ['Dequeue (front)', 'O(1)', 'Remove from front'],
                  ['Peek / Front', 'O(1)', 'Read front element'],
                  ['isEmpty', 'O(1)', 'Check if queue empty'],
                  ['Search', 'O(n)', 'Traverse to find element'],
                  ['Space', 'O(n)', 'n elements in queue'],
                ].map(([op,c,d])=>(
                  <div key={op} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontSize:12, color:'var(--text)' }}>{op}</span>
                      <span style={{ fontFamily:'JetBrains Mono', fontSize:12, color:c==='O(1)'?'var(--green)':'var(--yellow)' }}>{c}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{d}</div>
                  </div>
                ))}
                {type === 'Deque (Double-ended)' && [
                  ['addFront', 'O(1)', 'Add at front'],
                  ['addRear', 'O(1)', 'Add at rear'],
                  ['removeFront', 'O(1)', 'Remove from front'],
                  ['removeRear', 'O(1)', 'Remove from rear'],
                  ['peekFront', 'O(1)', 'Read front'],
                  ['peekRear', 'O(1)', 'Read rear'],
                ].map(([op,c,d])=>(
                  <div key={op} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ fontSize:12, color:'var(--text)' }}>{op}</span>
                      <span style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--green)' }}>{c}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{d}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'Applications' && (
              <div>
                <div className="ds-canvas" style={{ flexDirection:'column', gap:18, minHeight:260 }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:13, color:'var(--muted)' }}>
                    Round-Robin CPU Scheduling — the classic queue application. Each process gets a fixed time slice (quantum); if it is not done, it goes to the back of the queue.
                  </div>

                  <div>
                    <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:6 }}>READY QUEUE (front → rear)</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', minHeight:54 }}>
                      {rrQueue.length === 0
                        ? <span style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)' }}>{rrResult ? 'empty' : 'Press ▶ Run to start'}</span>
                        : rrQueue.map((pid, i) => (
                          <div key={i} style={{ padding:'8px 14px', borderRadius:6, background:`${PALETTE[pid % PALETTE.length]}22`, border:`2px solid ${PALETTE[pid % PALETTE.length]}`, fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color:PALETTE[pid % PALETTE.length] }}>
                            P{pid + 1}
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:6 }}>CPU</div>
                    <div style={{ width:90, height:60, borderRadius:8, border:`2px solid ${rrActivePid!=null ? PALETTE[rrActivePid % PALETTE.length] : 'var(--border)'}`, background: rrActivePid!=null ? `${PALETTE[rrActivePid % PALETTE.length]}22` : 'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'JetBrains Mono', fontSize:16, fontWeight:700, color: rrActivePid!=null ? PALETTE[rrActivePid % PALETTE.length] : 'var(--muted)', transition:'all 0.25s' }}>
                      {rrActivePid != null ? `P${rrActivePid + 1}` : 'idle'}
                    </div>
                  </div>

                  {rrGantt.length > 0 && (
                    <div>
                      <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:6 }}>GANTT CHART (t=0 → {rrTime})</div>
                      <div style={{ display:'flex', height:40, borderRadius:6, overflow:'hidden', border:'1px solid var(--border)' }}>
                        {rrGantt.map((g, i) => (
                          <div key={i} title={`P${g.pid+1}: ${g.start}-${g.end}`} style={{
                            width: `${((g.end - g.start) / maxTime) * 100}%`,
                            background: `${PALETTE[g.pid % PALETTE.length]}33`,
                            borderRight: '1px solid var(--bg)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color: PALETTE[g.pid % PALETTE.length],
                            minWidth: 24,
                          }}>
                            P{g.pid+1}
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', marginTop:4 }}>
                        <span>0</span><span>{maxTime}</span>
                      </div>
                    </div>
                  )}

                  {rrResult && stepIdx >= steps.length - 1 && (
                    <div style={{ display:'grid', gridTemplateColumns:`repeat(${rrResult.waiting.length}, 1fr)`, gap:8 }}>
                      {rrResult.waiting.map((w, i) => (
                        <div key={i} style={{ background:'var(--surface2)', border:`1px solid ${PALETTE[i % PALETTE.length]}`, borderRadius:6, padding:'6px 10px', textAlign:'center' }}>
                          <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:PALETTE[i % PALETTE.length], fontWeight:700 }}>P{i+1}</div>
                          <div style={{ fontSize:10, color:'var(--muted)' }}>wait {w} · TAT {rrResult.turnaround[i]}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ds-log" style={{ marginTop:12 }}>{rrCurrent ? rrCurrent.msg : (rrResult ? 'Scheduling complete. Press ▶ Play again to replay, or change inputs and Run again.' : 'Set burst times and quantum on the right, then press ▶ Run.')}</div>

                <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    ['CPU Scheduling', 'Round-robin process scheduling (animated above) uses a queue to give every process a fair time slice.'],
                    ['BFS traversal', 'Graph/tree BFS uses a queue to visit level by level.'],
                    ['Print Spooler', 'Print jobs are queued and processed in the order they were sent.'],
                    ['I/O Buffers', 'Keyboard buffer, network packet queue — data arrives faster than it is consumed.'],
                    ['Sliding Window', 'A deque tracks the max/min in a moving window in O(1) amortized.'],
                    ['Palindrome Check', 'A deque compares front and rear characters moving inward.'],
                  ].map(([title, desc]) => (
                    <div key={title} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--accent)', marginBottom:4 }}>{title}</div>
                      <div style={{ fontSize:12, color:'var(--muted)' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="ds-ops-panel">
            {tab === 'Overview' && (
              <>
                <h3>Queue State</h3>
                <div className="ds-info-box">
                  Size: <strong style={{ color:'var(--accent)' }}>{queue.length}</strong><br/>
                  Front: <strong style={{ color:'var(--accent)' }}>{queue.length ? queue[0] : '—'}</strong><br/>
                  Rear: <strong style={{ color:'#a78bfa' }}>{queue.length ? queue[queue.length-1] : '—'}</strong><br/>
                  Empty: <strong style={{ color: queue.length?'var(--green)':'var(--red)' }}>{queue.length ? 'No' : 'Yes'}</strong>
                </div>
                <button className="btn btn-secondary" onClick={reset_} style={{ width:'100%' }}>↺ Reset</button>
              </>
            )}

            {tab === 'Enqueue' && (
              <>
                <h3>Enqueue</h3>
                <div className="ds-op-group">
                  <label>Value</label>
                  <input className="ds-input" type="number" value={inputVal} onChange={e=>setInput(e.target.value)} placeholder="e.g. 99"/>
                </div>
                <button className="btn btn-primary" onClick={enqueue} style={{ width:'100%' }} disabled={running}>▶ Enqueue at REAR →</button>
                {type === 'Deque (Double-ended)' && (
                  <button className="btn btn-secondary" onClick={enqueueFront} style={{ width:'100%' }} disabled={running}>▶ ← Enqueue at FRONT (Deque)</button>
                )}
                <div className="ds-info-box">
                  <strong>Simple/Circular:</strong> Add at rear only.<br/>
                  <strong>Deque:</strong> Add at front OR rear — both O(1).
                </div>
              </>
            )}

            {tab === 'Dequeue' && (
              <>
                <h3>Dequeue</h3>
                <button className="btn btn-danger" onClick={dequeue} style={{ width:'100%' }} disabled={running}>▶ ← Dequeue from FRONT</button>
                {type === 'Deque (Double-ended)' && (
                  <button className="btn btn-danger" onClick={dequeueRear} style={{ width:'100%' }} disabled={running}>▶ Dequeue from REAR → (Deque)</button>
                )}
                <div className="ds-info-box">
                  <strong>Simple/Circular:</strong> Remove from front only.<br/>
                  <strong>Deque:</strong> Remove from front OR rear — both O(1).<br/><br/>
                  Attempting dequeue on an empty queue = <strong style={{ color:'var(--red)' }}>Underflow</strong>.
                </div>
              </>
            )}

            {tab === 'Peek' && (
              <>
                <h3>Peek</h3>
                <button className="btn btn-secondary" onClick={peek} style={{ width:'100%' }} disabled={running}>▶ Peek FRONT</button>
                <div className="ds-info-box">
                  Returns the front element <strong>without removing it</strong>.<br/>
                  O(1) — direct access to the front pointer.
                </div>
              </>
            )}

            {tab === 'Applications' && (
              <>
                <h3>Round-Robin Scheduler</h3>
                <div className="ds-op-group">
                  <label>Burst times (comma-separated)</label>
                  <input className="ds-input" value={burstsInput} onChange={e=>setBurstsInput(e.target.value)} placeholder="e.g. 5, 3, 8"/>
                </div>
                <div className="ds-op-group">
                  <label>Time quantum</label>
                  <input className="ds-input" type="number" min="1" value={quantum} onChange={e=>setQuantum(e.target.value)} placeholder="e.g. 3"/>
                </div>
                <button className="btn btn-primary" onClick={runScheduler} style={{ width:'100%' }} disabled={running}>▶ Run Scheduler</button>
                <div className="ds-info-box">
                  All processes assumed to arrive at t=0.<br/>
                  Each gets up to <code>quantum</code> time units, then — if unfinished — moves to the back of the queue.<br/>
                  <strong>Fair, no starvation</strong> — used in real time-sharing OS schedulers.
                </div>
              </>
            )}

            {steps.length > 0 && (
              <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
                onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
                speed={speed} onSpeedChange={setSpeed} />
            )}

            {tab !== 'Overview' && tab !== 'Applications' && (
              <button className="btn btn-secondary" onClick={reset_} style={{ width:'100%', marginTop: steps.length>0?0:'auto' }}>↺ Reset Queue</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
