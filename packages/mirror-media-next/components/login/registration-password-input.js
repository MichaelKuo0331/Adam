import styled from 'styled-components'

import { InputState } from '../../constants/form'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import { loginActions, loginPassword } from '../../slice/login-slice'
import Hint from '../shared/hint'
import GenericPasswordInput from '../shared/inputs/generic-password-input'

/**
 * @typedef {Object} RegistrationPasswordCheck
 * @property {string} label
 * @property {boolean} isValid
 */

/**
 * @param {string} password
 * @returns {RegistrationPasswordCheck[]}
 */
export function getRegistrationPasswordChecks(password) {
  return [
    { label: '8個字元', isValid: password.length >= 8 },
    { label: '大寫英文', isValid: /[A-Z]/.test(password) },
    { label: '小寫英文', isValid: /[a-z]/.test(password) },
    { label: '數字', isValid: /[0-9]/.test(password) },
  ]
}

/**
 * @param {string} password
 * @returns {string}
 */
export function getRegistrationPasswordHint(password) {
  const missingRules = getRegistrationPasswordChecks(password)
    .filter((check) => !check.isValid)
    .map((check) => check.label)

  if (missingRules.length === 0) return ''

  const prefix = missingRules[0] === '8個字元' ? '密碼至少需含' : '密碼需含'
  return `${prefix}${missingRules.join('、')}`
}

/**
 * @param {string} password
 * @returns {boolean}
 */
export function isValidRegistrationPassword(password) {
  return getRegistrationPasswordChecks(password).every((check) => check.isValid)
}

const HintArea = styled.div`
  display: grid;
  min-height: 40px;
  padding: 8px 0;

  > p {
    grid-area: 1 / 1;
    align-self: center;
  }

  > p[aria-hidden='true'] {
    visibility: hidden;
  }
`

export default function RegistrationPasswordInput() {
  const dispatch = useAppDispatch()
  const password = useAppSelector(loginPassword)
  const checks = getRegistrationPasswordChecks(password)
  const hint = password === '' ? '' : getRegistrationPasswordHint(password)
  const state =
    password === ''
      ? InputState.Start
      : checks.every((check) => check.isValid)
        ? InputState.Valid
        : InputState.Invalid

  /** @type {import('react').ChangeEventHandler<HTMLInputElement>} */
  const handleOnChange = (e) => {
    dispatch(loginActions.setPassword(e.target.value))
  }

  return (
    <div>
      <GenericPasswordInput
        value={password}
        placeholder="密碼至少需 8 個字元"
        state={state}
        onChange={handleOnChange}
      />
      <HintArea>
        <Hint $state={InputState.Invalid} aria-hidden="true">
          {getRegistrationPasswordHint('')}
        </Hint>
        {hint && (
          <Hint $state={InputState.Invalid} role="status">
            {hint}
          </Hint>
        )}
      </HintArea>
    </div>
  )
}
