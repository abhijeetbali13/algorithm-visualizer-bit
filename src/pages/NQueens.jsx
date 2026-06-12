import { useState } from 'react';
import { useVisualizer } from '../hooks/useVisualizer';
import StepControls from '../components/StepControls';

function nQueensSteps(N) {
  const steps = [];
  const board = Array.from({length:N}, () => Array(N).fill(0));
  let solutions = 0;

  function isSafe(row, col) {
    for (let i=0;i<row;i++) {
      if (board[i][col]===1) return false;
      if (col-(row-i)>=0 && board[i][col-(row-i)]===1) return false;
      if (col+(row-i)<N && board[i][col+(row-i)]===1) return false;
    }
    return true;
  }

  function solve(row) {
    if (row===N) { solutions++; steps.push({ board:board.map(r=>[...r]), placing:null, backCell:null, solutions, msg:`🎉 Solution #${solutions} found!` }); return; }
    for (let col=0;col<N;col++) {
      const safe = isSafe(row, col);
      steps.push({ board:board.map(r=>[...r]), placing:[row,col], backCell:null, solutions, msg:`Row ${row+1}: Try col ${col+1} — ${safe?'safe ✓':'conflict ✗'}` });
      if (safe) {
        board[row][col]=1;
        steps.push({ board:board.map(r=>[...r]), placing:[row,col], backCell:null, solutions, msg:`Placed queen at (${row+1},${col+1})` });
        solve(row+1);
        board[row][col]=0;
        steps.push({ board:board.map(r=>[...r]), placing:null, backCell:[row,col], solutions, msg:`Backtrack: remove queen from (${row+1},${col+1})` });
      }
    }
  }
  solve(0);
  steps.push({ board:board.map(r=>[...r]), placing:null, backCell:null, solutions, msg:`✓ Done — found ${solutions} solution${solutions!==1?'s':''} for N=${N}` });
  return steps;
}

export default function NQueens() {
  const [N, setN] = useState(6);
  const viz = useVisualizer(() => nQueensSteps(N));
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset } = viz;

  const board = current?.board || Array.from({length:N},()=>Array(N).fill(0));
  const placing = current?.placing || null;
  const backCell = current?.backCell || null;
  const cellSize = Math.min(52, Math.floor(340/N));

  return (
    <div className="algo-page">
      <div className="page-wrapper">
        <div className="algo-header">
          <h1>N-Queens Problem</h1>
          <p>Place N queens on an N×N board so no two attack each other. Backtracking explores every placement and retreats on conflict.</p>
        </div>
        <div className="algo-layout">
          <div>
            <div className="status-bar">{current ? current.msg : 'Select board size and press Start'}</div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:24, display:'flex', justifyContent:'center' }}>
              <div>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${N},${cellSize}px)`, gap:2 }}>
                  {board.map((row,r) => row.map((cell,c) => {
                    const light = (r+c)%2===0;
                    const isTrying = placing&&placing[0]===r&&placing[1]===c;
                    const isBack   = backCell&&backCell[0]===r&&backCell[1]===c;
                    let bg = light ? '#1e3a5f' : '#111827';
                    if (isBack)   bg = 'rgba(239,68,68,0.35)';
                    else if (isTrying) bg = 'rgba(234,179,8,0.35)';
                    else if (cell===1) bg = light ? 'rgba(0,212,255,0.18)' : 'rgba(0,212,255,0.1)';
                    return (
                      <div key={`${r}-${c}`} style={{ width:cellSize, height:cellSize, background:bg, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, border:isTrying?'2px solid var(--yellow)':isBack?'2px solid var(--red)':'2px solid transparent', fontSize:cellSize*0.52, transition:'background 0.12s' }}>
                        {cell===1 && '♛'}
                      </div>
                    );
                  }))}
                </div>
                <div style={{ display:'flex', gap:14, marginTop:14, justifyContent:'center', flexWrap:'wrap' }}>
                  {[['rgba(0,212,255,0.2)','Placed'],['rgba(234,179,8,0.35)','Trying'],['rgba(239,68,68,0.35)','Backtrack']].map(([c,l]) => (
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--muted)' }}>
                      <div style={{ width:12, height:12, borderRadius:3, background:c }}/>{l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {current && (
              <div style={{ display:'flex', gap:12, marginTop:16 }}>
                <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 20px', fontFamily:'JetBrains Mono', textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>SOLUTIONS</div>
                  <div style={{ fontSize:22, color:'var(--green)', fontWeight:700 }}>{current.solutions}</div>
                </div>
                <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 20px', fontFamily:'JetBrains Mono', textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>STEP</div>
                  <div style={{ fontSize:22, color:'var(--accent)', fontWeight:700 }}>{stepIdx+1} / {steps.length}</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="controls-panel">
              <h3>Board Size (N)</h3>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                {[4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => { reset(); setN(n); }} className="btn btn-secondary"
                    style={{ padding:'6px 14px', fontSize:14, background:N===n?'rgba(0,212,255,0.1)':'', borderColor:N===n?'var(--accent)':'', color:N===n?'var(--accent)':'' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <StepControls running={running} stepIdx={stepIdx} totalSteps={steps.length} onStart={start} onPause={pause} onReset={reset} onPrev={prev} onNext={next} speed={speed} onSpeedChange={setSpeed}/>
            <div className="controls-panel">
              <h3>Complexity</h3>
              <div className="info-grid">
                <div className="info-chip"><div className="label">Time</div><div className="value">O(N!)</div></div>
                <div className="info-chip"><div className="label">Space</div><div className="value">O(N)</div></div>
                <div className="info-chip"><div className="label">N=6 sols</div><div className="value">4</div></div>
                <div className="info-chip"><div className="label">N=8 sols</div><div className="value">92</div></div>
              </div>
            </div>
            <div className="controls-panel">
              <h3>Pseudocode</h3>
              <div className="pseudocode"><span className="fn">solve</span>(row):{'\n'}  <span className="kw">if</span> row==N: record ✓{'\n'}  <span className="kw">for</span> col=0 to N-1:{'\n'}    <span className="kw">if</span> isSafe(row,col):{'\n'}      board[row][col]=1{'\n'}      <span className="fn">solve</span>(row+1){'\n'}      board[row][col]=0 <span className="cm">← backtrack</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
