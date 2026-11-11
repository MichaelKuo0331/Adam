import { useRef, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import styled from 'styled-components'

import { FirebaseAuthError } from '../../constants/firebase'
import { InputState } from '../../constants/form'
import { useReferrer } from '../../context/referrer'
import { auth } from '../../firebase'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { isValidNewPassword } from '../../modules/authentication/password-policy'
import {
  FormState,
  loginActions,
  loginEmail,
  loginIsFederatedRedirectResultLoading,
  loginPassword,
} from '../../slice/login-slice'
import { isCompanyEmail, isValidEmail } from '../../utils'
import {
  errorHandler,
  getAccessToken,
  loginPageOnAuthStateChangeAction,
} from '../../utils/membership'
import PrimaryButton from '../shared/buttons/primary-button'
import Hint from '../shared/hint'

import FormTitle from './form-title'
import RegistartionEmailInput from './registration-email-input'
import RegistrationPasswordInput from './registration-password-input'

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

const RegistrationHint = styled(Hint)`
  margin-bottom: 16px;
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
export default function MainFormRegistration({ onSubmittingChange } = {}) {
  const dispatch = useAppDispatch()
  const getReferrer = useReferrer()
  const [isLoading, setIsLoading] = useState(false)
  const isSubmitting = useRef(false)
  const email = useAppSelector(loginEmail)
  const password = useAppSelector(loginPassword)
  const isFederatedRedirectResultLoading = useAppSelector(
    loginIsFederatedRedirectResultLoading
  )
  const allowToSubmit =
    isValidEmail(email) &&
    isValidNewPassword(password) &&
    !isCompanyEmail(email) &&
    !isFederatedRedirectResultLoading

  const handleSubmit = async () => {
    if (!allowToSubmit || isSubmitting.current) return
    isSubmitting.current = true
    setIsLoading(true)
    onSubmittingChange?.(true)

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      if (!user) {
        throw new Error('Unable to get Firebase User')
      }
      const idToken = await user.getIdToken()
      if (!idToken) {
        throw new Error('Unexpected Error when getting firebase Id token.')
      }
      const accessToken = await getAccessToken(idToken)
      const result = await loginPageOnAuthStateChangeAction(
        user,
        true,
        accessToken
      )

      dispatch(loginActions.changeState(result))
    } catch (e) {
      if (
        !(
          e instanceof FirebaseError &&
          e.code === FirebaseAuthError.EMAIL_ALREADY_IN_USE
        )
      ) {
        errorHandler(e instanceof Error ? e : new Error(String(e)), {
          userEmail: email,
          referrer: getReferrer(),
        })
      }
      dispatch(loginActions.changeState(FormState.RegisterFail))
    } finally {
      isSubmitting.current = false
      setIsLoading(false)
      onSubmittingChange?.(false)
    }
  }

  return (
    <>
      <FormTitle>Email 註冊</FormTitle>
      <RegistrationHint $state={InputState.Start}>
        若要使用 Facebook、Google 或 Apple
        帳號註冊，請切換至上方「登入」，選擇對應的第三方登入方式即可。
      </RegistrationHint>
      <InputGroup>
        <RegistartionEmailInput />
        <RegistrationPasswordInput />
      </InputGroup>
      <ControlGroup>
        <PrimaryButton
          isLoading={isLoading}
          disabled={!allowToSubmit}
          onClick={handleSubmit}
        >
          註冊會員
        </PrimaryButton>
      </ControlGroup>
    </>
  )
}
