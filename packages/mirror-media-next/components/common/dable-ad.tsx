import { useEffect, useEffectEvent } from 'react'
import Script from 'next/script'

import { DABLE_WIDGET_IDS } from '@/constants/ads'
import useMediaQuery from '@/hooks/use-media-query'
import { minWidth } from '@/styles/media'

type DableAdProps = {
  // programmatically set for desktop or not
  breakpoint: keyof typeof minWidth
  className?: string
}

export default function DableAd({ breakpoint, className }: DableAdProps) {
  const { isMediaQueryResolved, matches: isDesktopWidth } = useMediaQuery(
    minWidth[breakpoint]
  )
  const widgetId = isDesktopWidth ? DABLE_WIDGET_IDS.PC : DABLE_WIDGET_IDS.MB

  // next/script runs the inline script below only once per session, so after a
  // client-side navigation the remounted widget would stay empty and unlogged.
  // On first load `window.dable` doesn't exist yet (lazyOnload) and the inline
  // script handles both.
  const renderWidget = useEffectEvent(() => {
    window.dable?.('sendLog')
    window.dable?.('renderWidget', `dablewidget_${widgetId}`)
  })

  // Once per mount, when the breakpoint is known. Crossing the breakpoint later
  // keeps the widget already rendered.
  useEffect(() => {
    if (!isMediaQueryResolved) return
    renderWidget()
  }, [isMediaQueryResolved])

  return (
    <>
      <Script
        async
        strategy="lazyOnload"
        id="dable"
        dangerouslySetInnerHTML={{
          __html: `
            (function (d, a, b, l, e, _) {
              if (d[b] && d[b].q) return
              d[b] = function () {
                ;(d[b].q = d[b].q || []).push(arguments)
              }
              e = a.createElement(l)
              e.async = 1
              e.charset = 'utf-8'
              e.src = '//static.dable.io/dist/plugin.min.js'
              _ = a.getElementsByTagName(l)[0]
              _.parentNode.insertBefore(e, _)
            })(window, document, 'dable', 'script')
            dable('setService', 'mirrormedia.mg')
            dable('sendLogOnce')
            dable('renderWidget', 'dablewidget_${DABLE_WIDGET_IDS.MB}')
            dable('renderWidget', 'dablewidget_${DABLE_WIDGET_IDS.PC}')
          `,
        }}
      />
      <div
        id={`dablewidget_${widgetId}`}
        className={className}
        data-widget_id={widgetId}
      ></div>
    </>
  )
}
