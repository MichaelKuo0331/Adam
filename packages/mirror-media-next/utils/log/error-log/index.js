import {
  getClientSideOnlyError,
  isServer,
  transformTimeDataIntoSlashFormat,
} from '../../index'
import {
  detectIsInApp,
  getBrowserInfo,
  getDeviceInfo,
  getFormattedPageType,
  getWindowSizeInfo,
} from '../shared'

/**
 * Build the `message` field Error Reporting groups on.
 * Error Reporting only looks at `stack_trace`, `exception` and `message`; when none of them
 * exist it scans every field of the payload for something that looks like a stack trace, so we
 * always hand it one `message`, formatted as `<Name>: <message>` followed by the stack frames —
 * the shape it knows how to parse
 * (see https://cloud.google.com/error-reporting/docs/formatting-error-messages).
 * @param {Error} error
 * @returns {string}
 */
const formatErrorMessage = (error) => {
  const header = `${error.name || 'Error'}: ${error.message}`
  const stack = typeof error.stack === 'string' ? error.stack.trim() : ''

  if (!stack) return header
  // V8 stacks already start with the header; Firefox/Safari stacks are frames only.
  return stack.startsWith(header) ? stack : `${header}\n${stack}`
}

/**
 *
 * @typedef {import('../../../context/membership').MemberType} MemberType
 *
 * @typedef {Object} Payload
 * @property {MemberType} [memberType] - type of member
 * @property {string} [userEmail] - member email
 * @property {string} [firebaseId] - member firebase id
 * @property {boolean} [isMemberArticle] - whether is member article. It will only be `true` if it is on story page and is a member article.
 * @property {string} [referrer] - previous page, from `useReferrer`. Falls back to `document.referrer`.
 */

/**
 * Generate information for error report.
 * The returned object is written to Cloud Logging as-is and becomes the entry's `jsonPayload`,
 * so it follows the layout Error Reporting expects: a top-level `message` carrying the stack
 * trace, plus `context`. `errorLog`, `clientInfo` and `pageInfo` are extra fields Error
 * Reporting ignores; they are kept for querying in Logs Explorer.
 *
 * Caution: Since this function have use Web API, such as `window.location.href`, `window.navigator.userAgent`,
 * this function should be ONLY executed at client-side.
 * @param {Error} error
 * @param {Payload} [payload]
 * @throws {Error}
 */
const generateErrorReportInfo = (error, payload = {}) => {
  if (isServer()) throw getClientSideOnlyError('generateErrorReportInfo')

  const pathname = window.location.pathname
  const {
    memberType = 'not-member',
    userEmail = '',
    firebaseId = '',
    isMemberArticle = false,
    referrer = document.referrer,
  } = payload
  const userAgent = window.navigator.userAgent
  const errorLog = {
    error: {
      name: error.name,
      message: error.message,
    },
    datetime: transformTimeDataIntoSlashFormat(new Date().toISOString(), true),
  }
  const clientInfo = {
    ip: '',
    userInfo: {
      'member-type': memberType,
      email: userEmail,
      'firebase-id': firebaseId,
    },
    browser: getBrowserInfo(userAgent),
    device: getDeviceInfo(userAgent),
    'is-in-app-browser': detectIsInApp(userAgent),
    'screen-size': getWindowSizeInfo(),
  }
  const pageInfo = {
    referral: referrer,
    'page-url': window.location.href,
    'page-type': getFormattedPageType(pathname, isMemberArticle),
  }

  if (pathname.startsWith('/story/')) {
    pageInfo['story-slug'] = pathname.split('/story/')?.[1] ?? ''
  }

  return {
    message: formatErrorMessage(error),
    context: {
      httpRequest: {
        url: window.location.href,
        userAgent,
        referrer,
      },
    },
    errorLog,
    clientInfo,
    pageInfo,
  }
}

export { generateErrorReportInfo }
