import React, { ErrorInfo } from 'react'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { logger } from 'src/utils/logger'

interface ErrorBoundaryState {
  error: Error | null
}

// Uncaught errors during renders of subclasses will be caught here
// Errors in handlers (e.g. press handler) will not reach here
export class ErrorBoundary extends React.Component<unknown, ErrorBoundaryState> {
  constructor(props: unknown) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO analytics here
    logger.error('ErrorBoundary', 'componentDidCatch', 'Error caught by boundary', error, errorInfo)
  }

  render() {
    const { error } = this.state
    if (error !== null) {
      return (
        <Box alignItems="center" flex={1} justifyContent="center">
          <Text variant="headlineLarge">An Error Occurred</Text>
          {error.message && (
            <Text mt="xl" variant="headlineSmall">
              {error.message}
            </Text>
          )}
        </Box>
      )
    }
    return this.props.children
  }
}
