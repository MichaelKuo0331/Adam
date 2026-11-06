import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import {
  getNewPasswordHint,
  getNewPasswordInputState,
} from '../../modules/authentication/password-policy'
import { loginActions, loginPassword } from '../../slice/login-slice'
import GenericPasswordInput from '../shared/inputs/generic-password-input'

export default function RegistrationPasswordInput() {
  const dispatch = useAppDispatch()
  const password = useAppSelector(loginPassword)
  const state = getNewPasswordInputState(password)

  /** @type {import('react').ChangeEventHandler<HTMLInputElement>} */
  const handleOnChange = (e) => {
    dispatch(loginActions.setPassword(e.target.value))
  }

  return (
    <GenericPasswordInput
      value={password}
      placeholder="密碼至少需 8 個字元"
      state={state}
      invalidMessage={getNewPasswordHint(password)}
      reservedHintMessage={getNewPasswordHint('')}
      onChange={handleOnChange}
    />
  )
}
