import { useEffect } from 'react'
import { FirebaseError } from 'firebase/app'
import { getAdditionalUserInfo, getRedirectResult } from 'firebase/auth'
import styled from 'styled-components'

import LoginFailed from '../../components/login/login-failed'
import MainForm from '../../components/login/main-form'
import RegistrationFailed from '../../components/login/registration-failed'
import RegistrationSuccess from '../../components/login/registration-success'
import WebviewHint from '../../components/login/webview-hint'
import LayoutFull from '../../components/shared/layout-full'
import { FirebaseAuthError } from '../../constants/firebase'
import { useMembership } from '../../context/membership'
import { auth } from '../../firebase'
import useRedirect from '../../hooks/use-redirect'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { FormState, loginActions, loginState } from '../../slice/login-slice'
import { getLogTraceObject } from '../../utils'
import { fetchHeaderDataInDefaultPageLayout } from '../../utils/api'
import { setPageCache } from '../../utils/cache-setting'
import { getSectionAndTopicFromDefaultHeaderData } from '../../utils/data-process'
import { isInAppBrowser } from '../../utils/login'
import {
  errorHandler,
  loginPageOnAuthStateChangeAction,
} from '../../utils/membership'
import { processSettledResult } from '../../utils/response-processor'
import redirectToDestinationWhileAuthed from '../../utils/server-side-only/redirect-to-destination-while-authed'

const Container = styled.div`
  flex-grow: 1;

  background-color: #fff;
  ${({ theme }) => theme.breakpoint.md} {
    background-color: #f2f2f2;
  }
`

/**
 * @typedef {Object} PageProps
 * @property {boolean} isWebview
 * @property {Object} headerData
 * @property {import('../../utils/api').HeadersData} headerData.sectionsData
 * @property {import('../../utils/api').Topics} headerData.topicsData
 */

/**
 * @param {PageProps} props
 */
export default function Login({ headerData, isWebview }) {
  const dispatch = useAppDispatch()
  const { accessToken, isLogInProcessFinished, userEmail } = useMembership()
  const loginFormState = useAppSelector(loginState)
  const { redirect } = useRedirect()

  useEffect(() => {
    if (!isLogInProcessFinished || isWebview) {
      return
    }

    const handleFederatedRedirectResult = async () => {
      try {
        const redirectResult = await getRedirectResult(auth)
        if (redirectResult && redirectResult?.user) {
          const firebaseAuthUser = redirectResult.user
          const isNewUser = getAdditionalUserInfo(redirectResult).isNewUser
          await loginPageOnAuthStateChangeAction(
            firebaseAuthUser,
            isNewUser,
            accessToken
          )
          redirect()
        }
      } catch (e) {
        if (
          e instanceof FirebaseError &&
          e.code === FirebaseAuthError.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL
        ) {
          dispatch(loginActions.goToStart())
          dispatch(
            loginActions.changeShouldShowHintOfExitenceOfDifferentAuthMethod(
              true
            )
          )
        } else {
          errorHandler(e, { userEmail })
          dispatch(loginActions.changeState(FormState.LoginFail))
        }
      } finally {
        dispatch(loginActions.changeIsFederatedRedirectResultLoading(false))
      }
    }

    handleFederatedRedirectResult()
  }, [
    isLogInProcessFinished,
    accessToken,
    redirect,
    dispatch,
    userEmail,
    isWebview,
  ])

  const getBodyByState = () => {
    switch (loginFormState) {
      case FormState.Form:
        return <MainForm />
      case FormState.RegisterSuccess:
        return <RegistrationSuccess />
      case FormState.LoginSuccess:
        return <>登入成功</>
      case FormState.RegisterFail:
        return <RegistrationFailed />
      case FormState.LoginFail:
        return <LoginFailed />
      default:
        return null
    }
  }

  const jsx = getBodyByState()

  return (
    <LayoutFull
      head={{ robotsMetaContent: 'noindex, nofollow', skipCanonical: true }}
      header={{ type: 'default', data: headerData }}
    >
      <Container>{isWebview ? <WebviewHint /> : jsx}</Container>
    </LayoutFull>
  )
}

/**
 * @type {import('next').GetServerSideProps<PageProps>}
 */
export const getServerSideProps = redirectToDestinationWhileAuthed()(async ({
  req,
  res,
}) => {
  setPageCache(res, { cachePolicy: 'no-store' }, req.url)

  const globalLogFields = getLogTraceObject(req)

  const responses = await Promise.allSettled([
    fetchHeaderDataInDefaultPageLayout(),
  ])

  // handle header data
  const [sectionsData, topicsData, flashNewsData] = processSettledResult(
    responses[0],
    getSectionAndTopicFromDefaultHeaderData,
    'Error occurs while getting header data in login page',
    globalLogFields
  )

  const userAgent = req.headers?.['user-agent']

  return {
    props: {
      isWebview: isInAppBrowser(userAgent),
      headerData: { flashNewsData, sectionsData, topicsData },
    },
  }
})
