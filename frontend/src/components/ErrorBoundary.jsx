import { Component } from 'react';
import PropTypes from 'prop-types';
import { logError } from '../utils/logger';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-5">
          <div className="text-center max-w-[500px]">
            <h1 className="text-2xl text-red-600 mb-4">
              Algo salió mal
            </h1>
            <p className="text-slate-500 mb-6">
              Ocurrió un error inesperado. Recarga la página o contacta al administrador.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white border-none rounded-md cursor-pointer"
            >
              Recargar página
            </button>
            {this.props.showError && (
              <pre className="mt-4 p-4 bg-red-50 rounded-md text-xs text-left overflow-x-auto">
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

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  showError: PropTypes.bool,
};
