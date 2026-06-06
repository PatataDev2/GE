import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '1rem' }}>
              Algo salió mal
            </h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Ocurrió un error inesperado. Recarga la página o contacta al administrador.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Recargar página
            </button>
            {this.props.showError && (
              <pre style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#fee2e2',
                borderRadius: '6px',
                fontSize: '0.75rem',
                textAlign: 'left',
                overflowX: 'auto'
              }}>
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
