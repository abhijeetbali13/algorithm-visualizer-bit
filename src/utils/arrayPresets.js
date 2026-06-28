/** Array preset generators for sorting visualizers */

export function randomArray(size = 18, min = 10, max = 94) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

export function nearlySortedArray(size = 18) {
  const a = randomArray(size);
  for (let i = 0; i < Math.max(2, Math.floor(size * 0.15)); i++) {
    const x = Math.floor(Math.random() * (size - 1));
    [a[x], a[x + 1]] = [a[x + 1], a[x]];
  }
  return a;
}

export function reverseArray(size = 18) {
  return Array.from({ length: size }, (_, i) => (size - i) * 5 + 10);
}

export function sortedArray(size = 18) {
  return Array.from({ length: size }, (_, i) => i * 5 + 12);
}

export function duplicateHeavyArray(size = 18) {
  const pool = [12, 24, 36, 48, 60];
  return Array.from({ length: size }, () => pool[Math.floor(Math.random() * pool.length)]);
}

export function parseCustomArray(raw, { minLen = 2, maxLen = 30, minVal = 1, maxVal = 999 } = {}) {
  const nums = raw
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => Number(s))
    .filter(n => !isNaN(n) && n >= minVal && n <= maxVal);
  if (nums.length < minLen) return { error: `Enter at least ${minLen} numbers (${minVal}–${maxVal}), comma-separated.` };
  if (nums.length > maxLen) return { error: `Max ${maxLen} numbers.` };
  return { values: nums };
}

export const INPUT_PRESETS = [
  { id: 'random', label: 'Random', icon: '🎲' },
  { id: 'shuffle', label: 'Shuffle', icon: '🔀' },
  { id: 'reverse', label: 'Reverse', icon: '↩' },
  { id: 'nearly', label: 'Nearly Sorted', icon: '📈' },
  { id: 'sorted', label: 'Sorted', icon: '✓' },
  { id: 'duplicates', label: 'Duplicate Heavy', icon: '⧉' },
  { id: 'small', label: 'Small (8)', icon: 'S' },
  { id: 'large', label: 'Large (28)', icon: 'L' },
];

export function applyPreset(presetId, current = [], defaultSize = 18) {
  const size = current.length || defaultSize;
  switch (presetId) {
    case 'random': return randomArray(defaultSize);
    case 'shuffle': return randomArray(size);
    case 'reverse': return reverseArray(size);
    case 'nearly': return nearlySortedArray(size);
    case 'sorted': return sortedArray(size);
    case 'duplicates': return duplicateHeavyArray(size);
    case 'small': return randomArray(8);
    case 'large': return randomArray(28);
    default: return randomArray(defaultSize);
  }
}
