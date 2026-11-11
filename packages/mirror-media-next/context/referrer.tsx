import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { useRouter } from 'next/router'

type GetReferrer = () => string

const ReferrerContext = createContext<GetReferrer>(() => document.referrer)

/**
 * Provides the URL of the page the user came from, for logs.
 *
 * The browser only sets `document.referrer` on a full page load, so after a
 * client-side navigation it still points at whatever site the user entered
 * from. This provider records the previous page itself.
 *
 * Mount it in `_app`: the refs must outlive page remounts.
 */
function ReferrerProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  // URL of the page currently shown.
  const currentUrlRef = useRef('')
  // URL of the page before it. Undefined until the first client-side navigation.
  const referrerRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    // The page from the full page load.
    currentUrlRef.current = window.location.href

    // Runs before the next page renders, so that page's log effects already
    // read the updated referrer.
    // Read `currentUrlRef`, not `window.location.href`: on back/forward the
    // browser changes the URL before this fires, so `location` would already
    // be the destination page.
    const handleBeforeHistoryChange = (
      _url: string,
      { shallow }: { shallow: boolean }
    ) => {
      if (shallow) return
      referrerRef.current = currentUrlRef.current
    }
    // Record the page we just arrived on, for the next navigation.
    const handleRouteChangeComplete = () => {
      currentUrlRef.current = window.location.href
    }
    router.events.on('beforeHistoryChange', handleBeforeHistoryChange)
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    return () => {
      router.events.off('beforeHistoryChange', handleBeforeHistoryChange)
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
    }
  }, [router.events])

  // Before any client-side navigation, `document.referrer` is still correct
  // (it belongs to the full page load). Read at call time from the ref, so the
  // function never changes and the context never re-renders its consumers.
  const getReferrer = useCallback(
    () => referrerRef.current ?? document.referrer,
    []
  )

  return (
    <ReferrerContext.Provider value={getReferrer}>
      {children}
    </ReferrerContext.Provider>
  )
}

function useReferrer(): GetReferrer {
  return useContext(ReferrerContext)
}

// `ReferrerContext` is for class components (`static contextType`); others use `useReferrer`.
export { ReferrerContext, ReferrerProvider, useReferrer }
