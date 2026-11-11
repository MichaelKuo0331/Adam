import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword } from 'firebase/auth'
import styled from 'styled-components'

import { FirebaseAuthError } from '../../constants/firebase'
import { InputState } from '../../constants/form'
import { useReferrer } from '../../context/referrer'
import { auth } from '../../firebase'
import useRedirect from '../../hooks/use-redirect'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { isValidLoginPassword } from '../../modules/authentication/password-policy'
import {
  FormState,
  loginActions,
  loginEmail,
  loginIsFederatedRedirectResultLoading,
  loginPassword,
} from '../../slice/login-slice'
import { isCompanyEmail, isValidEmail } from '../../utils'
import { generateErrorReportInfo } from '../../utils/log/error-log'
import { sendErrorLog } from '../../utils/log/send-log'
import {
  errorHandler,
  getAccessToken,
  loginPageOnAuthStateChangeAction,
} from '../../utils/membership'
import PrimaryButton from '../shared/buttons/primary-button'
import GenericPasswordInput from '../shared/inputs/generic-password-input'

import EmailInput from './email-input'

/** @type {Set<string>} */
const EMAIL_PASSWORD_CREDENTIAL_ERROR_CODES = new Set([
  FirebaseAuthError.USER_NOT_FOUND,
  FirebaseAuthError.WRONG_PASSWORD,
  FirebaseAuthError.INVALID_LOGIN_CREDENTIALS,
  FirebaseAuthError.INVALID_CREDENTIAL,
])

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;

  > div {
    display: grid;
    grid-template-rows: 48px minmax(40px, auto);
    row-gap: 0;

    > p {
      align-self: center;
      margin: 0;
      padding: 8px 0;
    }
  }
`

// Sits in the password hint row (40px), right-aligned beside any error hint
const ForgotPasswordLink = styled(Link)`
  display: flex;
  align-items: center;
  align-self: flex-end;
  height: 40px;
  margin-top: -40px;
  color: #1d9fb8;
  font-size: 14px;
  line-height: 150%;

  &:hover,
  &:active {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 12px;
  margin-bottom: 16px;
`

/**
 * @param {Object} [props]
 * @param {(pending: boolean) => void} [props.onSubmittingChange]
 */
export default function MainFormLoginWithPassword({ onSubmittingChange } = {}) {
  const dispatch = useAppDispatch()
  const getReferrer = useReferrer()
  const email = useAppSelector(loginEmail)
  const password = useAppSelector(loginPassword)
  const isFederatedRedirectResultLoading = useAppSelector(
    loginIsFederatedRedirectResultLoading
  )
  const allowToSubmit =
    isValidEmail(email) &&
    isValidLoginPassword(password) &&
    !isCompanyEmail(email) &&
    !isFederatedRedirectResultLoading
  const { redirect } = useRedirect()

  const [passwordErrorCode, setPasswordErrorCode] = useState(
    /** @type {string | null} */ (null)
  )
  const isRateLimited =
    passwordErrorCode === FirebaseAuthError.TOO_MANY_REQUESTS
  const passwordErrorMessage = passwordErrorCode
    ? isRateLimited
      ? '登入嘗試過於頻繁，請稍後再試。'
      : '帳號或密碼錯誤'
    : ''
  const passwordInputState = passwordErrorCode
    ? InputState.Invalid
    : InputState.Start

  /** @type {import('react').ChangeEventHandler<HTMLInputElement>} */
  const handlePasswordOnChange = (e) => {
    dispatch(loginActions.setPassword(e.target.value))
  }
  const [isLoading, setIsLoading] = useState(false)
  const isSubmitting = useRef(false)

  useEffect(() => {
    setPasswordErrorCode(null)
  }, [email, password])

  const handleSubmit = async () => {
    if (!allowToSubmit || isSubmitting.current) return
    isSubmitting.current = true
    setIsLoading(true)
    setPasswordErrorCode(null)
    onSubmittingChange?.(true)

    try {
      /** @type {import('firebase/auth').UserCredential} */
      let credential
      try {
        credential = await signInWithEmailAndPassword(auth, email, password)
      } catch (error) {
        if (
          error instanceof FirebaseError &&
          error.code === FirebaseAuthError.TOO_MANY_REQUESTS
        ) {
          setPasswordErrorCode(error.code)
          try {
            sendErrorLog(
              generateErrorReportInfo(error, {
                userEmail: email,
                referrer: getReferrer(),
              })
            )
          } catch (loggingError) {
            console.error(
              'Unable to report Firebase sign-in rate limit.',
              loggingError
            )
          }
          return
        }
        if (
          error instanceof FirebaseError &&
          EMAIL_PASSWORD_CREDENTIAL_ERROR_CODES.has(error.code)
        ) {
          setPasswordErrorCode(error.code)
          return
        }
        throw error
      }

      const { user } = credential
      if (!user) {
        throw new Error('Unable to get Firebase User')
      }
      const idToken = await user.getIdToken()
      if (!idToken) {
        throw new Error('Unexpected Error when getting firebase Id token.')
      }
      const accessToken = await getAccessToken(idToken)
      await loginPageOnAuthStateChangeAction(user, false, accessToken)

      redirect()
    } catch (e) {
      errorHandler(e instanceof Error ? e : new Error(String(e)), {
        userEmail: email,
        referrer: getReferrer(),
      })
      dispatch(loginActions.changeState(FormState.LoginFail))
    } finally {
      isSubmitting.current = false
      setIsLoading(false)
      onSubmittingChange?.(false)
    }
  }

  return (
    <>
      <InputGroup>
        <EmailInput />
        <GenericPasswordInput
          value={password}
          placeholder="請輸入密碼"
          invalidMessage={passwordErrorMessage}
          showInvalidBorder={!isRateLimited}
          state={passwordInputState}
          onChange={handlePasswordOnChange}
        />
        <ForgotPasswordLink
          href={{ pathname: '/recover-password', query: { email } }}
        >
          忘記密碼？
        </ForgotPasswordLink>
      </InputGroup>
      <ControlGroup>
        <PrimaryButton
          isLoading={isLoading}
          disabled={!allowToSubmit}
          onClick={handleSubmit}
        >
          登入會員
        </PrimaryButton>
      </ControlGroup>
    </>
  )
}
