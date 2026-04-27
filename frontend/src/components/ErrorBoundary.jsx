import { Component } from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      errorDetails: '',
      stack: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected UI error occurred.',
      stack: error?.stack || '',
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for debugging
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Store error details
    this.setState({
      errorDetails: errorInfo?.componentStack || '',
    });

    // In production, you could send this to an error tracking service
    if (import.meta.env.PROD) {
      // Log to your error tracking service
      console.log('Error tracked:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      message: '',
      errorDetails: '',
      stack: '',
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          className="error-boundary-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="panel error-panel">
            <div className="error-header">
              <h2>⚠️ Something Went Wrong</h2>
              <p className="error-message">{this.state.message}</p>
            </div>

            {import.meta.env.DEV && this.state.errorDetails && (
              <details className="error-details">
                <summary>Error Details (Dev Only)</summary>
                <pre className="error-stack">{this.state.errorDetails}</pre>
              </details>
            )}

            <div className="error-actions">
              <button
                className="button-link"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <a href="/" className="ghost-link">
                Go Home
              </a>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
