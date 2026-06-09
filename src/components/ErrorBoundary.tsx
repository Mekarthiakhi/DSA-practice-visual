/**
 * ErrorBoundary Component
 * Catches runtime errors in child components and displays fallback UI
 * Prevents entire app from crashing due to one component failure
 */

import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  componentName?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error caught in ${this.props.componentName || 'ErrorBoundary'}:`, error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    })
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center h-full bg-gradient-to-b from-red-950/40 to-red-900/20 border border-red-700/50 rounded-lg p-4 m-2 overflow-auto"
          style={{ background: '#1a0f0f' }}
        >
          <div className="flex flex-col gap-3 max-w-md">
            {/* Error Header */}
            <div className="flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <span className="font-semibold text-red-300">
                Error in {this.props.componentName || 'Component'}
              </span>
            </div>

            {/* Error Message */}
            <div className="bg-red-900/20 border border-red-700/30 rounded p-2 font-mono text-sm text-red-200 break-words">
              {this.state.error?.message || 'An unknown error occurred'}
            </div>

            {/* Stack Trace (if available) */}
            {this.state.errorInfo && (
              <details className="text-xs text-red-300/70">
                <summary className="cursor-pointer hover:text-red-300 transition-colors">
                  Show stack trace
                </summary>
                <pre className="mt-2 p-2 bg-red-900/10 rounded overflow-auto max-h-40 text-red-300/60">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-2 bg-red-800 hover:bg-red-700 text-red-200 rounded text-sm font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-red-300/60 text-center">
              If this error persists, please check the browser console for details
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
