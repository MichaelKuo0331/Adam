import styled from 'styled-components'

const Link = styled.a`
  background-color: #1d9fb8;
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
    background: #054f77;
    transition: background 0.3s ease;
  }
`

export default function SubscribeLink({ className = '' }) {
  return (
    <Link className={className} href="/subscribe">
      <span>加入訂閱會員</span>
    </Link>
  )
}
