import { INPUT_PRESETS, applyPreset, parseCustomArray } from '../utils/arrayPresets';

/**
 * Reusable interactive input panel for array-based algorithms.
 */
export default function InputPanel({
  value,
  onChange,
  onApply,
  onPreset,
  error,
  disabled = false,
  placeholder = 'e.g. 45, 12, 78, 3, 56',
  title = 'Interactive Input',
  showPresets = true,
  minLen = 2,
  maxLen = 30,
}) {
  const handleApply = () => {
    const result = parseCustomArray(value, { minLen, maxLen });
    if (result.error) {
      onApply?.(null, result.error);
      return;
    }
    onApply?.(result.values, null);
  };

  const handlePreset = (id) => {
    const next = applyPreset(id);
    onChange?.(next.join(', '));
    onPreset?.(next);
  };

  return (
    <div className="controls-panel input-panel">
      <h3>{title}</h3>
      {showPresets && (
        <div className="input-preset-grid">
          {INPUT_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              className="input-preset-btn"
              onClick={() => handlePreset(p.id)}
              disabled={disabled}
              title={p.label}
            >
              <span className="input-preset-icon">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="input-row">
        <input
          className="ds-input"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button className="btn btn-primary" onClick={handleApply} disabled={disabled} type="button">
          Apply
        </button>
      </div>
      {error && <div className="input-error">{error}</div>}
      <div className="input-hint">Comma-separated integers. Use presets for common test patterns.</div>
    </div>
  );
}
