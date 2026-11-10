import Image from 'next/image'
import styled from 'styled-components'

const Link = styled.a`
  background-color: black;
  width: fit-content;
  height: 32px;
  padding: 9px 12px 9px 13.33px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5.33px;
  font-size: 14px;
  line-height: 1;
  font-weight: 400;
  border-radius: 32px;
  color: white;
  &:hover {
    background: rgba(0, 0, 0, 0.87);
    transition: background 0.3s ease;
  }
`

export default function DonateLink({ className = '' }) {
  return (
    <Link className={className} href="/donate" target="_blank">
      <Image
        src={'/images-next/donate.png'}
        width={13.33}
        height={13.33}
        alt="donate"
      ></Image>
      <span>贊助本文</span>
    </Link>
  )
}
