/**
 * AI Tutor — curated knowledge base for VTU ADA syllabus.
 * Never hallucinates: returns graceful fallback for unsupported topics.
 */

import { ALL_ALGORITHMS, DS_LIST } from '../data/algorithms';

const SYLLABUS_TOPICS = [
  'sorting', 'graphs', 'dynamic programming', 'greedy algorithms',
  'trees', 'recursion', 'backtracking', 'searching', 'strings',
  'data structures', 'complexity analysis',
];

const FALLBACK_MESSAGE = `I'm designed specifically to help with **algorithms and data structures** included in this visualizer.

I don't have reliable information about this topic.

Try asking about **sorting**, **graphs**, **dynamic programming**, **greedy algorithms**, **trees**, **recursion**, **backtracking**, or **searching**.

You can also ask about a specific algorithm like Bubble Sort, Dijkstra, 0/1 Knapsack, or N-Queens.`;

const ALGO_NAMES = [...ALL_ALGORITHMS, ...DS_LIST].map(a => a.title.toLowerCase());

/** @type {Record<string, { beginner: string, advanced: string, keywords: string[], related?: string[] }>} */
const KNOWLEDGE = {
  'bubble-sort': {
    keywords: ['bubble', 'bubble sort', 'adjacent', 'swap'],
    related: ['Selection Sort', 'Insertion Sort'],
    beginner: `**Bubble Sort** is the simplest sorting algorithm.

**How it works:** Walk through the array comparing neighbors. If the left element is bigger, swap them. Each full pass moves the largest unsorted value to the end — like a bubble rising.

**Time:** O(n²) average/worst, O(n) best (with early exit on sorted input).
**Space:** O(1) — sorts in place.
**Stable:** Yes — equal elements keep their order.

**When to use:** Teaching and tiny datasets only. For real applications, use Merge Sort or Quick Sort.`,
    advanced: `**Bubble Sort analysis:**

Each pass performs at most n−1 comparisons. With early-exit flag, best case is O(n) when input is sorted.

**Stability proof:** Swaps only occur when a[j] > a[j+1] (strict inequality), so equal elements never cross.

**Optimization:** Track \`swapped\` boolean per pass; break when false.

**Comparison vs Selection Sort:** Bubble does more swaps but can detect sorted input in O(n). Selection always does O(n²) comparisons.

**Interview tip:** Know the early-exit optimization — it's the most common follow-up question.`,
  },

  'selection-sort': {
    keywords: ['selection', 'selection sort', 'minimum'],
    related: ['Bubble Sort', 'Insertion Sort'],
    beginner: `**Selection Sort** finds the smallest element in the unsorted part and swaps it to the front.

**How it works:** For each position i from 0 to n−2, scan the rest of the array for the minimum, then swap it into position i.

**Time:** O(n²) always — no early exit.
**Space:** O(1).
**Stable:** No — swapping can jump over equal elements.

**Key advantage:** At most n−1 swaps — useful when writes are expensive.`,
    advanced: `**Selection Sort** performs exactly n(n−1)/2 comparisons regardless of input order.

**Non-stability counterexample:** [5a, 5b, 2] → swap index 0 with index 2 → [2, 5b, 5a]. Original order of 5a and 5b reversed.

**When to prefer over Insertion Sort:** When memory writes cost more than reads (flash storage, EEPROM).

**Linked list variant:** Can be made stable by shifting instead of swapping.`,
  },

  'insertion-sort': {
    keywords: ['insertion', 'insertion sort', 'online'],
    related: ['Merge Sort', 'Quick Sort'],
    beginner: `**Insertion Sort** builds a sorted section one element at a time — like sorting playing cards in your hand.

**How it works:** Take each element and slide it left into its correct position among already-sorted elements.

**Time:** O(n) best (nearly sorted), O(n²) worst (reverse sorted).
**Space:** O(1). **Stable:** Yes.

**When to use:** Small arrays, nearly-sorted data, or as the inner sort in Timsort (Python) for subarrays under ~32 elements.`,
    advanced: `**Insertion Sort** is an **online algorithm** — it can sort elements as they arrive without knowing the full input.

**Binary Insertion Sort:** Use binary search to find insertion point → O(n log n) comparisons but still O(n²) shifts.

**Hybrid sorts:** C++ Introsort and Python Timsort switch to Insertion Sort below a threshold (~15–32) because lower constant factors beat O(n log n) for tiny n.

**Inversion count:** Number of shifts equals the inversion count — useful in competitive programming.`,
  },

  'merge-sort': {
    keywords: ['merge', 'merge sort', 'divide conquer', 'stable sort'],
    related: ['Quick Sort', 'Heap Sort'],
    beginner: `**Merge Sort** splits the array in half recursively, sorts each half, then merges them.

**Time:** O(n log n) guaranteed — best, average, and worst.
**Space:** O(n) for the temporary merge buffer.
**Stable:** Yes.

**When to use:** When guaranteed O(n log n) is required, stability matters, or sorting linked lists.`,
    advanced: `**Recurrence:** T(n) = 2T(n/2) + O(n) → O(n log n) by Master Theorem.

**In-place merge:** Possible but complex; standard implementation uses O(n) auxiliary space.

**External sorting:** Merge Sort is the algorithm of choice for data too large to fit in RAM (database sorting).

**Bottom-up iterative version:** Avoids recursion stack overflow for very large n.

**vs Quick Sort:** Merge Sort has worse cache locality and uses extra memory, but guarantees O(n log n).`,
  },

  'quick-sort': {
    keywords: ['quick', 'quick sort', 'partition', 'pivot', 'quicksort'],
    related: ['Merge Sort', 'Heap Sort'],
    beginner: `**Quick Sort** picks a pivot, partitions the array so smaller elements go left and larger go right, then recurses on both sides.

**Time:** O(n log n) average, O(n²) worst (bad pivot on sorted input).
**Space:** O(log n) recursion stack.
**Stable:** No.

**When to use:** General-purpose sorting — fastest in practice for random data. Used in C++ std::sort (Introsort).`,
    advanced: `**Why faster than Merge Sort in practice:**
1. In-place partitioning → better cache locality
2. No O(n) auxiliary allocation
3. Tight inner loop with good branch prediction

**Pivot strategies:** Random, median-of-three, median-of-medians (O(n log n) worst case, large constants).

**Introsort:** Switches to Heap Sort when recursion depth exceeds 2·log₂(n) to guarantee O(n log n).

**Dual-Pivot QuickSort:** Java's Arrays.sort() for primitives uses two pivots → ~10% faster.`,
  },

  'heap-sort': {
    keywords: ['heap', 'heap sort', 'priority'],
    related: ['Merge Sort', 'Quick Sort'],
    beginner: `**Heap Sort** builds a max-heap from the array, then repeatedly extracts the maximum to the end.

**Time:** O(n log n) always.
**Space:** O(1) in-place.
**Stable:** No.

**When to use:** When you need guaranteed O(n log n) with O(1) extra space.`,
    advanced: `**Build-heap:** O(n) using bottom-up heapify (not O(n log n)).

**Extract-max loop:** n extractions × O(log n) each = O(n log n).

**Introsort fallback:** C++ std::sort uses Heap Sort when Quick Sort recursion depth is too deep.

**vs Priority Queue sort:** Same asymptotic complexity; heap sort is in-place.`,
  },

  'dijkstra': {
    keywords: ['dijkstra', 'shortest path', 'priority queue', 'single source'],
    related: ["Bellman-Ford", 'Floyd-Warshall'],
    beginner: `**Dijkstra's Algorithm** finds shortest paths from one source to all other nodes in a weighted graph.

**Rule:** Always expand the closest unvisited node first (greedy choice).

**Requirements:** All edge weights must be **non-negative**.

**Time:** O((V+E) log V) with a binary heap.
**Space:** O(V) for distance array and priority queue.

**Real-world:** GPS navigation, network routing (OSPF).`,
    advanced: `**Correctness (greedy-stays-ahead):** When node u is extracted with distance d, any alternative path must pass through some unvisited v with dist[v] ≥ d. Adding non-negative edges cannot improve d.

**Failure with negative edges:** A→B(5), A→C(3), C→B(−4). Dijkstra finalizes B at 5, misses path A→C→B = −1.

**Implementations:** Binary heap O((V+E)log V), Fibonacci heap O(E + V log V), array O(V²) for dense graphs.

**A* extension:** Dijkstra + heuristic h(n) → guided search for pathfinding.`,
  },

  'bellman-ford': {
    keywords: ['bellman', 'ford', 'negative weight', 'negative cycle'],
    related: ["Dijkstra's", 'Floyd-Warshall'],
    beginner: `**Bellman-Ford** finds shortest paths even with **negative edge weights**.

**How it works:** Relax every edge V−1 times. If a Vth pass still improves any distance, a negative cycle exists.

**Time:** O(V × E).
**Space:** O(V).

**When to use:** Graphs with negative weights, detecting negative cycles (e.g., currency arbitrage).`,
    advanced: `**Why V−1 iterations:** Shortest simple path has at most V−1 edges. After k iterations, all paths using ≤ k edges are optimal.

**Negative cycle detection:** Run one more full relaxation pass. Any improvement → reachable negative cycle.

**SPFA optimization:** Queue-based; average faster but O(VE) worst case.

**Distributed routing:** Distance-vector protocols (RIP) are Bellman-Ford variants.`,
  },

  'prims': {
    keywords: ['prim', 'mst', 'minimum spanning'],
    related: ["Kruskal's MST", "Dijkstra's"],
    beginner: `**Prim's Algorithm** builds a Minimum Spanning Tree by greedily adding the cheapest edge that connects a new vertex.

**Start:** Pick any vertex. Grow the tree by always adding the minimum-weight edge to an unvisited node.

**Time:** O(E log V) with a priority queue.
**Space:** O(V).

**When to use:** Dense graphs, or when you already have the graph as an adjacency matrix.`,
    advanced: `**Greedy correctness:** Cut property — minimum edge crossing any cut belongs to some MST.

**Dense graph:** Array-based implementation O(V²) can beat Kruskal's O(E log E) when E ≈ V².

**vs Kruskal:** Prim grows one tree; Kruskal merges forests. Prim better for dense graphs; Kruskal simpler with Union-Find.`,
  },

  'kruskal': {
    keywords: ['kruskal', 'union find', 'mst'],
    related: ["Prim's MST"],
    beginner: `**Kruskal's Algorithm** sorts all edges by weight and adds them one by one, skipping edges that would create a cycle.

**Uses:** Union-Find (Disjoint Set) to detect cycles efficiently.

**Time:** O(E log E) dominated by sorting.
**Space:** O(V) for Union-Find.

**When to use:** Sparse graphs, when edges are naturally given as a list.`,
    advanced: `**Union-Find operations:** find with path compression + union by rank → nearly O(1) amortized per operation.

**Cut property proof:** Sorting edges ensures we always pick the cheapest valid edge across some cut.

**Parallel Kruskal:** Sort edges in parallel, then merge forests — used in large-scale network design.`,
  },

  'floyd-warshall': {
    keywords: ['floyd', 'warshall', 'all pairs', 'apsp'],
    related: ["Dijkstra's", 'Bellman-Ford'],
    beginner: `**Floyd-Warshall** finds shortest paths between **all pairs** of vertices.

**How it works:** Dynamic programming — for each intermediate node k, check if path i→k→j is shorter than i→j.

**Time:** O(V³). **Space:** O(V²).
**Handles negative edges** (but not negative cycles on diagonal).

**When to use:** Small dense graphs needing all-pairs distances.`,
    advanced: `**DP recurrence:** dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]) for each k.

**Negative cycle:** After algorithm, if dist[i][i] < 0 for any i, negative cycle exists.

**Transitive closure variant:** Replace min with OR for reachability in O(V³).

**vs running V Dijkstras:** O(V·(V+E)log V) — Floyd wins for dense graphs (E ≈ V²).`,
  },

  'knapsack': {
    keywords: ['knapsack', '0/1', 'dynamic programming', 'dp'],
    related: ['Fractional Knapsack', 'Matrix Chain'],
    beginner: `**0/1 Knapsack:** Given items with weights and values, maximize total value without exceeding capacity. Each item can be taken **once** (0 or 1).

**DP approach:** Build table dp[i][w] = max value using first i items with capacity w.

**Time:** O(n × W). **Space:** O(n × W), optimizable to O(W).

**When to use:** Resource allocation with indivisible items.`,
    advanced: `**Recurrence:** dp[i][w] = max(dp[i−1][w], dp[i−1][w−wt[i]] + val[i]) if wt[i] ≤ w.

**Space optimization:** Iterate w from W down to wt[i] (1D array) → O(W) space.

**Pseudo-polynomial:** O(nW) is polynomial in W but exponential in bit-length of W.

**vs Fractional Knapsack:** 0/1 requires DP; fractional is greedy (sort by value/weight ratio).`,
  },

  'matrix-chain': {
    keywords: ['matrix chain', 'parenthesization', 'multiplication'],
    related: ['0/1 Knapsack', 'LCS'],
    beginner: `**Matrix Chain Multiplication** finds the best way to parenthesize a chain of matrices to minimize scalar multiplications.

**Example:** A(10×30) × B(30×5) × C(5×60) — order matters!

**Time:** O(n³). **Space:** O(n²).

**When to use:** Compiler expression optimization, ML matrix operation scheduling.`,
    advanced: `**Recurrence:** m[i][j] = min over k of m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j].

**Interval DP pattern:** Fill by increasing chain length l from 2 to n.

**Reconstruction:** Store split[i][j] to print optimal parenthesization.

**Brute force:** Catalan number of parenthesizations → O(4ⁿ/n^1.5).`,
  },

  'lcs': {
    keywords: ['lcs', 'longest common subsequence', 'subsequence'],
    related: ['Matrix Chain', 'String matching'],
    beginner: `**Longest Common Subsequence (LCS)** finds the longest sequence appearing in both strings in order (not necessarily contiguous).

**Example:** "ABCBDAB" and "BDCAB" → LCS = "BCAB" (length 4).

**Time:** O(m × n). **Space:** O(m × n).

**Applications:** Git diff, DNA alignment, file comparison.`,
    advanced: `**Recurrence:** If S1[i]=S2[j]: dp[i][j]=dp[i−1][j−1]+1; else dp[i][j]=max(dp[i−1][j], dp[i][j−1]).

**Space optimization:** O(min(m,n)) using two rows.

**LCS vs Longest Common Substring:** Substring requires contiguity → different DP (reset to 0 on mismatch).

**Reconstruction:** Trace back from dp[m][n] following max of up/left/diagonal.`,
  },

  'n-queens': {
    keywords: ['n queens', 'n-queens', 'backtracking', 'chess'],
    related: ['Backtracking', 'Graph coloring'],
    beginner: `**N-Queens** places N queens on an N×N chessboard so no two attack each other (same row, column, or diagonal).

**Approach:** Backtracking — try placing a queen in each row, backtrack when conflicts arise.

**Time:** O(N!) worst case. **Space:** O(N) for board/recursion.

**Key insight:** Place one queen per row and column; check diagonals with math.`,
    advanced: `**Constraint propagation:** Use column and diagonal sets for O(1) conflict check instead of scanning board.

**Symmetry breaking:** Fix first queen in first half of row 0 to eliminate mirror duplicates.

**Count vs find all:** Same backtracking; counting can use bitmask DP for small N.

**Related:** Graph coloring, Sudoku solvers use identical backtracking framework.`,
  },

  'huffman': {
    keywords: ['huffman', 'compression', 'prefix code', 'encoding'],
    related: ['Greedy algorithms', 'Activity Selection'],
    beginner: `**Huffman Coding** assigns shorter binary codes to more frequent characters — a classic compression technique.

**Greedy rule:** Repeatedly merge the two least frequent nodes into a new tree node.

**Time:** O(n log n) with a min-heap.
**Space:** O(n).

**Result:** Prefix-free codes — no codeword is a prefix of another.`,
    advanced: `**Optimality proof:** Greedy choice — merging two least frequent nodes is safe (exchange argument).

**Build process:** Min-heap of leaf nodes → extract two min, create parent, reinsert until one node remains.

**Average code length:** Within 1 bit of entropy H(X) = −Σ p(x) log₂ p(x).

**Used in:** DEFLATE (gzip, PNG), MP3 metadata, JPEG.`,
  },

  'fractional-knapsack': {
    keywords: ['fractional', 'knapsack', 'greedy', 'ratio'],
    related: ['0/1 Knapsack'],
    beginner: `**Fractional Knapsack** allows taking fractions of items. Greedy strategy: sort by value/weight ratio, take as much as possible of the best items first.

**Time:** O(n log n) for sorting.
**Always optimal** — unlike 0/1 Knapsack which needs DP.

**When to use:** Divisible resources (liquids, bandwidth allocation).`,
    advanced: `**Greedy proof:** Exchange argument — swapping a lower-ratio item for higher-ratio always improves or maintains value.

**vs 0/1 Knapsack:** Fractional is polynomial; 0/1 is NP-hard (pseudo-polynomial via DP).

**Implementation:** Sort by val/wt descending, fill greedily until capacity reached.`,
  },

  'activity-selection': {
    keywords: ['activity', 'interval', 'scheduling', 'greedy'],
    related: ['Fractional Knapsack', 'Huffman Coding'],
    beginner: `**Activity Selection** picks the maximum number of non-overlapping activities from a set with start and finish times.

**Greedy rule:** Sort by finish time, always pick the next compatible activity.

**Time:** O(n log n). **Space:** O(n).

**Real-world:** Meeting room scheduling, CPU job scheduling.`,
    advanced: `**Greedy proof:** Earliest finish time leaves maximum room for future activities (greedy-stays-ahead).

**Weighted variant:** Requires DP — O(n log n) with sorting + binary search.

**Interval scheduling maximization:** Unweighted = greedy; weighted = DP on sorted finish times.`,
  },

  'horspool': {
    keywords: ['horspool', 'string matching', 'pattern', 'shift'],
    related: ['Boyer-Moore'],
    beginner: `**Horspool's Algorithm** is a simplified Boyer-Moore string matcher using a bad-character shift table.

**Idea:** On mismatch, shift the pattern by a precomputed amount based on the mismatched text character.

**Time:** O(n) average, O(nm) worst. **Space:** O(σ) for alphabet table.

**When to use:** Practical string search when full Boyer-Moore is overkill.`,
    advanced: `**Shift table:** For each character c, shift = position of rightmost c in pattern (excluding last), or pattern length if c absent.

**vs Boyer-Moore:** Horspool only uses bad-character rule; simpler table, slightly more shifts in practice.

**Best case:** Sublinear — can skip many characters on mismatch.`,
  },

  'boyer-moore': {
    keywords: ['boyer', 'moore', 'bad character', 'good suffix'],
    related: ['Horspool'],
    beginner: `**Boyer-Moore** scans the pattern right-to-left and skips large sections of text on mismatches.

**Two rules:** Bad character (mismatch char in text) and good suffix (matched suffix pattern).

**Time:** O(n/m) best, O(nm) worst. **Space:** O(σ + m).

**Used in:** grep, text editors, bioinformatics.`,
    advanced: `**Bad character rule:** Shift pattern so mismatched text char aligns with its rightmost occurrence in pattern.

**Good suffix rule:** When suffix matches, shift using precomputed border table (like KMP applied backwards).

**Galil rule optimization:** Avoid re-checking known matching suffix characters.

**Practical performance:** Often 3–5× faster than naive on natural language text.`,
  },

  'complexity': {
    keywords: ['complexity', 'big o', 'time complexity', 'space complexity', 'big-o', 'asymptotic'],
    related: ['All algorithms'],
    beginner: `**Time complexity** measures how runtime grows with input size n.
**Space complexity** measures extra memory used.

**Common classes (fastest → slowest):**
O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)

**Rules of thumb:**
- n < 1,000 → O(n²) may be fine
- n < 10⁶ → need O(n log n) or better
- Always consider **worst case** for interviews`,
    advanced: `**Master Theorem:** T(n) = aT(n/b) + O(n^d)
- d < log_b(a) → O(n^log_b(a))
- d = log_b(a) → O(n^d log n)
- d > log_b(a) → O(n^d)

**Amortized analysis:** Dynamic array push — O(1) amortized despite O(n) occasional resize.

**Space-time tradeoff:** Hash tables O(1) lookup vs sorted arrays O(log n) but less memory.

**NP vs P:** 0/1 Knapsack is NP-hard; Fractional Knapsack is in P (greedy).`,
  },

  'recursion': {
    keywords: ['recursion', 'recursive', 'base case', 'divide conquer'],
    related: ['Merge Sort', 'Quick Sort', 'N-Queens'],
    beginner: `**Recursion** solves a problem by breaking it into smaller instances of the same problem.

**Every recursive function needs:**
1. **Base case** — stops recursion
2. **Recursive case** — calls itself with smaller input

**Examples in this visualizer:** Merge Sort, Quick Sort, N-Queens, tree traversals.

**Watch out for:** Missing base case → stack overflow.`,
    advanced: `**Recurrence relations:** Express T(n) in terms of T(smaller n), solve with Master Theorem or substitution.

**Tail recursion:** Can be optimized to iteration by compiler (not guaranteed in JS/Java).

**Memoization:** Top-down DP — cache recursive results to avoid exponential recomputation.

**Stack depth:** Java default stack ~1MB → ~10,000 frames. Iterative or explicit stack for deep recursion.`,
  },

  'backtracking': {
    keywords: ['backtracking', 'backtrack', 'constraint'],
    related: ['N-Queens'],
    beginner: `**Backtracking** builds solutions incrementally and abandons paths that violate constraints.

**Template:**
1. Make a choice
2. Recurse
3. If failed, undo choice (backtrack) and try next option

**Example:** N-Queens — place queen, check conflicts, backtrack if stuck.

**Time:** Often exponential. **Space:** O(depth) recursion stack.`,
    advanced: `**Pruning:** Constraint propagation eliminates branches early — critical for performance.

**State space tree:** Each node = partial solution; leaves = complete solutions or dead ends.

**vs DFS:** Backtracking is DFS with explicit undo; branch-and-bound adds cost bounds for optimization.

**Sudoku/N-Queens:** Same framework with different constraint checks.`,
  },

  'data-structures': {
    keywords: ['array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'data structure'],
    related: ['All data structure pages'],
    beginner: `**Core data structures in this visualizer:**

- **Array** — O(1) random access, fixed or dynamic
- **Linked List** — O(1) insert/delete at known node, no random access
- **Stack** — LIFO: push/pop O(1)
- **Queue** — FIFO: enqueue/dequeue O(1)
- **Tree (BST)** — O(log n) search/insert/delete when balanced
- **Graph** — adjacency list O(V+E) space, matrix O(V²)

Pick based on your access pattern: random access → array; frequent insert/delete → linked list.`,
    advanced: `**Amortized costs:** Dynamic array doubling → O(1) amortized append.

**BST degradation:** Unbalanced BST → O(n) operations. AVL/Red-Black maintain O(log n).

**Adjacency list vs matrix:** List better for sparse graphs (E << V²); matrix O(1) edge lookup.

**Cache locality:** Arrays outperform linked lists on modern CPUs due to spatial locality.`,
  },
};

function normalize(text) {
  return text.toLowerCase().trim().replace(/[?!.,'"]/g, '').replace(/\s+/g, ' ');
}

function scoreMatch(query, entry) {
  const q = normalize(query);
  let best = 0;

  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (q.includes(k) || k.includes(q)) return 1;
    const words = q.split(' ');
    const matched = words.filter(w => w.length > 2 && k.includes(w));
    best = Math.max(best, matched.length / Math.max(words.length, 1));
  }
  return best;
}

function findBestEntry(query) {
  const q = normalize(query);
  let bestKey = null;
  let bestScore = 0;

  for (const [key, entry] of Object.entries(KNOWLEDGE)) {
    const score = scoreMatch(q, entry);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  if (bestScore >= 0.5) return { key: bestKey, entry: KNOWLEDGE[bestKey] };

  for (const algo of ALGO_NAMES) {
    if (q.includes(algo) || algo.split(' ').every(w => q.includes(w))) {
      const id = algo.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const entry = KNOWLEDGE[id] || KNOWLEDGE[Object.keys(KNOWLEDGE).find(k => k.includes(id.slice(0, 4)))];
      if (entry) return { key: id, entry };
    }
  }

  return null;
}

function isOffTopic(query) {
  const q = normalize(query);
  const offTopicHints = [
    'weather', 'stock', 'crypto', 'recipe', 'movie', 'sport',
    'python django', 'react native', 'machine learning model',
    'neural network training', 'blockchain', 'kubernetes',
    'html css', 'sql injection', 'linux command',
  ];
  if (offTopicHints.some(h => q.includes(h))) return true;

  const hasAlgoHint = Object.values(KNOWLEDGE).some(e =>
    e.keywords.some(kw => q.includes(normalize(kw)))
  ) || ALGO_NAMES.some(n => q.includes(n));

  return !hasAlgoHint && q.length > 10;
}

/**
 * @param {string} question
 * @param {{ mode?: 'beginner' | 'advanced', topic?: string }} options
 * @returns {{ text: string, related: string[], known: boolean }}
 */
export function getTutorResponse(question, { mode = 'beginner' } = {}) {
  const trimmed = (question || '').trim();

  if (!trimmed) {
    return {
      text: 'Please type a question about an algorithm or data structure from the syllabus.',
      related: SYLLABUS_TOPICS.slice(0, 4),
      known: false,
    };
  }

  try {
    if (isOffTopic(trimmed)) {
      return { text: FALLBACK_MESSAGE, related: SYLLABUS_TOPICS, known: false };
    }

    const match = findBestEntry(trimmed);

    if (!match) {
      return { text: FALLBACK_MESSAGE, related: SYLLABUS_TOPICS, known: false };
    }

    const { entry } = match;
    const text = mode === 'advanced' ? entry.advanced : entry.beginner;
    const related = entry.related || [];

    if (!text) {
      return { text: FALLBACK_MESSAGE, related: SYLLABUS_TOPICS, known: false };
    }

    return { text, related, known: true };
  } catch {
    return {
      text: 'Something went wrong processing your question. Please try rephrasing it or ask about a specific algorithm from the syllabus.',
      related: SYLLABUS_TOPICS,
      known: false,
    };
  }
}

export { SYLLABUS_TOPICS, FALLBACK_MESSAGE };
