
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console with component stack
    console.error(`${error.toString()}\n${errorInfo.componentStack}`);
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900">
          <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Ceva nu a funcționat corect
            </h1>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md mb-6 overflow-x-auto">
              <p className="text-sm font-mono text-red-600 dark:text-red-400">
                {this.state.error?.toString() || 'A apărut o eroare neașteptată'}
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Vă rugăm să reîmprospătați pagina sau să încercați din nou mai târziu.
            </p>
            <div className="flex justify-center">
              <Button onClick={this.handleRefresh} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Reîmprospătează pagina</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
