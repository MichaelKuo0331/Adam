import { InputState, type InputStateEnum } from '../../constants/form'

export type NewPasswordCheck = {
  label: string
  isValid: boolean
}

export function isValidLoginPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 6
}

export function getNewPasswordChecks(password: string): NewPasswordCheck[] {
  return [
    { label: '8個字元', isValid: password.length >= 8 },
    { label: '大寫英文', isValid: /[A-Z]/.test(password) },
    { label: '小寫英文', isValid: /[a-z]/.test(password) },
    { label: '數字', isValid: /[0-9]/.test(password) },
  ]
}

export function getNewPasswordHint(password: string): string {
  const missingRules = getNewPasswordChecks(password)
    .filter((check) => !check.isValid)
    .map((check) => check.label)

  if (missingRules.length === 0) return ''

  const prefix = missingRules[0] === '8個字元' ? '密碼至少需含' : '密碼需含'
  return `${prefix}${missingRules.join('、')}`
}

export function isValidNewPassword(password: string): boolean {
  return getNewPasswordChecks(password).every((check) => check.isValid)
}

export function getNewPasswordInputState(password: string): InputStateEnum {
  if (password === '') return InputState.Start
  return isValidNewPassword(password) ? InputState.Valid : InputState.Invalid
}
