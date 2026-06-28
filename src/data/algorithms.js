/** Central algorithm catalog — single source of truth for search, cards, and navigation */

export const ALL_ALGORITHMS = [
  { id: 'bubble-sort', title: 'Bubble Sort', category: 'Sorting', to: '/bubble-sort', color: 'var(--cat-sorting)', keywords: ['bubble', 'sort', 'comparison', 'swap', 'adjacent'], description: 'Compare adjacent elements, swap if out of order. Best case O(n) with early exit.', complexity: { time: 'O(n²)', space: 'O(1)' } },
  { id: 'selection-sort', title: 'Selection Sort', category: 'Sorting', to: '/selection-sort', color: 'var(--cat-sorting)', keywords: ['selection', 'minimum', 'swap'], description: 'Find minimum in unsorted portion, swap into place. At most n−1 swaps ever.', complexity: { time: 'O(n²)', space: 'O(1)' } },
  { id: 'insertion-sort', title: 'Insertion Sort', category: 'Sorting', to: '/insertion-sort', color: 'var(--cat-sorting)', keywords: ['insertion', 'online', 'nearly sorted'], description: 'Grow sorted subarray left-to-right. O(n) on nearly-sorted. Online algorithm.', complexity: { time: 'O(n²)', space: 'O(1)' } },
  { id: 'merge-sort', title: 'Merge Sort', category: 'Sorting', to: '/merge-sort', color: 'var(--cat-sorting)', keywords: ['merge', 'divide', 'conquer', 'stable'], description: 'Divide recursively, merge sorted halves. Stable, guaranteed O(n log n).', complexity: { time: 'O(n log n)', space: 'O(n)' } },
  { id: 'quick-sort', title: 'Quick Sort', category: 'Sorting', to: '/quick-sort', color: 'var(--cat-sorting)', keywords: ['quick', 'partition', 'pivot'], description: 'Partition around pivot, sort recursively. Fastest in practice for random data.', complexity: { time: 'O(n log n)', space: 'O(log n)' } },
  { id: 'heap-sort', title: 'Heap Sort', category: 'Sorting', to: '/heap-sort', color: 'var(--cat-sorting)', keywords: ['heap', 'priority', 'extract max'], description: 'Build max-heap, extract maximum repeatedly. In-place, O(n log n) always.', complexity: { time: 'O(n log n)', space: 'O(1)' } },
  { id: 'dijkstra', title: "Dijkstra's", category: 'Graph', to: '/dijkstra', color: 'var(--cat-graph)', keywords: ['dijkstra', 'shortest path', 'priority queue', 'greedy'], description: "Shortest paths from source using a priority queue. Greedy, non-negative weights only.", complexity: { time: 'O((V+E)logV)', space: 'O(V)' } },
  { id: 'bellman-ford', title: 'Bellman-Ford', category: 'Graph', to: '/bellman-ford', color: 'var(--cat-graph)', keywords: ['bellman', 'ford', 'negative', 'relaxation'], description: 'Shortest paths with negative weights. Relax all edges V−1 times. Detects neg cycles.', complexity: { time: 'O(VE)', space: 'O(V)' } },
  { id: 'prims', title: "Prim's MST", category: 'Graph', to: '/prims', color: 'var(--cat-graph)', keywords: ['prim', 'mst', 'minimum spanning'], description: 'Grow MST greedily by always adding cheapest edge connecting new node.', complexity: { time: 'O(E log V)', space: 'O(V)' } },
  { id: 'kruskal', title: "Kruskal's MST", category: 'Graph', to: '/kruskal', color: 'var(--cat-graph)', keywords: ['kruskal', 'union find', 'mst'], description: 'Sort edges by weight, add non-cycle edges using Union-Find data structure.', complexity: { time: 'O(E log E)', space: 'O(V)' } },
  { id: 'floyd-warshall', title: 'Floyd-Warshall', category: 'Graph', to: '/floyd-warshall', color: 'var(--cat-graph)', keywords: ['floyd', 'warshall', 'all pairs', 'apsp'], description: 'All-pairs shortest paths via DP over intermediate nodes. Handles negative edges.', complexity: { time: 'O(V³)', space: 'O(V²)' } },
  { id: 'knapsack', title: '0/1 Knapsack', category: 'DP', to: '/knapsack', color: 'var(--cat-dp)', keywords: ['knapsack', 'dynamic programming', '0/1'], description: 'Maximize value within weight capacity. Classic 2D DP table.', complexity: { time: 'O(nW)', space: 'O(nW)' } },
  { id: 'matrix-chain', title: 'Matrix Chain', category: 'DP', to: '/matrix-chain', color: 'var(--cat-dp)', keywords: ['matrix', 'chain', 'multiplication', 'parenthesization'], description: 'Optimal parenthesization of matrix chain to minimize scalar multiplications.', complexity: { time: 'O(n³)', space: 'O(n²)' } },
  { id: 'lcs', title: 'LCS', category: 'DP', to: '/lcs', color: 'var(--cat-dp)', keywords: ['lcs', 'longest common subsequence', 'string'], description: 'Longest Common Subsequence via 2D DP table. Classic string problem.', complexity: { time: 'O(mn)', space: 'O(mn)' } },
  { id: 'n-queens', title: 'N-Queens', category: 'Backtrack', to: '/n-queens', color: 'var(--cat-backtrack)', keywords: ['n queens', 'backtracking', 'chess'], description: 'Place N queens on N×N board so none attack. Watch backtracking live.', complexity: { time: 'O(N!)', space: 'O(N)' } },
  { id: 'huffman', title: 'Huffman Coding', category: 'Greedy', to: '/huffman', color: 'var(--cat-greedy)', keywords: ['huffman', 'compression', 'prefix code'], description: 'Variable-length prefix codes for compression. Greedy via min-heap priority queue.', complexity: { time: 'O(n log n)', space: 'O(n)' } },
  { id: 'fractional-knapsack', title: 'Frac. Knapsack', category: 'Greedy', to: '/fractional-knapsack', color: 'var(--cat-greedy)', keywords: ['fractional', 'knapsack', 'greedy', 'ratio'], description: 'Take item fractions. Greedy by value/weight ratio — always optimal.', complexity: { time: 'O(n log n)', space: 'O(n)' } },
  { id: 'activity-selection', title: 'Activity Selection', category: 'Greedy', to: '/activity-selection', color: 'var(--cat-greedy)', keywords: ['activity', 'interval', 'scheduling'], description: 'Maximum non-overlapping activities. Greedy: sort by finish time.', complexity: { time: 'O(n log n)', space: 'O(n)' } },
  { id: 'horspool', title: 'Horspool', category: 'String', to: '/horspool', color: 'var(--cat-string)', keywords: ['horspool', 'pattern', 'string matching'], description: 'Simplified Boyer-Moore. Shift table from pattern for fast mismatches.', complexity: { time: 'O(n)', space: 'O(σ)' } },
  { id: 'boyer-moore', title: 'Boyer-Moore', category: 'String', to: '/boyer-moore', color: 'var(--cat-string)', keywords: ['boyer', 'moore', 'bad character', 'good suffix'], description: 'Scan right-to-left with bad character rule. Sublinear in practice.', complexity: { time: 'O(n/m)', space: 'O(σ)' } },
];

export const DS_LIST = [
  { id: 'ds-array', title: 'Arrays', category: 'Data Structure', to: '/ds/array', color: 'var(--cat-ds)', keywords: ['array', 'index', 'contiguous'], description: 'O(1) index access, contiguous memory. 2D arrays and memory layout.', complexity: { time: 'Access O(1)', space: 'O(n)' } },
  { id: 'ds-list', title: 'Linked List', category: 'Data Structure', to: '/ds/linked-list', color: 'var(--cat-ds)', keywords: ['linked list', 'node', 'pointer'], description: 'Singly, Doubly, Circular. Node pointer animation on every operation.', complexity: { time: 'Insert O(1)', space: 'O(n)' } },
  { id: 'ds-stack', title: 'Stack', category: 'Data Structure', to: '/ds/stack', color: 'var(--cat-ds)', keywords: ['stack', 'lifo', 'push', 'pop'], description: 'LIFO. Push, Pop, Peek. Balanced brackets and expression evaluation.', complexity: { time: 'O(1)', space: 'O(n)' } },
  { id: 'ds-queue', title: 'Queue', category: 'Data Structure', to: '/ds/queue', color: 'var(--cat-ds)', keywords: ['queue', 'fifo', 'circular', 'deque'], description: 'FIFO. Simple, Circular, Deque. OS scheduling real-world examples.', complexity: { time: 'O(1)', space: 'O(n)' } },
  { id: 'ds-graph', title: 'Graphs', category: 'Data Structure', to: '/ds/graph', color: 'var(--cat-ds)', keywords: ['graph', 'bfs', 'dfs', 'adjacency'], description: 'Adjacency Matrix vs List. BFS and DFS on interactive graphs.', complexity: { time: 'BFS O(V+E)', space: 'O(V+E)' } },
  { id: 'ds-tree', title: 'Trees', category: 'Data Structure', to: '/ds/tree', color: 'var(--cat-ds)', keywords: ['tree', 'bst', 'traversal'], description: 'BST insert/delete/search + all 4 traversals visualized as tree.', complexity: { time: 'O(log n)', space: 'O(n)' } },
  { id: 'ds-heap', title: 'Heap', category: 'Data Structure', to: '/ds/heap', color: 'var(--cat-ds)', keywords: ['heap', 'min heap', 'max heap', 'priority queue', 'heapify'], description: 'Min & Max Heap with animated insert, extract, and Heap Sort. Array + tree dual view.', complexity: { time: 'O(log n)', space: 'O(n)' } },
  { id: 'ds-hash', title: 'Hash Table', category: 'Data Structure', to: '/ds/hash-table', color: 'var(--cat-ds)', keywords: ['hash table', 'hash map', 'chaining', 'open addressing', 'collision'], description: 'Chaining vs Open Addressing. Linear, Quadratic, and Double Hash probing with live visualization.', complexity: { time: 'O(1) avg', space: 'O(n)' } },
];

export const CATEGORIES = ['All', 'Sorting', 'Graph', 'DP', 'Greedy', 'Backtrack', 'String', 'Data Structure'];

export const CATEGORY_COLORS = {
  Sorting: 'var(--cat-sorting)',
  Graph: 'var(--cat-graph)',
  DP: 'var(--cat-dp)',
  Greedy: 'var(--cat-greedy)',
  Backtrack: 'var(--cat-backtrack)',
  String: 'var(--cat-string)',
  'Data Structure': 'var(--cat-ds)',
};

export const FULL_CATALOG = [...ALL_ALGORITHMS, ...DS_LIST];

export function getAlgorithmById(id) {
  return FULL_CATALOG.find(a => a.id === id) ?? null;
}
