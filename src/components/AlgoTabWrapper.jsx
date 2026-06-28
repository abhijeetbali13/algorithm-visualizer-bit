import { useState } from 'react';
import LearningPanel from './LearningPanel';
import QuizPanel from './QuizPanel';
import AnalyticsPanel from './AnalyticsPanel';
import CodePanel from './CodePanel';
import ExecutionTrace from './ExecutionTrace';

/**
 * AlgoTabWrapper — tabs for visualizer, code sync, analytics, learning, quiz, trace.
 */
export default function AlgoTabWrapper({
  children, algoId, meta,
  pseudoLines = [], javaLines = [],
  activePseudo = -1, activeJava = -1,
  steps = [], stepIdx = -1,
  currentMsg = '',
  hiddenTabs = [],
  analyticsCategory,
  onJumpTo,
  sidebar,
}) {
  const tabs = ['Visualizer', 'Pseudocode', 'Java Code', 'Trace', 'Analytics', 'Learn', 'Quiz']
    .filter(t => !hiddenTabs.includes(t));
  const [tab, setTab] = useState('Visualizer');

  const codeSide = sidebar || null;

  return (
    <>
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t} type="button" className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Visualizer' && children}

      {tab === 'Pseudocode' && (
        <div className="algo-layout">
          <div>
            <div className="status-bar" style={{ marginBottom: 14 }}>
              {currentMsg || 'Run the visualizer to see the active pseudocode line highlighted in sync'}
            </div>
            {pseudoLines.length > 0
              ? <CodePanel lines={pseudoLines} activeLine={activePseudo} language="pseudo" />
              : <div className="empty-text" style={{ padding: 16 }}>Pseudocode not available for this algorithm yet.</div>
            }
          </div>
          {codeSide}
        </div>
      )}

      {tab === 'Java Code' && (
        <div className="algo-layout">
          <div>
            <div className="status-bar" style={{ marginBottom: 14 }}>
              {currentMsg || 'Run the visualizer — the active Java line highlights in sync with the animation'}
            </div>
            {javaLines.length > 0
              ? <CodePanel lines={javaLines} activeLine={activeJava} language="java" />
              : <div className="empty-text" style={{ padding: 16 }}>Java code not available for this algorithm yet.</div>
            }
          </div>
          {codeSide}
        </div>
      )}

      {tab === 'Trace' && (
        <div className="algo-layout">
          <ExecutionTrace steps={steps} stepIdx={stepIdx} onJumpTo={onJumpTo} maxHeight={480} />
          {codeSide}
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="algo-layout">
          <div style={{ maxWidth: 800 }}>
            <AnalyticsPanel steps={steps} stepIdx={stepIdx} category={analyticsCategory} />
          </div>
          {codeSide}
        </div>
      )}

      {tab === 'Learn' && (
        <div style={{ maxWidth: 760 }}>
          {meta?.learning
            ? <LearningPanel data={meta.learning} />
            : <div className="empty-text" style={{ padding: '24px 0' }}>
                Detailed learning content coming soon. Use the Visualizer tab to explore this algorithm step-by-step.
              </div>
          }
        </div>
      )}

      {tab === 'Quiz' && (
        <div style={{ maxWidth: 680 }}>
          <div className="section-label">Test your knowledge</div>
          {meta?.quiz?.length > 0
            ? <QuizPanel algoId={algoId} questions={meta.quiz} />
            : <div className="empty-text" style={{ padding: '24px 0' }}>Quiz questions coming soon for this algorithm.</div>
          }
        </div>
      )}
    </>
  );
}
