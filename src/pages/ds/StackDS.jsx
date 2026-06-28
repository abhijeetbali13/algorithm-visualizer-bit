import { useState, useRef } from 'react';
import { useVisualizer } from '../../hooks/useVisualizer';
import StepControls from '../../components/StepControls';
import './ds.css';

const OPS = ['Overview', 'Push / Pop / Peek', 'Reverse String', 'Balanced Brackets', 'Expression Conversion'];

/* ───────────────────────── Visual stack box (shared by every tab) ───────────────────────── */

function StackBox({ items, highlightTop, topLabel = '← TOP', minSlots = 4 }) {
  const MAX_SHOW = 8;
  const display = items.slice(-MAX_SHOW);
  const offset = items.length - display.length;
  const padSlots = Math.max(0, minSlots - display.length);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
      {display.length > 0 && (
        <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--accent)', marginBottom:4 }}>{topLabel}</div>
      )}
      <div style={{ border:'2px solid var(--border)', borderRadius:'0 0 8px 8px', borderTop:'none', width:110, paddingBottom:8, minHeight: padSlots*50 }}>
        {display.length === 0 && (
          <div style={{ padding:'20px 0', textAlign:'center', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)' }}>empty</div>
        )}
        {[...display].reverse().map((v, ri) => {
          const i = display.length - 1 - ri + offset;
          const isTop = i === items.length - 1;
          const hl = isTop ? highlightTop : null;
          const col = hl==='push'?'var(--accent)':hl==='pop'?'var(--red)':hl==='peek'?'var(--yellow)':'var(--border)';
          return (
            <div key={i} style={{ margin:'4px 8px', height:42, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:`2px solid ${col}`, background: hl?`${col}22`:'var(--surface2)', fontFamily:'JetBrains Mono', fontSize:15, fontWeight:700, color:hl?col:'var(--text)', transition:'all 0.2s', position:'relative' }}>
              {v}
            </div>
          );
        })}
      </div>
      <div style={{ width:118, height:10, background:'var(--border)', borderRadius:'0 0 8px 8px' }}/>
      <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'var(--muted)', marginTop:4 }}>BOTTOM</div>
    </div>
  );
}

/* ───────────────────────── Step builders: Push / Pop / Peek ───────────────────────── */

function buildPush(stack, v) {
  const result = [...stack, v];
  const steps = [
    { stack: [...stack], hl: null, msg: `Create slot for ${v}. SP (stack pointer) about to move up.` },
    { stack: result, hl: 'push', msg: `PUSH ${v} → placed on TOP. SP incremented. O(1).` },
  ];
  return { steps, result };
}

function buildPop(stack) {
  const top = stack[stack.length - 1];
  const result = stack.slice(0, -1);
  const steps = [
    { stack: [...stack], hl: 'pop', msg: `Read TOP = ${top}. About to remove it...` },
    { stack: result, hl: null, msg: `POP → removed ${top}. SP decremented. New top: ${result.length ? result[result.length-1] : 'empty'}. O(1).` },
  ];
  return { steps, result };
}

function buildPeek(stack) {
  const top = stack[stack.length - 1];
  const steps = [
    { stack: [...stack], hl: 'peek', msg: `PEEK → top element is ${top}. Stack unchanged. O(1).` },
  ];
  return { steps, result: stack };
}

/* ───────────────────────── Step builders: Reverse String ───────────────────────── */

function buildReverseSteps(str) {
  const chars = str.split('');
  const steps = [];
  let stk = [];
  for (const ch of chars) {
    stk = [...stk, ch];
    steps.push({ stack: [...stk], result: '', phase: 'push', msg: `PUSH '${ch}' onto stack. Stack: [${stk.join(', ')}]` });
  }
  let result = '';
  while (stk.length) {
    const ch = stk[stk.length - 1];
    stk = stk.slice(0, -1);
    result += ch;
    steps.push({ stack: [...stk], result, phase: 'pop', msg: `POP '${ch}' → append to result. Result so far: "${result}"` });
  }
  steps.push({ stack: [], result, phase: 'done', msg: `Done! Reversed string: "${result}". Pushing then popping every char reverses the order — LIFO. O(n) time, O(n) space.` });
  return { steps, result };
}

/* ───────────────────────── Step builders: Balanced Brackets ───────────────────────── */

function buildBracketSteps(str) {
  const pairs = { ')':'(', ']':'[', '}':'{' };
  const opens = new Set(['(','[','{']);
  const steps = [];
  let stk = []; // {ch, idx}
  let charStates = {};
  let result = null;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (opens.has(ch)) {
      stk = [...stk, { ch, idx: i }];
      charStates = { ...charStates, [i]: 'current' };
      steps.push({ stack: stk.map(x=>x.ch), charStates: { ...charStates }, result: null,
        msg: `'${ch}' is an opening bracket → PUSH. Stack depth: ${stk.length}.` });
    } else if (pairs[ch]) {
      if (!stk.length || stk[stk.length-1].ch !== pairs[ch]) {
        charStates = { ...charStates, [i]: 'mismatch' };
        result = 'invalid';
        steps.push({ stack: stk.map(x=>x.ch), charStates: { ...charStates }, result,
          msg: `✗ '${ch}' at position ${i} does not match! Expected '${stk.length ? stk[stk.length-1].ch : 'nothing — stack empty'}'.` });
        return { steps, result };
      }
      const matched = stk[stk.length-1];
      stk = stk.slice(0, -1);
      charStates = { ...charStates, [matched.idx]: 'match', [i]: 'match' };
      steps.push({ stack: stk.map(x=>x.ch), charStates: { ...charStates }, result: null,
        msg: `'${ch}' matches '${matched.ch}' from position ${matched.idx} → POP ✓` });
    } else if (ch.trim()) {
      steps.push({ stack: stk.map(x=>x.ch), charStates: { ...charStates }, result: null,
        msg: `'${ch}' is not a bracket — skip.` });
    }
  }
  result = stk.length === 0 ? 'valid' : 'invalid';
  steps.push({ stack: stk.map(x=>x.ch), charStates: { ...charStates }, result,
    msg: result === 'valid' ? '✓ All brackets balanced! Stack is empty at the end.' : `✗ ${stk.length} unmatched opening bracket(s) remain on the stack.` });
  return { steps, result };
}

/* ───────────────────────── Step builders: Expression conversions ─────────────────────────
   Verified against textbook examples (A+B*C-D ↔ ABC*+D- ↔ -+A*BCD etc.) before wiring up.   */

const PREC = { '+':1, '-':1, '*':2, '/':2, '^':3 };
const isOp = (t) => ['+','-','*','/','^'].includes(t);

function tokenizeInfix(expr) {
  const s = expr.replace(/\s+/g, '');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[A-Za-z0-9]/.test(ch)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9]/.test(s[j])) j++;
      tokens.push(s.slice(i, j));
      i = j;
    } else { tokens.push(ch); i++; }
  }
  return tokens;
}
// Compact pre/postfix has no delimiters, so the textbook convention is: if the
// string contains spaces, tokens are space-separated (multi-char OK); if not,
// every character is its own single-char operand/operator.
function tokenizePrePost(expr) {
  const trimmed = expr.trim();
  if (/\s/.test(trimmed)) return trimmed.split(/\s+/).filter(Boolean);
  return trimmed.split('');
}

function convInfixToPostfix(expr) {
  const tokens = tokenizeInfix(expr);
  const stack = []; const output = []; const steps = [];
  for (const t of tokens) {
    if (isOp(t)) {
      while (stack.length && stack[stack.length-1] !== '(' &&
        (PREC[stack[stack.length-1]] > PREC[t] || (PREC[stack[stack.length-1]] === PREC[t] && t !== '^'))) {
        output.push(stack.pop());
      }
      stack.push(t);
      steps.push({ stack:[...stack], output: output.join(' '), token: t, msg: `Operator '${t}' → pop higher/equal precedence operators first, then push '${t}'.` });
    } else if (t === '(') {
      stack.push(t);
      steps.push({ stack:[...stack], output: output.join(' '), token: t, msg: `'(' → push to stack (marks a sub-expression boundary).` });
    } else if (t === ')') {
      while (stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
      stack.pop();
      steps.push({ stack:[...stack], output: output.join(' '), token: t, msg: `')' → pop operators until matching '(' is found and discarded.` });
    } else {
      output.push(t);
      steps.push({ stack:[...stack], output: output.join(' '), token: t, msg: `'${t}' is an operand → send straight to output.` });
    }
  }
  while (stack.length) output.push(stack.pop());
  steps.push({ stack: [...stack], output: output.join(' '), token: null, msg: `Pop remaining operators. Result: ${output.join(' ')}` });
  return { steps, result: output.join(' ') };
}

function convInfixToPrefix(expr) {
  const tokens = tokenizeInfix(expr).reverse().map(t => t === '(' ? ')' : t === ')' ? '(' : t);
  const stack = []; const output = []; const steps = [];
  for (const t of tokens) {
    if (isOp(t)) {
      while (stack.length && stack[stack.length-1] !== '(' && PREC[stack[stack.length-1]] > PREC[t]) {
        output.push(stack.pop());
      }
      stack.push(t);
      steps.push({ stack:[...stack], output: [...output].reverse().join(' '), token: t, msg: `Operator '${t}' (scanning right→left) → pop strictly-higher precedence first, then push.` });
    } else if (t === '(') {
      stack.push(t);
      steps.push({ stack:[...stack], output: [...output].reverse().join(' '), token: t, msg: `'(' (was ')' before reversal) → push.` });
    } else if (t === ')') {
      while (stack.length && stack[stack.length-1] !== '(') output.push(stack.pop());
      stack.pop();
      steps.push({ stack:[...stack], output: [...output].reverse().join(' '), token: t, msg: `')' (was '(' before reversal) → pop until matching bracket.` });
    } else {
      output.push(t);
      steps.push({ stack:[...stack], output: [...output].reverse().join(' '), token: t, msg: `'${t}' is an operand → send to output.` });
    }
  }
  while (stack.length) output.push(stack.pop());
  const result = output.reverse().join(' ');
  steps.push({ stack: [...stack], output: result, token: null, msg: `Reverse the output to get the final prefix string: ${result}` });
  return { steps, result };
}

function convPostfixToInfix(expr) {
  const tokens = tokenizePrePost(expr);
  const stack = []; const steps = [];
  for (const t of tokens) {
    if (isOp(t)) {
      if (stack.length < 2) { steps.push({ stack:[...stack], output:'', token:t, msg:`✗ Not enough operands for '${t}' — invalid postfix expression.`, error:true }); return { steps, result: null }; }
      const b = stack.pop(), a = stack.pop();
      const expr2 = `(${a}${t}${b})`;
      stack.push(expr2);
      steps.push({ stack:[...stack], output:'', token:t, msg: `Operator '${t}' → pop top two operands (${b}, then ${a}), combine as ${expr2}, push back.` });
    } else {
      stack.push(t);
      steps.push({ stack:[...stack], output:'', token:t, msg: `'${t}' is an operand → push.` });
    }
  }
  const result = stack.length === 1 ? stack[0] : null;
  steps.push({ stack:[...stack], output: result || '', token: null,
    msg: result ? `One item remains on the stack — the fully parenthesized infix expression: ${result}` : `✗ Leftover items on stack — invalid postfix expression.` });
  return { steps, result };
}

function convPrefixToInfix(expr) {
  const tokens = tokenizePrePost(expr).reverse();
  const stack = []; const steps = [];
  for (const t of tokens) {
    if (isOp(t)) {
      if (stack.length < 2) { steps.push({ stack:[...stack], output:'', token:t, msg:`✗ Not enough operands for '${t}' — invalid prefix expression.`, error:true }); return { steps, result: null }; }
      const a = stack.pop(), b = stack.pop();
      const expr2 = `(${a}${t}${b})`;
      stack.push(expr2);
      steps.push({ stack:[...stack], output:'', token:t, msg: `Operator '${t}' (scanning right→left) → combine top two as ${expr2}, push back.` });
    } else {
      stack.push(t);
      steps.push({ stack:[...stack], output:'', token:t, msg: `'${t}' is an operand → push.` });
    }
  }
  const result = stack.length === 1 ? stack[0] : null;
  steps.push({ stack:[...stack], output: result || '', token: null,
    msg: result ? `One item remains — the fully parenthesized infix expression: ${result}` : `✗ Leftover items on stack — invalid prefix expression.` });
  return { steps, result };
}

function convPostfixToPrefix(expr) {
  const tokens = tokenizePrePost(expr);
  const stack = []; const steps = [];
  for (const t of tokens) {
    if (isOp(t)) {
      if (stack.length < 2) { steps.push({ stack:[...stack], output:'', token:t, msg:`✗ Not enough operands for '${t}' — invalid postfix expression.`, error:true }); return { steps, result: null }; }
      const b = stack.pop(), a = stack.pop();
      const expr2 = `${t} ${a} ${b}`.trim();
      stack.push(expr2);
      steps.push({ stack:[...stack], output:'', token:t, msg: `Operator '${t}' → pop two, prepend operator: "${expr2}", push back.` });
    } else {
      stack.push(t);
      steps.push({ stack:[...stack], output:'', token:t, msg: `'${t}' is an operand → push.` });
    }
  }
  const result = stack.length === 1 ? stack[0] : null;
  steps.push({ stack:[...stack], output: result || '', token: null,
    msg: result ? `Final prefix expression: ${result}` : `✗ Leftover items on stack — invalid postfix expression.` });
  return { steps, result };
}

function convPrefixToPostfix(expr) {
  const tokens = tokenizePrePost(expr).reverse();
  const stack = []; const steps = [];
  for (const t of tokens) {
    if (isOp(t)) {
      if (stack.length < 2) { steps.push({ stack:[...stack], output:'', token:t, msg:`✗ Not enough operands for '${t}' — invalid prefix expression.`, error:true }); return { steps, result: null }; }
      const a = stack.pop(), b = stack.pop();
      const expr2 = `${a} ${b} ${t}`.trim();
      stack.push(expr2);
      steps.push({ stack:[...stack], output:'', token:t, msg: `Operator '${t}' (scanning right→left) → pop two, append operator: "${expr2}", push back.` });
    } else {
      stack.push(t);
      steps.push({ stack:[...stack], output:'', token:t, msg: `'${t}' is an operand → push.` });
    }
  }
  const result = stack.length === 1 ? stack[0] : null;
  steps.push({ stack:[...stack], output: result || '', token: null,
    msg: result ? `Final postfix expression: ${result}` : `✗ Leftover items on stack — invalid prefix expression.` });
  return { steps, result };
}

const CONVERSIONS = {
  'Infix → Postfix':  { fn: convInfixToPostfix,  example: 'A+B*C-D',   placeholder: 'e.g. A+B*C-D or (A+B)*(C-D)' },
  'Infix → Prefix':   { fn: convInfixToPrefix,   example: 'A+B*C-D',   placeholder: 'e.g. A+B*C-D' },
  'Postfix → Infix':  { fn: convPostfixToInfix,  example: 'ABC*+D-',   placeholder: 'e.g. ABC*+D- (or spaced: A B C * + D -)' },
  'Prefix → Infix':   { fn: convPrefixToInfix,   example: '-+A*BCD',   placeholder: 'e.g. -+A*BCD' },
  'Postfix → Prefix': { fn: convPostfixToPrefix, example: 'ABC*+D-',   placeholder: 'e.g. ABC*+D-' },
  'Prefix → Postfix': { fn: convPrefixToPostfix, example: '-+A*BCD',   placeholder: 'e.g. -+A*BCD' },
};

/* ───────────────────────── Main component ───────────────────────── */

export default function StackDS() {
  const [stackInitInput, setStackInitInput] = useState('');
  const [stackInitErr, setStackInitErr]     = useState('');
  const [stack, setStack] = useState([3, 7, 12, 25]);
  const [tab, setTab] = useState('Overview');
  const [idleMsg, setIdleMsg] = useState('Select an operation, then press ▶ Play.');
  const [inputVal, setInputVal] = useState('');
  const [inputStr, setInputStr] = useState('hello');
  const [inputBracket, setInputBracket] = useState('{[()]}');
  const [convMode, setConvMode] = useState('Infix → Postfix');
  const [convInput, setConvInput] = useState('A+B*C-D');

  const pendingSteps = useRef([]);
  const viz = useVisualizer(() => pendingSteps.current);
  const { current, steps, stepIdx, running, speed, setSpeed, start, pause, prev, next, reset, jumpTo } = viz;

  const run = (builderResult) => {
    pendingSteps.current = builderResult.steps;
    if (builderResult.result !== undefined && Array.isArray(builderResult.result)) setStack(builderResult.result);
    reset();
    start();
  };

  const switchTab = (t) => { setTab(t); reset(); };

  const push = () => { const v = parseInt(inputVal); if (isNaN(v)) return setIdleMsg('Enter a valid number.'); run(buildPush(stack, v)); setInputVal(''); };
  const pop  = () => { if (!stack.length) return setIdleMsg('Stack Underflow! Cannot pop from empty stack.'); run(buildPop(stack)); };
  const peek = () => { if (!stack.length) return setIdleMsg('Stack is empty!'); run(buildPeek(stack)); };

  const reverseString = () => { if (!inputStr.trim()) return setIdleMsg('Enter a string.'); pendingSteps.current = buildReverseSteps(inputStr).steps; reset(); start(); };
  const checkBrackets  = () => { if (!inputBracket.trim()) return setIdleMsg('Enter a bracket string.'); pendingSteps.current = buildBracketSteps(inputBracket).steps; reset(); start(); };
  const convert = () => {
    if (!convInput.trim()) return setIdleMsg('Enter an expression.');
    const { fn } = CONVERSIONS[convMode];
    pendingSteps.current = fn(convInput).steps;
    reset(); start();
  };

  const resetStack = () => { setStack([3,7,12,25]); reset(); setIdleMsg('Stack reset.'); setInputVal(''); };

  // applyCustomStack: load custom initial stack values
  const applyCustomStack = () => {
    setStackInitErr('');
    const vals = stackInitInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (vals.length < 1 || vals.length > 8) {
      setStackInitErr('Enter 1–8 integers (comma-separated).');
      return;
    }
    setStack(vals);
    reset();
    setIdleMsg(`Loaded stack: [${vals.join(', ')}] (rightmost = top)`);
  };

  // resetToEmpty: clear the stack entirely
  const resetToEmpty = () => {
    setStack([]);
    setStackInitInput('');
    setStackInitErr('');
    reset();
    setIdleMsg('Stack cleared (empty).');
  };

  // Derived display state per-tab
  const c = current;
  const reverseStack = tab === 'Reverse String' ? (c ? c.stack : []) : [];
  const reverseResult = tab === 'Reverse String' ? (c ? c.result : '') : '';
  const bracketStack = tab === 'Balanced Brackets' ? (c ? c.stack : []) : [];
  const bracketCharStates = tab === 'Balanced Brackets' ? (c ? c.charStates : {}) : {};
  const bracketResult = tab === 'Balanced Brackets' ? (c ? c.result : null) : null;
  const convStack = tab === 'Expression Conversion' ? (c ? c.stack : []) : [];
  const convOutput = tab === 'Expression Conversion' ? (c ? c.output : '') : '';

  const displayMsg = c ? c.msg : idleMsg;

  return (
    <div className="ds-page">
      <div className="page-wrapper">
        <div className="ds-header">
          <h1>Stack</h1>
          <p>LIFO — Last In, First Out. Like a stack of plates: you can only add or remove from the TOP. Push, Pop, and Peek are all O(1).</p>
        </div>

              {/* ── Custom stack input ── */}
      <div className="controls-panel" style={{ marginBottom:16 }}>
        <h3>Load Custom Stack</h3>
        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>Pre-load the stack with your own values (bottom → top, left → right).</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <input type="text" value={stackInitInput} onChange={e => setStackInitInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') applyCustomStack(); }}
            placeholder="e.g. 5, 12, 3, 99 (bottom to top)"
            style={{ flex:1, minWidth:200, padding:'7px 10px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontFamily:'JetBrains Mono', fontSize:12 }} />
          <button className="btn btn-primary" onClick={applyCustomStack}>Load</button>
          <button className="btn btn-secondary" onClick={resetToEmpty}>↺ Empty Stack</button>
        </div>
        {stackInitErr && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{stackInitErr}</div>}
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>2–8 values. Rightmost value becomes the top of the stack.</div>
      </div>
      <div className="ds-tabs">
          {OPS.map(o => <button key={o} className={`ds-tab${tab===o?' active':''}`} onClick={()=>switchTab(o)}>{o}</button>)}
        </div>

        <div className="ds-layout">
          <div>
            {tab === 'Overview' && (
              <>
                <div className="ds-canvas" style={{ minHeight:180 }}>
                  <StackBox items={stack} highlightTop={null}/>
                </div>
                <div className="ds-log" style={{ marginTop:12 }}>Current stack: [{stack.join(', ')}] · size {stack.length}</div>
                <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div className="ds-info-box">
                    <strong>LIFO principle:</strong><br/>
                    The last element pushed is the first one popped.<br/><br/>
                    <strong>Core ops:</strong> push, pop, peek/top, isEmpty — all O(1).
                  </div>
                  <div className="ds-info-box">
                    <strong>Real-world uses:</strong><br/>
                    • Function call stack &amp; recursion<br/>
                    • Undo/redo in editors<br/>
                    • Browser back-button history<br/>
                    • Expression evaluation &amp; conversion<br/>
                    • Balanced bracket checking
                  </div>
                </div>
              </>
            )}

            {tab === 'Push / Pop / Peek' && (
              <>
                <div className="ds-canvas" style={{ minHeight:220 }}>
                  <StackBox items={c ? c.stack : stack} highlightTop={c ? c.hl : null}/>
                </div>
                <div className="ds-log" style={{ marginTop:12 }}>{displayMsg}</div>
              </>
            )}

            {tab === 'Reverse String' && (
              <div>
                <div className="ds-canvas" style={{ flexDirection:'column', gap:16, minHeight:240 }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:13, color:'var(--muted)' }}>
                    Algorithm: push every character, then pop them all — LIFO reverses the order.
                  </div>
                  <div style={{ display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap', justifyContent:'center' }}>
                    <StackBox items={reverseStack} highlightTop={c ? (c.phase === 'push' ? 'push' : c.phase === 'pop' ? 'pop' : null) : null} minSlots={Math.max(inputStr.length,1)}/>
                    <div style={{ display:'flex', flexDirection:'column', gap:14, paddingTop:20 }}>
                      <div>
                        <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:4 }}>Original:</div>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:20, color:'var(--text)', letterSpacing:4 }}>{inputStr}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:4 }}>Result so far:</div>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:20, color:'var(--green)', letterSpacing:4, minHeight:28 }}>{reverseResult}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ds-log" style={{ marginTop:12 }}>{displayMsg}</div>
              </div>
            )}

            {tab === 'Balanced Brackets' && (
              <div>
                <div className="ds-canvas" style={{ flexDirection:'column', gap:16, minHeight:240 }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:13, color:'var(--muted)' }}>
                    Algorithm: push opening brackets. On a closing bracket, check if it matches the top.
                  </div>
                  <div style={{ display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap', justifyContent:'center' }}>
                    <StackBox items={bracketStack} highlightTop={c ? 'peek' : null} minSlots={Math.max(inputBracket.length,1)}/>
                    <div style={{ paddingTop:20 }}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:18, display:'flex', gap:4, flexWrap:'wrap', alignItems:'center', maxWidth:320 }}>
                        {inputBracket.split('').map((ch, i) => {
                          const state = bracketCharStates[i];
                          const col = state==='match'?'var(--green)':state==='mismatch'?'var(--red)':state==='current'?'var(--yellow)':'var(--muted)';
                          return <span key={i} style={{ padding:'4px 8px', borderRadius:4, border:`2px solid ${col}`, color:col, background:`${col}11`, transition:'all 0.2s' }}>{ch}</span>;
                        })}
                      </div>
                      {bracketResult && (
                        <div style={{ marginTop:12, color:bracketResult==='valid'?'var(--green)':'var(--red)', fontWeight:700, fontFamily:'JetBrains Mono' }}>
                          {bracketResult==='valid'?'✓ Valid':'✗ Invalid'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ds-log" style={{ marginTop:12 }}>{displayMsg}</div>
              </div>
            )}

            {tab === 'Expression Conversion' && (
              <div>
                <div className="ds-canvas" style={{ flexDirection:'column', gap:16, minHeight:260 }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:13, color:'var(--muted)' }}>
                    {convMode} — uses a stack to track {convMode.startsWith('Infix') ? 'pending operators (precedence rule).' : 'partially-built sub-expressions.'}
                  </div>
                  <div style={{ display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap', justifyContent:'center' }}>
                    <StackBox items={convStack} highlightTop={c ? 'push' : null} minSlots={3}/>
                    <div style={{ display:'flex', flexDirection:'column', gap:14, paddingTop:20, maxWidth:340 }}>
                      <div>
                        <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:4 }}>Input ({convMode.split(' → ')[0]}):</div>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:17, color:'var(--text)', wordBreak:'break-all' }}>{convInput}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:4 }}>Current token:</div>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:17, color:'var(--yellow)' }}>{c && c.token ? `'${c.token}'` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', marginBottom:4 }}>Output / Result:</div>
                        <div style={{ fontFamily:'JetBrains Mono', fontSize:17, color:'var(--green)', wordBreak:'break-all' }}>{convOutput || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ds-log" style={{ marginTop:12 }}>{displayMsg}</div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="ds-ops-panel">
            {tab === 'Overview' && (
              <>
                <h3>Stack State</h3>
                <div className="ds-info-box">
                  Size: <strong style={{ color:'var(--accent)' }}>{stack.length}</strong><br/>
                  Top: <strong style={{ color:'var(--accent)' }}>{stack.length ? stack[stack.length-1] : 'empty'}</strong><br/>
                  Status: <strong style={{ color: stack.length?'var(--green)':'var(--red)' }}>{stack.length?'Not empty':'Empty'}</strong>
                </div>
                <button className="btn btn-secondary" onClick={resetStack} style={{ width:'100%' }}>↺ Reset</button>
              </>
            )}

            {tab === 'Push / Pop / Peek' && (
              <>
                <h3>Operations</h3>
                <div className="ds-op-group">
                  <label>Value to push</label>
                  <input className="ds-input" type="number" value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="e.g. 42"/>
                </div>
                <button className="btn btn-primary" onClick={push} style={{ width:'100%' }} disabled={running}>▶ PUSH ↑</button>
                <button className="btn btn-danger" onClick={pop} style={{ width:'100%' }} disabled={running}>▶ POP ↓</button>
                <button className="btn btn-secondary" onClick={peek} style={{ width:'100%' }} disabled={running}>▶ PEEK (read top)</button>
                <div className="ds-info-box">
                  Stack size: <strong style={{ color:'var(--accent)' }}>{stack.length}</strong><br/>
                  Top: <strong style={{ color:'var(--accent)' }}>{stack.length ? stack[stack.length-1] : '—'}</strong>
                </div>
              </>
            )}

            {tab === 'Reverse String' && (
              <>
                <h3>Input</h3>
                <div className="ds-op-group">
                  <label>String to reverse</label>
                  <input className="ds-input" value={inputStr} onChange={e=>setInputStr(e.target.value.slice(0,14))} placeholder="e.g. hello"/>
                </div>
                <button className="btn btn-primary" onClick={reverseString} style={{ width:'100%' }} disabled={running}>▶ Animate Reverse</button>
                <div className="ds-info-box">
                  1. Push each char onto stack<br/>
                  2. Pop all chars — LIFO gives reverse order<br/>
                  <strong>O(n) time, O(n) space</strong>
                </div>
              </>
            )}

            {tab === 'Balanced Brackets' && (
              <>
                <h3>Input</h3>
                <div className="ds-op-group">
                  <label>Bracket string</label>
                  <input className="ds-input" value={inputBracket} onChange={e=>setInputBracket(e.target.value.slice(0,20))} placeholder="{[()]}"/>
                </div>
                <button className="btn btn-primary" onClick={checkBrackets} style={{ width:'100%' }} disabled={running}>▶ Check</button>
                <div className="ds-info-box">
                  Push <code>{'('}</code> <code>{'['}</code> <code>{'{'}</code><br/>
                  On <code>{')'}</code> <code>{']'}</code> <code>{'}'}</code> — pop and check match<br/>
                  Valid if stack empty at end<br/>
                  <strong>O(n) time, O(n) space</strong>
                </div>
              </>
            )}

            {tab === 'Expression Conversion' && (
              <>
                <h3>Conversion type</h3>
                <select className="ds-input" value={convMode} onChange={e=>{ setConvMode(e.target.value); setConvInput(CONVERSIONS[e.target.value].example); reset(); }}>
                  {Object.keys(CONVERSIONS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="ds-op-group">
                  <label>Expression</label>
                  <input className="ds-input" value={convInput} onChange={e=>setConvInput(e.target.value.slice(0,24))} placeholder={CONVERSIONS[convMode].placeholder}/>
                </div>
                <button className="btn btn-primary" onClick={convert} style={{ width:'100%' }} disabled={running}>▶ Convert</button>
                <div className="ds-info-box">
                  Precedence: ^ &gt; * / &gt; + -<br/>
                  {convMode.startsWith('Postfix') || convMode.startsWith('Prefix')
                    ? <>Compact form (no spaces) = 1 char per operand. Use spaces for multi-char operands, e.g. <code>12 5 3 * +</code>.</>
                    : <>Operands may be multi-char (letters/digits), e.g. <code>12+5*3</code>.</>}
                </div>
              </>
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
