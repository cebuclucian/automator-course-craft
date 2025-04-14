
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Ceva nu a mers bine</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Ne pare rău, a apărut o eroare în aplicație.
          </p>
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-w-full text-left">
            <pre className="text-sm">{this.state.error?.toString()}</pre>
          </div>
          <Button onClick={() => window.location.reload()}>
            Reîncarcă pagina
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
