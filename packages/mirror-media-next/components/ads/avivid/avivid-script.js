import { useEffect } from 'react'
import Script from 'next/script'

// Delay AviviD visibility until its injected content has a stable size to reduce CLS from third-party DOM insertion.
const AVIVID_READY_ATTRIBUTE = 'data-mm-avivid-ready'
const AVIVID_TARGET_CLASS = 'avivid_onpage_mobile_bottom'
const AVIVID_CONTENT_CLASS = 'avivid_onpage_content_wrapper'
const AVIVID_STABLE_DELAY = 180

export default function AvividScript() {
  useEffect(() => {
    // Find all script tags and check whether src contains the unsafe URL.
    // 找出所有 script 標籤，並檢查 src 是否包含不安全的網址
    // Remove the known unsafe AviviD script if it was injected.
    const scripts = document.querySelectorAll('script')
    scripts.forEach((script) => {
      if (script.src.includes('aws-sdk-AviviD-min-1')) {
        console.warn('Blocking unsafe script:', script.src)
        script.remove()
      }
    })

    // Use a document-level observer to catch late third-party insertion, then attach a per-banner observer until the content wrapper stops changing size briefly.
    // This keeps the banner hidden until its size is more stable, reducing the chance of showing it midway through a third-party resize sequence.
    // Track per-node observers and timers so we can stop them as soon as a banner is ready or the page unmounts.
    const nodeObservers = new WeakMap()
    const nodeReadyTimers = new WeakMap()
    const activeObservers = new Set()
    const activeTimerIds = new Set()

    // Read the current banner content size and round it so small sub-pixel changes do not keep the banner hidden forever.
    const getAvividContentSize = (node) => {
      const content = node.querySelector(`.${AVIVID_CONTENT_CLASS}`)
      if (!content) return null

      const { height, width } = content.getBoundingClientRect()
      if (height <= 0 || width <= 0) return null

      return {
        height: Math.round(height),
        width: Math.round(width),
      }
    }

    // Clear any pending stability timer before scheduling a new one for the same banner.
    const clearReadyTimer = (node) => {
      const timerId = nodeReadyTimers.get(node)
      if (timerId) {
        clearTimeout(timerId)
        activeTimerIds.delete(timerId)
        nodeReadyTimers.delete(node)
      }
    }

    // Mark the banner as ready once we decide its size is stable, then stop observing that node.
    const markAvividReady = (node) => {
      if (node.getAttribute(AVIVID_READY_ATTRIBUTE) === 'true') {
        return
      }

      clearReadyTimer(node)
      node.setAttribute(AVIVID_READY_ATTRIBUTE, 'true')

      const observer = nodeObservers.get(node)
      if (observer) {
        observer.disconnect()
        activeObservers.delete(observer)
        nodeObservers.delete(node)
      }
    }

    // Re-check the banner after a short delay; only reveal it when two consecutive measurements match.
    const scheduleReadyCheck = (node) => {
      const snapshot = getAvividContentSize(node)
      if (!snapshot) return

      clearReadyTimer(node)

      const timerId = window.setTimeout(() => {
        activeTimerIds.delete(timerId)
        nodeReadyTimers.delete(node)

        if (!node.isConnected) return
        const currentSize = getAvividContentSize(node)
        if (!currentSize) return

        if (
          currentSize.height === snapshot.height &&
          currentSize.width === snapshot.width
        ) {
          markAvividReady(node)
          return
        }

        scheduleReadyCheck(node)
      }, AVIVID_STABLE_DELAY)

      nodeReadyTimers.set(node, timerId)
      activeTimerIds.add(timerId)
    }

    const observeAvividNode = (node) => {
      if (!(node instanceof HTMLElement)) return
      if (!node.classList.contains(AVIVID_TARGET_CLASS)) return
      if (nodeObservers.has(node)) return

      // Start a stability check if the content already exists, but avoid revealing it until the size stops changing for a short window.
      if (getAvividContentSize(node)) {
        scheduleReadyCheck(node)
        return
      }

      // Watch third-party mutations because AviviD builds the banner incrementally after GTM executes.
      const innerObserver = new MutationObserver(() => {
        if (node.getAttribute(AVIVID_READY_ATTRIBUTE) === 'true') {
          return
        }

        if (getAvividContentSize(node)) {
          scheduleReadyCheck(node)
        }
      })

      innerObserver.observe(node, {
        childList: true,
        subtree: true,
        attributes: true,
      })
      nodeObservers.set(node, innerObserver)
      activeObservers.add(innerObserver)
    }

    // Catch banners that may already exist before the observer starts.
    document
      .querySelectorAll(`.${AVIVID_TARGET_CLASS}`)
      .forEach((node) => observeAvividNode(node))

    const rootObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          if (!(addedNode instanceof HTMLElement)) return

          observeAvividNode(addedNode)
          addedNode
            .querySelectorAll(`.${AVIVID_TARGET_CLASS}`)
            .forEach((node) => observeAvividNode(node))
        })
      })
    })

    rootObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      rootObserver.disconnect()
      activeObservers.forEach((observer) => observer.disconnect())
      activeTimerIds.forEach((timerId) => clearTimeout(timerId))
    }
  }, [])

  // This AviviD/Likr bootstrap (all environments) triggers a web-push flow
  // that registers /firebase-messaging-sw.js (scope
  // /firebase-cloud-messaging-ns-scope). That worker file is served by prod
  // infrastructure outside this repo, so non-prod environments log a 404
  // ServiceWorker registration error in clean browser sessions. Pre-existing,
  // vendor-handled noise — do not "fix" it with a stub public/ file, which
  // could silently replace the real prod push worker at the same URL.
  return (
    <Script
      async
      strategy="lazyOnload"
      id="likrNotification"
      dangerouslySetInnerHTML={{
        __html: `window.AviviD = window.AviviD || {settings:{},status:{}}; AviviD.web_id = "mirrormedia"; AviviD.category_id = "20180905000003"; AviviD.tracking_platform = 'likr'; (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl+'&timestamp='+new Date().getTime();f.parentNode.insertBefore(j,f); })(window,document,'script','dataLayer','GTM-W9F4QDN'); (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl+'&timestamp='+new Date().getTime();f.parentNode.insertBefore(j,f); })(window,document,'script','dataLayer','GTM-MKB8VFG');`,
      }}
    />
  )
}
