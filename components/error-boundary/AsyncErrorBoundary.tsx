'use client'

import React, { Component, ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  asyncError: Error | null
}

/**
 * Enhanced Error Boundary that catches async errors
 * Wraps the standard ErrorBoundary with async error handling
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { asyncError: null }
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'unhandledrejection',
        this.handleUnhandledRejection
      )
      window.addEventListener('error', this.handleGlobalError)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'unhandledrejection',
        this.handleUnhandledRejection
      )
      window.removeEventListener('error', this.handleGlobalError)
    }
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason)

    // Convert promise rejection to error
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))

    this.setState({ asyncError: error })

    // Prevent the default browser behavior
    event.preventDefault()
  }

  private handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error)
    this.setState({ asyncError: event.error })
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { asyncError: error }
  }

  componentDidCatch(error: Error) {
    this.setState({ asyncError: error })
  }

  render() {
    if (this.state.asyncError) {
      // Throw the error so the ErrorBoundary can catch it
      throw this.state.asyncError
    }

    return (
      <ErrorBoundary fallback={this.props.fallback}>
        {this.props.children}
      </ErrorBoundary>
    )
  }
}
