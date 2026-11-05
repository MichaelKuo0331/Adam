import styled from 'styled-components'

import { InputState } from '../../constants/form'
import CenteredHint from '../shared/centered-hint'
import Hint from '../shared/hint'

const StyledHint = styled(Hint)`
  font-size: 16px;
  text-align: center;
  align-self: center;
`

export const HINT_STATE = /** @type {const} */ ({
  DEFAULT: 'default',
  ERROR: 'error',
  IN_PROGRESS: 'in-progress',
  SUCCESS: 'success',
})

/** @typedef {(typeof HINT_STATE)[keyof typeof HINT_STATE]} HintState */

/** @param {{ state: HintState }} props */
export default function Hints({ state }) {
  switch (state) {
    case HINT_STATE.IN_PROGRESS:
      return (
        <StyledHint $state={InputState.Incomplete}>正在寄出信件...</StyledHint>
      )
    case HINT_STATE.ERROR:
      return (
        <StyledHint $state={InputState.Invalid}>
          Email 寄出失敗，請重新再試
        </StyledHint>
      )
    case HINT_STATE.SUCCESS:
      return (
        <>
          <StyledHint $state={InputState.Valid}>
            若此信箱可重設密碼，您將收到重設密碼郵件。
          </StyledHint>
          <CenteredHint $state={InputState.Incomplete}>
            沒收到信嗎？請檢查垃圾信件匣，或等候 30 秒重新寄送
          </CenteredHint>
        </>
      )
    default:
      return
  }
}
