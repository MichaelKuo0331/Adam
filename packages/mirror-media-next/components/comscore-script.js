import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Script from 'next/script'

import { useReferrer } from '../context/referrer'

/**
 * Component for implement comScore script.
 * There are two different script, one for amp type page, one for other.
 * See amp Docs to get more info about comScore amp page script: https://direct-support.comscore.com/hc/en-us/article_attachments/360058526434
 *
 */
export default function ComScoreScript() {
  const router = useRouter()
  const { pathname } = router
  const getReferrer = useReferrer()
  const isAmpStoryPage =
    pathname.startsWith('/story/amp/') || pathname.startsWith('/external/amp/')

  // Sends the first pageview on mount and a virtual pageview on each client-side
  // navigation (comScore SPA guide). Shallow pushes (search keyword changes) are
  // not counted.
  useEffect(() => {
    if (isAmpStoryPage) return

    const sendPageview = () => {
      const pageview = {
        c1: '2',
        c2: '24318560',
        c4: window.location.href,
        c7: window.location.href,
        c8: document.title,
        c9: getReferrer(),
        // The SDK would read URL, title and referrer when it processes the
        // pageview, which for a queued one is after the user has moved on.
        // Capture them now instead. Must be booleans.
        options: {
          enableFirstPartyCookie: true,
          enableDocumentUrlCollection: false,
          enableDocumentTitleCollection: false,
          enableDocumentReferrerCollection: false,
        },
      }
      if (window.COMSCORE) {
        window.COMSCORE.beacon(pageview)
      } else {
        // beacon.js (lazyOnload) replays this queue once when it loads.
        ;(window._comscore = window._comscore || []).push(pageview)
      }
    }

    sendPageview()

    /** @param {string} _url @param {{ shallow: boolean }} options */
    const handleRouteChangeComplete = (_url, { shallow }) => {
      if (shallow) return
      sendPageview()
    }

    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
    }
  }, [isAmpStoryPage, router.events, getReferrer])

  if (isAmpStoryPage) {
    return (
      <>
        <Head>
          <script
            async
            // eslint-disable-next-line react/no-unknown-property
            custom-element="amp-analytics"
            src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"
          ></script>
        </Head>

        {/* @ts-ignore */}
        <amp-analytics type="comscore">
          <script
            type="application/json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                vars: {
                  c2: '24318560',
                },
                extraUrlParams: {
                  comscorekw: 'amp',
                },
              }),
            }}
          ></script>
          {/* @ts-ignore */}
        </amp-analytics>
      </>
    )
  }

  return (
    <>
      <Script
        id="comScore"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            var _comscore = _comscore || [];
            (function() {
              var s = document.createElement("script"), el = document.getElementsByTagName("script")[0]; s.async = true;
              s.src = "https://sb.scorecardresearch.com/cs/24318560/beacon.js";
              el.parentNode.insertBefore(s, el);
            })();
          `,
        }}
      />
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img src="https://sb.scorecardresearch.com/p?c1=2&amp;c2=24318560&amp;cv=3.9.1&amp;cj=1">`,
        }}
      />
    </>
  )
}
