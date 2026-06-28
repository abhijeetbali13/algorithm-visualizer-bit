/**
 * CodePanel — shows pseudocode or Java with active line highlight.
 * Props:
 *   lines: string[]   — array of code lines
 *   activeLine: number — 0-indexed active line (-1 = none)
 *   language: 'pseudo' | 'java'
 */
export default function CodePanel({ lines = [], activeLine = -1, language = 'pseudo' }) {
  const kwJava   = /\b(public|static|void|int|double|for|while|if|else|return|new|class|boolean|String|null|true|false|break|continue|throws|throw)\b/g;
  const kwPseudo = /\b(for|while|if|else|return|function|do|end|begin|then|to|downto|and|or|not|in)\b/gi;
  const kwRe = language === 'java' ? kwJava : kwPseudo;

  const highlight = (line) =>
    line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(kwRe, '<span class="kw">$&</span>')
      .replace(/(\/\/.*)/g, '<span class="cm">$1</span>')
      .replace(/(".*?")/g, '<span style="color:#86efac">$1</span>');

  return (
    <div style={{ background: 'var(--code-bg)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {lines.map((line, i) => {
        const isActive = i === activeLine;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            transition: 'background 0.2s, border-color 0.2s',
          }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--muted)', padding: '2px 8px', minWidth: 32, textAlign: 'right', userSelect: 'none' }}>{i + 1}</span>
            <pre style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: isActive ? 'var(--text)' : 'var(--muted)', padding: '2px 12px', margin: 0, whiteSpace: 'pre', lineHeight: 1.8, flex: 1 }}
              dangerouslySetInnerHTML={{ __html: highlight(line) }} />
          </div>
        );
      })}
    </div>
  );
}
