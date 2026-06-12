import { Link } from 'react-router-dom';

export default function AlgorithmCard({ title, category, description, complexity, to, color }) {
  const accent = color || 'var(--accent)';
  return (
    <Link to={to} style={{ display: 'block' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        height: '100%',
        transition: 'all 0.25s',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.background = 'var(--surface2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = 'var(--surface)';
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: accent, borderRadius: '12px 12px 0 0'
        }}/>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          {category}
        </div>
        <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 }}>
          {description}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            background: 'var(--code-bg)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '3px 8px', fontFamily: 'JetBrains Mono',
            fontSize: 11, color: accent
          }}>
            {complexity.time}
          </span>
          <span style={{
            background: 'var(--code-bg)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '3px 8px', fontFamily: 'JetBrains Mono',
            fontSize: 11, color: 'var(--muted)'
          }}>
            {complexity.space}
          </span>
        </div>
        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: accent, fontWeight: 600
        }}>
          Visualize
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
