import styled from 'styled-components'

import DefaultButton from '../shared/buttons/default-button'

import FormWrapper from './form-wrapper'
import StyledLink from './styled-link'

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const PrimaryText = styled.p`
  color: rgba(0, 0, 0, 0.87);
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
`

const SecondaryText = styled.p`
  color: rgba(0, 0, 0, 0.5);
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  margin-top: 16px;
  margin-bottom: 32px;
`

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

/**
 * @param {Object} props
 * @param {string} props.primaryText
 * @param {import('react').MouseEventHandler<HTMLButtonElement>} props.onBack
 * @param {import('react').MouseEventHandler<HTMLButtonElement>} [props.onLogin]
 */
export default function GenericFailed({ primaryText, onBack, onLogin }) {
  return (
    <Main>
      <FormWrapper>
        <PrimaryText>
          抱歉，出了點狀況...
          <br />
          {primaryText}
        </PrimaryText>
        <SecondaryText>
          或是聯繫客服信箱{' '}
          <StyledLink href="mailto:mm-onlineservice@mirrormedia.mg">
            mm-onlineservice@mirrormedia.mg
          </StyledLink>{' '}
          / 致電 (02)6633-3966 由專人為您服務。
        </SecondaryText>
        <Controls>
          <DefaultButton onClick={onBack}>回上一步</DefaultButton>
          {onLogin && <DefaultButton onClick={onLogin}>前往登入</DefaultButton>}
        </Controls>
      </FormWrapper>
    </Main>
  )
}
