// This file is for response codes from Firebaes SDK

export const FirebaseAuthError = {
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  WEAK_PASSWORD: 'auth/weak-password',
  ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL:
    'auth/account-exists-with-different-credential',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  INVALID_LOGIN_CREDENTIALS: 'auth/invalid-login-credentials',
  INVALID_CREDENTIAL: 'auth/invalid-credential',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  EXPIRED_ACTION_CODE: 'auth/expired-action-code',
  INVALID_ACTION_CODE: 'auth/invalid-action-code',
} as const
