import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const CATEGORY_FIELDS = {
  sorting: [
    { key: 'cmps', label: 'Comparisons', color: 'var(--accent)' },
    { key: 'swaps', label: 'Swaps', color: 'var(--orange)' },
    { key: 'iterations', label: 'Iterations', color: 'var(--green)' },
    { key: 'assignments', label: 'Assignments', color: 'var(--yellow)' },
  ],
  graph: [
    { key: 'visited', label: 'Nodes Visited', color: 'var(--accent)' },
    { key: 'relaxations', label: 'Relaxations', color: 'var(--orange)' },
    { key: 'queueOps', label: 'Queue Ops', color: 'var(--green)' },
    { key: 'cmps', label: 'Edge Checks', color: 'var(--yellow)' },
  ],
  dp: [
    { key: 'states', label: 'States Evaluated', color: 'var(--accent)' },
    { key: 'memoHits', label: 'Memo Hits', color: 'var(--green)' },
    { key: 'cmps', label: 'Operations', color: 'var(--orange)' },
  ],
  backtrack: [
    { key: 'calls', label: 'Recursive Calls', color: 'var(--accent)' },
    { key: 'backtracks', label: 'Backtracks', color: 'var(--red)' },
    { key: 'cmps', label: 'Checks', color: 'var(--yellow)' },
  ],
};

function inferCategory(steps) {
  const s = steps.find(x => x && typeof x === 'object') || {};
  if (s.backtracks != null || s.calls != null) return 'backtrack';
  if (s.states != null || s.memoHits != null) return 'dp';
  if (s.relaxations != null || s.visited != null || s.queueOps != null) return 'graph';
  return 'sorting';
}

function readMetric(step, key) {
  if (!step) return 0;
  if (key === 'visited') return step.visited?.size ?? step.visitedCount ?? 0;
  if (key === 'queueOps') return step.queueOps ?? step.queueSize ?? 0;
  return step[key] ?? 0;
}

/**
 * AnalyticsPanel — live performance charts with category-aware metrics.
 */
export default function AnalyticsPanel({ steps, stepIdx, category }) {
  if (!steps.length) {
    return (
      <div className="controls-panel">
        <h3>Performance Analytics</h3>
        <div className="empty-text">Press Start to see live statistics and charts.</div>
      </div>
    );
  }

  const cat = category || inferCategory(steps);
  const fields = CATEGORY_FIELDS[cat] || CATEGORY_FIELDS.sorting;
  const current = steps[Math.max(stepIdx, 0)];

  const maxPoints = 40;
  const stride = Math.max(1, Math.floor(steps.length / maxPoints));
  const chartData = steps
    .filter((_, i) => i <= stepIdx && i % stride === 0)
    .map((s, i) => {
      const row = { step: i * stride };
      fields.forEach(f => { row[f.key] = readMetric(s, f.key); });
      return row;
    });

  const stat = (label, value, color) => (
    <div className="analytics-stat" style={{ borderColor: `${color}44` }}>
      <div className="analytics-stat-value" style={{ color }}>{value ?? 0}</div>
      <div className="analytics-stat-label">{label}</div>
    </div>
  );

  const primary = fields[0];
  const secondary = fields[1] || fields[0];

  return (
    <div className="controls-panel analytics-panel">
      <h3>Live Analytics · {cat}</h3>
      <div className="analytics-grid">
        {fields.map(f => stat(f.label, readMetric(current, f.key), f.color))}
        {stat('Step', Math.max(stepIdx + 1, 0), 'var(--green)')}
        {stat('Progress', `${Math.round((stepIdx + 1) / steps.length * 100)}%`, 'var(--yellow)')}
      </div>

      {chartData.length > 1 && (
        <>
          <div className="chart-label">{primary.label} over time</div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="step" tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Line type="monotone" dataKey={primary.key} stroke={primary.color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-label">{secondary.label} over time</div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="step" tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
              <Line type="monotone" dataKey={secondary.key} stroke={secondary.color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
