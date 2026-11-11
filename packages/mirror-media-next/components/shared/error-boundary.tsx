import {
  Component,
  type ContextType,
  type ErrorInfo,
  type ReactNode,
} from 'react'

import { ReferrerContext } from '../../context/referrer'
import { generateErrorReportInfo } from '../../utils/log/error-log'
import { sendErrorLog } from '../../utils/log/send-log'

type ErrorBoundaryProps = {
  children: ReactNode
  // Which boundary caught the error, sent as a top-level log field so reports can be filtered by source.
  boundary: string
  fallback?: ReactNode
  // Clears the error whenever this changes. Only needed at the app level (see
  // `pages/_app.js`): a client-side navigation swaps the page underneath without
  // unmounting the boundary, so the error state survives onto a route that is
  // perfectly fine. A boundary mounted inside a page unmounts along with it and
  // can omit this.
  resetKey?: string
}

type ErrorBoundaryState = {
  hasError: boolean
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static contextType = ReferrerContext
  declare context: ContextType<typeof ReferrerContext>

  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  // Only on an actual `resetKey` change. Resetting unconditionally here would
  // re-render the children while the cause is still present, throw again, and loop.
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    try {
      const errorLog = generateErrorReportInfo(error, {
        referrer: this.context(),
      })
      sendErrorLog({
        ...errorLog,
        boundary: this.props.boundary,
        componentStack: errorInfo.componentStack,
      })
      // eslint-disable-next-line no-empty
    } catch {}
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null

    return this.props.children
  }
}
