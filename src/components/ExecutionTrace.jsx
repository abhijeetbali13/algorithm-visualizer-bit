import { memo } from 'react';

/**
 * Scrollable execution trace synced with visualizer step index.
 */
function ExecutionTrace({ steps = [], stepIdx = -1, onJumpTo, maxHeight = 320 }) {
  if (!steps.length) {
    return (
      <div className="controls-panel empty-panel">
        <h3>Execution Trace</h3>
        <p className="empty-text">Run the visualizer to see each step logged here in order.</p>
      </div>
    );
  }

  return (
    <div className="controls-panel execution-trace">
      <h3>Execution Trace</h3>
      <div className="trace-list" style={{ maxHeight }}>
        {steps.map((step, i) => {
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <button
              key={i}
              type="button"
              className={`trace-item${active ? ' active' : ''}${done ? ' done' : ''}`}
              onClick={() => onJumpTo?.(i)}
              disabled={!onJumpTo}
            >
              <span className="trace-step">{i + 1}</span>
              <span className="trace-msg">{step.msg || `Step ${i + 1}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ExecutionTrace);
