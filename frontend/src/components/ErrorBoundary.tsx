import React from 'react'

interface ErrorBoundaryState {
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): Pick<ErrorBoundaryState, 'error'> {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    console.error('React runtime crash:', error, errorInfo)
  }

  render() {
    const { error, errorInfo } = this.state

    if (error) {
      return (
        <div style={{
          minHeight: '100vh',
          padding: 16,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          background: '#fff5f5',
          color: '#991b1b',
          fontFamily: 'monospace',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
        }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>React Runtime Crash</h1>
          <pre style={{
            color: '#991b1b',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: 12,
            overflow: 'auto',
          }}>
            {[
              `Message: ${error.message}`,
              '',
              `Stack: ${error.stack || 'No stack available'}`,
              '',
              `Component stack: ${errorInfo?.componentStack || 'No component stack available'}`,
            ].join('\n')}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
