import { useState, useRef, useCallback, useEffect } from 'react';

// ─── BFS algorithm ────────────────────────────────────────────────────────
function bfsSteps(nodes, edges, srcId, directed) {
  const ids = nodes.map(n => n.id);
  const getNeighbors = (u) => {
    if (directed) return edges.filter(e => e.from === u).map(e => e.to);
    return edges.filter(e => e.from === u || e.to === u).map(e => e.from === u ? e.to : e.from);
  };
  const visited = new Set([srcId]);
  const queue = [srcId];
  const parent = { [srcId]: null };
  const order = [];
  const steps = [];

  steps.push({
    type: 'bfs', visited: new Set(visited), queue: [...queue], current: null,
    order: [], parent: { ...parent },
    msg: `BFS from ${srcId}. Initialize: queue = [${srcId}], visited = {${srcId}}`,
    explanation: 'BFS uses a queue (FIFO). We start by enqueuing the source node and marking it visited.'
  });

  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    steps.push({
      type: 'bfs', visited: new Set(visited), queue: [...queue], current: u,
      order: [...order], parent: { ...parent },
      msg: `Dequeue ${u}. Queue = [${queue.join(', ') || '∅'}]`,
      explanation: `We dequeue the front of the queue: node ${u}. Now we explore all its unvisited neighbors.`
    });

    for (const v of getNeighbors(u)) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
        parent[v] = u;
        steps.push({
          type: 'bfs', visited: new Set(visited), queue: [...queue], current: u,
          activeEdge: { from: u, to: v }, order: [...order], parent: { ...parent },
          msg: `Neighbor ${v} unvisited → enqueue. Queue = [${queue.join(', ')}]`,
          explanation: `${v} hasn't been visited. We mark it visited and add to queue. BFS explores by level — all neighbors before going deeper.`
        });
      } else {
        steps.push({
          type: 'bfs', visited: new Set(visited), queue: [...queue], current: u,
          skippedEdge: { from: u, to: v }, order: [...order], parent: { ...parent },
          msg: `Neighbor ${v} already visited — skip`,
          explanation: `${v} is already in visited set. Skipping to avoid revisiting nodes.`
        });
      }
    }
  }
  steps.push({
    type: 'bfs', visited: new Set(visited), queue: [], current: null,
    order: [...order], parent: { ...parent },
    msg: `BFS complete! Visit order: ${order.join(' → ')}`,
    explanation: `BFS finished. The traversal order reflects level-by-level exploration from the source. Time: O(V+E).`
  });
  return steps;
}

// ─── DFS algorithm ────────────────────────────────────────────────────────
function dfsSteps(nodes, edges, srcId, directed) {
  const getNeighbors = (u) => {
    if (directed) return edges.filter(e => e.from === u).map(e => e.to);
    return edges.filter(e => e.from === u || e.to === u).map(e => e.from === u ? e.to : e.from);
  };
  const visited = new Set();
  const stack = [];
  const order = [];
  const parent = { [srcId]: null };
  const steps = [];

  function dfsVisit(u) {
    visited.add(u);
    stack.push(u);
    order.push(u);
    steps.push({
      type: 'dfs', visited: new Set(visited), stack: [...stack], current: u,
      order: [...order], parent: { ...parent },
      msg: `Visit ${u}. Stack = [${stack.join(', ')}]`,
      explanation: `DFS uses a stack (implicit via recursion). Visiting ${u} and pushing onto stack. Going as deep as possible before backtracking.`
    });

    for (const v of getNeighbors(u)) {
      if (!visited.has(v)) {
        parent[v] = u;
        steps.push({
          type: 'dfs', visited: new Set(visited), stack: [...stack], current: u,
          activeEdge: { from: u, to: v }, order: [...order], parent: { ...parent },
          msg: `Edge ${u}→${v}: ${v} unvisited → recurse`,
          explanation: `Found unvisited neighbor ${v}. DFS dives deep: we recurse into ${v} before visiting other neighbors of ${u}.`
        });
        dfsVisit(v);
      } else {
        steps.push({
          type: 'dfs', visited: new Set(visited), stack: [...stack], current: u,
          skippedEdge: { from: u, to: v }, order: [...order], parent: { ...parent },
          msg: `Edge ${u}→${v}: already visited — back-edge`,
          explanation: `${v} is already visited. This is a back-edge (creates a cycle in undirected graphs).`
        });
      }
    }
    stack.pop();
    steps.push({
      type: 'dfs', visited: new Set(visited), stack: [...stack], current: null,
      order: [...order], parent: { ...parent },
      activeEdge: null,
      msg: `Backtrack from ${u}. Stack = [${stack.join(', ') || '∅'}]`,
      explanation: `All neighbors of ${u} explored. Backtracking. DFS backtracks when it can't go deeper.`
    });
  }

  steps.push({
    type: 'dfs', visited: new Set(), stack: [], current: null,
    order: [], parent: {},
    msg: `DFS from ${srcId}. Using recursive DFS with implicit stack.`,
    explanation: 'DFS explores as far as possible along each branch before backtracking. Uses O(V) stack space.'
  });
  dfsVisit(srcId);

  // Visit unvisited (forest DFS)
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      parent[n.id] = null;
      steps.push({
        type: 'dfs', visited: new Set(visited), stack: [...stack], current: null,
        order: [...order], parent: { ...parent },
        msg: `Node ${n.id} unreachable from ${srcId} — starting new DFS tree`,
        explanation: `The graph is disconnected. Starting a new DFS tree from ${n.id}.`
      });
      dfsVisit(n.id);
    }
  }

  steps.push({
    type: 'dfs', visited: new Set(visited), stack: [], current: null,
    order: [...order], parent: { ...parent },
    msg: `DFS complete! Visit order: ${order.join(' → ')}`,
    explanation: `DFS finished. Time: O(V+E). The order shows which nodes were entered first.`
  });
  return steps;
}

// ─── Dijkstra ────────────────────────────────────────────────────────────
function dijkstraSteps(nodes, edges, srcId, directed) {
  const ids = nodes.map(n => n.id);
  const getEdges = (u) => directed
    ? edges.filter(e => e.from === u)
    : edges.filter(e => e.from === u || e.to === u).map(e => e.from === u ? e : { ...e, from: e.to, to: e.from });

  const dist = {}, prev = {}, visited = new Set();
  ids.forEach(id => { dist[id] = Infinity; prev[id] = null; });
  dist[srcId] = 0;
  const steps = [];
  const pq = [...ids];

  steps.push({
    type: 'dijkstra', dist: { ...dist }, visited: new Set(), current: null, relaxed: null, path: [], prev: { ...prev },
    msg: `Init: dist[${srcId}]=0, all others=∞`,
    explanation: 'Dijkstra uses a priority queue. Source distance = 0, all others = ∞. We always process the minimum-distance unvisited node.'
  });

  while (pq.length) {
    pq.sort((a, b) => dist[a] - dist[b]);
    const u = pq.shift();
    if (dist[u] === Infinity) break;
    visited.add(u);
    steps.push({
      type: 'dijkstra', dist: { ...dist }, visited: new Set(visited), current: u, relaxed: null, path: [], prev: { ...prev },
      msg: `Visit node ${u} (dist=${dist[u]}) — minimum in priority queue`,
      explanation: `We pick the unvisited node with smallest distance: ${u} (d=${dist[u]}). This node's distance is now finalized.`
    });

    for (const e of getEdges(u)) {
      const v = e.to;
      if (visited.has(v)) continue;
      const nd = dist[u] + e.weight;
      const better = nd < dist[v];
      steps.push({
        type: 'dijkstra', dist: { ...dist }, visited: new Set(visited), current: u, relaxed: { from: u, to: v, better }, path: [], prev: { ...prev },
        msg: `Edge ${u}→${v} (w=${e.weight}): ${dist[u]}+${e.weight}=${nd} ${better ? `< ${dist[v] === Infinity ? '∞' : dist[v]} → RELAX` : `≥ ${dist[v]}, skip`}`,
        explanation: better
          ? `Through ${u}: cost ${nd} < current ${dist[v] === Infinity ? '∞' : dist[v]}. Update dist[${v}] and set parent to ${u}.`
          : `Through ${u}: cost ${nd} is not better than current ${dist[v]}. No update.`
      });
      if (better) { dist[v] = nd; prev[v] = u; }
    }
  }

  const allPaths = {};
  ids.forEach(id => {
    const p = []; let cur = id;
    while (cur !== null) { p.unshift(cur); cur = prev[cur]; }
    if (p[0] === srcId) allPaths[id] = p;
  });

  steps.push({
    type: 'dijkstra', dist: { ...dist }, visited: new Set(visited), current: null, relaxed: null, path: allPaths, prev: { ...prev },
    msg: `Done! Shortest distances from ${srcId}: ${ids.map(id => `${id}=${dist[id] === Infinity ? '∞' : dist[id]}`).join(', ')}`,
    explanation: 'Dijkstra complete. Highlighted paths are shortest routes. Works only with non-negative weights. Time: O((V+E) log V) with binary heap.'
  });
  return steps;
}

// ─── Bellman-Ford ────────────────────────────────────────────────────────
function bellmanFordSteps(nodes, edges, srcId) {
  const ids = nodes.map(n => n.id);
  const dist = {}, prev = {};
  ids.forEach(id => { dist[id] = Infinity; prev[id] = null; });
  dist[srcId] = 0;
  const steps = [];
  steps.push({
    type: 'bellman', dist: { ...dist }, checkEdge: null, relaxed: null, iter: 0, prev: { ...prev },
    msg: `Init: dist[${srcId}]=0, all others=∞`,
    explanation: 'Bellman-Ford relaxes all edges V-1 times. Unlike Dijkstra, it handles negative edge weights.'
  });

  for (let i = 1; i <= ids.length - 1; i++) {
    steps.push({
      type: 'bellman', dist: { ...dist }, checkEdge: null, relaxed: null, iter: i, prev: { ...prev },
      msg: `── Iteration ${i} of ${ids.length - 1} ──`,
      explanation: `Iteration ${i}: checking all ${edges.length} edges. After V-1 iterations, all shortest paths are found.`
    });
    for (const e of edges) {
      const { from: u, to: v, weight: w } = e;
      if (dist[u] === Infinity) {
        steps.push({ type: 'bellman', dist: { ...dist }, checkEdge: e, relaxed: false, iter: i, prev: { ...prev }, msg: `Edge ${u}→${v}: dist[${u}]=∞, skip`, explanation: `${u} not yet reached from source. Can't relax edge ${u}→${v}.` });
        continue;
      }
      const nd = dist[u] + w;
      const better = nd < dist[v];
      steps.push({
        type: 'bellman', dist: { ...dist }, checkEdge: e, relaxed: better, iter: i, prev: { ...prev },
        msg: `${u}→${v}(w=${w}): ${dist[u]}+${w}=${nd} ${better ? `< ${dist[v] === Infinity ? '∞' : dist[v]} → RELAX` : `≥ ${dist[v]}`}`,
        explanation: better ? `Found shorter path to ${v} via ${u}. Update dist[${v}] = ${nd}.` : `No improvement for ${v}.`
      });
      if (better) { dist[v] = nd; prev[v] = u; }
    }
  }
  let negCycle = false;
  for (const e of edges) {
    if (dist[e.from] !== Infinity && dist[e.from] + e.weight < dist[e.to]) { negCycle = true; break; }
  }
  steps.push({
    type: 'bellman', dist: { ...dist }, checkEdge: null, relaxed: null, iter: ids.length, negCycle, prev: { ...prev },
    msg: negCycle ? '⚠ Negative cycle detected!' : `✓ Done: ${ids.map(id => `${id}=${dist[id] === Infinity ? '∞' : dist[id]}`).join(', ')}`,
    explanation: negCycle ? 'A negative cycle exists — distances can decrease indefinitely. No shortest paths.' : 'Bellman-Ford complete. Time: O(V·E). Slower than Dijkstra but handles negative weights.'
  });
  return steps;
}

// ─── Prim's MST ────────────────────────────────────────────────────────────
function primsSteps(nodes, edges) {
  if (!nodes.length) return [];
  const inMST = new Set([nodes[0].id]);
  const mstEdges = [];
  const steps = [];
  steps.push({
    type: 'prim', inMST: new Set(inMST), mstEdges: [], candidate: null,
    msg: `Start with node ${nodes[0].id}`,
    explanation: "Prim's greedily grows the MST. Start with any node, then always pick the minimum-weight edge crossing the cut."
  });

  while (inMST.size < nodes.length) {
    let best = null;
    for (const e of edges) {
      const inA = inMST.has(e.from), inB = inMST.has(e.to);
      if ((inA && !inB) || (!inA && inB)) {
        steps.push({
          type: 'prim', inMST: new Set(inMST), mstEdges: [...mstEdges], candidate: e,
          msg: `Candidate: ${e.from}↔${e.to} (w=${e.weight})`,
          explanation: `Edge ${e.from}↔${e.to} crosses the MST boundary (cut). Checking if it's the minimum available.`
        });
        if (!best || e.weight < best.weight) best = e;
      }
    }
    if (!best) break;
    mstEdges.push(best);
    const newNode = inMST.has(best.from) ? best.to : best.from;
    inMST.add(newNode);
    steps.push({
      type: 'prim', inMST: new Set(inMST), mstEdges: [...mstEdges], candidate: null,
      msg: `Add edge ${best.from}↔${best.to} (w=${best.weight}), include node ${newNode}`,
      explanation: `Minimum cut edge was ${best.from}↔${best.to}. Adding to MST. Now ${inMST.size} of ${nodes.length} nodes are in the MST.`
    });
  }
  const totalW = mstEdges.reduce((s, e) => s + e.weight, 0);
  steps.push({
    type: 'prim', inMST: new Set(inMST), mstEdges: [...mstEdges], candidate: null,
    msg: `MST complete! Total weight = ${totalW}`,
    explanation: `Prim's complete. MST has ${mstEdges.length} edges connecting all ${nodes.length} nodes at minimum cost. Time: O(E log V).`
  });
  return steps;
}

// ─── Kruskal's MST ──────────────────────────────────────────────────────────
function kruskalSteps(nodes, edges) {
  const parent = {};
  const rank = {};
  nodes.forEach(n => { parent[n.id] = n.id; rank[n.id] = 0; });
  function find(x) { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; }
  function union(x, y) {
    const rx = find(x), ry = find(y);
    if (rx === ry) return false;
    if (rank[rx] < rank[ry]) parent[rx] = ry;
    else if (rank[rx] > rank[ry]) parent[ry] = rx;
    else { parent[ry] = rx; rank[rx]++; }
    return true;
  }

  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const mstEdges = [];
  const steps = [];
  steps.push({
    type: 'kruskal', mstEdges: [], checkEdge: null, accepted: false,
    msg: `Sorted ${sorted.length} edges by weight`,
    explanation: "Kruskal's sorts all edges by weight, then greedily adds the cheapest edge that doesn't create a cycle. Uses Union-Find (disjoint set)."
  });

  for (const e of sorted) {
    const cycle = find(e.from) === find(e.to);
    steps.push({
      type: 'kruskal', mstEdges: [...mstEdges], checkEdge: e, accepted: false,
      msg: `Edge ${e.from}↔${e.to} (w=${e.weight}): ${cycle ? 'creates cycle → SKIP' : 'safe → ACCEPT'}`,
      explanation: cycle
        ? `${e.from} and ${e.to} are already in the same component. Adding this edge would form a cycle.`
        : `${e.from} and ${e.to} are in different components. This edge is safe to add.`
    });
    if (!cycle) {
      union(e.from, e.to);
      mstEdges.push(e);
      steps.push({
        type: 'kruskal', mstEdges: [...mstEdges], checkEdge: e, accepted: true,
        msg: `Accepted! MST now has ${mstEdges.length} edges`,
        explanation: `Merged the two components. MST grows to ${mstEdges.length} edges.`
      });
    }
  }
  const totalW = mstEdges.reduce((s, e) => s + e.weight, 0);
  steps.push({
    type: 'kruskal', mstEdges: [...mstEdges], checkEdge: null, accepted: false,
    msg: `MST complete! ${mstEdges.length} edges, total weight = ${totalW}`,
    explanation: `Kruskal's complete. Minimum Spanning Tree found with total weight ${totalW}. Time: O(E log E).`
  });
  return steps;
}

// ─── Floyd-Warshall ──────────────────────────────────────────────────────────
function floydSteps(nodes, edges) {
  const ids = nodes.map(n => n.id);
  const n = ids.length;
  const INF = 99999;
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : INF));
  edges.forEach(e => {
    const fi = ids.indexOf(e.from), ti = ids.indexOf(e.to);
    if (fi >= 0 && ti >= 0) { dist[fi][ti] = e.weight; dist[ti][fi] = e.weight; }
  });
  const steps = [];
  steps.push({
    type: 'floyd', dist: dist.map(r => [...r]), k: -1, i: -1, j: -1, updated: false,
    msg: 'Initialize distance matrix with direct edge weights',
    explanation: 'Floyd-Warshall finds all-pairs shortest paths. Build initial matrix: 0 on diagonal, edge weights, ∞ for no direct edge.'
  });

  for (let k = 0; k < n; k++) {
    steps.push({
      type: 'floyd', dist: dist.map(r => [...r]), k, i: -1, j: -1, updated: false,
      msg: `Intermediate node: ${ids[k]}`,
      explanation: `Try routing all pairs through intermediate node ${ids[k]}. Does going through ${ids[k]} create a shorter path?`
    });
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const via = dist[i][k] + dist[k][j];
        const better = via < dist[i][j];
        if (better) {
          steps.push({
            type: 'floyd', dist: dist.map(r => [...r]), k, i, j, updated: false,
            msg: `dist[${ids[i]}][${ids[j]}]=${dist[i][j] >= INF ? '∞' : dist[i][j]}, via ${ids[k]}=${via >= INF ? '∞' : via} → UPDATE`,
            explanation: `Path ${ids[i]}→${ids[k]}→${ids[j]} costs ${via < INF ? via : '∞'}, shorter than current ${dist[i][j] >= INF ? '∞' : dist[i][j]}. Updating.`
          });
          dist[i][j] = via;
          steps.push({
            type: 'floyd', dist: dist.map(r => [...r]), k, i, j, updated: true,
            msg: `Updated dist[${ids[i]}][${ids[j]}]=${via}`,
            explanation: `dist[${ids[i]}][${ids[j]}] = ${via} via ${ids[k]}.`
          });
        }
      }
    }
  }
  steps.push({
    type: 'floyd', dist: dist.map(r => [...r]), k: -1, i: -1, j: -1, updated: false,
    msg: 'All-pairs shortest paths complete',
    explanation: 'Floyd-Warshall done. Matrix now contains shortest distances between every pair of nodes. Time: O(V³).'
  });
  return steps;
}

// ─── Random & Grid graph generators ─────────────────────────────────────────
function randomGraph(nodeCount = 6) {
  const labels = 'ABCDEFGHIJKLMNOP';
  const CX = 260, CY = 180;
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: labels[i],
    x: CX + Math.cos((i / nodeCount) * 2 * Math.PI) * 155 + (Math.random() - 0.5) * 40,
    y: CY + Math.sin((i / nodeCount) * 2 * Math.PI) * 130 + (Math.random() - 0.5) * 40,
  }));
  const edges = [];
  for (let i = 1; i < nodeCount; i++) {
    edges.push({ id: `e${edges.length}`, from: labels[i - 1], to: labels[i], weight: Math.floor(Math.random() * 14) + 1 });
  }
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 2; j < nodeCount; j++) {
      if (Math.random() < 0.35)
        edges.push({ id: `e${edges.length}`, from: labels[i], to: labels[j], weight: Math.floor(Math.random() * 14) + 1 });
    }
  }
  return { nodes, edges };
}

function gridGraph(rows = 3, cols = 3) {
  const nodes = [];
  const edges = [];
  const PAD = 70, STEP = 90;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      nodes.push({ id: `${r * cols + c}`, x: PAD + c * STEP, y: PAD + r * STEP });
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;
      if (c + 1 < cols) edges.push({ id: `e${edges.length}`, from: `${id}`, to: `${id + 1}`, weight: Math.floor(Math.random() * 9) + 1 });
      if (r + 1 < rows) edges.push({ id: `e${edges.length}`, from: `${id}`, to: `${id + cols}`, weight: Math.floor(Math.random() * 9) + 1 });
    }
  }
  return { nodes, edges };
}

const ALGO_OPTIONS = ['BFS', 'DFS', 'Dijkstra', 'Bellman-Ford', "Prim's MST", "Kruskal's MST", 'Floyd-Warshall'];
const ALGO_DESCRIPTIONS = {
  BFS: 'Breadth-First Search — explores level by level using a queue. Finds shortest path in unweighted graphs.',
  DFS: 'Depth-First Search — explores as deep as possible using a stack/recursion. Used for cycle detection, topological sort.',
  Dijkstra: 'Greedy shortest path. Priority queue picks minimum-distance node. Requires non-negative weights.',
  'Bellman-Ford': 'Shortest path. Relaxes all edges V-1 times. Handles negative weights, detects negative cycles.',
  "Prim's MST": 'Minimum Spanning Tree. Grows from a seed node, always picks cheapest cut edge.',
  "Kruskal's MST": 'Minimum Spanning Tree. Sorts edges by weight, adds cheapest that does not create a cycle (Union-Find).',
  'Floyd-Warshall': 'All-pairs shortest paths. O(V³) DP over intermediate nodes. Works with negative weights (no negative cycles).',
};

// ─── Arrow marker defs for directed graphs ──────────────────────────────────
function ArrowDefs() {
  return (
    <defs>
      <marker id="arrow-default" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
      </marker>
      <marker id="arrow-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
      </marker>
      <marker id="arrow-skip" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
      </marker>
      <marker id="arrow-mst" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
      </marker>
      <marker id="arrow-candidate" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#eab308" />
      </marker>
    </defs>
  );
}

export default function GraphLab() {
  const svgRef = useRef(null);
  const timerRef = useRef(null);
  const init = randomGraph(6);

  const [nodes, setNodes] = useState(init.nodes);
  const [edges, setEdges] = useState(init.edges);
  const [directed, setDirected] = useState(false);
  const [weighted, setWeighted] = useState(true);
  const [mode, setMode] = useState('select');
  const [edgeFrom, setEdgeFrom] = useState(null);
  const [edgeWeight, setEdgeWeight] = useState('5');
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedAlgo, setSelectedAlgo] = useState('BFS');
  const [srcNode, setSrcNode] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(700);
  const [editingEdge, setEditingEdge] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [showExplanation, setShowExplanation] = useState(true);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  const current = steps[stepIdx] || null;

  // ── SVG helpers ──────────────────────────────────────────────────────────
  const getSVGPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const resetAlgo = useCallback(() => {
    clearInterval(timerRef.current);
    setRunning(false);
    setSteps([]);
    setStepIdx(-1);
  }, []);

  // ── Graph interactions ───────────────────────────────────────────────────
  const handleSVGClick = useCallback((e) => {
    if (dragging) return;
    const pt = getSVGPoint(e);
    if (mode === 'addNode') {
      const labels = 'ABCDEFGHIJKLMNOP';
      const used = new Set(nodes.map(n => n.id));
      const id = labels.split('').find(l => !used.has(l)) || `N${nodes.length}`;
      setNodes(ns => [...ns, { id, x: pt.x, y: pt.y }]);
      resetAlgo();
    }
  }, [mode, nodes, dragging, getSVGPoint, resetAlgo]);

  const handleNodeClick = useCallback((e, nodeId) => {
    e.stopPropagation();
    if (mode === 'addEdge') {
      if (!edgeFrom) { setEdgeFrom(nodeId); return; }
      if (edgeFrom === nodeId) { setEdgeFrom(null); return; }
      if (edges.some(ed => ed.from === edgeFrom && ed.to === nodeId)) { setEdgeFrom(null); return; }
      const w = parseInt(edgeWeight) || 1;
      setEdges(es => [...es, { id: `e${Date.now()}`, from: edgeFrom, to: nodeId, weight: w }]);
      setEdgeFrom(null);
      resetAlgo();
    } else if (mode === 'delete') {
      setNodes(ns => ns.filter(n => n.id !== nodeId));
      setEdges(es => es.filter(ed => ed.from !== nodeId && ed.to !== nodeId));
      resetAlgo();
    } else {
      setSrcNode(nodeId);
    }
  }, [mode, edgeFrom, edgeWeight, edges, resetAlgo]);

  const handleMouseDown = useCallback((e, nodeId) => {
    if (mode !== 'select') return;
    e.stopPropagation();
    const pt = getSVGPoint(e);
    const node = nodes.find(n => n.id === nodeId);
    if (node) { setDragging(nodeId); setDragOffset({ x: pt.x - node.x, y: pt.y - node.y }); }
  }, [mode, nodes, getSVGPoint]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const pt = getSVGPoint(e);
    setNodes(ns => ns.map(n => n.id === dragging
      ? { ...n, x: Math.max(20, Math.min(SVG_W - 20, pt.x - dragOffset.x)), y: Math.max(20, Math.min(SVG_H - 20, pt.y - dragOffset.y)) }
      : n));
  }, [dragging, dragOffset, getSVGPoint]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const handleEdgeClick = useCallback((e, edge) => {
    e.stopPropagation();
    if (mode === 'delete') { setEdges(es => es.filter(ed => ed.id !== edge.id)); resetAlgo(); }
    else if (weighted) { setEditingEdge(edge.id); setEditWeight(String(edge.weight)); }
  }, [mode, weighted, resetAlgo]);

  const saveEdgeWeight = () => {
    const w = parseInt(editWeight);
    if (!isNaN(w) && w > 0) {
      setEdges(es => es.map(e => e.id === editingEdge ? { ...e, weight: w } : e));
      resetAlgo();
    }
    setEditingEdge(null);
  };

  // ── Algorithm runner ──────────────────────────────────────────────────────
  const runAlgo = () => {
    resetAlgo();
    if (!nodes.length) return;
    const src = srcNode || nodes[0].id;
    let s = [];
    if (selectedAlgo === 'BFS') s = bfsSteps(nodes, edges, src, directed);
    else if (selectedAlgo === 'DFS') s = dfsSteps(nodes, edges, src, directed);
    else if (selectedAlgo === 'Dijkstra') s = dijkstraSteps(nodes, edges, src, directed);
    else if (selectedAlgo === 'Bellman-Ford') s = bellmanFordSteps(nodes, edges, src);
    else if (selectedAlgo === "Prim's MST") s = primsSteps(nodes, edges);
    else if (selectedAlgo === "Kruskal's MST") s = kruskalSteps(nodes, edges);
    else if (selectedAlgo === 'Floyd-Warshall') s = floydSteps(nodes, edges);
    if (!s.length) return;
    setSteps(s);
    setStepIdx(0);
    setRunning(true);
    let i = 1;
    timerRef.current = setInterval(() => {
      if (i >= s.length) { clearInterval(timerRef.current); setRunning(false); setStepIdx(s.length - 1); return; }
      setStepIdx(i); i++;
    }, speed);
  };

  const stepPrev = () => { if (!running) setStepIdx(i => Math.max(0, i - 1)); };
  const stepNext = () => { if (!running && stepIdx < steps.length - 1) setStepIdx(i => i + 1); };
  const pause = () => { clearInterval(timerRef.current); setRunning(false); };
  const resume = () => {
    if (stepIdx >= steps.length - 1) return;
    setRunning(true);
    let i = stepIdx + 1;
    timerRef.current = setInterval(() => {
      if (i >= steps.length) { clearInterval(timerRef.current); setRunning(false); return; }
      setStepIdx(i); i++;
    }, speed);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Graph import/export ───────────────────────────────────────────────────
  const exportGraph = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'graph.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importGraph = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.nodes || !parsed.edges) throw new Error('Must have nodes and edges arrays.');
      setNodes(parsed.nodes);
      setEdges(parsed.edges);
      resetAlgo();
      setImportJson('');
    } catch (err) {
      setImportError('Invalid JSON: ' + err.message);
    }
  };

  // ── Color helpers ──────────────────────────────────────────────────────────
  const getNodeFill = (id) => {
    if (!current) return id === srcNode ? '#7c3aed' : '#1e293b';
    // BFS/DFS
    if (current.type === 'bfs' || current.type === 'dfs') {
      if (current.current === id) return '#f97316';
      if (current.visited?.has(id)) return '#22c55e';
    }
    // Dijkstra/Bellman
    if (current.type === 'dijkstra' || current.type === 'bellman') {
      if (current.current === id) return '#f97316';
      if (current.visited?.has(id)) return '#22c55e';
    }
    // Prim
    if (current.type === 'prim' && current.inMST?.has(id)) return '#22c55e';
    if (id === srcNode) return '#7c3aed';
    return '#1e293b';
  };

  const getEdgeStyle = (e) => {
    if (!current) return { stroke: '#334155', width: 1.5, marker: 'arrow-default' };
    // BFS/DFS active/skip
    const isActive = current.activeEdge && ((current.activeEdge.from === e.from && current.activeEdge.to === e.to) || (!directed && current.activeEdge.from === e.to && current.activeEdge.to === e.from));
    const isSkip = current.skippedEdge && ((current.skippedEdge.from === e.from && current.skippedEdge.to === e.to) || (!directed && current.skippedEdge.from === e.to && current.skippedEdge.to === e.from));
    if (isActive) return { stroke: '#22c55e', width: 2.5, marker: 'arrow-active' };
    if (isSkip) return { stroke: '#f97316', width: 2, marker: 'arrow-skip' };
    // Dijkstra relaxed
    if (current.relaxed) {
      const { from, to, better } = current.relaxed;
      if ((e.from === from && e.to === to) || (!directed && e.from === to && e.to === from))
        return { stroke: better ? '#22c55e' : '#f97316', width: 2.5, marker: better ? 'arrow-active' : 'arrow-skip' };
    }
    // Bellman checkEdge
    if (current.checkEdge) {
      const ce = current.checkEdge;
      if (e.from === ce.from && e.to === ce.to)
        return { stroke: current.relaxed ? '#22c55e' : '#f97316', width: 2.5, marker: current.relaxed ? 'arrow-active' : 'arrow-skip' };
    }
    // Prim mstEdges
    if (current.mstEdges) {
      const inMST = current.mstEdges.find(m => (m.from === e.from && m.to === e.to) || (m.from === e.to && m.to === e.from));
      if (inMST) return { stroke: '#22c55e', width: 3, marker: 'arrow-mst' };
      const isCandidate = current.candidate && ((current.candidate.from === e.from && current.candidate.to === e.to) || (current.candidate.from === e.to && current.candidate.to === e.from));
      if (isCandidate) return { stroke: '#eab308', width: 2.5, marker: 'arrow-candidate' };
    }
    // Kruskal
    if (current.type === 'kruskal' && current.mstEdges) {
      const inMST = current.mstEdges.find(m => (m.from === e.from && m.to === e.to) || (m.from === e.to && m.to === e.from));
      if (inMST) return { stroke: '#22c55e', width: 3, marker: 'arrow-mst' };
      if (current.checkEdge && current.checkEdge.id === e.id) return { stroke: current.accepted ? '#22c55e' : '#f97316', width: 2.5, marker: current.accepted ? 'arrow-active' : 'arrow-skip' };
    }
    // Floyd path
    if (current.path && typeof current.path === 'object' && !Array.isArray(current.path)) {
      for (const p of Object.values(current.path)) {
        for (let k = 0; k < p.length - 1; k++) {
          if ((e.from === p[k] && e.to === p[k + 1]) || (e.from === p[k + 1] && e.to === p[k]))
            return { stroke: '#22c55e', width: 2.5, marker: 'arrow-mst' };
        }
      }
    }
    return { stroke: '#334155', width: 1.5, marker: 'arrow-default' };
  };

  // ── Edge midpoint with offset for directed parallel edges ──────────────────
  const edgeMidpoint = (fn, tn, offset = 0) => {
    const mx = (fn.x + tn.x) / 2;
    const my = (fn.y + tn.y) / 2;
    if (offset === 0) return { mx, my };
    const dx = tn.x - fn.x, dy = tn.y - fn.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { mx: mx + (-dy / len) * offset, my: my + (dx / len) * offset };
  };

  // ── Distance/queue panel ───────────────────────────────────────────────────
  const renderInfoPanel = () => {
    if (!current) return null;
    // BFS queue
    if (current.type === 'bfs') {
      return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          <div style={{ flex: 1, minWidth: 180, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>QUEUE (front → back)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {current.queue.length === 0
                ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>empty ∅</span>
                : current.queue.map((n, i) => (
                  <span key={i} style={{ background: i === 0 ? 'rgba(0,212,255,0.15)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text)' }}>{n}</span>
                ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>VISITED ORDER</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#22c55e' }}>
              {current.order.length ? current.order.join(' → ') : '—'}
            </div>
          </div>
        </div>
      );
    }
    // DFS stack
    if (current.type === 'dfs') {
      return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          <div style={{ flex: 1, minWidth: 180, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>CALL STACK (top)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {current.stack.length === 0
                ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>empty ∅</span>
                : [...current.stack].reverse().map((n, i) => (
                  <span key={i} style={{ background: i === 0 ? 'rgba(0,212,255,0.15)' : 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text)', width: 'fit-content' }}>{n}</span>
                ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>VISIT ORDER</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#22c55e' }}>
              {current.order.length ? current.order.join(' → ') : '—'}
            </div>
          </div>
        </div>
      );
    }
    // Dijkstra/Bellman distance table
    if ((current.type === 'dijkstra' || current.type === 'bellman') && current.dist) {
      return (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>DISTANCE TABLE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {nodes.map(n => {
              const d = current.dist[n.id];
              const isCurrent = current.current === n.id;
              return (
                <div key={n.id} style={{ background: 'var(--surface2)', border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 50 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, color: isCurrent ? 'var(--accent)' : 'var(--text)' }}>{n.id}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: d === Infinity ? 'var(--muted)' : '#22c55e' }}>{d === Infinity ? '∞' : d}</div>
                  {current.prev && current.prev[n.id] !== null && current.prev[n.id] !== undefined && (
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--muted)' }}>via {current.prev[n.id]}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // Floyd matrix
    if (current.type === 'floyd' && current.dist) {
      const ids = nodes.map(n => n.id);
      return (
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>DISTANCE MATRIX (all-pairs)</div>
          <table style={{ borderCollapse: 'collapse', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
            <thead><tr>
              <th style={{ padding: '3px 8px', color: 'var(--muted)' }}></th>
              {ids.map(id => <th key={id} style={{ padding: '3px 8px', color: 'var(--accent)' }}>{id}</th>)}
            </tr></thead>
            <tbody>
              {ids.map((ri, i) => (
                <tr key={ri}>
                  <td style={{ padding: '3px 8px', color: 'var(--accent)', fontWeight: 700 }}>{ri}</td>
                  {ids.map((ci, j) => {
                    const v = current.dist[i]?.[j];
                    const isActive = current.i === i && current.j === j;
                    const isUpdated = isActive && current.updated;
                    return (
                      <td key={ci} style={{ padding: '3px 8px', textAlign: 'center', border: '1px solid var(--border)', background: isUpdated ? 'rgba(34,197,94,0.2)' : isActive ? 'rgba(0,212,255,0.15)' : 'transparent', color: isUpdated ? '#22c55e' : isActive ? 'var(--accent)' : 'var(--text)', transition: 'background 0.2s' }}>
                        {v >= 99999 ? '∞' : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  const SVG_W = 520, SVG_H = 360;
  const needsSrc = ['BFS', 'DFS', 'Dijkstra', 'Bellman-Ford'].includes(selectedAlgo);

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', color: '#a78bfa', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'JetBrains Mono' }}>Interactive Lab</span>
          </div>
          <h1 style={{ color: '#a78bfa' }}>Graph Lab</h1>
          <p>Build your own graph interactively. Add nodes, drag to reposition, add weighted edges, then run any graph algorithm with step-by-step explanation.</p>
        </div>

        {/* Graph type toggles */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => { setDirected(d => !d); resetAlgo(); }}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', borderColor: directed ? 'var(--accent)' : 'var(--border)', background: directed ? 'rgba(0,212,255,0.1)' : 'var(--surface2)', color: directed ? 'var(--accent)' : 'var(--muted)' }}>
            {directed ? '→ Directed' : '↔ Undirected'}
          </button>
          <button
            onClick={() => setWeighted(w => !w)}
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', borderColor: weighted ? 'var(--accent)' : 'var(--border)', background: weighted ? 'rgba(0,212,255,0.1)' : 'var(--surface2)', color: weighted ? 'var(--accent)' : 'var(--muted)' }}>
            {weighted ? '⚖ Weighted' : '— Unweighted'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
            {directed ? 'Edges have direction (arrows)' : 'Edges are bidirectional'} · {weighted ? 'Click edge labels to edit weights' : 'All weights = 1'}
          </span>
        </div>

        <div className="graph-lab-shell">
          {/* ── SVG Canvas ── */}
          <div className="graph-canvas-stack">
            {/* Toolbar */}
            <div className="graph-toolbar">
              {[['select', '↖ Select/Drag'], ['addNode', '+ Add Node'], ['addEdge', directed ? '→ Add Edge' : '— Add Edge'], ['delete', '✕ Delete']].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setEdgeFrom(null); }}
                  style={{ padding: '6px 13px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', borderColor: mode === m ? 'var(--accent)' : 'var(--border)', background: mode === m ? 'rgba(0,212,255,0.1)' : 'var(--surface2)', color: mode === m ? 'var(--accent)' : 'var(--muted)' }}>
                  {label}
                </button>
              ))}
              {mode === 'addEdge' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>weight:</span>
                  <input type="number" value={edgeWeight} onChange={e => setEdgeWeight(e.target.value)} min={1} max={99}
                    style={{ width: 48, padding: '3px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                </div>
              )}
              <button onClick={() => { const g = randomGraph(6); setNodes(g.nodes); setEdges(g.edges); setSrcNode(null); resetAlgo(); }}
                className="btn btn-secondary" style={{ padding: '6px 13px', fontSize: 12, marginLeft: 'auto' }}>⟳ Random</button>
              <button onClick={() => { const g = gridGraph(3, 3); setNodes(g.nodes); setEdges(g.edges); setSrcNode(null); resetAlgo(); }}
                className="btn btn-secondary" style={{ padding: '6px 13px', fontSize: 12 }}>⊞ Grid</button>
              <button onClick={() => { setNodes([]); setEdges([]); setSrcNode(null); resetAlgo(); }}
                className="btn btn-danger" style={{ padding: '6px 13px', fontSize: 12 }}>Clear</button>
            </div>

            {edgeFrom && (
              <div style={{ padding: '7px 12px', marginBottom: 8, background: 'rgba(0,212,255,0.08)', border: '1px solid var(--accent)', borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>
                Click destination node to add edge from <strong>{edgeFrom}</strong> — click {edgeFrom} again to cancel
              </div>
            )}

            {/* SVG */}
            <div className="graph-svg-shell">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="xMidYMid meet"
                className="graph-svg"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, cursor: mode === 'addNode' ? 'crosshair' : 'default' }}
                onClick={handleSVGClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <ArrowDefs />

                {/* Edges */}
                {edges.map(e => {
                  const fn = nodes.find(n => n.id === e.from);
                  const tn = nodes.find(n => n.id === e.to);
                  if (!fn || !tn) return null;
                  const style = getEdgeStyle(e);
                  const { mx, my } = edgeMidpoint(fn, tn, directed ? 12 : 0);
                  const dx = tn.x - fn.x, dy = tn.y - fn.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const r = 20;
                  const x1 = fn.x + (dx / len) * r;
                  const y1 = fn.y + (dy / len) * r;
                  const x2 = tn.x - (dx / len) * (r + (directed ? 10 : 0));
                  const y2 = tn.y - (dy / len) * (r + (directed ? 10 : 0));
                  return (
                    <g key={e.id} onClick={ev => handleEdgeClick(ev, e)} style={{ cursor: 'pointer' }}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={style.stroke} strokeWidth={style.width} strokeLinecap="round"
                        markerEnd={directed ? `url(#${style.marker})` : undefined}
                        style={{ transition: 'stroke 0.3s' }} />
                      {weighted && (
                        <>
                          <rect x={mx - 11} y={my - 9} width={22} height={16} rx={4} fill="var(--surface)" stroke={style.stroke} strokeWidth={0.8} style={{ transition: 'stroke 0.3s' }} />
                          {editingEdge === e.id
                            ? <foreignObject x={mx - 18} y={my - 12} width={36} height={22}>
                                <input value={editWeight} onChange={ev => setEditWeight(ev.target.value)}
                                  onBlur={saveEdgeWeight} onKeyDown={ev => ev.key === 'Enter' && saveEdgeWeight()}
                                  autoFocus style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: 10, background: 'var(--surface2)', border: 'none', color: 'var(--text)', textAlign: 'center', borderRadius: 3 }} />
                              </foreignObject>
                            : <text x={mx} y={my + 4} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" fill={style.stroke} style={{ transition: 'fill 0.3s', pointerEvents: 'none' }}>{e.weight}</text>
                          }
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map(n => {
                  const fill = getNodeFill(n.id);
                  const isSrc = n.id === srcNode;
                  const isCurrent = current?.current === n.id;
                  return (
                    <g key={n.id}
                      onClick={ev => handleNodeClick(ev, n.id)}
                      onMouseDown={ev => handleMouseDown(ev, n.id)}
                      style={{ cursor: mode === 'select' ? 'grab' : 'pointer' }}>
                      <circle cx={n.x} cy={n.y} r={20} fill={fill}
                        stroke={isSrc ? '#a78bfa' : isCurrent ? '#f97316' : current?.inMST?.has(n.id) ? '#22c55e' : 'var(--border)'}
                        strokeWidth={isSrc || isCurrent ? 2.5 : 1.5}
                        style={{ transition: 'fill 0.3s, stroke 0.3s' }} />
                      <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="JetBrains Mono" fill="#e2e8f0" style={{ pointerEvents: 'none' }}>{n.id}</text>
                      {current?.dist?.[n.id] !== undefined && current.dist[n.id] !== Infinity && (
                        <text x={n.x} y={n.y + 34} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" fill="#22c55e">{current.dist[n.id]}</text>
                      )}
                    </g>
                  );
                })}

                {/* edgeFrom pending indicator */}
                {edgeFrom && (() => {
                  const fn = nodes.find(n => n.id === edgeFrom);
                  return fn ? <circle cx={fn.x} cy={fn.y} r={24} fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="6,3" /> : null;
                })()}
              </svg>
            </div>

            {/* Status bar */}
            <div className="status-bar" style={{ marginTop: 8 }}>
              {current ? current.msg : 'Select an algorithm, pick a source node (click on graph), then press ▶ Run'}
            </div>

            {/* Explanation panel */}
            {current?.explanation && showExplanation && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#a78bfa', display: 'block', marginBottom: 3 }}>WHY?</span>
                {current.explanation}
              </div>
            )}

            {/* Info panels (queue/stack/dist table) */}
            {renderInfoPanel()}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {[['#1e293b', 'Unvisited'], ['#f97316', 'Current'], ['#22c55e', 'Visited/MST'], ['#7c3aed', 'Source'], ['#eab308', 'Candidate']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />{l}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Controls ── */}
          <div className="graph-control-column" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Algorithm selector */}
            <div className="controls-panel">
              <h3>Algorithm</h3>
              <select value={selectedAlgo} onChange={e => { setSelectedAlgo(e.target.value); resetAlgo(); }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                {ALGO_OPTIONS.map(a => <option key={a}>{a}</option>)}
              </select>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginTop: 6 }}>
                {ALGO_DESCRIPTIONS[selectedAlgo]}
              </div>

              {needsSrc && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>Source node</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {nodes.map(n => (
                      <button key={n.id} onClick={() => setSrcNode(n.id)}
                        style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontWeight: 700, transition: 'all 0.15s', borderColor: srcNode === n.id ? '#a78bfa' : 'var(--border)', background: srcNode === n.id ? 'rgba(124,58,237,0.15)' : 'var(--surface2)', color: srcNode === n.id ? '#a78bfa' : 'var(--text)' }}>
                        {n.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}
                onClick={runAlgo} disabled={running || !nodes.length || (needsSrc && !srcNode)}>
                {running ? '⏳ Running…' : '▶ Run Algorithm'}
              </button>
            </div>

            {/* Playback */}
            {steps.length > 0 && (
              <div className="controls-panel">
                <h3>Playback</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)' }}>Step {Math.max(stepIdx + 1, 0)} / {steps.length}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--accent)' }}>{steps.length ? Math.round((stepIdx + 1) / steps.length * 100) : 0}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${steps.length ? (stepIdx + 1) / steps.length * 100 : 0}%`, background: 'var(--accent)', transition: 'width 0.15s', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '7px 4px', fontSize: 12 }} onClick={stepPrev} disabled={running || stepIdx <= 0}>← Prev</button>
                  {running
                    ? <button className="btn btn-secondary" style={{ flex: 1.2, padding: '7px 4px', fontSize: 12 }} onClick={pause}>⏸ Pause</button>
                    : <button className="btn btn-primary" style={{ flex: 1.2, padding: '7px 4px', fontSize: 12 }} onClick={resume} disabled={stepIdx >= steps.length - 1}>▶ Play</button>
                  }
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '7px 4px', fontSize: 12 }} onClick={stepNext} disabled={running || stepIdx >= steps.length - 1}>Next →</button>
                </div>
                <button className="btn btn-danger" style={{ width: '100%', marginTop: 6 }} onClick={resetAlgo}>↺ Reset</button>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                    <span>Animation Speed</span>
                    <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{speed <= 300 ? 'Fast' : speed <= 700 ? 'Med' : 'Slow'}</span>
                  </div>
                  <input type="range" min={100} max={1500} step={100} value={speed} onChange={e => setSpeed(Number(e.target.value))} disabled={running}
                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="show-expl" checked={showExplanation} onChange={e => setShowExplanation(e.target.checked)} />
                  <label htmlFor="show-expl" style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>Show step explanations</label>
                </div>
              </div>
            )}

            {/* Graph info */}
            <div className="controls-panel">
              <h3>Graph Info</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Nodes</div><div className="value">{nodes.length}</div></div>
                <div className="info-chip"><div className="label">Edges</div><div className="value">{edges.length}</div></div>
                <div className="info-chip"><div className="label">Type</div><div className="value" style={{ fontSize: 11 }}>{directed ? 'Directed' : 'Undirected'}</div></div>
                <div className="info-chip"><div className="label">Weights</div><div className="value" style={{ fontSize: 11 }}>{weighted ? 'Yes' : 'No'}</div></div>
              </div>
            </div>

            {/* Import/Export */}
            <div className="controls-panel">
              <h3>Import / Export</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={exportGraph}>⬇ Export JSON</button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}
                  onClick={() => {
                    const data = JSON.stringify({ nodes, edges });
                    localStorage.setItem('graphlab_saved', data);
                    alert('Graph saved to browser storage!');
                  }}>💾 Save</button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}
                  onClick={() => {
                    const data = localStorage.getItem('graphlab_saved');
                    if (data) { try { const g = JSON.parse(data); setNodes(g.nodes); setEdges(g.edges); resetAlgo(); } catch { alert('Nothing saved.'); } }
                    else alert('No saved graph found.');
                  }}>📂 Load</button>
              </div>
              <textarea
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                placeholder='Paste exported JSON here to import a graph...'
                style={{ width: '100%', height: 70, fontFamily: 'JetBrains Mono', fontSize: 10, padding: 6, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }}
              />
              {importError && <div style={{ fontSize: 11, color: 'var(--red, #ef4444)', marginTop: 4 }}>{importError}</div>}
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 6, fontSize: 12 }} onClick={importGraph} disabled={!importJson.trim()}>⬆ Import JSON</button>
            </div>

            {/* Mode Guide */}
            <div className="controls-panel">
              <h3>Mode Guide</h3>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 2 }}>
                <div><span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>Select</span> — drag nodes to reposition</div>
                <div><span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>Add Node</span> — click empty canvas</div>
                <div><span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>Add Edge</span> — click source → destination</div>
                <div><span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>Delete</span> — click node or edge</div>
                {weighted && <div><span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>Edit weight</span> — click edge label</div>}
                <div><span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>Set source</span> — click node in Select mode</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
