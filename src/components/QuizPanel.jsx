import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function QuizPanel({ algoId, questions }) {
  const { saveQuiz, quizScores } = useApp();
  const [idx, setIdx]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore]     = useState(0);
  const [done, setDone]       = useState(false);
  const [difficulty, setDiff] = useState('all');

  const filtered = difficulty === 'all'
    ? questions
    : questions.filter(q => q.difficulty === difficulty);

  const q = filtered[idx];

  const past = quizScores.filter(s => s.algoId === algoId);
  const bestScore = past.length ? Math.max(...past.map(s => Math.round(s.score / s.total * 100))) : null;

  const choose = (i) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.answer) setScore(s => s + 1);
  };

  const next = () => {
    if (idx + 1 >= filtered.length) {
      setDone(true);
      saveQuiz(algoId, score + (selected === q.answer ? 1 : 0), filtered.length);
    } else {
      setIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => { setIdx(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); };

  if (!filtered.length) return (
    <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'JetBrains Mono' }}>No questions for this filter.</div>
  );

  if (done) {
    const pct = Math.round((score / filtered.length) * 100);
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700, color: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)', marginBottom: 8 }}>
          {score} / {filtered.length}
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
          {pct >= 80 ? 'Excellent! You know this algorithm well.' : pct >= 50 ? 'Good effort! Review the visualizer to strengthen your understanding.' : 'Keep practicing — step through the visualizer again.'}
        </div>
        {bestScore !== null && (
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 16 }}>Your best: {bestScore}%</div>
        )}
        <button className="btn btn-primary" onClick={restart}>Try Again</button>
      </div>
    );
  }

  const diffColors = { easy: 'var(--green)', medium: 'var(--yellow)', hard: 'var(--red)' };

  return (
    <div>
      {/* Difficulty filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all', 'easy', 'medium', 'hard'].map(d => (
          <button key={d} onClick={() => { setDiff(d); restart(); }}
            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid', cursor: 'pointer', fontFamily: 'JetBrains Mono',
              borderColor: difficulty === d ? diffColors[d] || 'var(--accent)' : 'var(--border)',
              color: difficulty === d ? diffColors[d] || 'var(--accent)' : 'var(--muted)',
              background: difficulty === d ? `${diffColors[d] || 'var(--accent)'}15` : 'transparent' }}>
            {d}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)' }}>Question {idx + 1} / {filtered.length}</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: diffColors[q?.difficulty] || 'var(--muted)' }}>{q?.difficulty}</span>
      </div>
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${((idx + 1) / filtered.length) * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* Question */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.7, marginBottom: 16 }}>{q.question}</div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {q.options.map((opt, i) => {
          let bg = 'var(--surface2)', border = 'var(--border)', color = 'var(--text)';
          if (answered) {
            if (i === q.answer) { bg = 'rgba(34,197,94,0.12)'; border = 'var(--green)'; color = 'var(--green)'; }
            else if (i === selected && i !== q.answer) { bg = 'rgba(239,68,68,0.12)'; border = 'var(--red)'; color = 'var(--red)'; }
          } else if (selected === i) { bg = 'rgba(0,212,255,0.1)'; border = 'var(--accent)'; }
          return (
            <button key={i} onClick={() => choose(i)}
              style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px', textAlign: 'left', fontSize: 13, color, cursor: answered ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: 'Inter' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, marginRight: 8, color: border }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && q.explanation && (
        <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
          💡 {q.explanation}
        </div>
      )}

      {answered && (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={next}>
          {idx + 1 >= filtered.length ? 'See Results' : 'Next Question →'}
        </button>
      )}
    </div>
  );
}
