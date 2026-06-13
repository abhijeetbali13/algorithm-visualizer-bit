import AlgorithmCard from '../components/AlgorithmCard';

const algorithms = [
  { title:'Bubble Sort',     category:'Sorting',             to:'/bubble-sort', color:'#00d4ff', description:'Compare adjacent elements and swap if out of order. Each pass bubbles the largest element to its correct final position.', complexity:{time:'O(n²)',space:'O(1)'} },
  { title:'Merge Sort',      category:'Sorting',             to:'/merge-sort',  color:'#a78bfa', description:'Divide recursively into halves, then merge sorted halves. Includes live recursion tree showing every split and merge.', complexity:{time:'O(n log n)',space:'O(n)'} },
  { title:'Heap Sort',       category:'Sorting',             to:'/heap-sort',   color:'#fb923c', description:'Build a max-heap, then extract maximum repeatedly. Visualized as a binary tree with heapify steps.', complexity:{time:'O(n log n)',space:'O(1)'} },
  { title:"Dijkstra's",      category:'Graph',               to:'/dijkstra',    color:'#34d399', description:'Shortest paths from a source node. Every step explains why a node is chosen and whether an edge relaxation improves the distance.', complexity:{time:'O((V+E) log V)',space:'O(V)'} },
  { title:"Prim's",          category:'Graph · MST',         to:'/prims',       color:'#22d3ee', description:'Minimum Spanning Tree by greedily adding the cheapest edge connecting a new node to the current MST.', complexity:{time:'O(E log V)',space:'O(V)'} },
  { title:"Kruskal's",       category:'Graph · MST',         to:'/kruskal',     color:'#4ade80', description:'Sort all edges, then greedily add cheapest non-cycle edges. Uses Union-Find to detect cycles. Shows sorted edge list.', complexity:{time:'O(E log E)',space:'O(V+E)'} },
  { title:'0/1 Knapsack',    category:'Dynamic Programming', to:'/knapsack',    color:'#fbbf24', description:'Maximize value within weight capacity. Switch between DP table construction and naive brute-force showing all 2ⁿ subsets.', complexity:{time:'O(nW)',space:'O(nW)'} },
  { title:'N-Queens',        category:'Backtracking',        to:'/n-queens',    color:'#f87171', description:'Place N queens so none attack each other. Watch backtracking in real time with queen placement and removal on the board.', complexity:{time:'O(N!)',space:'O(N)'} },
  { title:'Huffman Coding',  category:'Greedy · Compression',to:'/huffman',     color:'#e879f9', description:'Variable-length prefix codes for lossless compression. Watch the Huffman tree grow and see compression ratios.', complexity:{time:'O(n log n)',space:'O(n)'} },
  { title:'Horspool',        category:'String Matching',     to:'/horspool',    color:'#f472b6', description:'Simplified Boyer-Moore variant. Visualizes shift table construction and how mismatches skip large portions of text.', complexity:{time:'O(n)',space:'O(σ)'} },
  { title:'Boyer-Moore',     category:'String Matching',     to:'/boyer-moore', color:'#c084fc', description:'Efficient string search scanning right-to-left. Shows bad character rule with shift table and pattern jumps live.', complexity:{time:'O(n/m)–O(nm)',space:'O(σ)'} },
];

export default function Home() {
  return (
    <div className="page-wrapper" style={{ paddingTop:56, paddingBottom:80 }}>
      <div style={{ marginBottom:64, maxWidth:640 }}>
        <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)', marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ display:'inline-block', width:24, height:1, background:'var(--accent)' }}/>
          Interactive Algorithm Visualizations · Computer Science
        </div>
        <h1 style={{ fontFamily:'JetBrains Mono', fontWeight:800, lineHeight:1.1, fontSize:'clamp(2rem,5vw,3.2rem)', marginBottom:20 }}>
          Algorithm<br/>
          <span style={{ background:'linear-gradient(90deg, var(--accent), #a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Visualizer Hub</span>
        </h1>
        <p style={{ fontSize:15, color:'var(--muted)', lineHeight:1.8, marginBottom:28 }}>
          A visual learning tool for Computer Science students. Watch sorting, graph, dynamic programming, backtracking, greedy, and string-matching algorithms execute step by step — with Prev/Next controls so you learn at your own pace.
        </p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <a href="#algorithms" className="btn btn-primary">Explore Algorithms</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="btn btn-secondary">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
            View on GitHub
          </a>
        </div>
      </div>

      {/* Feature highlights — no hard numbers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:1, background:'var(--border)', borderRadius:12, overflow:'hidden', marginBottom:64 }}>
        {[
          ['Step-by-step','Prev / Next controls'],
          ['Multiple algos','Growing collection'],
          ['Why explained','Every decision shown'],
          ['Brute Force','vs DP comparison'],
          ['Two variants','Textbook + Standard'],
        ].map(([v,l]) => (
          <div key={l} style={{ background:'var(--surface)', padding:'16px 20px' }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color:'var(--accent)', marginBottom:3 }}>{v}</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{l}</div>
          </div>
        ))}
      </div>

      <div id="algorithms">
        <div style={{ fontFamily:'JetBrains Mono', fontSize:11, letterSpacing:'0.12em', color:'var(--muted)', textTransform:'uppercase', marginBottom:20 }}>
          // select an algorithm to visualize
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:18 }}>
          {algorithms.map(a => <AlgorithmCard key={a.to} {...a}/>)}
        </div>
      </div>
    </div>
  );
}
