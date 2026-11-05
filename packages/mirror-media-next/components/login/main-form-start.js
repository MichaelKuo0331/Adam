import { useRef, useState } from 'react'
import styled from 'styled-components'

import { InputState } from '../../constants/form'
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'
import {
  AuthMethod,
  FormMode,
  loginActions,
  loginFormMode,
  loginIsFederatedRedirectResultLoading,
  loginShouldShowHintOfExitenceOfDifferentAuthMethod,
} from '../../slice/login-slice'
import CenteredHint from '../shared/centered-hint'

import ButtonLoginWithThirdParty from './button-login-with-third-party'
import FormWrapper from './form-wrapper'
import MainFormLoginWithPassword from './main-form-login-with-password'
import MainFormRegistration from './main-form-registration'
import ReminderSection from './reminder-section'

/** @typedef {{ $active: boolean }} ActiveProps */

/** @type {{ name: import('./button-login-with-third-party').ThirdPartyName }[]} */
const THIRD_PARTY_LIST = [
  { name: AuthMethod.Facebook },
  { name: AuthMethod.Google },
  { name: AuthMethod.Apple },
]

const ThirdPartyButtonGroup = styled.fieldset`
  display: flex;
  flex-direction: column;
  row-gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  &:disabled {
    opacity: 0.5;
  }
`

const ModeSwitch = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 24px;
`

const ModeButton = styled.button`
  flex: 1;
  height: 56px;
  padding: 12px 16px;
  border: 0;
  background: ${
    /** @param {ActiveProps} props */
    ({ $active }) => ($active ? '#054f77' : '#fff')
  };
  color: ${
    /** @param {ActiveProps} props */
    ({ $active }) => ($active ? '#fff' : '#054f77')
  };
  /* Inset ring outlines the inactive tab without shifting layout */
  box-shadow: ${
    /** @param {ActiveProps} props */
    ({ $active }) => ($active ? 'none' : 'inset 0 0 0 1px #054f77')
  };
  font-size: 18px;
  font-weight: 500;
  line-height: 150%;
  cursor: ${
    /** @param {ActiveProps} props */
    ({ $active }) => ($active ? 'default' : 'pointer')
  };
  transition: background-color 0.15s ease;

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-radius: 0 8px 8px 0;
  }

  /* Tint the outlined tab on hover so it reads as clickable */
  &:hover:not(:disabled) {
    background: ${
      /** @param {ActiveProps} props */
      ({ $active }) => ($active ? '#054f77' : '#e6eef3')
    };
  }

  &:focus-visible {
    outline: 2px solid #054f77;
    outline-offset: 2px;
  }

  /* Keep the normal look while the redirect check runs to avoid a flash */
  &:disabled {
    cursor: progress;
  }
`

const Seperator = styled.div`
  display: flex;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.3);
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;

  > span {
    margin-left: 12px;
    margin-right: 12px;
  }

  &:before,
  &:after {
    content: '';
    display: flex;
    flex-grow: 1;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.1);
  }
`

const PanelStack = styled.div`
  display: grid;
  width: 100%;
`

const Panel = styled.section`
  grid-area: 1 / 1;
  align-self: start;
  display: flex;
  justify-content: center;
  min-width: 0;
  visibility: ${
    /** @param {ActiveProps} props */
    ({ $active }) => ($active ? 'visible' : 'hidden')
  };
`

/**
 * @param {Object} [props]
 * @param {import('react').ComponentType<{ children: import('react').ReactNode }>} [props.FormContainer]
 */
export default function MainFormStart({ FormContainer = FormWrapper } = {}) {
  const dispatch = useAppDispatch()
  const formMode = useAppSelector(loginFormMode)
  const isRegistration = formMode === FormMode.Registration
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionPending = useRef(false)
  const isFederatedRedirectResultLoading = useAppSelector(
    loginIsFederatedRedirectResultLoading
  )
  const shouldShowHintOfExitenceOfDifferentAuthMethod = useAppSelector(
    loginShouldShowHintOfExitenceOfDifferentAuthMethod
  )
  const hint = '無法完成登入，請重試或改用其他登入方式。'
  const isSwitchDisabled = isSubmitting || isFederatedRedirectResultLoading

  /** @param {boolean} pending */
  const handleSubmittingChange = (pending) => {
    submissionPending.current = pending
    setIsSubmitting(pending)
  }

  /** @param {typeof FormMode.Login | typeof FormMode.Registration} mode */
  const handleModeChange = (mode) => {
    if (
      submissionPending.current ||
      isFederatedRedirectResultLoading ||
      isRegistration === (mode === FormMode.Registration)
    ) {
      return
    }

    dispatch(loginActions.clearPassword())
    dispatch(
      loginActions.changeShouldShowHintOfExitenceOfDifferentAuthMethod(false)
    )
    dispatch(
      mode === FormMode.Login
        ? loginActions.goToLoginForm()
        : loginActions.goToRegistrationForm()
    )
  }

  const modeSwitch = (
    <ModeSwitch role="group" aria-label="選擇登入或註冊">
      <ModeButton
        type="button"
        $active={!isRegistration}
        aria-pressed={!isRegistration}
        disabled={isSwitchDisabled}
        onClick={() => handleModeChange(FormMode.Login)}
      >
        登入
      </ModeButton>
      <ModeButton
        type="button"
        $active={isRegistration}
        aria-pressed={isRegistration}
        disabled={isSwitchDisabled}
        onClick={() => handleModeChange(FormMode.Registration)}
      >
        註冊
      </ModeButton>
    </ModeSwitch>
  )

  return (
    <PanelStack key={isRegistration ? FormMode.Registration : FormMode.Login}>
      <Panel
        $active={!isRegistration}
        aria-label="登入"
        aria-hidden={isRegistration}
        inert={isRegistration}
      >
        <FormContainer>
          {modeSwitch}
          <ThirdPartyButtonGroup
            aria-label="第三方登入"
            disabled={isSubmitting}
          >
            {THIRD_PARTY_LIST.map((item) => (
              <ButtonLoginWithThirdParty
                key={item.name}
                thirdPartyName={item.name}
              />
            ))}
            {shouldShowHintOfExitenceOfDifferentAuthMethod && (
              <CenteredHint $state={InputState.Invalid}>{hint}</CenteredHint>
            )}
          </ThirdPartyButtonGroup>
          <Seperator>
            <span>或</span>
          </Seperator>
          <MainFormLoginWithPassword
            onSubmittingChange={handleSubmittingChange}
          />
          <ReminderSection />
        </FormContainer>
      </Panel>
      <Panel
        $active={isRegistration}
        aria-label="註冊"
        aria-hidden={!isRegistration}
        inert={!isRegistration}
      >
        <FormContainer>
          {modeSwitch}
          <MainFormRegistration onSubmittingChange={handleSubmittingChange} />
          <ReminderSection />
        </FormContainer>
      </Panel>
    </PanelStack>
  )
}
