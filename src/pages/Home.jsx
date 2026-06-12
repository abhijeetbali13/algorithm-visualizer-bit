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
          VTU ADA Syllabus · 11 Interactive Visualizations
        </div>
        <h1 style={{ fontFamily:'JetBrains Mono', fontWeight:800, lineHeight:1.1, fontSize:'clamp(2rem,5vw,3.2rem)', marginBottom:20 }}>
          Algorithm<br/>
          <span style={{ background:'linear-gradient(90deg, var(--accent), #a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Visualizer Hub</span>
        </h1>
        <p style={{ fontSize:15, color:'var(--muted)', lineHeight:1.8, marginBottom:28 }}>
          Watch sorting, graph, DP, backtracking, greedy, and string-matching algorithms execute step by step. Prev/Next controls let you move at your own pace.
        </p>
        <a href="#algorithms" className="btn btn-primary">Explore Algorithms</a>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:1, background:'var(--border)', borderRadius:12, overflow:'hidden', marginBottom:64 }}>
        {[['11','Algorithms'],['5','Categories'],['Prev/Next','Step Control'],['Brute Force','vs DP'],['Open Source','MIT']].map(([v,l]) => (
          <div key={l} style={{ background:'var(--surface)', padding:'16px 20px' }}>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:18, fontWeight:700, color:'var(--accent)' }}>{v}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{l}</div>
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
