import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

type StickyMetrics = { height: number; offset: number }

type StickyHeaderContextValue = {
  showStickyControls: boolean
  // Height of the rows that stay fixed at the top once the header collapses.
  stickyHeight: number
  // Scroll position at which the header collapses.
  stickyOffset: number
}

const StickyHeaderContext = createContext<StickyHeaderContextValue>({
  showStickyControls: false,
  stickyHeight: 0,
  stickyOffset: 0,
})

const StickyHeaderDispatchContext = createContext<
  Dispatch<SetStateAction<StickyMetrics>>
>(() => {})

function StickyHeaderProvider({ children }: { children: ReactNode }) {
  const [showStickyControls, setShowStickyControls] = useState(false)
  const [stickyMetrics, setStickyMetrics] = useState<StickyMetrics>({
    height: 0,
    offset: 0,
  })

  useEffect(() => {
    function updateStickyState() {
      setShowStickyControls(window.scrollY >= stickyMetrics.offset)
    }

    updateStickyState()
    window.addEventListener('scroll', updateStickyState, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateStickyState)
    }
  }, [stickyMetrics.offset])

  return (
    <StickyHeaderDispatchContext.Provider value={setStickyMetrics}>
      <StickyHeaderContext.Provider
        value={{
          showStickyControls,
          stickyHeight: stickyMetrics.height,
          stickyOffset: stickyMetrics.offset,
        }}
      >
        {children}
      </StickyHeaderContext.Provider>
    </StickyHeaderDispatchContext.Provider>
  )
}

function useStickyHeader() {
  return useContext(StickyHeaderContext)
}

function useSetStickyLayout() {
  return useContext(StickyHeaderDispatchContext)
}

export { StickyHeaderProvider, useSetStickyLayout, useStickyHeader }
