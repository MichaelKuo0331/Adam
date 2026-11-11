import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import { useMembership } from '../../context/membership'
import { useReferrer } from '../../context/referrer'
import { sendUserBehaviorLog } from '../../utils/log/send-log'
import { generateUserBehaviorLogInfo } from '../../utils/log/user-behavior-log'
/**
 * Component for recording and sending user-behavior-log to Google Cloud Logging.
 * This component do two things:
 * 1. Create information of user behavior log by using utils function `generateUserBehaviorLogInfo`:
 * 2. Add three `useEffect` hook, each hook represents certain type of event we want to send:.
 *    1. pageview event:
 *        - Send log when page is initialized.
 *        - Currently we detect pathname of router is changed, if changed, then send log.
 *        - In old website (mirror-media-nuxt), we send log at vue-router life-cycle `beforeEach`, but in Nextjs, we haven't found similar method.
 *    2. exit event:
 *        - Send log when page is closed or navigate to another page.
 *        - We add two event listener: `beforeunload` event in window, and `beforeHistoryChangeEvent` in next/router.
 *        - The former event listener is for page closed and navigated by `<a>`, the latter is for navigated by `next/link` or 'next/router'
 *        - To prevent two event listener trigger simultaneously, we add condition that if `beforeunload` is triggered, `beforeHistoryChangeEvent` would not triggered.
 *    3. click event:
 *        - Send log when user clicking.
 *        - We register `click` event in window.
 * 3. This component is currently used at `_app.js` and story page.
 *    - The reason why need to add at story page is that we need story-page-only data `isMemberArticle` to generate log info.
 * 4. Why we create logger as a component, not just a custom hook?
 *    - Because if we write as a custom hook and use it at `_app.js`, we are unable to use membership info to generate log info.
 *    - However, only `_app.js` is guaranteed to be used at every page, so it is risk to use custom hook at other component.
 *    - To ensure every page could achieve membership info and send log, we decide to write it as components, and import it into `_app.js`.
 *
 *
 * @param {Object} props
 * @param {boolean} [props.isMemberArticle = false] Whether is a member-only article. Optional, value only existed when this components used at story-page.
 * @param {string} [props.writers] - used only in story page
 */
export default function UserBehaviorLogger({
  isMemberArticle = false,
  writers,
}) {
  //Since `usePathname()` is recommend to use at Next.js 13 App route, we use `useRouter` to get pathname instead to prevent unexpected error.
  const router = useRouter()
  // Query and hash changes (utm params, in-page anchors) aren't a new pageview.
  // Only updated by non-shallow navigations to a different path; the pageview
  // effect below depends on it, so a change here sends the next pageview.
  // Shallow pushes (search keyword changes) stay on the same pageview.
  const [pagePath, setPagePath] = useState(() => router.asPath.split(/[?#]/)[0])
  const getReferrer = useReferrer()

  const {
    isLogInProcessFinished,
    memberInfo: { memberType },
    userEmail,
    firebaseId,
  } = useMembership()

  const userBehaviorLogInfoPayload = useMemo(() => {
    return {
      memberType,
      userEmail,
      firebaseId,
      isMemberArticle,
      writers,
    }
  }, [memberType, userEmail, firebaseId, isMemberArticle, writers])

  //pageview event
  useEffect(() => {
    /** @param {string} url @param {{ shallow: boolean }} options */
    const handleRouteChangeComplete = (url, { shallow }) => {
      if (shallow) return
      setPagePath(url.split(/[?#]/)[0])
    }
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
    }
  }, [router.events])

  useEffect(() => {
    if (!isLogInProcessFinished) {
      return
    }

    const info = generateUserBehaviorLogInfo('pageview', {
      ...userBehaviorLogInfoPayload,
      referrer: getReferrer(),
    })
    sendUserBehaviorLog(info)
  }, [
    isLogInProcessFinished,
    userBehaviorLogInfoPayload,
    pagePath,
    getReferrer,
  ])

  //exit event
  useEffect(() => {
    let ignore = false
    let hasBeforeUnloadEventTriggered = false

    if (!isLogInProcessFinished) {
      return
    }
    const info = generateUserBehaviorLogInfo('exit', {
      ...userBehaviorLogInfoPayload,
      referrer: getReferrer(),
    })

    const beforeUnloadEvent = () => {
      if (ignore) {
        return
      }
      hasBeforeUnloadEventTriggered = true
      sendUserBehaviorLog(info)
    }
    /** @param {string} _url @param {{ shallow: boolean }} options */
    const beforeHistoryChangeEvent = (_url, { shallow }) => {
      if (ignore || hasBeforeUnloadEventTriggered || shallow) {
        return
      }
      sendUserBehaviorLog(info)
    }
    window.addEventListener('beforeunload', beforeUnloadEvent)
    router.events.on('beforeHistoryChange', beforeHistoryChangeEvent)
    return () => {
      ignore = true
      window.removeEventListener('beforeunload', beforeUnloadEvent)
      router.events.off('beforeHistoryChange', beforeHistoryChangeEvent)
    }
  }, [router, isLogInProcessFinished, userBehaviorLogInfoPayload, getReferrer])

  //click event
  useEffect(() => {
    let ignore = false
    if (!isLogInProcessFinished) {
      return
    }
    const clickEvent = () => {
      if (ignore) {
        return
      }
      const info = generateUserBehaviorLogInfo('click', {
        ...userBehaviorLogInfoPayload,
        referrer: getReferrer(),
      })
      sendUserBehaviorLog(info)
    }
    window.addEventListener('click', clickEvent)
    return () => {
      ignore = true
      window.removeEventListener('click', clickEvent)
    }
  }, [isLogInProcessFinished, userBehaviorLogInfoPayload, getReferrer])

  return null
}
