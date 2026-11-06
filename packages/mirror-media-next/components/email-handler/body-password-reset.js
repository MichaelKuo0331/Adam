import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import styled from 'styled-components'

import { InputState } from '../../constants/form'
import { auth } from '../../firebase'
import {
  getNewPasswordHint,
  getNewPasswordInputState,
  isValidNewPassword,
} from '../../modules/authentication/password-policy'
import { getSearchParamFromApiKeyUrl } from '../../utils'
import { generateErrorReportInfo } from '../../utils/log/error-log'
import { sendErrorLog } from '../../utils/log/send-log'
import FormWrapper from '../login/form-wrapper'
import PrimaryButton from '../shared/buttons/primary-button'
import GenericPasswordInput from '../shared/inputs/generic-password-input'

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ContentBlock = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 16px;
`

const PrimaryText = styled.p`
  color: rgba(0, 0, 0, 0.87);
  font-size: 24px;
  font-weight: 500;
  line-height: 150%;
`

export default function BodyPasswordReset() {
  const [password, setPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const isSubmitting = useRef(false)
  const router = useRouter()
  const actionCode = getSearchParamFromApiKeyUrl(router.query, 'oobCode')
  const email = useRef('')

  const validality = getNewPasswordInputState(password)

  /** @type {import('react').ChangeEventHandler<HTMLInputElement>} */
  const handleOnInputChange = (e) => {
    setPassword(e.target.value)
  }

  const handleOnPrimaryButtonClicked = async () => {
    if (
      !isInitialized ||
      !isValidNewPassword(password) ||
      isSubmitting.current
    ) {
      return
    }
    isSubmitting.current = true
    setIsProcessing(true)

    try {
      try {
        if (Array.isArray(actionCode)) throw new Error('Invalid action code')

        await confirmPasswordReset(auth, actionCode, password)
      } catch (err) {
        const errorReport = generateErrorReportInfo(err, {
          userEmail: email.current,
        })
        sendErrorLog(errorReport)

        await router.replace({
          pathname: '/password-change-fail',
          query: {
            from: router.pathname,
          },
        })
        return
      }

      await router.replace('/password-change-success')
    } finally {
      isSubmitting.current = false
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (isInitialized) return

    const checkUrlInfo = async () => {
      try {
        if (Array.isArray(actionCode)) throw new Error('Invalid action code')

        email.current = await verifyPasswordResetCode(auth, actionCode)

        setIsInitialized(true)
      } catch (err) {
        const errorReport = generateErrorReportInfo(err, {
          userEmail: email.current,
        })
        sendErrorLog(errorReport)

        router.replace({
          pathname: '/password-change-fail',
          query: {
            from: router.pathname,
          },
        })
      }
    }

    checkUrlInfo()
  }, [actionCode, isInitialized, router])

  return (
    <Main>
      <FormWrapper>
        {isInitialized ? (
          <>
            <ContentBlock>
              <PrimaryText>請輸入新的密碼</PrimaryText>
              <GenericPasswordInput
                placeholder="密碼至少需 8 個字元"
                state={validality}
                invalidMessage={getNewPasswordHint(password)}
                reservedHintMessage={getNewPasswordHint('')}
                value={password}
                onChange={handleOnInputChange}
              />
            </ContentBlock>
            <PrimaryButton
              onClick={handleOnPrimaryButtonClicked}
              isLoading={isProcessing}
              disabled={validality !== InputState.Valid}
            >
              送出
            </PrimaryButton>
          </>
        ) : null}
        {/* TODO: add loading effect (should discuss with designer and PM) */}
      </FormWrapper>
    </Main>
  )
}
