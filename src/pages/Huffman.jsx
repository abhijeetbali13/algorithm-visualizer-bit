import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';
import AlgoTabWrapper from '../components/AlgoTabWrapper';
import { getAlgoMeta } from '../data/algoMeta';
import { useApp } from '../context/AppContext';

const PRESETS = [
  { name:'Classic', text:'ABRACADABRA' },
  { name:'Example', text:'MISSISSIPPI' },
  { name:'Custom',  text:'HELLO WORLD' },
];

function huffmanSteps(text) {
  const freq = {};
  for (const ch of text) freq[ch] = (freq[ch]||0)+1;

  let nodes = Object.entries(freq).map(([ch,f],i) => ({ id:i, ch, freq:f, left:null, right:null, isLeaf:true }));
  let nextId = nodes.length;
  const steps = [];
  const forest = nodes.map(n => ({ ...n }));

  const snap = (msg, highlight, tree) =>
    steps.push({ forest: forest.map(n=>({...n})), highlight: highlight||[], msg, treeRoot: tree||null });

  snap(`Frequency count: ${Object.entries(freq).map(([c,f])=>`'${c}'=${f}`).join(', ')}`, [], null);

  while (forest.filter(n=>n).length > 1) {
    const alive = forest.filter(n=>n).sort((a,b)=>a.freq-b.freq);
    const a = alive[0], b = alive[1];
    snap(`Pick two lowest-freq nodes: '${a.ch||'◆'}' (${a.freq}) and '${b.ch||'◆'}' (${b.freq})`, [a.id, b.id], null);

    const merged = { id:nextId++, ch:null, freq:a.freq+b.freq, left:a.id, right:b.id, isLeaf:false };
    const idxA = forest.findIndex(n=>n&&n.id===a.id);
    const idxB = forest.findIndex(n=>n&&n.id===b.id);
    forest[idxA] = null;
    forest[idxB] = null;
    forest.push(merged);

    snap(`Merge → new internal node (freq=${merged.freq}). Forest size: ${forest.filter(n=>n).length}`, [merged.id], null);
  }

  // Build lookup map
  const allNodes = {};
  steps.forEach(s => s.forest.forEach(n => { if(n) allNodes[n.id]=n; }));

  const root = forest.find(n=>n);
  const codes = {};
  function buildCodes(id, code) {
    if (!id && id!==0) return;
    const node = allNodes[id];
    if (!node) return;
    if (node.isLeaf) { codes[node.ch] = code || '0'; return; }
    buildCodes(node.left, code+'0');
    buildCodes(node.right, code+'1');
  }
  if (root) buildCodes(root.id, '');

  const avgLen = Object.entries(codes).reduce((s,[ch,code])=>s+(freq[ch]||0)*code.length,0) / text.length;
  snap(`✓ Huffman tree built! Avg code length: ${avgLen.toFixed(2)} bits/char`, root?[root.id]:[], root);

  return { steps, allNodes, codes, freq };
}

// Layout the tree as SVG
function layoutTree(allNodes, rootId, W=540, H=220) {
  if (!rootId && rootId!==0) return {};
  const positions = {};
  function assignX(id, depth, left, right) {
    if (id===null||id===undefined) return;
    const node = allNodes[id];
    if (!node) return;
    positions[id] = { x:(left+right)/2, y:20+depth*52 };
    if (!node.isLeaf) {
      assignX(node.left,  depth+1, left,  (left+right)/2);
      assignX(node.right, depth+1, (left+right)/2, right);
    }
  }
  assignX(rootId, 0, 0, W);
  return positions;
}

export default function Huffman() {
  
  const META = getAlgoMeta('huffman');
  const { markVisited } = useApp();
  const [presetIdx, setPresetIdx] = useState(0);
  const [customText, setCustomText] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const text = customText !== null ? customText : PRESETS[presetIdx].text;

  const result = huffmanSteps(text);
  const viz = useVisualizer(() => result.steps);
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const applyCustomText = () => {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setInputError('Enter at least 2 characters.');
      return;
    }
    if (trimmed.length > 40) {
      setInputError('Please enter 40 characters or fewer.');
      return;
    }
    const uniqueChars = new Set(trimmed).size;
    if (uniqueChars < 2) {
      setInputError('Text needs at least 2 distinct characters.');
      return;
    }
    if (uniqueChars > 16) {
      setInputError('Please use 16 distinct characters or fewer (tree gets too wide otherwise).');
      return;
    }

    setInputError('');
    reset();
    setCustomText(trimmed);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') applyCustomText();
  };

  const selectPreset = (i) => {
    reset();
    setCustomText(null);
    setPresetIdx(i);
  };

  const allNodes = result.allNodes;
  const codes    = result.codes;
  const freq     = result.freq;
  const treeRoot = steps[steps.length-1]?.treeRoot;
  const positions = treeRoot ? layoutTree(allNodes, treeRoot.id) : {};
  const highlight = current?.highlight || [];

  function renderTree(id, svg=true) {
    if (id===null||id===undefined) return null;
    const node = allNodes[id];
    if (!node || !positions[id]) return null;
    const { x, y } = positions[id];
    const isHL = highlight.includes(id);
    const fill = isHL ? 'var(--yellow)' : node.isLeaf ? 'var(--accent)' : '#1e3a5f';
    const elems = [];
    if (!node.isLeaf) {
      if (positions[node.left])  elems.push(<line key={`l${id}`} x1={x} y1={y} x2={positions[node.left].x}  y2={positions[node.left].y}  stroke="var(--border)" strokeWidth="1.5"/>);
      if (positions[node.right]) elems.push(<line key={`r${id}`} x1={x} y1={y} x2={positions[node.right].x} y2={positions[node.right].y} stroke="var(--border)" strokeWidth="1.5"/>);
      elems.push(renderTree(node.left));
      elems.push(renderTree(node.right));
    }
    elems.push(
      <g key={`n${id}`}>
        <circle cx={x} cy={y} r={20} fill={fill} stroke={isHL?'white':'transparent'} strokeWidth={2} opacity="0.9"/>
        <text x={x} y={y-4}  textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fill={node.isLeaf?'#0b0f1a':'var(--text)'} fontWeight="700">{node.ch||'◆'}</text>
        <text x={x} y={y+10} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill={node.isLeaf?'#0b0f1a':'var(--muted)'}>{node.freq}</text>
      </g>
    );
    return elems;
  }

  const encoded = text.split('').map(c => codes[c]||'').join(' ');
  const origBits = text.length * 8;
  const compBits = text.split('').reduce((s,c)=>s+(codes[c]?.length||0),0);

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>Huffman Coding</h1>
          <p>Lossless data compression using variable-length prefix codes. Frequent characters get shorter codes. Built via a greedy min-heap strategy.</p>
        </div>
        <AlgoTabWrapper algoId="huffman" meta={META} steps={steps||[]} stepIdx={stepIdx||-1} currentMsg={current?.msg||''} onJumpTo={jumpTo}>

        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Select preset and press Start'}</div>

            {/* Huffman tree SVG */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16 }}>
              <div className="section-label">Huffman Tree</div>
              <svg viewBox="0 0 540 230" style={{ width:'100%', height:'auto' }}>
                {treeRoot && Object.keys(positions).length > 0 ? renderTree(treeRoot.id) : (
                  <text x="270" y="115" textAnchor="middle" fill="var(--muted)" fontSize="13" fontFamily="JetBrains Mono">Tree builds during visualization</text>
                )}
              </svg>
            </div>

            {/* Code table */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:16, marginTop:16 }}>
              <div className="section-label">Huffman Codes & Compression</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                {Object.entries(codes).sort((a,b)=>(freq[b[0]]||0)-(freq[a[0]]||0)).map(([ch,code]) => (
                  <div key={ch} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 12px', fontFamily:'JetBrains Mono', fontSize:12 }}>
                    <span style={{ color:'var(--accent)', fontWeight:700 }}>'{ch}'</span>
                    <span style={{ color:'var(--muted)', margin:'0 6px' }}>×{freq[ch]}</span>
                    <span style={{ color:'var(--green)' }}>→ {code}</span>
                  </div>
                ))}
              </div>
              {Object.keys(codes).length > 0 && (
                <div style={{ display:'flex', gap:12 }}>
                  <div className="info-chip"><div className="label">Original</div><div className="value">{origBits} bits</div></div>
                  <div className="info-chip"><div className="label">Compressed</div><div className="value">{compBits} bits</div></div>
                  <div className="info-chip"><div className="label">Ratio</div><div className="value" style={{ color:'var(--green)' }}>{((1-compBits/origBits)*100).toFixed(1)}% saved</div></div>
                </div>
              )}
            </div>

            {/* Custom text input */}
            <div className="controls-panel" style={{ marginTop: 16 }}>
              <h3>Custom Text</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g. HELLO WORLD"
                  disabled={running}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border, #444)',
                    background: 'var(--bg-input, #1a1a1a)',
                    color: 'var(--fg, #fff)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={applyCustomText}
                  disabled={running}
                  className="btn"
                  style={{ padding: '8px 16px' }}
                >
                  Apply
                </button>
              </div>
              {inputError && (
                <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{inputError}</div>
              )}
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
                Enter 2–40 characters with 2–16 distinct symbols, then click Apply or press Enter.
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Preset Text</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {PRESETS.map((p,i) => (
                  <button key={i} onClick={() => selectPreset(i)} className="btn btn-secondary"
                    style={{ fontSize:12, background:(customText===null && presetIdx===i)?'rgba(0,212,255,0.1)':'', borderColor:(customText===null && presetIdx===i)?'var(--accent)':'', color:(customText===null && presetIdx===i)?'var(--accent)':'' }}>
                    {p.name}: "{p.text}"
                  </button>
                ))}
              </div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)', marginTop:8, padding:'8px 10px', background:'var(--code-bg)', borderRadius:6 }}>
                {text}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length} onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next} speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O(n log n)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(n)</div></div>
                <div className="info-chip"><div className="label">Method</div><div className="value">Greedy</div></div>
                <div className="info-chip"><div className="label">Lossless</div><div className="value">Yes</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode">freq[] = count chars{'\n'}pq = min-heap(freq){'\n'}{'\n'}<span className="kw">while</span> pq.size &gt; 1:{'\n'}  a = pq.extractMin(){'\n'}  b = pq.extractMin(){'\n'}  node = merge(a, b){'\n'}  pq.insert(node){'\n'}{'\n'}root = pq.top(){'\n'}<span className="fn">buildCodes</span>(root, "")</div>
            </div>
          </div>
        </div>
      </AlgoTabWrapper>
      </div>
    </div>
  );
}
