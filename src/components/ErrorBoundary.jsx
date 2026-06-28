import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Visualizer crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: 16,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            border: '2px solid rgba(239,68,68,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}>⚠</div>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text)', fontWeight: 700 }}>
              Visualizer Error
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, maxWidth: 420, lineHeight: 1.6 }}>
              This visualizer encountered an unexpected error. Please refresh the page or try another algorithm.
            </p>
          </div>
          {this.state.error && (
            <div style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: 'var(--red, #ef4444)',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: '8px 14px',
              maxWidth: 480,
              wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </div>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 4 }}
          >
            ↺ Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
