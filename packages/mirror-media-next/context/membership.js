import { createContext, useContext, useEffect, useReducer } from 'react'

import { generateErrorReportInfo } from '../utils/log/error-log'
import { sendErrorLog } from '../utils/log/send-log'
import {
  getAccessToken,
  removeAccessTokenFromStorage,
} from '../utils/membership'

import { useReferrer } from './referrer'

/**
 * @typedef {Object} MemberInfo
 * @property {MemberType} memberType
 */

/**
 * @typedef {Object} Membership
 * @property {boolean} isLoggedIn
 * @property {string} accessToken
 * @property {string} userEmail
 * @property {string} firebaseId
 * @property {MemberInfo} memberInfo
 * @property {boolean} isLogInProcessFinished
 */

/**
 * @typedef {Object} MembershipReducerAction
 * @property {"LOGIN" | "LOGOUT"} type
 * @property {Object} [payload]
 * @property {Membership["accessToken"]} [payload.accessToken]
 * @property {MemberInfo} [payload.memberInfo]
 * @property {string} [payload.userEmail]
 * @property {string} [payload.firebaseId]
 */

/**
 * @typedef { 'not-member' |'basic-member' | 'premium-member' | 'one-time-member' | 'one-time-member'} MemberType
 */

/**
 * TODO: check which data should be stored, such as user email, is email verified, etc.
 * @type {Membership}
 */
const initialMembership = {
  isLoggedIn: false,
  accessToken: '',
  userEmail: '',
  memberInfo: { memberType: 'not-member' },
  isLogInProcessFinished: false,
  firebaseId: '',
}

/**
 * @typedef {import('react').Dispatch<MembershipReducerAction>} MembershipDispatch
 */

const MembershipContext = createContext(initialMembership)

/** @type {import('react').Context<MembershipDispatch>} */
const MembershipDispatchContext = createContext(null)

/**
 *
 * @param {Membership} membership
 * @param {MembershipReducerAction} action
 * @returns {Membership}
 */
const membershipReducer = (membership, action) => {
  const { memberInfo } = membership
  const isLogInProcessFinished = true
  switch (action.type) {
    case 'LOGIN': {
      const {
        memberInfo: { memberType = 'not-member' } = {},
        accessToken = '',
        userEmail = '',
        firebaseId = '',
      } = action?.payload ?? {}
      return {
        isLoggedIn: true,
        accessToken: accessToken,
        userEmail,
        memberInfo: {
          ...memberInfo,
          memberType: memberType,
        },
        isLogInProcessFinished,
        firebaseId,
      }
    }
    case 'LOGOUT':
      return {
        isLoggedIn: false,
        accessToken: '',
        userEmail: '',
        memberInfo: {
          memberType: 'not-member',
        },
        isLogInProcessFinished,
        firebaseId: '',
      }

    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}

/**
 * The context provider for managing membership state.
 * The provider not only manage membership state, but also login membership if needed.
 * The process of login membership contain five steps:
 * 1. Add an observer `auth.onAuthStateChanged` to detect whether firebase is sign-in or not.
 * 2. If firebase is sign-in, then get firebase id token.
 * 3. If successfully get firebase id token, then get Access Token, which is sign by WAS (weekly-api-server).
 * 4. If successfully get Access Token, then dispatch a `LOGIN` action, which will store value of Access Token.
 * 5. If firebase is NOT sign-in, or firebase id token is verified invalid by WAS, then dispatch a `LOGOUT` action, which will clear the value of Access Token which previously stored.
 *
 * Please remind two things:
 * 1. "Get Access Token" is an essential piece for login process: if user couldn't get Access Token, it should not be treated as login completely.
 * 2. Sign-in/sign-out to firebase is only part of the login/logout process:
 *    - After firebase sign-in, it is needed get Access token, and dispatch a "LOGIN" action to store access token.
 *    - After firebase sign-out, it is needed to dispatch a "LOGOUT" action to clear access token.
 *
 * @param {Object} props
 * @param {import('react').JSX.Element} props.children
 * @returns {import('react').JSX.Element}
 */
const MembershipProvider = ({ children }) => {
  const [membership, dispatch] = useReducer(
    membershipReducer,
    initialMembership
  )
  const getReferrer = useReferrer()

  useEffect(() => {
    let isMounted = true
    let unsubscribeAuthStateChanged = () => {}

    /**
     * Use function `getIdToken` to get a Firebase JWT Token
     * Return a token string if success, return null if failed.
     * If return `null`, which means some unexpected error occurred on Firebase.
     * @see https://firebase.google.com/docs/reference/js/auth.user.md#usergetidtoken
     *
     * @param {import('firebase/auth').User} user
     * @returns {Promise<import('firebase/auth').IdTokenResult["token"]| null>}
     */
    const getIdToken = async (user) => {
      try {
        const idToken = await user.getIdToken()
        return idToken
      } catch (err) {
        const errorLog = generateErrorReportInfo(err, {
          userEmail: membership.userEmail,
          firebaseId: membership.firebaseId,
          referrer: getReferrer(),
        })
        sendErrorLog(errorLog)

        return null
      }
    }

    /**
     * @param {string} accessToken
     * @returns {MemberType}
     */
    const getMemberType = (accessToken) => {
      try {
        const JwtPayload = accessToken.split('.')[1]

        const buffer = Buffer.from(JwtPayload, 'base64')
        const decodedString = buffer.toString('utf-8')
        const decodedJwtPayload = JSON.parse(decodedString)
        const memberType = decodedJwtPayload.roles[0]
        return memberType
      } catch (e) {
        const errorLog = generateErrorReportInfo(e, {
          userEmail: membership.userEmail,
          firebaseId: membership.firebaseId,
          referrer: getReferrer(),
        })
        sendErrorLog(errorLog)

        return 'not-member'
      }
    }

    /**
     * @typedef {import('firebase/auth').Auth} Auth
     * @type {Parameters<Auth['onAuthStateChanged']>[0]}
     */
    const handleFirebaseAuthStateChanged = async (user) => {
      const [{ auth }, { signOut }] = await Promise.all([
        import('../firebase'),
        import('firebase/auth'),
      ])

      if (user) {
        const idToken = await getIdToken(user)

        if (!idToken) {
          return
        }

        /**
         * Get user Access Token.
         * Access Token is generated by WAS(weekly-api-server).
         * It is need to send post request to `/access-token` and set Firebase id token as a authorization header,
         * WAS will verify Firebase id token and return Access Token if success.
         * By using Access Token, user can access information of certain member account, read member article if has corresponding permissions.
         * @see https://github.com/mirror-media/Adam/blob/dev/packages/weekly-api-server/README.md
         */
        try {
          const accessToken = await getAccessToken(idToken)
          const memberType = getMemberType(accessToken)

          if (accessToken) {
            dispatch({
              type: 'LOGIN',
              payload: {
                accessToken,
                memberInfo: { memberType },
                userEmail: user.email,
                firebaseId: user.uid,
              },
            })
            console.log('Has access token, hurray!')
          }
        } catch (error) {
          /**
           * There are two situations that need to be handled:
           * 1. Firebase id Token is verified by WAS, but it is an invalid id token. The status code is 401.
           * 2. WAS has some unexpected error, such as unable to sign in JWT token, or unable to request GQL server. The status code is 500.
           */
          const statusCode = error?.response?.status
          switch (statusCode) {
            case 401:
              //Logout firebase
              signOut(auth)
              break
            case 500:
            default: {
              const errorLog = generateErrorReportInfo(error, {
                userEmail: user.email,
                firebaseId: user.uid,
                referrer: getReferrer(),
              })
              sendErrorLog(errorLog)
              break
            }
          }
        }
      } else {
        /**
         * If user is not log in firebase, we should dispatch a "LOGOUT" action to clear access token.
         */
        dispatch({ type: 'LOGOUT' })
        removeAccessTokenFromStorage()
      }
    }

    const setupAuthStateChanged = async () => {
      const { auth } = await import('../firebase')

      if (!isMounted) {
        return
      }

      unsubscribeAuthStateChanged = auth.onAuthStateChanged(
        handleFirebaseAuthStateChanged
      )
    }

    setupAuthStateChanged()

    return () => {
      isMounted = false
      unsubscribeAuthStateChanged()
    }
  }, [getReferrer])
  return (
    <MembershipContext.Provider value={membership}>
      <MembershipDispatchContext.Provider value={dispatch}>
        {children}
      </MembershipDispatchContext.Provider>
    </MembershipContext.Provider>
  )
}
/**
 * This context provide the value of property in membership, such as `isLoggedIn`, `accessToken`.
 */
const useMembership = () => {
  return useContext(MembershipContext)
}

/**
 * This context provide the function that lets components dispatch actions to set value of property in membership.
 */
const useMembershipDispatch = () => {
  return useContext(MembershipDispatchContext)
}

/**
 * @param {string} [referrer] - from `useReferrer`, for the error log
 */
const handleFirebaseSignOut = async (referrer) => {
  const [{ auth }, { signOut }] = await Promise.all([
    import('../firebase'),
    import('firebase/auth'),
  ])
  const currentUser = auth.currentUser

  try {
    await signOut(auth)
  } catch (error) {
    const errorLog = generateErrorReportInfo(error, {
      userEmail: currentUser?.email,
      firebaseId: currentUser?.uid,
      referrer,
    })
    sendErrorLog(errorLog)
  }
}
export {
  handleFirebaseSignOut as logout,
  MembershipProvider,
  useMembership,
  useMembershipDispatch,
}
