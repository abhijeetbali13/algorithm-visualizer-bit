/**
 * LearningPanel — structured educational content for algorithm pages.
 */

const Section = ({ title, children, color = 'var(--accent)' }) => (
  <section className="learning-section" aria-labelledby={`section-${title.replace(/\s/g, '-')}`}>
    <h3 className="learning-section-title" style={{ color }} id={`section-${title.replace(/\s/g, '-')}`}>
      <span className="learning-section-bar" style={{ background: color }} aria-hidden="true" />
      {title}
    </h3>
    {children}
  </section>
);

const BulletList = ({ items, color = 'var(--text-secondary)' }) => (
  <ul className="learning-list">
    {items.map((item, i) => (
      <li key={i}>
        <span className="learning-bullet" style={{ color }} aria-hidden="true">▸</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default function LearningPanel({ data }) {
  if (!data) return null;

  const {
    overview, problem, useCases, dryRun, complexity,
    advantages, disadvantages, interviewQs, mistakes, edgeCases,
    whenToUse, whenToAvoid, learningTips, relatedAlgorithms,
  } = data;

  return (
    <div className="learning-panel">
      {overview && (
        <Section title="Overview">
          <p className="learning-body">{overview}</p>
        </Section>
      )}
      {problem && (
        <Section title="Problem Statement">
          <p className="learning-body">{problem}</p>
        </Section>
      )}
      {whenToUse && (
        <Section title="When Should I Use This?" color="var(--green)">
          <p className="learning-body">{whenToUse}</p>
        </Section>
      )}
      {whenToAvoid && (
        <Section title="When Should I Avoid This?" color="var(--red)">
          <p className="learning-body">{whenToAvoid}</p>
        </Section>
      )}
      {useCases?.length > 0 && (
        <Section title="Real-World Applications" color="var(--green)">
          <BulletList items={useCases} color="var(--green)" />
        </Section>
      )}
      {dryRun && (
        <Section title="Dry Run" color="var(--yellow)">
          <pre className="learning-dry-run">{dryRun}</pre>
        </Section>
      )}
      {complexity && (
        <Section title="Complexity Analysis" color="var(--accent)">
          <div className="complexity-grid">
            {Object.entries(complexity).map(([k, v]) => (
              <div key={k} className="info-chip">
                <div className="label">{k}</div>
                <div className="value">{v}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {advantages?.length > 0 && (
        <Section title="Advantages" color="var(--green)">
          <BulletList items={advantages} color="var(--green)" />
        </Section>
      )}
      {disadvantages?.length > 0 && (
        <Section title="Disadvantages" color="var(--red)">
          <BulletList items={disadvantages} color="var(--red)" />
        </Section>
      )}
      {edgeCases?.length > 0 && (
        <Section title="Edge Cases" color="var(--orange)">
          <BulletList items={edgeCases} color="var(--orange)" />
        </Section>
      )}
      {mistakes?.length > 0 && (
        <Section title="Common Mistakes" color="var(--orange)">
          <BulletList items={mistakes} color="var(--orange)" />
        </Section>
      )}
      {learningTips?.length > 0 && (
        <Section title="Learning Tips" color="var(--accent2)">
          <BulletList items={learningTips} color="var(--accent2)" />
        </Section>
      )}
      {interviewQs?.length > 0 && (
        <Section title="Common Interview Questions" color="var(--accent)">
          <div className="interview-list">
            {interviewQs.map((q, i) => (
              <div key={i} className="interview-card">
                <div className="interview-q">Q{i + 1}.</div>
                <div className="interview-text">{q}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {relatedAlgorithms?.length > 0 && (
        <Section title="Related Algorithms" color="var(--accent2)">
          <div className="related-algo-list">
            {relatedAlgorithms.map(name => (
              <span key={name} className="related-algo-chip">{name}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
