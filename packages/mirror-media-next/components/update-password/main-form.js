import { useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth'
import styled from 'styled-components'

import { InputState } from '../../constants/form'
import { useReferrer } from '../../context/referrer'
import { auth } from '../../firebase'
import {
  getNewPasswordHint,
  getNewPasswordInputState,
  isValidLoginPassword,
  isValidNewPassword,
} from '../../modules/authentication/password-policy'
import { generateErrorReportInfo } from '../../utils/log/error-log'
import { sendErrorLog } from '../../utils/log/send-log'
import PrimaryButton from '../shared/buttons/primary-button'
import GenericPasswordInput from '../shared/inputs/generic-password-input'

// following comments is required since these variables are used by comments but not codes.
/* eslint-disable-next-line no-unused-vars */
const { Start, Invalid } = InputState

/**
 * @typedef { Start | Invalid} OldPasswordState
 */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  row-gap: 0;
  margin-top: 16px;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 8px;
`

const FieldLabel = styled.label`
  color: rgba(0, 0, 0, 0.87);
  font-size: 18px;
  font-weight: 400;
  line-height: 150%;
`

export default function MainForm() {
  const getReferrer = useReferrer()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isSubmitting = useRef(false)

  const [oldPassword, setOldPassword] = useState('')
  const [oldPasswordState, setOldPasswordState] = useState(
    /** @type {OldPasswordState} */ (InputState.Start)
  )

  const [newPassword, setNewPassword] = useState('')
  const newPasswordState = getNewPasswordInputState(newPassword)

  const [newPasswordCheck, setNewPassworkCheck] = useState('')
  const newPasswordCheckState =
    newPasswordCheck === ''
      ? InputState.Start
      : newPassword === newPasswordCheck
        ? InputState.Valid
        : InputState.Invalid
  const allowToSubmit =
    isValidLoginPassword(oldPassword) &&
    isValidNewPassword(newPassword) &&
    newPassword === newPasswordCheck

  const handleOnClickButton = async () => {
    if (!allowToSubmit || isSubmitting.current) return
    isSubmitting.current = true
    setIsLoading(true)

    const email = auth?.currentUser?.email
    try {
      /** @type {import('firebase/auth').UserCredential} */
      let userCredential
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          oldPassword
        )
      } catch (e) {
        const errorReport = generateErrorReportInfo(e, {
          userEmail: email,
          referrer: getReferrer(),
        })
        sendErrorLog(errorReport)
        setOldPasswordState(InputState.Invalid)
        return
      }

      try {
        await updatePassword(userCredential.user, newPassword)
      } catch (e) {
        const errorReport = generateErrorReportInfo(e, {
          userEmail: email,
          referrer: getReferrer(),
        })
        sendErrorLog(errorReport)
        await router.push({
          pathname: '/password-change-fail',
          query: { from: router.pathname },
        })
        return
      }

      await router.push('/password-change-success')
    } finally {
      isSubmitting.current = false
      setIsLoading(false)
    }
  }

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        handleOnClickButton()
      }}
    >
      <FieldGroup>
        <FieldLabel>請輸入目前密碼</FieldLabel>
        <GenericPasswordInput
          placeholder="目前密碼"
          invalidMessage="密碼錯誤，請重新再試"
          onChange={(e) => {
            setOldPassword(e.target.value)
            setOldPasswordState(InputState.Start)
          }}
          value={oldPassword}
          state={oldPasswordState}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>請輸入新密碼</FieldLabel>
        <GenericPasswordInput
          placeholder="密碼至少需 8 個字元"
          invalidMessage={getNewPasswordHint(newPassword)}
          reservedHintMessage={getNewPasswordHint('')}
          onChange={(e) => setNewPassword(e.target.value)}
          value={newPassword}
          state={newPasswordState}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>請再次輸入新密碼</FieldLabel>
        <GenericPasswordInput
          placeholder="再次輸入新密碼"
          invalidMessage="兩次密碼須相符"
          validMessage="兩次密碼相符"
          onChange={(e) => setNewPassworkCheck(e.target.value)}
          value={newPasswordCheck}
          state={newPasswordCheckState}
        />
      </FieldGroup>
      <PrimaryButton
        disabled={!allowToSubmit}
        isLoading={isLoading}
        onClick={handleOnClickButton}
      >
        儲存
      </PrimaryButton>
    </Form>
  )
}
