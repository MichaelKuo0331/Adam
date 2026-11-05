import { InputState } from '../../constants/form'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { loginActions, loginEmail } from '../../slice/login-slice'
import { isCompanyEmail, isValidEmail } from '../../utils'
import GenericTextInput from '../shared/inputs/generic-text-input'

export default function RegistartionEmailInput() {
  const dispatch = useAppDispatch()
  const email = useAppSelector(loginEmail)
  const hasValidFormat = isValidEmail(email)
  const shouldUseGoogle = hasValidFormat && isCompanyEmail(email)
  const invalidMessage = shouldUseGoogle
    ? '若您想使用本公司企業信箱，請切換至「登入」，選擇 Google 帳號登入，以享有 Premium 會員資格。'
    : '請輸入有效的 Email 地址'
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
      validMessage="Email 格式正確"
      value={email}
      state={state}
      onChange={handleInputChange}
    />
  )
}
