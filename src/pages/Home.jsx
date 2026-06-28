import { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import AlgorithmCard from '../components/AlgorithmCard';
import { useApp } from '../context/useApp';
import { ALL_ALGORITHMS, DS_LIST, CATEGORIES, CATEGORY_COLORS, FULL_CATALOG } from '../data/algorithms';
import { searchAlgorithms } from '../utils/search';

const FEATURES = [
  { icon: '🎬', title: 'Step-by-Step Visualization', desc: 'Every decision explained in plain English. Play, pause, step forward and back, control speed from 0.25× to 4×.' },
  { icon: '💻', title: 'Code Sync', desc: 'Pseudocode and Java implementation with the active line highlighted — stays in sync with every animation step.' },
  { icon: '📖', title: 'Structured Learning', desc: 'Overview, complexity, dry runs, interview questions, edge cases, and common mistakes for every algorithm.' },
  { icon: '🧪', title: 'Interactive Graph Lab', desc: 'Build your own graph: add weighted edges, run Dijkstra, Prim, Kruskal, or Floyd-Warshall on custom input.' },
  { icon: '🤖', title: 'AI Teaching Assistant', desc: 'Ask about complexity, dry runs, or why a step was taken. Honest answers from a curated syllabus — no hallucinations.' },
  { icon: '⚡', title: 'Compare Mode', desc: 'Run two sorting algorithms side-by-side on the same array with live comparison stats.' },
];

const STATS = [
  { value: String(ALL_ALGORITHMS.length), label: 'Algorithms' },
  { value: String(DS_LIST.length), label: 'Data Structures' },
  { value: '5', label: 'Graph Algorithms' },
  { value: '33', label: 'Quiz Questions' },
];

function Home() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const { visitedCount, favorites } = useApp();

  const filtered = useMemo(
    () => searchAlgorithms(FULL_CATALOG, { query: search, category: cat }),
    [search, cat]
  );

  const showDefault = search === '' && cat === 'All';
  const algoFiltered = filtered.filter(a => a.category !== 'Data Structure');
  const dsFiltered = filtered.filter(a => a.category === 'Data Structure');

  const handleSearch = useCallback((e) => setSearch(e.target.value), []);
  const handleCat = useCallback((c) => setCat(c), []);

  return (
    <div>
      <section className="hero-section">
        <div className="page-wrapper">
          <div style={{ maxWidth: 680 }}>
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-line" aria-hidden="true" />
              VTU ADA LEARNING PLATFORM
            </div>
            <h1 className="hero-title">
              Algorithm<br />
              <span className="grad-text">Visualizer Hub</span>
            </h1>
            <p className="hero-subtitle">
              Step through every algorithm with annotated explanations, live code sync, custom inputs, and an honest AI tutor — built for understanding, not memorization.
            </p>
            <div className="hero-actions">
              <a href="#algorithms" className="btn btn-primary">Explore Algorithms →</a>
              <Link to="/graph-lab" className="btn btn-secondary">🧪 Graph Lab</Link>
              <Link to="/ai-tutor" className="btn btn-secondary">🤖 AI Tutor</Link>
            </div>
          </div>

          <div className="stats-strip" role="list" aria-label="Platform statistics">
            {STATS.map(({ value, label }) => (
              <div key={label} className="stat-cell" role="listitem">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--space-2xl) 0', borderBottom: '1px solid var(--border)' }}>
        <div className="page-wrapper">
          <div className="section-label">Features</div>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: 'var(--space-xl)', color: 'var(--text)' }}>
            Everything you need to master ADA
          </h2>
          <div className="feature-grid">
            {FEATURES.map(({ icon, title, desc }) => (
              <article key={title} className="feature-card">
                <div className="feature-icon" aria-hidden="true">{icon}</div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--space-2xl) 0' }} id="algorithms">
        <div className="page-wrapper">
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="section-label">Algorithms</div>
            <div className="search-filter-bar">
              <input
                className="search-input"
                type="search"
                placeholder="Search by name, category, or complexity (e.g. O(n²))…"
                value={search}
                onChange={handleSearch}
                aria-label="Search algorithms"
                style={{ maxWidth: 360 }}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Filter by category">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`cat-pill${cat === c ? ' active' : ''}`}
                    onClick={() => handleCat(c)}
                    aria-pressed={cat === c}
                    style={cat === c ? {
                      borderColor: CATEGORY_COLORS[c] || 'var(--accent)',
                      color: CATEGORY_COLORS[c] || 'var(--accent)',
                      background: `color-mix(in srgb, ${CATEGORY_COLORS[c] || 'var(--accent)'} 12%, transparent)`,
                    } : {}}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {visitedCount > 0 && (
              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                You've explored {visitedCount} algorithm{visitedCount !== 1 ? 's' : ''} · {favorites.length} favorited
              </p>
            )}
          </div>

          {showDefault ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
                {ALL_ALGORITHMS.map(a => <AlgorithmCard key={a.to} {...a} />)}
              </div>
              <div>
                <div className="section-label" style={{ color: 'var(--cat-ds)' }}>Data Structures</div>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text)' }}>
                  Interactive Data Structure Explorer
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                  {DS_LIST.map(d => <AlgorithmCard key={d.to} {...d} />)}
                </div>
              </div>
            </>
          ) : (
            <>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon" aria-hidden="true">🔍</div>
                  <div className="empty-state-title">No matches found</div>
                  <p className="empty-state-desc">Try a different search term, check spelling, or filter by category.</p>
                </div>
              )}
              {algoFiltered.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                  {algoFiltered.map(a => <AlgorithmCard key={a.to} {...a} />)}
                </div>
              )}
              {dsFiltered.length > 0 && (
                <>
                  <div className="section-label" style={{ color: 'var(--cat-ds)' }}>Data Structures</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                    {dsFiltered.map(a => <AlgorithmCard key={a.to} {...a} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <section style={{
        background: 'linear-gradient(135deg, var(--accent-muted), var(--accent2-muted))',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        padding: 'var(--space-2xl) 0',
      }}>
        <div className="page-wrapper" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>
            Free Educational Platform
          </div>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: 'var(--space-md)', color: 'var(--text)' }}>
            Built for VTU ADA students
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: 480, margin: '0 auto var(--space-xl)' }}>
            Every algorithm in the VTU syllabus, visualized with step-by-step explanations, custom input, Java code sync, and quiz mode.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/graph-lab" className="btn btn-primary">Try Graph Lab</Link>
            <Link to="/compare" className="btn btn-secondary">Compare Algorithms</Link>
            <Link to="/ai-tutor" className="btn btn-secondary">Ask AI Tutor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(Home);
