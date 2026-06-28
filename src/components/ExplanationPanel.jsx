import { memo } from 'react';

function ExplanationPanel({ stepIdx, totalSteps, message, title = 'Step Explanation' }) {
  const stepNum = stepIdx >= 0 ? stepIdx + 1 : 0;
  const hasMessage = Boolean(message?.trim());

  return (
    <div className="explanation-panel" role="status" aria-live="polite" aria-atomic="true">
      <div className="explanation-header">
        <span className="explanation-title">{title}</span>
        {totalSteps > 0 && (
          <span className="explanation-step-badge">
            {stepNum > 0 ? `Step ${stepNum} / ${totalSteps}` : 'Ready'}
          </span>
        )}
      </div>
      <div className={`explanation-body${hasMessage ? ' active' : ''}`}>
        {hasMessage ? message : 'Press ▶ Start or use Next → to begin. Each step will explain what the algorithm is doing.'}
      </div>
    </div>
  );
}

export default memo(ExplanationPanel);
