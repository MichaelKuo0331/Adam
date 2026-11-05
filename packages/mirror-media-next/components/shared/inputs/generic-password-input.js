import { useState } from 'react'
import styled, { css } from 'styled-components'

import { InputState } from '../../../constants/form'
import IconConceal from '../../../public/images-next/login/conceal.svg'
import IconReveal from '../../../public/images-next/login/reveal.svg'
import getHint from '../../../utils/hint'

/** @typedef {import('../../../constants/form').InputStateEnum} PasswordInputState */

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 8px;
  width: 100%;
  background: #fff;
`

/**
 * @typedef {Object} GroupProps
 * @property {boolean} $isInvalid
 * @property {boolean} $isFocus
 */

/** @type {import('styled-components').StyledComponent<"div", any, GroupProps, never>} */
const Group = styled.div`
  display: flex;
  height: 48px;
  padding: 12px;
  align-items: center;
  column-gap: 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.3);

  ${
    /** @param {GroupProps} props */
    ({ $isInvalid }) =>
      $isInvalid &&
      css`
        border: 1px solid #e51731;
      `
  }

  ${
    /** @param {GroupProps} props */
    ({ $isFocus }) =>
      $isFocus &&
      css`
        border: 1px solid rgba(0, 0, 0, 0.87);
      `
  }
`

const Input = styled.input`
  flex-grow: 1;
  font-size: 18px;
  font-weight: 400;
  line-height: 150%;
  color: rgba(0, 0, 0, 0.87);
  outline: none;

  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
  }
`

const Toggle = styled.button`
  outline: none;
  &:focus {
    outline: none;
  }
`

/**
 * @param {Object} props
 * @param {string} props.value - input 數值
 * @param {PasswordInputState} props.state - input 狀態
 * @param {string} props.placeholder - input placeholder
 * @param {string} [props.incompleteMessage] - 輸入未完成的提示
 * @param {string} [props.invalidMessage] - 輸入錯誤的提示
 * @param {string} [props.validMessage] - 輸入正確的提示
 * @param {boolean} [props.showInvalidBorder=true] - Whether invalid state marks the input border.
 * @param {import('react').ChangeEventHandler<HTMLInputElement>} props.onChange - input 數值變動處理
 */
export default function GenericPasswordInput({
  value,
  state,
  placeholder,
  incompleteMessage,
  invalidMessage,
  validMessage,
  showInvalidBorder = true,
  onChange,
}) {
  const [isConcealed, setIsConealed] = useState(true)
  const [isFocus, setIsFocus] = useState(false)

  return (
    <Wrapper>
      <Group
        $isInvalid={showInvalidBorder && state === InputState.Invalid}
        $isFocus={isFocus}
      >
        <Input
          type={isConcealed ? 'password' : 'text'}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
        />
        <Toggle type="button" onClick={() => setIsConealed(!isConcealed)}>
          {isConcealed ? <IconReveal /> : <IconConceal />}
        </Toggle>
      </Group>
      {getHint(state, {
        incompleteMessage,
        invalidMessage,
        validMessage,
      })}
    </Wrapper>
  )
}
