import { memo } from 'react';
import { Link } from 'react-router-dom';

function AlgorithmCard({ title, category, description, complexity, to, color }) {
  const accent = color || 'var(--accent)';

  return (
    <Link to={to} className="algo-card-link" aria-label={`Visualize ${title}`}>
      <article className="algo-card" style={{ '--card-accent': accent }}>
        <div className="algo-card-accent-bar" />
        <span className="algo-card-category">{category}</span>
        <h3 className="algo-card-title">{title}</h3>
        <p className="algo-card-desc">{description}</p>
        <div className="algo-card-tags">
          <span className="algo-card-tag primary">{complexity.time}</span>
          <span className="algo-card-tag">{complexity.space}</span>
        </div>
        <span className="algo-card-cta">
          Visualize
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </article>
    </Link>
  );
}

export default memo(AlgorithmCard);
