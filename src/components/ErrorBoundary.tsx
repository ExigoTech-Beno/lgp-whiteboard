import React from 'react'

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' })
    window.location.reload()
  }

  handleClearAndReload = () => {
    try {
      localStorage.removeItem('lgp-presentation')
    } catch (_) { /* noop */ }
    this.setState({ hasError: false, message: '' })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const hasBackups = Array.from({ length: 5 }, (_, i) => localStorage.getItem(`lgp-bk-ts-${i}`)).some(Boolean)

    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0a0d12',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        gap: 16, fontFamily: '"IBM Plex Sans", sans-serif', color: '#90a4ae', padding: 40,
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 18, color: '#ef9a9a', fontWeight: 600 }}>Canvas failed to load</div>
        <div style={{
          background: '#111d2e', border: '1px solid #ef9a9a55', borderRadius: 8,
          padding: '10px 18px', fontSize: 12, maxWidth: 500, wordBreak: 'break-word',
          color: '#78909c',
        }}>
          {this.state.message}
        </div>

        <button
          onClick={this.handleReload}
          style={{
            marginTop: 8, padding: '10px 28px', borderRadius: 8, border: 'none',
            background: '#1e88e5', color: '#fff', fontFamily: 'inherit',
            fontSize: 14, cursor: 'pointer', fontWeight: 600,
          }}
        >
          Reload (keep my work)
        </button>

        {hasBackups && (
          <div style={{ fontSize: 11, color: '#4caf50' }}>
            ✓ Auto-save backups exist — use the <strong>🕒 History</strong> button after reloading to restore.
          </div>
        )}

        <button
          onClick={this.handleClearAndReload}
          style={{
            padding: '7px 18px', borderRadius: 8,
            border: '1px solid #ef9a9a55', background: 'transparent',
            color: '#ef9a9a', fontFamily: 'inherit',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          Clear canvas &amp; start fresh (⚠️ loses unsaved work)
        </button>
      </div>
    )
  }
}
