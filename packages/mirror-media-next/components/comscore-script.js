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

  // The inline script below only counts the first page load. Client-side
  // navigations need a virtual pageview via COMSCORE.beacon (comScore SPA guide).
  // Shallow pushes (search keyword changes) are not counted.
  useEffect(() => {
    if (isAmpStoryPage) return

    /** @param {string} _url @param {{ shallow: boolean }} options */
    const handleRouteChangeComplete = (_url, { shallow }) => {
      if (shallow) return
      window.COMSCORE?.beacon({
        c1: '2',
        c2: '24318560',
        c4: window.location.href,
        c9: getReferrer(),
        // Otherwise the SDK appends its own c9 from document.referrer, which
        // is stale after a client-side navigation. Must be a boolean.
        options: {
          enableFirstPartyCookie: 'true',
          enableDocumentReferrerCollection: false,
        },
      })
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
            _comscore.push({ c1: "2", c2: "24318560" ,  options: { enableFirstPartyCookie: "true" } });
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
