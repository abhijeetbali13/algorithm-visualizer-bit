import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

const PRESETS = [
  {
    name: 'Classic',
    activities: [
      { name:'A1', start:1, end:4  },
      { name:'A2', start:3, end:5  },
      { name:'A3', start:0, end:6  },
      { name:'A4', start:5, end:7  },
      { name:'A5', start:3, end:9  },
      { name:'A6', start:5, end:9  },
      { name:'A7', start:6, end:10 },
      { name:'A8', start:8, end:11 },
      { name:'A9', start:8, end:12 },
      { name:'A10',start:2, end:14 },
      { name:'A11',start:12,end:16 },
    ],
  },
  {
    name: 'Simple',
    activities: [
      { name:'A', start:1, end:3  },
      { name:'B', start:2, end:5  },
      { name:'C', start:4, end:7  },
      { name:'D', start:1, end:8  },
      { name:'E', start:5, end:9  },
      { name:'F', start:8, end:10 },
    ],
  },
];

function activitySelectionSteps(activities) {
  const sorted = [...activities].sort((a, b) => a.end - b.end);
  const steps = [];
  const selected = [];

  steps.push({ sorted: [...sorted], selected: [], currentIdx: -1, lastEnd: -1, msg: `Sort ${sorted.length} activities by finish time: ${sorted.map(a => `${a.name}(${a.start}-${a.end})`).join(', ')}` });

  let lastEnd = -Infinity;

  for (let i = 0; i < sorted.length; i++) {
    const act = sorted[i];
    const compatible = act.start >= lastEnd;

    steps.push({
      sorted: [...sorted], selected: [...selected], currentIdx: i, lastEnd,
      compatible,
      msg: `Consider ${act.name} [${act.start}, ${act.end}]: start(${act.start}) ${compatible ? '>=' : '<'} lastEnd(${lastEnd === -Infinity ? '-∞' : lastEnd}) → ${compatible ? '✓ Compatible! Select it.' : '✗ Conflicts with last selected activity.'}`,
    });

    if (compatible) {
      selected.push(i);
      lastEnd = act.end;
      steps.push({ sorted: [...sorted], selected: [...selected], currentIdx: i, lastEnd, compatible: true, msg: `Selected ${act.name}! lastEnd updated to ${act.end}. Total selected: ${selected.length}.` });
    }
  }

  steps.push({ sorted: [...sorted], selected: [...selected], currentIdx: -1, lastEnd, done: true, msg: `✓ Done! Maximum ${selected.length} non-overlapping activities: ${selected.map(i => sorted[i].name).join(', ')}` });
  return steps;
}

export default function ActivitySelection() {
  const [presetIdx, setPresetIdx] = useState(0);
  const { activities } = PRESETS[presetIdx];
  const switchPreset = (i) => { viz.reset(); setPresetIdx(i); };

  const viz = useVisualizer(() => activitySelectionSteps(activities));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const sorted      = current?.sorted      || [...activities].sort((a,b)=>a.end-b.end);
  const selected    = current?.selected    || [];
  const currentIdx  = current?.currentIdx  ?? -1;
  const lastEnd     = current?.lastEnd     ?? -Infinity;
  const compatible  = current?.compatible;
  const done        = current?.done        || false;

  const maxEnd = Math.max(...activities.map(a => a.end), 1);
  const timelineWidth = 540;

  const getBarColor = (i) => {
    if (selected.includes(i)) return 'var(--green)';
    if (i === currentIdx) return compatible ? 'var(--accent)' : 'var(--red)';
    return '#1e3a5f';
  };

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Activity Selection Problem</h1>
          <p>Select the maximum number of non-overlapping activities. Greedy strategy: <strong style={{ color: 'var(--accent)' }}>always pick the activity with the earliest finish time</strong> that doesn't conflict with the last selected one.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Press ▶ Start or step through'}</div>

            {/* lastEnd tracker */}
            {currentIdx >= 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 14px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Last end: </span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{lastEnd === -Infinity ? '−∞' : lastEnd}</span>
                </div>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 14px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)' }}>Selected: </span>
                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>{selected.length}</span>
                </div>
                {compatible !== undefined && (
                  <div style={{ background: compatible ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${compatible ? 'var(--green)' : 'var(--red)'}`, borderRadius: 6, padding: '5px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: compatible ? 'var(--green)' : 'var(--red)' }}>
                    {compatible ? '✓ Compatible' : '✗ Conflict'}
                  </div>
                )}
              </div>
            )}

            {/* Gantt-style timeline */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 16px', overflowX: 'auto' }}>
              <div className="section-label">Timeline (sorted by finish time)</div>

              {/* Time axis */}
              <div style={{ display: 'flex', marginBottom: 8, paddingLeft: 44 }}>
                {Array.from({ length: maxEnd + 1 }, (_, t) => (
                  <div key={t} style={{ width: `${timelineWidth / maxEnd}px`, fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono', textAlign: 'left', borderLeft: '1px solid var(--border)', paddingLeft: 2, paddingBottom: 4 }}>{t}</div>
                ))}
              </div>

              {/* Activity bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {sorted.map((act, i) => {
                  const col = getBarColor(i);
                  const barLeft = (act.start / maxEnd) * timelineWidth;
                  const barWidth = ((act.end - act.start) / maxEnd) * timelineWidth;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, fontFamily: 'JetBrains Mono', fontSize: 11, color: col === '#1e3a5f' ? 'var(--muted)' : col, fontWeight: isCurrent ? 700 : 400, textAlign: 'right' }}>{act.name}</div>
                      <div style={{ position: 'relative', width: timelineWidth, height: 22 }}>
                        <div style={{ position: 'absolute', left: barLeft, width: barWidth, height: '100%', background: col, borderRadius: 4, opacity: col === '#1e3a5f' ? 0.4 : 0.9, border: isCurrent ? `2px solid ${compatible ? 'var(--green)' : 'var(--red)'}` : '2px solid transparent', transition: 'background 0.2s, border-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: col === '#1e3a5f' ? 'transparent' : '#0b0f1a', fontWeight: 700 }}>{act.start}–{act.end}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* lastEnd marker */}
              {lastEnd !== -Infinity && lastEnd > 0 && (
                <div style={{ position: 'relative', marginTop: 8, paddingLeft: 44 }}>
                  <div style={{ position: 'absolute', left: `${44 + (lastEnd / maxEnd) * timelineWidth}px`, top: -200, bottom: 0, width: 2, background: 'var(--accent)', opacity: 0.5, pointerEvents: 'none' }} />
                </div>
              )}
            </div>

            {done && (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--green)', borderRadius: 8, padding: '10px 16px', marginTop: 14, fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--green)' }}>
                ✓ Maximum {selected.length} activities: {selected.map(i => sorted[i].name).join(' → ')}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="controls-panel">
              <h3>Preset</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => switchPreset(i)} className="btn btn-secondary"
                    style={{ flex: 1, fontSize: 12, background: presetIdx === i ? 'rgba(0,212,255,0.1)' : '', borderColor: presetIdx === i ? 'var(--accent)' : '', color: presetIdx === i ? 'var(--accent)' : '' }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
              onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
              speed={speed} onSpeedChange={setSpeed} />
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Sort</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Select</div><div className="value">O(n)</div></div>
                <div className="info-chip"><div className="label">Total</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Optimal</div><div className="value">Yes ✓</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Why Greedy Works</h3>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                Picking earliest finish time leaves maximum room for future activities. Can be proven optimal by an exchange argument: any solution with a later-finishing first activity can be swapped without reducing the count.
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">
                sort by finish time{'\n'}
                selected = [first]{'\n'}
                lastEnd = first.end{'\n\n'}
                <span className="kw">for</span> each activity a:{'\n'}
                {'  '}<span className="kw">if</span> a.start &gt;= lastEnd:{'\n'}
                {'    '}selected.add(a){'\n'}
                {'    '}lastEnd = a.end{'\n\n'}
                <span className="cm">// Greedy: earliest finish</span>{'\n'}
                <span className="cm">// → max activities</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}