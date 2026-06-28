import { useState, useRef } from 'react';
import { useVisualizer } from '../../hooks/useVisualizer';
import StepControls from '../../components/StepControls';
import './ds.css';

const TREE_TYPES = ['Binary Tree', 'BST', 'Tree Types'];
const TRAVERSALS = ['Preorder', 'Inorder', 'Postorder', 'Level Order'];

/* ───────────────────────── Tree helpers ───────────────────────── */

class TNode {
  constructor(val) { this.val = val; this.left = null; this.right = null; }
}

function insertBST(root, val) {
  if (!root) return new TNode(val);
  if (val < root.val) root.left = insertBST(root.left, val);
  else if (val > root.val) root.right = insertBST(root.right, val);
  return root;
}

function deleteBST(root, val) {
  if (!root) return null;
  if (val < root.val) { root.left = deleteBST(root.left, val); }
  else if (val > root.val) { root.right = deleteBST(root.right, val); }
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let succ = root.right;
    while (succ.left) succ = succ.left;
    root.val = succ.val;
    root.right = deleteBST(root.right, succ.val);
  }
  return root;
}

function cloneTree(node) {
  if (!node) return null;
  const n = new TNode(node.val);
  n.left = cloneTree(node.left);
  n.right = cloneTree(node.right);
  return n;
}

function getLayout(root) {
  if (!root) return [];
  const result = [];
  const q = [{ node: root, depth: 0, pos: 0, spread: 240 }];
  while (q.length) {
    const { node, depth, pos, spread } = q.shift();
    const x = 270 + pos;
    const y = 40 + depth * 70;
    result.push({ val: node.val, x, y, depth });
    if (node.left)  q.push({ node: node.left,  depth: depth+1, pos: pos - spread/2, spread: spread/2 });
    if (node.right) q.push({ node: node.right, depth: depth+1, pos: pos + spread/2, spread: spread/2 });
  }
  return result;
}

function getEdges(root) {
  const edges = [];
  const layout = getLayout(root);
  const map = {};
  layout.forEach(n => map[n.val] = n);
  function walk(node) {
    if (!node) return;
    if (node.left)  { const p=map[node.val], c=map[node.left.val];  if(p&&c) edges.push([p.x,p.y,c.x,c.y]); }
    if (node.right) { const p=map[node.val], c=map[node.right.val]; if(p&&c) edges.push([p.x,p.y,c.x,c.y]); }
    walk(node.left); walk(node.right);
  }
  walk(root);
  return edges;
}

function buildInitialBST(values) {
  let r = null;
  for (const v of values) r = insertBST(r, v);
  return r;
}
const DEFAULT_VALUES = [50,30,70,20,40,60,80];

/* ───────────────────────── Step builders ───────────────────────── */

const colorFor = { current:'var(--yellow)', new:'var(--accent)', deleted:'var(--red)', found:'var(--green)' };

function buildInsertSteps(root, v) {
  const steps = [];
  let cur = root;
  while (cur) {
    const goLeft = v < cur.val;
    if (v === cur.val) {
      steps.push({ tree: cloneTree(root), hl: { [cur.val]: 'found' }, msg: `${v} already exists in the tree (BST has no duplicates).`, duplicate: true });
      return { steps, result: root };
    }
    steps.push({ tree: cloneTree(root), hl: { [cur.val]: 'current' }, msg: `${v} ${goLeft ? '<' : '>'} ${cur.val} → go ${goLeft ? 'left' : 'right'}.` });
    cur = goLeft ? cur.left : cur.right;
  }
  const result = insertBST(cloneTree(root), v);
  steps.push({ tree: result, hl: { [v]: 'new' }, msg: `Reached an empty spot → insert new node(${v}) here. O(log n) average, O(n) worst case (skewed tree).` });
  return { steps, result };
}

function buildSearchSteps(root, v) {
  const steps = [];
  let cur = root;
  while (cur) {
    if (v === cur.val) {
      steps.push({ tree: cloneTree(root), hl: { [cur.val]: 'found' }, msg: `${v} == ${cur.val} ✓ Found! O(log n) average.` });
      return { steps };
    }
    const goLeft = v < cur.val;
    steps.push({ tree: cloneTree(root), hl: { [cur.val]: 'current' }, msg: `${v} ${goLeft ? '<' : '>'} ${cur.val} → go ${goLeft ? 'left' : 'right'}.` });
    cur = goLeft ? cur.left : cur.right;
  }
  steps.push({ tree: cloneTree(root), hl: {}, msg: `${v} not found — reached a null pointer. O(log n) average.` });
  return { steps };
}

function buildDeleteSteps(root, v) {
  const steps = [];
  let cur = root;
  while (cur && cur.val !== v) {
    const goLeft = v < cur.val;
    steps.push({ tree: cloneTree(root), hl: { [cur.val]: 'current' }, msg: `${v} ${goLeft ? '<' : '>'} ${cur.val} → go ${goLeft ? 'left' : 'right'}.` });
    cur = goLeft ? cur.left : cur.right;
  }
  if (!cur) {
    steps.push({ tree: cloneTree(root), hl: {}, msg: `${v} not found in the tree — nothing to delete.` });
    return { steps, result: root, notFound: true };
  }

  steps.push({ tree: cloneTree(root), hl: { [v]: 'deleted' }, msg: `Found node(${v}) — this is the node to delete.` });

  if (!cur.left && !cur.right) {
    const result = deleteBST(cloneTree(root), v);
    steps.push({ tree: result, hl: {}, msg: `Case 1: ${v} is a LEAF (no children) → simply remove it. O(log n) average.` });
    return { steps, result };
  }

  if (!cur.left || !cur.right) {
    const child = cur.left || cur.right;
    steps.push({ tree: cloneTree(root), hl: { [v]: 'deleted', [child.val]: 'new' },
      msg: `Case 2: ${v} has ONE child (${child.val}) → that child will move directly into ${v}'s position.` });
    const result = deleteBST(cloneTree(root), v);
    steps.push({ tree: result, hl: { [child.val]: 'new' }, msg: `Node ${child.val} now occupies the spot where ${v} used to be. O(log n) average.` });
    return { steps, result };
  }

  // Two children: find inorder successor (min of right subtree)
  let succ = cur.right;
  steps.push({ tree: cloneTree(root), hl: { [v]: 'deleted', [succ.val]: 'current' },
    msg: `Case 3: ${v} has TWO children → find the inorder successor (smallest value in the right subtree), starting at ${succ.val}.` });
  while (succ.left) {
    succ = succ.left;
    steps.push({ tree: cloneTree(root), hl: { [v]: 'deleted', [succ.val]: 'current' }, msg: `Keep going left → ${succ.val} (still smaller).` });
  }
  steps.push({ tree: cloneTree(root), hl: { [v]: 'deleted', [succ.val]: 'found' },
    msg: `Successor = ${succ.val} (no left child, so it is the smallest in that subtree). This value will replace ${v}.` });
  const result = deleteBST(cloneTree(root), v);
  steps.push({ tree: result, hl: { [succ.val]: 'new' },
    msg: `${succ.val} is copied into the deleted node's position, then the original ${succ.val} node is removed from the right subtree (it has at most one child, so that removal is simple). O(log n) average.` });
  return { steps, result };
}

function buildTraversalSteps(root, type) {
  const order = [];
  const pre  = (n) => { if(!n) return; order.push(n.val); pre(n.left); pre(n.right); };
  const ino  = (n) => { if(!n) return; ino(n.left); order.push(n.val); ino(n.right); };
  const post = (n) => { if(!n) return; post(n.left); post(n.right); order.push(n.val); };
  const lvl  = (n) => { if(!n) return; const q=[n]; while(q.length){ const c=q.shift(); order.push(c.val); if(c.left)q.push(c.left); if(c.right)q.push(c.right); } };
  if (type==='Preorder') pre(root);
  else if (type==='Inorder') ino(root);
  else if (type==='Postorder') post(root);
  else lvl(root);

  const steps = order.map((val, i) => ({
    hl: { [val]: 'current' },
    order: order.slice(0, i+1),
    msg: `Visit ${val}${i===order.length-1 ? ' (last)' : ''}.`,
  }));
  steps.push({ hl: {}, order: [...order], msg: `${type} complete: ${order.join(' → ')}` });
  return steps;
}

/* ───────────────────────── Main component ───────────────────────── */

export default function TreeDS() {
  const [treeInitInput, setTreeInitInput] = useState('');
  const [treeInitErr, setTreeInitErr]     = useState('');
  const [treeType, setTreeType] = useState('BST');
  const [bstRoot, setBSTRoot]   = useState(() => buildInitialBST(DEFAULT_VALUES));
  const [idleMsg, setIdleMsg]   = useState('Select an operation, then press ▶ Play.');
  const [inputVal, setInputVal] = useState('');
  const [activeTraversal, setAT] = useState('');
  const [customInput, setCustomInput] = useState('50, 30, 70, 20, 40, 60, 80');

  const pendingSteps = useRef([]);
  const viz = useVisualizer(() => pendingSteps.current);
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const displayTree = current && current.tree !== undefined ? current.tree : bstRoot;
  const layout = getLayout(displayTree);
  const edges  = getEdges(displayTree);
  const displayHL = current ? current.hl : {};
  const displayMsg = current ? current.msg : idleMsg;
  const traversalOrder = (current && current.order) ? current.order : [];

  const runInsert = () => {
    const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a valid number.');
    const { steps: s, result } = buildInsertSteps(bstRoot, v);
    pendingSteps.current = s;
    setBSTRoot(result);
    reset(); start(); setInputVal('');
  };
  const runDelete = () => {
    const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a valid number.');
    const { steps: s, result } = buildDeleteSteps(bstRoot, v);
    pendingSteps.current = s;
    setBSTRoot(result);
    reset(); start(); setInputVal('');
  };
  const runSearch = () => {
    const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a valid number.');
    pendingSteps.current = buildSearchSteps(bstRoot, v).steps;
    reset(); start();
  };
  const runTraversal = (type) => {
    setAT(type);
    pendingSteps.current = buildTraversalSteps(bstRoot, type);
    reset(); start();
  };

  const loadCustom = () => {
    const vals = customInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)).slice(0, 15);
    if (vals.length < 1) { setIdleMsg('Enter comma-separated numbers, e.g. 8, 3, 10, 1, 6'); return; }
    setBSTRoot(buildInitialBST(vals));
    reset();
    setIdleMsg(`Built a fresh BST from: ${vals.join(', ')}`);
  };

  const applyCustomTree = () => {
    const nums = treeInitInput.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0 && n < 1000);
    const unique = [...new Set(nums)];
    if (unique.length < 2) { setTreeInitErr('Enter at least 2 unique numbers (1–999)'); return; }
    if (unique.length > 12) { setTreeInitErr('Max 12 nodes'); return; }
    setTreeInitErr(''); setTreeInitInput('');
    let r = null;
    for (const v of unique) r = insertBST(r, v);
    setBSTRoot(r);
    setIdleMsg('BST built from your values. Click a traversal or try Insert/Delete/Search.');
  };
  const resetTree = () => { setBSTRoot(buildInitialBST(DEFAULT_VALUES)); setIdleMsg('Tree reset to default.'); };
  const reset_ = () => { setBSTRoot(buildInitialBST(DEFAULT_VALUES)); reset(); setAT(''); setIdleMsg('Tree reset.'); setInputVal(''); };

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Trees</h1>
          <p>A hierarchical data structure with a root node and subtrees of children. No cycles. The most important non-linear data structure in CS.</p>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {TREE_TYPES.map(t=><button key={t} className={`ds-tab${treeType===t?' active':''}`} onClick={()=>{setTreeType(t); reset(); setAT('');}}>{t}</button>)}
        </div>

        <div className="ds-layout">
          <div>
            {(treeType==='Binary Tree'||treeType==='BST') && (
              <>
                <div className="ds-canvas" style={{ minHeight:340, overflow:'auto' }}>
                  {layout.length === 0
                    ? <div style={{ color:'var(--muted)', fontFamily:'JetBrains Mono', fontSize:13, padding:'40px 0', textAlign:'center' }}>Empty tree</div>
                    : (
                      <svg viewBox="0 0 540 380" style={{ width:'100%', height:'auto', minWidth:400 }}>
                        {edges.map(([x1,y1,x2,y2],i)=>(
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border)" strokeWidth="1.5"/>
                        ))}
                        {layout.map(({val,x,y})=>{
                          const hlType = displayHL[val];
                          const fill = colorFor[hlType] || 'var(--accent)';
                          return (
                            <g key={val}>
                              <circle cx={x} cy={y} r={22} fill={fill} style={{ transition:'fill 0.25s' }}/>
                              <text x={x} y={y+5} textAnchor="middle" fill="#0b0f1a" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">{val}</text>
                            </g>
                          );
                        })}
                      </svg>
                    )
                  }
                </div>

                <div className="ds-log" style={{ marginTop:10 }}>{displayMsg}</div>

                {steps.length > 0 && (
                  <div style={{ display:'flex', gap:14, marginTop:8, fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', flexWrap:'wrap' }}>
                    <span><span style={{ color:'var(--yellow)' }}>●</span> comparing / traversing</span>
                    <span><span style={{ color:'var(--accent)' }}>●</span> new / replacing</span>
                    <span><span style={{ color:'var(--red)' }}>●</span> being deleted</span>
                    <span><span style={{ color:'var(--green)' }}>●</span> found</span>
                  </div>
                )}

                {traversalOrder.length > 0 && (
                  <div style={{ marginTop:10, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:6 }}>{activeTraversal} order:</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {traversalOrder.map((v,i)=>(
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <div style={{ padding:'3px 10px', borderRadius:4, background: i===traversalOrder.length-1?'rgba(0,212,255,0.2)':'rgba(0,212,255,0.06)', border:`1px solid ${i===traversalOrder.length-1?'var(--accent)':'rgba(0,212,255,0.2)'}`, fontFamily:'JetBrains Mono', fontSize:13, color:'var(--accent)' }}>{v}</div>
                          {i<traversalOrder.length-1 && <span style={{ color:'var(--muted)', fontSize:11 }}>→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {treeType==='BST' && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'var(--muted)', marginBottom:8 }}>Traversals:</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {TRAVERSALS.map(t=>(
                        <button key={t} onClick={()=>runTraversal(t)} disabled={running} className="btn btn-secondary" style={{ fontSize:12 }}>▶ {t}</button>
                      ))}
                    </div>
                    <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        ['Preorder', 'Root → Left → Right', 'Copy/serialize tree'],
                        ['Inorder', 'Left → Root → Right', 'BST: gives sorted order!'],
                        ['Postorder', 'Left → Right → Root', 'Delete tree, evaluate expression'],
                        ['Level Order', 'Level by level (BFS)', 'Shortest path, tree width'],
                      ].map(([name,order,use])=>(
                        <div key={name} style={{ background:'var(--surface2)', border:`1px solid ${activeTraversal===name?'var(--accent)':'var(--border)'}`, borderRadius:6, padding:'8px 10px' }}>
                          <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:activeTraversal===name?'var(--accent)':'var(--text)', marginBottom:3 }}>{name}</div>
                          <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)' }}>{order}</div>
                          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>Use: {use}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {treeType==='Tree Types' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  ['Binary Tree (BT)', 'Each node has at most 2 children. No ordering constraint.', 'Expression trees, Huffman coding'],
                  ['Binary Search Tree (BST)', 'Left subtree < node < Right subtree. Enables O(log n) search.', 'Databases, dictionaries, symbol tables'],
                  ['Complete Binary Tree (CBT)', 'All levels full except last, filled left to right.', 'Heap implementation (stored in array)'],
                  ['Full Binary Tree', 'Every node has 0 or 2 children. No node has only 1 child.', 'Expression trees, Huffman coding'],
                  ['Perfect Binary Tree', 'All internal nodes have 2 children. All leaves at same level.', 'Theoretical analysis'],
                  ['AVL Tree', 'Self-balancing BST. |height(left)-height(right)| ≤ 1.', 'Databases where frequent lookups needed'],
                  ['Red-Black Tree', 'Self-balancing BST with color property. Used in C++ std::map.', 'Linux kernel, Java TreeMap, C++ STL'],
                  ['B-Tree', 'Multi-way search tree. Nodes can have many children.', 'Databases, file systems (NTFS, ext4)'],
                  ['Heap (Min/Max)', 'CBT where parent ≥ (or ≤) children. O(1) min/max access.', 'Priority queues, Heap Sort, Dijkstra'],
                  ['Trie', 'Tree of characters. Each path from root = a word prefix.', 'Autocomplete, spell checking, IP routing'],
                  ['Segment Tree', 'Each node stores info about a range of array elements.', 'Range queries, lazy propagation'],
                  ['Fenwick Tree (BIT)', 'Compact tree for prefix sum queries and point updates.', 'Competitive programming, inversion count'],
                ].map(([name,desc,use])=>(
                  <div key={name} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:13, color:'var(--accent)', fontWeight:700, marginBottom:4 }}>{name}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4, lineHeight:1.6 }}>{desc}</div>
                    <div style={{ fontSize:11, color:'var(--green)' }}>Use: {use}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="ds-ops-panel">
            {(treeType==='Binary Tree'||treeType==='BST') && (
              <>
                {treeType==='BST' && (
                  <>
                    <h3>BST Operations</h3>
                    <div className="ds-op-group">
                      <label>Value</label>
                      <input className="ds-input" type="number" value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="e.g. 45"/>
                    </div>
                    <button className="btn btn-primary" onClick={runInsert} disabled={running} style={{ width:'100%' }}>▶ Insert</button>
                    <button className="btn btn-secondary" onClick={runSearch} disabled={running} style={{ width:'100%' }}>▶ Search</button>
                    <button className="btn btn-danger" onClick={runDelete} disabled={running} style={{ width:'100%' }}>▶ Delete</button>
                    <div className="ds-info-box">
                      <strong>BST Property:</strong> left &lt; node &lt; right<br/><br/>
                      <strong>Insert:</strong> walk left/right by comparison until an empty spot — O(log n) avg, O(n) worst (skewed)<br/>
                      <strong>Search:</strong> same walk — O(log n) avg, O(n) worst<br/>
                      <strong>Delete — 3 cases:</strong><br/>
                      • Leaf → remove directly<br/>
                      • One child → child moves up into its place<br/>
                      • Two children → copy in the inorder successor (min of right subtree), then remove that successor from its original spot
                    </div>
                    <div className="ds-op-group">
                      <label>Build tree from custom values</label>
                      <div className="ds-input-row">
                        <input className="ds-input" value={customInput} onChange={e=>setCustomInput(e.target.value)} placeholder="e.g. 8, 3, 10, 1, 6"/>
                        <button className="btn btn-secondary" onClick={loadCustom}>Build</button>
                      </div>
                    </div>
                  </>
                )}
                {treeType==='Binary Tree' && (
                  <div className="ds-info-box">
                    <strong>This tree has:</strong><br/>
                    Nodes: {layout.length}<br/>
                    Height: {layout.length ? Math.max(...layout.map(n=>n.depth))+1 : 0}<br/><br/>
                    <strong>Properties:</strong><br/>
                    Max nodes at depth d: 2^d<br/>
                    Max nodes in height h: 2^h - 1<br/>
                    Min height for n nodes: ⌊log₂n⌋
                  </div>
                )}
                <button className="btn btn-secondary" onClick={reset_} style={{ width:'100%' }}>↺ Reset Tree</button>
                <div className="ds-info-box">
                  <strong>Inorder traversal of a BST</strong> always gives <strong style={{ color:'var(--accent)' }}>sorted output</strong>. Try it!
                </div>
              </>
            )}
            {treeType==='Tree Types' && (
              <div className="ds-info-box">
                <strong>Key heights:</strong><br/>
                Balanced BST: O(log n)<br/>
                Skewed BST: O(n)<br/><br/>
                <strong>Why balance matters:</strong><br/>
                Search O(log n) vs O(n) for a skewed tree with the same data.<br/><br/>
                AVL and Red-Black trees auto-balance on insert/delete.
              </div>
            )}

            {steps.length > 0 && (
              <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length}
                onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next}
                speed={speed} onSpeedChange={setSpeed} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
