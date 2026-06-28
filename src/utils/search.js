/**
 * Fuzzy search with typo tolerance, partial matches, category & complexity filtering.
 */

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

function tokenMatch(query, target) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 1;
  if (t.includes(q)) return 1;
  if (q.length >= 3) {
    const dist = levenshtein(q, t.slice(0, q.length + 2));
    if (dist <= Math.floor(q.length / 3)) return 0.7;
  }
  const qTokens = q.split(/\s+/);
  const matched = qTokens.filter(tok => t.includes(tok) || levenshtein(tok, t.slice(0, tok.length + 2)) <= 1);
  return matched.length / qTokens.length;
}

function complexityMatch(query, item) {
  const q = query.toLowerCase();
  const time = (item.complexity?.time || '').toLowerCase();
  const space = (item.complexity?.space || '').toLowerCase();
  const combined = `${time} ${space}`;
  const patterns = [
    { re: /o\s*\(\s*n\s*²\s*\)|quadratic|n\^2|n2/, val: 'o(n²)' },
    { re: /o\s*\(\s*n\s*log\s*n\s*\)|nlogn|log n/, val: 'o(n log n)' },
    { re: /o\s*\(\s*n\s*\)|linear/, val: 'o(n)' },
    { re: /o\s*\(\s*1\s*\)|constant/, val: 'o(1)' },
    { re: /o\s*\(\s*v/, val: 'graph' },
    { re: /exponential|o\s*\(\s*n!/, val: 'factorial' },
  ];
  for (const { re, val } of patterns) {
    if (re.test(q) && combined.includes(val.replace(/\s/g, ''))) return 0.9;
    if (re.test(q) && combined.includes(val.split('(')[0])) return 0.6;
  }
  return tokenMatch(q, combined);
}

/**
 * @param {Array} items - algorithm catalog items
 * @param {{ query?: string, category?: string }} filters
 */
export function searchAlgorithms(items, { query = '', category = 'All' } = {}) {
  const q = query.trim();

  return items
    .filter(item => category === 'All' || item.category === category)
    .map(item => {
      if (!q) return { item, score: 1 };

      const titleScore = tokenMatch(q, item.title);
      const catScore = tokenMatch(q, item.category);
      const descScore = tokenMatch(q, item.description) * 0.6;
      const kwScore = Math.max(...(item.keywords || []).map(k => tokenMatch(q, k)), 0) * 0.85;
      const cxScore = complexityMatch(q, item);
      const idScore = tokenMatch(q, item.id.replace(/-/g, ' ')) * 0.7;

      const score = Math.max(titleScore, catScore * 0.9, descScore, kwScore, cxScore, idScore);
      return { item, score };
    })
    .filter(({ score }) => score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
