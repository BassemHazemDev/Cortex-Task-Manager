/**
 * @module ErrorBoundary
 * 
 * React Error Boundary component that catches JavaScript errors anywhere
 * in the child component tree, logs those errors, and displays a fallback UI.
 */

import { Component } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary component that catches errors in child components.
 * Prevents the entire app from crashing when a component fails.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could send error to an error reporting service here
    // Example: errorReportingService.log({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // If a custom onReset handler is provided, call it
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      // Default fallback UI
      return (
        <Card className="m-4 border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {this.props.message || 'An unexpected error occurred in this section.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs bg-muted rounded p-3">
                <summary className="cursor-pointer font-medium mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="whitespace-pre-wrap break-words text-destructive">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap break-words mt-2 text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
