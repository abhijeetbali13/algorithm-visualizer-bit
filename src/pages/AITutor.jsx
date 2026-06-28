import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { getTutorResponse, SYLLABUS_TOPICS } from '../services/aiTutor';

const CONTEXT_TIPS = {
  sorting: [
    'Why is Quick Sort faster than Merge Sort in practice?',
    'What is the time complexity of Bubble Sort?',
    'When should I use Insertion Sort over Quick Sort?',
    'Explain the partition step in Quick Sort',
  ],
  graph: [
    "Why can't Dijkstra handle negative edge weights?",
    'What is the difference between Dijkstra and Bellman-Ford?',
    'Explain how Prim\'s algorithm builds an MST',
    'When should I use Floyd-Warshall?',
  ],
  dp: [
    'What is memoization vs tabulation?',
    'Explain the 0/1 Knapsack recurrence relation',
    'How does LCS dynamic programming work?',
    'What is the Matrix Chain Multiplication recurrence?',
  ],
  greedy: [
    'Why does Fractional Knapsack need greedy but 0/1 needs DP?',
    'Explain Huffman coding step by step',
    'Why sort by finish time in Activity Selection?',
  ],
  general: [
    'What is the difference between time and space complexity?',
    'When should I use a greedy algorithm vs dynamic programming?',
    'Explain recursion with a base case example',
    'What makes an algorithm stable?',
  ],
};

function renderMarkdown(text) {
  if (!text) return [<p key="empty">I couldn't generate a response. Please try again.</p>];
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return null;
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </p>
    );
  }).filter(Boolean);
}

function AITutor() {
  const [messages, setMessages] = useState([{
    role: 'ai',
    text: "Hi! I'm your algorithm teaching assistant for this visualizer.\n\nAsk me about **sorting**, **graphs**, **dynamic programming**, **greedy algorithms**, **backtracking**, **string matching**, or **complexity analysis**.\n\nI'll explain concepts clearly — or tell you honestly if something is outside the syllabus.",
    known: true,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('general');
  const [mode, setMode] = useState('beginner');
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = useCallback((q) => {
    const question = (q || input).trim();
    if (!question || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: question }]);
    setLoading(true);

    setTimeout(() => {
      try {
        const { text, related, known } = getTutorResponse(question, { mode });
        setMessages(m => [...m, { role: 'ai', text: text || 'I could not find an answer. Please try asking about a specific algorithm from the syllabus.', known, related }]);
      } catch {
        setMessages(m => [...m, {
          role: 'ai',
          text: 'Something went wrong. Please try rephrasing your question or ask about a specific algorithm like Bubble Sort or Dijkstra.',
          known: false,
        }]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    }, 400 + Math.random() * 300);
  }, [input, loading, mode]);

  const tips = CONTEXT_TIPS[topic] || CONTEXT_TIPS.general;

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <header className="algo-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="algo-badge" style={{ color: 'var(--accent2)', background: 'var(--accent2-muted)', borderColor: 'color-mix(in srgb, var(--accent2) 30%, transparent)' }}>AI Tutor</span>
            <div className="ai-mode-toggle" role="group" aria-label="Explanation depth">
              <button type="button" className={`ai-mode-btn${mode === 'beginner' ? ' active' : ''}`} onClick={() => setMode('beginner')}>Beginner</button>
              <button type="button" className={`ai-mode-btn${mode === 'advanced' ? ' active' : ''}`} onClick={() => setMode('advanced')}>Advanced</button>
            </div>
          </div>
          <h1 style={{ color: 'var(--accent2)' }}>Algorithm Teaching Assistant</h1>
          <p>Ask about algorithms, complexity, dry runs, or code logic. I only answer from the curated syllabus — I won't guess about topics outside this visualizer.</p>
        </header>

        <div className="ai-tutor-layout">
          <div>
            <div className="ai-chat-panel" role="log" aria-live="polite" aria-label="Chat messages">
              {messages.map((m, i) => (
                <div key={i} className={`ai-message${m.role === 'user' ? ' user' : ''}`}>
                  <div className={`ai-avatar ${m.role === 'user' ? 'user' : 'bot'}`} aria-hidden="true">
                    {m.role === 'user' ? 'U' : '🤖'}
                  </div>
                  <div className={`ai-bubble ${m.role === 'user' ? 'user' : 'bot'}`}>
                    {m.role === 'ai' ? renderMarkdown(m.text) : <p>{m.text}</p>}
                    {m.role === 'ai' && !m.known && (
                      <div className="ai-fallback-notice" style={{ marginTop: 8 }}>
                        Outside syllabus — try: {SYLLABUS_TOPICS.slice(0, 4).join(', ')}…
                      </div>
                    )}
                    {m.role === 'ai' && m.related?.length > 0 && m.known && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                        Related: {m.related.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ai-message">
                  <div className="ai-avatar bot" aria-hidden="true">🤖</div>
                  <div className="ai-bubble bot" aria-label="Thinking">
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => <div key={i} className="ai-typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="ai-input-row">
              <input
                ref={inputRef}
                className="ai-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask about an algorithm, complexity, or concept…"
                disabled={loading}
                aria-label="Your question"
              />
              <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()} type="button">Send</button>
            </div>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="controls-panel">
              <h3>Topic Context</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['general', 'General'], ['sorting', 'Sorting'], ['graph', 'Graph'], ['dp', 'Dynamic Prog.'], ['greedy', 'Greedy']].map(([k, l]) => (
                  <button key={k} type="button" className={`ai-topic-btn${topic === k ? ' active' : ''}`} onClick={() => setTopic(k)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="controls-panel">
              <h3>Suggested Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tips.map((t, i) => (
                  <button key={i} type="button" className="ai-suggest-btn" onClick={() => send(t)} disabled={loading}>{t}</button>
                ))}
              </div>
            </div>

            <div className="controls-panel" style={{ background: 'var(--accent2-muted)', borderColor: 'color-mix(in srgb, var(--accent2) 25%, transparent)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: 'var(--accent2)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Honest answers only</strong><br />
                This tutor uses a curated knowledge base covering all algorithms in this visualizer. If your question is outside the syllabus, I'll say so — never guess.
              </p>
            </div>

            <Link to="/" className="btn btn-secondary" style={{ textAlign: 'center', justifyContent: 'center' }}>← Browse Algorithms</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default memo(AITutor);
