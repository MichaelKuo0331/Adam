import { InputState } from '../../constants/form'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { loginActions, loginEmail } from '../../slice/login-slice'
import { isCompanyEmail, isValidEmail } from '../../utils'
import GenericTextInput from '../shared/inputs/generic-text-input'

/**
 * @param {Object} [props]
 * @param {boolean} [props.shouldShowHint=true]
 */
export default function EmailInput({ shouldShowHint = true } = {}) {
  const dispatch = useAppDispatch()
  const email = useAppSelector(loginEmail)
  const hasValidFormat = isValidEmail(email)
  const shouldUseGoogle = hasValidFormat && isCompanyEmail(email)
  const invalidMessage = shouldShowHint
    ? shouldUseGoogle
      ? '若您想以本公司企業信箱登入，請點擊上方「以 Google 帳號繼續」重試，以享有 Premium 會員資格。'
      : '請輸入有效的 Email 地址'
    : ''
  const validMessage = shouldShowHint ? 'Email 格式正確' : ''
  const state =
    email === ''
      ? InputState.Start
      : hasValidFormat && !shouldUseGoogle
        ? InputState.Valid
        : InputState.Invalid

  /** @type {import('react').ChangeEventHandler<HTMLInputElement>} */
  const handleInputChange = (e) => {
    dispatch(loginActions.setEmail(e.target.value))
  }

  return (
    <GenericTextInput
      placeholder="name@example.com"
      invalidMessage={invalidMessage}
      validMessage={validMessage}
      value={email}
      state={state}
      onChange={handleInputChange}
    />
  )
}
