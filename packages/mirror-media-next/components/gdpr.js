import { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'

import { Z_INDEX } from '../constants'
import useFirstScrollDetector from '../hooks/useFirstScrollDetector'
import {
  getStorageItem,
  isStorageAvailable,
  setStorageItem,
} from '../utils/safe-storage'

const Wrapper = styled.div`
  position: relative;
  z-index: ${Z_INDEX.coverHeader};
  color: white;

  ${
    /**
     * @param {Object} props
     * @param {boolean} props.showNotification
     */
    ({ showNotification }) =>
      showNotification &&
      css`
        .gdpr-notification {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 10px;
          border-radius: 4px;
          background: #054f77;
          box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
          line-height: 180%;
          font-size: 14px;
          padding: 12px 16px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;

          ${({ theme }) => theme.breakpoint.md} {
            font-size: 16px;
            padding: 20px 36px;
            flex-direction: row;
          }
          ${({ theme }) => theme.breakpoint.xl} {
            padding: 28px 100px;
          }
        }

        button {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: #fff;
          color: #054f77;
          font-weight: 900;
          width: 83px;
          height: 33px;
          font-size: 14px;
          padding: 4px 0;
          margin-left: 0;
          margin-top: 18px;
          &:hover {
            background: #d8d8d8;
            transition: all 0.3s ease-in-out;
          }

          ${({ theme }) => theme.breakpoint.md} {
            font-size: 20px;
            width: 127px;
            height: 56px;
            padding: 10px 0;
            margin-left: 19px;
            margin-top: 0;
          }
          ${({ theme }) => theme.breakpoint.xl} {
            margin-left: 27px;
          }
        }

        a {
          color: #ffa011;
          margin-left: 8px;
          text-decoration: underline 0.7px;
          text-underline-offset: 3.5px;
        }

        .text {
          ${({ theme }) => theme.breakpoint.md} {
            width: 90%;
          }
        }
      `
  };
`

export default function GDPRNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const hasScrolled = useFirstScrollDetector()

  useEffect(() => {
    /*
      Reading `window.localStorage` can throw a SecurityError on the property
      access itself. Without it the agreement can never be recorded, so hide the
      notification instead of showing a button that remembers nothing.
     */
    if (!isStorageAvailable()) {
      return
    }

    const gdprSeen = getStorageItem('mirrormedia-gdprSeen')

    if (!gdprSeen) {
      setShowNotification(true)
    }
  }, [])

  const handleAgree = () => {
    setShowNotification(false)
    setStorageItem('mirrormedia-gdprSeen', 'true')
  }

  return (
    hasScrolled && (
      <Wrapper showNotification={showNotification}>
        {showNotification && (
          <div className="gdpr-notification">
            <div className="text">
              本網站使用相關技術提供更好的閱讀體驗，同時尊重使用者隱私，若您瀏覽此網站，即代表您同意我們使用第三方
              Cookie。若欲了解更多相關資訊，點這裡瞭解
              <a href="https://www.mirrormedia.mg/story/privacy/">隱私權聲明</a>
              。
            </div>
            <button onClick={handleAgree}>我同意</button>
          </div>
        )}
      </Wrapper>
    )
  )
}
