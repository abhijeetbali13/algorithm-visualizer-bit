export default function StepControls({ running, stepIdx, totalSteps, onStart, onPause, onReset, onPrev, onNext, onGenerate, speed, onSpeedChange, extraButtons }) {
  const hasPrev = stepIdx > 0;
  const hasNext = stepIdx < totalSteps - 1;
  const done = stepIdx === totalSteps - 1 && totalSteps > 0;

  return (
    <div className="controls-panel">
      <h3>Controls</h3>
      {onGenerate && (
        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 8 }} onClick={onGenerate}>
          ⟳ New Input
        </button>
      )}
      {extraButtons}
      {/* Step nav row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onPrev} disabled={!hasPrev || running}>
          ← Prev
        </button>
        {!running
          ? <button className="btn btn-primary" style={{ flex: 1 }} onClick={onStart} disabled={done}>
              {stepIdx < 0 ? '▶ Start' : done ? '✓ Done' : '▶ Play'}
            </button>
          : <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onPause}>
              ⏸ Pause
            </button>
        }
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onNext} disabled={!hasNext || running}>
          Next →
        </button>
      </div>
      <button className="btn btn-danger" style={{ width: '100%' }} onClick={onReset}>
        ↺ Reset
      </button>
      <div className="speed-control">
        <label>Speed: {speed <= 100 ? 'Fast' : speed <= 400 ? 'Medium' : 'Slow'}</label>
        <input type="range" min="50" max="900" step="50" value={speed} onChange={e => onSpeedChange(Number(e.target.value))} />
      </div>
      {totalSteps > 0 && (
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          Step {Math.max(stepIdx, 0) + 1} / {totalSteps}
        </div>
      )}
    </div>
  );
}
