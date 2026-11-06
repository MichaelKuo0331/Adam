import '../styles/tailwind.css'

import React, { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { useAmp } from 'next/amp'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { ApolloProvider } from '@apollo/client'
import isPropValid from '@emotion/is-prop-valid'
import { GoogleTagManager } from '@next/third-parties/google'
import { StyleSheetManager, ThemeProvider } from 'styled-components'

import client from '../apollo/apollo-client'
import { CarouselTickerProvider } from '../components/common/carousel-ticker'
import ErrorBoundary from '../components/shared/error-boundary'
import ErrorPage from '../components/shared/error-page'
import UserBehaviorLogger from '../components/shared/user-behavior-logger'
import WholeSiteScript from '../components/whole-site-script'
import { GTM_AUTH, GTM_ID, GTM_PREVIEW } from '../config/index.mjs'
import { MembershipProvider } from '../context/membership'
import { ReferrerProvider } from '../context/referrer'
import store from '../store'
import { AmpGlobalStyles, GlobalStyles } from '../styles/global-styles'
import { theme } from '../styles/theme'
import {
  compactDataLayer,
  resolvePageDataLayer,
} from '../utils/gtm/build-data-layer'
import { pushDataLayer } from '../utils/gtm/push-data-layer'
import { rememberStoryListFromEvent } from '../utils/gtm/story-list'

const PromoteTopic = dynamic(() => import('../components/promote-topic'), {
  ssr: false,
})

// styled-components v6 forwards every prop to the DOM (v5 filtered automatically),
// leaking style-only props and triggering React "unknown prop" warnings. Restore v5
// filtering globally during the v6 migration, until components move to transient ($) props.
const shouldForwardProp = (propName, target) =>
  typeof target === 'string' ? isPropValid(propName) : true

const styleSheetManagerProps = {
  shouldForwardProp,
  // Preserve v5 automatic vendor prefixing until browser support policy is revised.
  enableVendorPrefixes: true,
}

/**
 *
 * @param {Object} props
 * @param {React.ElementType} props.Component
 * @param {Object} props.pageProps
 * @param {import('../types/dataLayer').DataLayerPayload} [props.pageProps.dataLayer]
 * @returns {React.ReactElement}
 */
function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const { pathname } = router
  const isStoryPage = pathname.startsWith('/story/')
  const isServerErrorPage = pathname === '/500'

  // Skip this client-only dynamic widget on AMP pages because Next.js may emit
  // React fallback markers (e.g. `<template data-dgst="DYNAMIC_SERVER_USAGE">`)
  // that AMP treats as invalid `<template>` tags.
  const isAmpPage = useAmp()
  // Frozen on the first render: GoogleTagManager inlines this into the same
  // script as `gtm.start`, which only runs once per full page load. First load
  // and CSR navigations also send `mm_page_view` via pushDataLayer below.
  const initialDataLayer = compactDataLayer(
    resolvePageDataLayer(router.pathname, router.asPath, pageProps.dataLayer)
  )
  const ssrDataLayerRef = useRef(
    Object.keys(initialDataLayer).length > 0 ? initialDataLayer : undefined
  )

  useEffect(() => {
    if (isAmpPage) {
      return
    }

    pushDataLayer(
      resolvePageDataLayer(router.pathname, router.asPath, pageProps.dataLayer)
    )
  }, [isAmpPage, pageProps.dataLayer, router.asPath, router.pathname])

  useEffect(() => {
    if (isAmpPage) {
      return
    }

    document.addEventListener('click', rememberStoryListFromEvent)
    document.addEventListener('auxclick', rememberStoryListFromEvent)
    return () => {
      document.removeEventListener('click', rememberStoryListFromEvent)
      document.removeEventListener('auxclick', rememberStoryListFromEvent)
    }
  }, [isAmpPage])

  // The service worker is bundled into public/sw.js by the `build:sw` script
  // (esbuild) and registered manually here, replacing the auto-registration
  // that the removed next-pwa dependency used to inject at build time.
  // Skipped outside production to keep next-pwa's old semantics: `pnpm dev`
  // does not generate sw.js, and an active worker would interfere with
  // local development.
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return
    }

    const swUrl = `${router.basePath || ''}/sw.js`
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error('Failed to register service worker.', error)
    })
  }, [router.basePath])

  return (
    <>
      {!isAmpPage && (
        <GoogleTagManager
          gtmId={GTM_ID}
          auth={GTM_AUTH || undefined}
          preview={GTM_PREVIEW || undefined}
          dataLayer={ssrDataLayerRef.current}
        />
      )}
      {isAmpPage ? <AmpGlobalStyles /> : <GlobalStyles />}
      <ReferrerProvider>
        <MembershipProvider>
          <ApolloProvider client={client}>
            <Provider store={store}>
              <StyleSheetManager {...styleSheetManagerProps}>
                <ThemeProvider theme={theme}>
                  <CarouselTickerProvider>
                    {/* some script may need member type to decide render or not,
             make sure the WholeSiteScript component is placed inside contextProvider or other provider  */}
                    <WholeSiteScript />
                    {/* Since user behavior log need member info, make sure the
              UserBehaviorLogger component is placed inside contextProvider or
              other provider */}
                    {/* Story page has its own UserBehaviorLogger.
              In order to avoiding send log repeatedly, make sure not add UserBehaviorLogger components here when at story page. */}
                    {!isStoryPage && <UserBehaviorLogger />}
                    {/* Catches errors thrown while rendering the page on the client,
                      which would otherwise surface as a blank "Application error"
                      page. */}
                    <ErrorBoundary
                      boundary="mainpage"
                      resetKey={router.asPath}
                      fallback={
                        <ErrorPage
                          message="oops 發生了一些問題"
                          showRetry
                          showGoHome
                        />
                      }
                    >
                      {/* Remount on path change so same-route navigations (story → story)
                        don't keep the previous page's state, ad slots, or effects.
                        Search is excluded: it shallow-pushes `/search/[keyword]`, which
                        keeps the old pageProps, so a remount would re-query the old term. */}
                      <Component
                        key={
                          router.pathname === '/search/[keyword]'
                            ? undefined
                            : router.asPath.split(/[?#]/)[0]
                        }
                        {...pageProps}
                      />
                    </ErrorBoundary>
                    {/* Sits outside the page boundary above, so this is the only
                      thing catching it: without it, a failure in this secondary
                      widget would take down the whole app. No fallback props, so it just
                      disappears. */}
                    {!isAmpPage && !isServerErrorPage && (
                      <ErrorBoundary boundary="promote-topic">
                        <PromoteTopic />
                      </ErrorBoundary>
                    )}
                  </CarouselTickerProvider>
                </ThemeProvider>
              </StyleSheetManager>
            </Provider>
          </ApolloProvider>
        </MembershipProvider>
      </ReferrerProvider>
    </>
  )
}

export default MyApp
