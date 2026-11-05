import styled from 'styled-components'

import { PRIVACY_POLICY_URL, SERVICE_RULE_URL } from '../../constants/url'

import StyledLink from './styled-link'

const Reminder = styled.section`
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
  color: rgba(0, 0, 0, 0.5);
  text-align: left;
`

/** @returns {import('react').ReactElement} */
export default function ReminderSection() {
  return (
    <Reminder>
      繼續使用代表您同意與接受鏡傳媒的
      <StyledLink href={SERVICE_RULE_URL}>《服務條款》</StyledLink>
      以及<StyledLink href={PRIVACY_POLICY_URL}>《隱私政策》</StyledLink>
    </Reminder>
  )
}
