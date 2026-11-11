import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'

import { DONATION_PAGE_URL } from '../../../config/index.mjs'
import { Z_INDEX } from '../../../constants'
import ShareButton from '../../shared/share-button'
import DonateLink from '../shared/donate-link'
import SubscribeLink from '../shared/subscribe-link'

const Nav = styled.nav`
  position: fixed;
  z-index: ${Z_INDEX.header};
  left: 0%;
  right: 0%;
  top: 0%;
  bottom: 0%;
  height: 52px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  button {
    &:focus {
      outline: 0;
    }
  }

  ${({ theme }) => theme.breakpoint.md} {
    height: 70px;
    padding: 16px 24px;
  }
`
const LogoWrapper = styled.div`
  display: flex;
  align-items: center;

  .logo {
    width: 67.5px;
    height: 28px;

    ${({ theme }) => theme.breakpoint.md} {
      width: 90px;
      height: 38px;
    }
  }
`

const IconsWrapper = styled.div`
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* gap: 20px; */

  .share-button {
    margin-left: 12px;

    ${({ theme }) => theme.breakpoint.md} {
      margin-left: 18px;
    }
  }

  .donate-btn-pc {
    padding: 8px 12px;
    border: 1px solid #ffffff;
    display: none;
    ${({ theme }) => theme.breakpoint.md} {
      display: flex;
    }
  }

  .donate-btn-mb {
    ${({ theme }) => theme.breakpoint.md} {
      display: none;
    }
  }

  .subscribe-btn {
    padding: 8px 12px;
    margin-left: 8px;
    border: 1px solid #ffffff;
    ${({ theme }) => theme.breakpoint.md} {
      margin-left: 12px;
    }
  }
`

export default function Header() {
  return (
    <Nav>
      <LogoWrapper>
        <Link href="/">
          <Image
            src="/images-next/weekly-logo-white.svg"
            alt="mirror media logo"
            className="logo"
            width={90}
            height={38}
          />
        </Link>
      </LogoWrapper>
      <IconsWrapper>
        <a href={DONATION_PAGE_URL} target="_blank" rel="noreferrer noopenner">
          <Image
            src="/images-next/donate-circle.svg"
            alt="sponsor this article"
            className="donate-btn-mb"
            width={32}
            height={32}
          />
        </a>
        <DonateLink className="donate-btn-pc GTM-donate-link-top" />
        <SubscribeLink className="subscribe-btn GTM-subscribe-link-top" />
        {/* <PhotosIndexButton>
          <Image
            src="/images-next/photos-index-icon.svg"
            alt="photos index icon"
            className="photos-index-icon"
            width={32}
            height={32}
          />
        </PhotosIndexButton> */}
        <ShareButton className="share-button" />
      </IconsWrapper>
    </Nav>
  )
}
