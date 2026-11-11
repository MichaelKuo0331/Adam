import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { FirebaseError } from 'firebase/app'
import { applyActionCode } from 'firebase/auth'
import styled from 'styled-components'

import { FirebaseAuthError } from '../../constants/firebase'
import { useMembership } from '../../context/membership'
import { useReferrer } from '../../context/referrer'
import { auth } from '../../firebase'
import { getSearchParamFromApiKeyUrl } from '../../utils'
import { generateErrorReportInfo } from '../../utils/log/error-log'
import { sendErrorLog } from '../../utils/log/send-log'
import StyledLink from '../login/styled-link'
import PrimaryButton from '../shared/buttons/primary-button'

import FormWrapper from './form-wrapper'

const DEFAULT = 'default'
const SUCCESS = 'success'
const FAILED = 'failed'
const VERIFICATION_STATE = /** @type {const} */ ({
  DEFAULT,
  SUCCESS,
  FAILED,
})

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const FailedFormWrapper = styled(FormWrapper)`
  ${({ theme }) => theme.breakpoint.md} {
    width: 423px;
  }
`

const ContentBlock = styled.div`
  margin-bottom: 24px;
`

const FailedContentBlock = styled(ContentBlock)`
  margin-bottom: 32px;
`

const PrimaryText = styled.p`
  color: rgba(0, 0, 0, 0.87);
  font-size: 24px;
  font-weight: 500;
  line-height: 150%;
  word-break: break-all;
`

const SecondaryText = styled.p`
  color: rgba(0, 0, 0, 0.5);
  font-size: 18px;
  font-weight: 400;
  line-height: 150%;
  margin-top: 12px;
`

/** @typedef {DEFAULT | SUCCESS | FAILED} VerficationState */

export default function BodyEmailVerification() {
  const isProcessing = useRef(false)
  const { isLoggedIn, userEmail, firebaseId, memberInfo } = useMembership()
  const [errorType, setErrorType] = useState('')
  const router = useRouter()
  const getReferrer = useReferrer()
  const actionCode = getSearchParamFromApiKeyUrl(router.query, 'oobCode')
  const [verificationState, setVerificationState] = useState(
    !actionCode || Array.isArray(actionCode)
      ? /** @type {VerficationState} */ (VERIFICATION_STATE.FAILED)
      : /** @type {VerficationState} */ (VERIFICATION_STATE.DEFAULT)
  )

  useEffect(() => {
    if (Array.isArray(actionCode) || isProcessing.current) {
      return
    }

    isProcessing.current = true

    applyActionCode(auth, actionCode)
      .then(() => {
        setVerificationState(VERIFICATION_STATE.SUCCESS)
      })
      .catch((err) => {
        setVerificationState(VERIFICATION_STATE.FAILED)

        if (err instanceof FirebaseError) {
          setErrorType(err.code)
        }

        const errorReport = generateErrorReportInfo(err, {
          userEmail,
          firebaseId,
          memberType: memberInfo?.memberType,
          referrer: getReferrer(),
        })

        sendErrorLog(errorReport)
      })
  }, [actionCode, userEmail, firebaseId, memberInfo, getReferrer])

  const getFailedContent = () => {
    const SecondaryBlock = (
      <>
        <SecondaryText style={{ marginTop: '16px' }}>
          或是聯繫客服信箱{' '}
          <StyledLink href="mailto:mm-onlineservice@mirrormedia.mg">
            mm-onlineservice@mirrormedia.mg
          </StyledLink>{' '}
          / 致電 (02)6633-3966 由專人為您服務。
        </SecondaryText>
      </>
    )

    /** @type {string | JSX.Element} */
    let primaryTextWording
    /** @type {string} */
    let primaryButtonWording
    /** @type {import('react').MouseEventHandler<HTMLButtonElement>} */
    let onClick

    switch (errorType) {
      case FirebaseAuthError.USER_DISABLED:
      case FirebaseAuthError.USER_NOT_FOUND:
        primaryTextWording = (
          <>
            使用者不存在或帳號已停用
            <br />
            請重新註冊／登入帳號
          </>
        )
        primaryButtonWording = '前往註冊會員'
        onClick = () => {
          router.push({
            pathname: '/login',
          })
        }
        break
      case FirebaseAuthError.EXPIRED_ACTION_CODE:
        primaryTextWording = '連結已過期，請重新驗證'
        primaryButtonWording = '重新驗證信箱'
        onClick = () => {
          router.push({
            pathname: '/email-verify',
          })
        }
        break
      case FirebaseAuthError.INVALID_ACTION_CODE:
      default:
        primaryTextWording = '連結無效，請重新驗證'
        primaryButtonWording = '重新驗證信箱'
        onClick = () => {
          router.push({
            pathname: '/email-verify',
          })
        }
        break
    }

    return (
      <>
        <FailedContentBlock>
          <PrimaryText>{primaryTextWording}</PrimaryText>
          {SecondaryBlock}
        </FailedContentBlock>
        <PrimaryButton onClick={onClick}>{primaryButtonWording}</PrimaryButton>
      </>
    )
  }

  const getContent = () => {
    switch (verificationState) {
      case VERIFICATION_STATE.SUCCESS: {
        const primaryTextWording = isLoggedIn
          ? `${userEmail} 已驗證成功！`
          : `已驗證成功！`

        const primaryButtonWording = isLoggedIn ? '繼續前往付款' : '重新登入'

        /** @type {import('react').MouseEventHandler<HTMLButtonElement>} */
        const onClick = () => {
          const destination = '/subscribe'

          if (isLoggedIn) {
            window.location.href = destination
            /**
             * TODO: 等待會員訂購頁完成後，改用 router 來處理跳轉
             * 
            router.push({
              pathname: destination,
            })
            */
          } else {
            router.push({
              pathname: '/login',
              query: {
                destination,
              },
            })
          }
        }

        return (
          <>
            <ContentBlock>
              <PrimaryText>{primaryTextWording}</PrimaryText>
              {!isLoggedIn && (
                <SecondaryText>請重新登入，繼續完成訂購流程</SecondaryText>
              )}
            </ContentBlock>
            <PrimaryButton onClick={onClick}>
              {primaryButtonWording}
            </PrimaryButton>
          </>
        )
      }

      default:
        return null
    }
  }

  /** @type {string[]} */
  const VALID_STATE = [VERIFICATION_STATE.DEFAULT, VERIFICATION_STATE.SUCCESS]

  return (
    <Main>
      {VALID_STATE.includes(verificationState) ? (
        <FormWrapper>{getContent()}</FormWrapper>
      ) : (
        <FailedFormWrapper>{getFailedContent()}</FailedFormWrapper>
      )}
    </Main>
  )
}
