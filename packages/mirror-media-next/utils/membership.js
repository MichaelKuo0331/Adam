/**
 * @typedef {import('../context/membership').Membership['accessToken']} AccessToken
 */
import axios from 'axios'

import client from '../apollo/apollo-client'
import { createMember } from '../apollo/membership/mutation/member'
import { fetchAllMember } from '../apollo/membership/query/member'
import { API_TIMEOUT, WEEKLY_API_SERVER_ORIGIN } from '../config/index.mjs'
import { SECOND } from '../constants/time-unit'
import { FormState } from '../slice/login-slice'

import { generateErrorReportInfo } from './log/error-log'
import { sendErrorLog } from './log/send-log'

/**
 * there are 3 error situation:
 * 1: has firebase auth, but no member data in Israfel(login)
 * 2: has created new firebase auth, but member email is duplicated (regiser)
 * 3: some server error
 * in situation 1 and 2:
 * we need to delete this member's firebase account
 * in situation3:
 * do nothing with the firebase auth object
 * @param {Error | import('firebase/app').FirebaseError} error
 * @param {Parameters<generateErrorReportInfo>[1]} [payload]
 */
const errorHandler = async (error, payload) => {
  const [{ auth }, { signOut }] = await Promise.all([
    import('../firebase'),
    import('firebase/auth'),
  ])
  const currentUser = auth.currentUser
  if (
    error?.message === "GraphQL error: Can't find data in Israfel" ||
    error?.message === "this member's email has been used in Israfel"
  ) {
    currentUser?.delete()
  }

  const errorLog = generateErrorReportInfo(
    error,
    payload ?? {
      userEmail: currentUser.email,
      firebaseId: currentUser.uid,
    }
  )
  sendErrorLog(errorLog)

  await signOut(auth)
}

/**
 * This function would create member in Israfel.
 * @param {AccessToken} accessToken
 * @param {string} email
 * @param {string} firebaseId
 */
const createMemberDataInIsrafel = async (accessToken, email, firebaseId) => {
  try {
    await client.mutate({
      mutation: createMember,
      context: {
        uri: '/member/graphql',
        headers: {
          authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
      },
      variables: {
        firebaseId: firebaseId,
        email: email,
      },
    })
  } catch (error) {
    const errorMessage =
      error.message.search('Unique constraint failed on the fields') !== -1
        ? "this member's email has been used in Israfel"
        : error.message

    throw new Error(errorMessage)
  }
}
/**
 * This function fetches basic member information in Israfel.
 * This function would query information of certain member to check if they exist in Israfel.
 * if the member data is found successfully, it is no need to return result, as the data is not needed
 * for other purposes currently, such as store data in Redux.
 * If we need to store it in the future, feel free to modify this function to return query result if needed.
 * @async
 * @param {string} firebaseUid
 * @throws {Error} Throws an error if the GraphQL query fails or if certain member data is not found.
 */
const fetchBasicMemberInfoInIsrafel = async (firebaseUid, accessToken = '') => {
  try {
    const result = await client.query({
      query: fetchAllMember,
      context: {
        uri: '/member/graphql',
        headers: {
          authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
      },
      variables: {
        firebaseId: firebaseUid,
      },
    })
    const memberData = result?.data?.member
    if (!memberData) {
      throw "GraphQL error: Can't find data in Israfel, please check if this member's data existed in Israfel"
    }
  } catch (error) {
    throw new Error(error)
  }
}

const ACCESS_TOKEN_STORE_KEY = 'access-token'

/**
 * @typedef {import('../type/raw-data.typedef').AccessTokenData} AccessTokenData
 */

/**
 * get access token data from localStorage
 *
 * @returns {string | undefined}
 */
/* eslint-disable-next-line no-unused-vars */
const getAccessTokenFromStorage = () => {
  try {
    /** @type {AccessTokenData} */
    const accessTokenData = JSON.parse(
      localStorage.getItem(ACCESS_TOKEN_STORE_KEY)
    )
    const now = new Date().valueOf() / SECOND
    if (accessTokenData.expires_in > now) {
      return accessTokenData.access_token
    }
  } catch (e) {
    // ignore error
  }
  return undefined
}

/**
 * remove access token data from localStorage
 */
const removeAccessTokenFromStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_STORE_KEY)
}

/**
 * @param {string} idToken
 * @param {boolean} [forceUpdate] - fetch from WAS instead of storage
 * @throws {Error}
 * @returns {Promise<string | undefined>}
 */
const getAccessToken = async (idToken, forceUpdate = false) => {
  try {
    if (!forceUpdate) {
      // TODO：uncomment following codes
      // 備註：暫時性關閉這個功能
      // 說明：
      //     因為與會員狀態變動有關的功能（如：單篇解鎖、會員訂閱）還沒實作，無法在會員狀態更新時，強制更新 access token 資訊，
      //     這可能會導致使用者解鎖單篇文章後，無法立即看到文章解鎖的結果
      /**
      const accessToken = getAccessTokenFromStorage()

      if (accessToken) return accessToken
       */
    }

    const res = await axios({
      method: 'post',
      url: `https://${WEEKLY_API_SERVER_ORIGIN}/access-token`,
      headers: {
        authorization: `Bearer ${idToken}`,
      },
      timeout: API_TIMEOUT,
    })

    /** @type {AccessTokenData | undefined} */
    const accessTokenData = res.data.data

    if (accessTokenData) {
      localStorage.setItem(
        ACCESS_TOKEN_STORE_KEY,
        JSON.stringify(accessTokenData)
      )
      return accessTokenData.access_token
    }

    throw Error()
  } catch (error) {
    const statusCode = error?.response?.status
    let errorMessage = ''
    switch (statusCode) {
      case 401:
        errorMessage = 'Firebase ID token has invalid signature'
        break
      case 500:
        errorMessage =
          'Unexpected error occur when getting Access token generated by Israfel'
        break
      default:
        errorMessage =
          'Unexpected error occur when getting Access token generated by Israfel'
        break
    }
    throw new Error(errorMessage)
  }
}
/**
 *
 * @param {import('firebase/auth').User} firebaseAuthUser
 * @param {boolean} isNewUser
 * @param {AccessToken} accessToken
 * @returns
 */
const loginPageOnAuthStateChangeAction = async (
  firebaseAuthUser,
  isNewUser,
  accessToken = ''
) => {
  if (!accessToken) {
    throw new Error(
      "Error occurred at function `loginPageOnAuthStateChangeAction`: Required parameter 'accessToken' is missing."
    )
  }
  const userUid = firebaseAuthUser.uid

  /**
   * If it is a new user(register by email/password or first login by 3 party login), create it member is Israfel
   * If not, then query member basic info to check if certain member is existed in Israfel
   */
  if (isNewUser) {
    const userEmail = firebaseAuthUser.email
    await createMemberDataInIsrafel(accessToken, userEmail, userUid)
    return FormState.RegisterSuccess
  } else {
    await fetchBasicMemberInfoInIsrafel(userUid, accessToken)
    return FormState.LoginSuccess
  }
}

export {
  errorHandler,
  getAccessToken,
  loginPageOnAuthStateChangeAction,
  removeAccessTokenFromStorage,
}
