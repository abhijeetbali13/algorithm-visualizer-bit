import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useTheme } from '../context/useTheme';
import { useApp } from '../context/useApp';

const NAV_HEIGHT = 60;

const groups = [
  { label: 'Sorting', color: 'var(--cat-sorting)', links: [
    { to: '/bubble-sort', label: 'Bubble Sort' }, { to: '/selection-sort', label: 'Selection Sort' },
    { to: '/insertion-sort', label: 'Insertion Sort' }, { to: '/merge-sort', label: 'Merge Sort' },
    { to: '/quick-sort', label: 'Quick Sort' }, { to: '/heap-sort', label: 'Heap Sort' },
  ]},
  { label: 'Graph', color: 'var(--cat-graph)', links: [
    { to: '/dijkstra', label: "Dijkstra's" }, { to: '/bellman-ford', label: 'Bellman-Ford' },
    { to: '/prims', label: "Prim's MST" }, { to: '/kruskal', label: "Kruskal's MST" },
    { to: '/floyd-warshall', label: 'Floyd-Warshall' },
  ]},
  { label: 'DP / BT', color: 'var(--cat-dp)', links: [
    { to: '/knapsack', label: '0/1 Knapsack' }, { to: '/matrix-chain', label: 'Matrix Chain' },
    { to: '/lcs', label: 'LCS' }, { to: '/n-queens', label: 'N-Queens' },
  ]},
  { label: 'Greedy', color: 'var(--cat-greedy)', links: [
    { to: '/huffman', label: 'Huffman Coding' }, { to: '/fractional-knapsack', label: 'Frac. Knapsack' },
    { to: '/activity-selection', label: 'Activity Selection' },
  ]},
  { label: 'Strings', color: 'var(--cat-string)', links: [
    { to: '/horspool', label: 'Horspool' }, { to: '/boyer-moore', label: 'Boyer-Moore' },
  ]},
  { label: 'Data Structures', color: 'var(--cat-ds)', links: [
    { to: '/ds/array', label: 'Arrays' }, { to: '/ds/linked-list', label: 'Linked List' },
    { to: '/ds/stack', label: 'Stack' }, { to: '/ds/queue', label: 'Queue' },
    { to: '/ds/graph', label: 'Graphs' }, { to: '/ds/tree', label: 'Trees' },
    { to: '/ds/heap', label: 'Heap' }, { to: '/ds/hash-table', label: 'Hash Table' },
  ]},
];

const quickLinks = [
  { to: '/graph-lab', label: 'Graph Lab', icon: '🧪' },
  { to: '/compare', label: 'Compare', icon: '⚡' },
  { to: '/complexity', label: 'Complexity', icon: '📈' },
  { to: '/ai-tutor', label: 'AI Tutor', icon: '🤖' },
  { to: '/dashboard', label: 'Progress', icon: '📊' },
];

export { NAV_HEIGHT };

function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef(null);
  const navRef = useRef(null);
  const { theme, toggle } = useTheme();
  const { unlockedAchievements } = useApp();

  const enter = useCallback((label) => { clearTimeout(closeTimer.current); setOpen(label); }, []);
  const leave = useCallback(() => { closeTimer.current = setTimeout(() => setOpen(null), 150); }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(null); setMobileOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isLinkActive = (to) => pathname === to;
  const isGroupActive = (g) => g.links.some(l => l.to === pathname);

  return (
    <>
      <nav
        ref={navRef}
        className={`app-navbar${scrolled ? ' scrolled' : ''}`}
        role="navigation"
        aria-label="Main navigation"
        style={{
          background: theme === 'light' ? 'color-mix(in srgb, var(--surface) 92%, transparent)' : 'color-mix(in srgb, var(--bg) 94%, transparent)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--border)',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: NAV_HEIGHT,
          transition: 'box-shadow var(--duration-normal)',
        }}
      >
        <div className="page-wrapper navbar-inner">
          <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)} aria-label="AlgoHub home">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="var(--accent)" fillOpacity=".12" />
              <path d="M5 20 L9 8 L14 15 L19 10 L23 20" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="navbar-brand">AlgoHub</span>
          </Link>

          <div className="navbar-groups desktop-only" role="menubar">
            {groups.map(g => {
              const active = isGroupActive(g);
              return (
                <div key={g.label} className="navbar-dropdown-wrap" role="none"
                  onMouseEnter={() => enter(g.label)} onMouseLeave={leave}>
                  <button
                    type="button"
                    role="menuitem"
                    aria-haspopup="true"
                    aria-expanded={open === g.label}
                    className={`navbar-dropdown-btn${active ? ' active-indicator' : ''}`}
                    style={{ color: active ? g.color : 'var(--muted)', background: active ? `color-mix(in srgb, ${g.color} 10%, transparent)` : 'transparent' }}
                    onClick={() => setOpen(open === g.label ? null : g.label)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(open === g.label ? null : g.label); } }}
                  >
                    {g.label}
                    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                  {open === g.label && (
                    <div className="navbar-dropdown-menu" role="menu" onMouseEnter={() => enter(g.label)} onMouseLeave={leave}>
                      <div className="navbar-dropdown-heading" style={{ color: g.color }}>{g.label}</div>
                      {g.links.map(l => (
                        <Link key={l.to} to={l.to} role="menuitem" onClick={() => setOpen(null)}
                          style={{
                            padding: '7px 12px', borderRadius: 6, fontSize: 13,
                            fontWeight: isLinkActive(l.to) ? 600 : 400,
                            color: isLinkActive(l.to) ? g.color : 'var(--text)',
                            background: isLinkActive(l.to) ? `color-mix(in srgb, ${g.color} 10%, transparent)` : 'transparent',
                            display: 'block', transition: 'background 0.15s',
                          }}>
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="navbar-actions desktop-only">
            {quickLinks.map(({ to, label, icon }) => (
              <Link key={to} to={to} className="navbar-quick-link"
                aria-current={isLinkActive(to) ? 'page' : undefined}
                style={{
                  color: isLinkActive(to) ? 'var(--accent)' : 'var(--muted)',
                  background: isLinkActive(to) ? 'var(--accent-muted)' : 'transparent',
                  borderColor: isLinkActive(to) ? 'var(--accent)' : 'transparent',
                }}>
                {icon} {label}
              </Link>
            ))}
            {unlockedAchievements?.length > 0 && (
              <Link to="/achievements" className="navbar-star-badge" aria-label={`${unlockedAchievements.length} achievements unlocked`}>
                ★ {unlockedAchievements.length}
              </Link>
            )}
            <button type="button" onClick={toggle} className="navbar-theme-btn" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="navbar-mobile-actions mobile-only">
            <button type="button" onClick={toggle} className="navbar-theme-btn" aria-label="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
            <button type="button" className="navbar-hamburger" onClick={() => setMobileOpen(v => !v)}
              aria-expanded={mobileOpen} aria-controls="mobile-nav-drawer" aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-nav-drawer" className="navbar-mobile-drawer mobile-only" role="dialog" aria-label="Mobile navigation">
          <div className="page-wrapper">
            {groups.map(g => (
              <div key={g.label} className="mobile-nav-group">
                <div className="mobile-nav-label" style={{ color: g.color }}>{g.label}</div>
                {g.links.map(l => (
                  <Link key={l.to} to={l.to} className={`mobile-nav-link${isLinkActive(l.to) ? ' active' : ''}`}>{l.label}</Link>
                ))}
              </div>
            ))}
            <div className="mobile-nav-divider" />
            {quickLinks.map(({ to, label, icon }) => (
              <Link key={to} to={to} className={`mobile-nav-link quick${isLinkActive(to) ? ' active' : ''}`}>{icon} {label}</Link>
            ))}
          </div>
        </div>
      )}
      {mobileOpen && <div className="navbar-mobile-backdrop mobile-only" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
    </>
  );
}

export default memo(Navbar);
