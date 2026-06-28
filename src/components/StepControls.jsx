import { useState } from 'react';

export default function StepControls({
  running, stepIdx, totalSteps,
  onStart, onPause, onReset, onRestart, onPrev, onNext,
  onGenerate, speed, onSpeedChange,
  onJumpTo, extraButtons,
}) {
  const [jumpVal, setJumpVal] = useState('');
  const hasPrev = stepIdx > 0;
  const hasNext = stepIdx < totalSteps - 1;
  const done = stepIdx === totalSteps - 1 && totalSteps > 0;
  const pct = totalSteps > 0 ? Math.round(((stepIdx + 1) / totalSteps) * 100) : 0;
  const handleRestart = onRestart || onReset;

  const handleJump = () => {
    const n = parseInt(jumpVal, 10) - 1;
    if (!isNaN(n) && onJumpTo) { onJumpTo(n); setJumpVal(''); }
  };

  const handleTimelineClick = (e) => {
    if (!onJumpTo || running || totalSteps <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onJumpTo(Math.round(ratio * (totalSteps - 1)));
  };

  const speedLabel = speed <= 80 ? '4×' : speed <= 150 ? '2×' : speed <= 350 ? '1×' : speed <= 600 ? '0.5×' : '0.25×';
  const playLabel = stepIdx < 0 ? '▶ Start' : done ? '✓ Done' : running ? '⏸ Pause' : '▶ Resume';

  return (
    <div className="controls-panel step-controls">
      <h3>Controls</h3>

      {totalSteps > 0 && (
        <div className="step-progress-block">
          <div className="step-progress-header">
            <span>Step {Math.max(stepIdx + 1, 0)} / {totalSteps}</span>
            <span className="step-pct">{pct}%</span>
          </div>
          <div
            className="step-timeline"
            onClick={handleTimelineClick}
            role="slider"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={Math.max(stepIdx + 1, 0)}
            aria-label="Jump to step"
          >
            <div className="step-timeline-fill" style={{ width: `${pct}%` }} />
            {totalSteps <= 40 && Array.from({ length: totalSteps }, (_, i) => (
              <span
                key={i}
                className={`step-tick${i === stepIdx ? ' active' : ''}${i < stepIdx ? ' done' : ''}`}
                style={{ left: `${((i + 0.5) / totalSteps) * 100}%` }}
              />
            ))}
          </div>
          <div className="step-progress-bar">
            <div className="step-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {onGenerate && (
        <button className="btn btn-secondary btn-full" onClick={onGenerate} disabled={running} type="button">
          ⟳ New Random Input
        </button>
      )}
      {extraButtons}

      <div className="step-btn-row">
        <button className="btn btn-secondary" onClick={onPrev} disabled={!hasPrev || running} title="Previous step" type="button">← Prev</button>
        {!running
          ? <button className="btn btn-primary step-play-btn" onClick={onStart} disabled={done} title={playLabel} type="button">{playLabel}</button>
          : <button className="btn btn-secondary step-play-btn" onClick={onPause} title="Pause" type="button">⏸ Pause</button>
        }
        <button className="btn btn-secondary" onClick={onNext} disabled={!hasNext || running} title="Next step" type="button">Next →</button>
      </div>

      <div className="step-btn-row">
        <button className="btn btn-danger btn-full" onClick={onReset} type="button">↺ Reset</button>
        {totalSteps > 0 && (
          <button className="btn btn-secondary btn-full" onClick={handleRestart} disabled={running} type="button">↻ Restart</button>
        )}
      </div>

      {onJumpTo && totalSteps > 0 && (
        <div className="step-jump-row">
          <input
            type="number"
            value={jumpVal}
            onChange={e => setJumpVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJump()}
            placeholder={`Jump (1–${totalSteps})`}
            min={1}
            max={totalSteps}
            disabled={running}
            className="ds-input"
          />
          <button className="btn btn-secondary" onClick={handleJump} disabled={running} type="button">Go</button>
        </div>
      )}

      <div className="speed-control">
        <div className="speed-control-header">
          <span>Speed</span>
          <span className="speed-label">{speedLabel}</span>
        </div>
        <input
          type="range"
          min={50}
          max={900}
          step={50}
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
        />
        <div className="speed-hints"><span>Fast (4×)</span><span>Slow (0.25×)</span></div>
      </div>
    </div>
  );
}
