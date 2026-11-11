import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { GCP_PROJECT_ID, SITE_URL } from '../config/index.mjs'

/**
 * @typedef {{ id?: string | null, name?: string | null, slug?: string | null, state?: string | null } | null} SectionLike
 * @typedef {SectionLike[]} Sections
 */
/**
 * @typedef {import('../apollo/fragments/category').Category} Category
 */
/**
 * @typedef {Category[]} Categories
 */

/**
 * Get path of article base on different article style, and whether is external article.
 * @param {String} slug
 * @param {import('../type/raw-data.typedef').ArticleStyle} style
 * @param {Object |''} partner
 * @returns {String}
 */
const getArticleHref = (slug, style, partner) => {
  if (partner) {
    return `/external/${slug}/`
  }
  if (style === 'campaign') {
    return `/campaigns/${slug}`
  } else if (style === 'projects') {
    return `/projects/${slug}/`
  }
  /**
   * TODO: condition `isPremiumMember` is whether user is log in and is premium member,
   * We haven't migrate membership system yet, so remove this condition temporally.
   */
  // else if (isPremiumMember) {
  //   return `pre/story/${slug}/`
  // }

  return `/story/${slug}/`
}

/**
 * Get section slug based on different condition
 * @param {Sections} sections
 * @param {Object | ''} partner
 * @returns {String | undefined}
 */
function getSectionSlugGql(sections = [], partner = '') {
  if (partner) {
    return 'external'
  } else if (sections?.some((section) => section.slug === 'member')) {
    return 'member'
  }
  return sections[0]?.slug
}

/**
 * Get section name based on different condition
 * @param {Sections} sections
 * @param {Object | ''} partner
 * @returns {String | undefined}
 */
function getSectionNameGql(sections = [], partner) {
  if (partner) {
    if (partner.slug === 'healthnews') {
      return '生活'
    } else if (partner.slug === 'ebc') {
      return '時事'
    } else {
      return '時事'
    }
  }

  if (sections.length > 0) {
    if (sections.some((section) => section.slug === 'member')) {
      return '會員專區'
    } else {
      return sections[0]?.name
    }
  }
  return undefined
}

/**
  * Converts a UTC timestamp string to a Taipei time ISO 8601 string.
  *
  * @param {string | null | undefined} utcTimeStamp - The UTC timestamp (e.g., "2025-10-15T17:11:00Z").
  * @returns {string | undefined} The ISO 8601 string in Taipei time
  (e.g., "2025-10-16T01:11:00+08:00"), or undefined if the input is invalid.
   */
const toTaipeiISOString = (utcTimeStamp) => {
  if (!utcTimeStamp) return

  dayjs.extend(utc)
  dayjs.extend(timezone)
  return dayjs(utcTimeStamp).tz('Asia/Taipei').format()
}

/**
 * Transform params `time` into different pattern
 * depend on the type 'dot' or 'slash' or 'slashWithTime'
 * If `time` is not a valid date, this function will return undefined
 * @param {string} time
 * @param {'dot' | 'slash'| 'slashWithTime'|'dash'} format
 * @returns {string | undefined}
 */
const transformTimeData = (time, format) => {
  dayjs.extend(utc)

  const timeData = dayjs(time).utcOffset(8)

  if (!timeData.isValid()) {
    return undefined
  } else {
    switch (format) {
      case 'dot':
        return timeData.format('YYYY.MM.DD HH:mm')

      case 'slash':
        return timeData.format('YYYY/MM/DD')

      case 'slashWithTime':
        return timeData.format('YYYY/MM/DD HH:mm')

      case 'dash':
        return timeData.format('YYYY-MM-DD')

      default:
        return undefined
    }
  }
}

/**
 * Transform params `time` into `YYYY.MM.DD HH:MM` pattern
 * If `time` is not a valid date, this function will return undefined
 * @param {String} time
 * @returns {string | undefined}
 */
const transformTimeDataIntoDotFormat = (time) => {
  return transformTimeData(time, 'dot')
}

/**
 * Transform params `time` into `YYYY/MM/DD HH:MM` pattern
 * If `time` is not a valid date, this function will return undefined
 * @param {String} time
 * @param {boolean} includeTime - Whether to include time or not. Default is true.
 * @returns {string | undefined}
 */
const transformTimeDataIntoSlashFormat = (time, includeTime = true) => {
  const format = includeTime ? 'slashWithTime' : 'slash'
  return transformTimeData(time, format)
}

//TODO: add more specific type in param `arrayNeedToSort` and `arraySortReference`
/**
 * Sorts an array of objects based on the order of ids in another array of objects.
 * @template {{ id: any }} T
 * @template {{ id: any }} S
 * @param {T[]} arrayNeedToSort
 * @param {S[]} arraySortReference
 */
const sortArrayWithOtherArrayId = (arrayNeedToSort, arraySortReference) => {
  const sortedArray = arrayNeedToSort.slice().sort((a, b) => {
    const aIndex = arraySortReference.findIndex((x) => x.id === a.id)
    const bIndex = arraySortReference.findIndex((x) => x.id === b.id)
    return aIndex - bIndex
  })
  return sortedArray
}

/**
Get the magazine href from a given slug.
@param {string} slug
@returns {string}
*/
const getMagazineHrefFromSlug = (slug) => {
  const issue = slug.match(/\d+/)[0]
  const book = slug.endsWith('A本') ? 'A' : 'B'
  const href = `/magazine/Book_${book}/${book}${issue}-Publish`
  return href
}

/**
 * array of categories with the slug 'wine' or 'wine1'.
 * @param {{ slug: string | null }[]} categories - certain category information
 * @returns {{ slug: string | null }[] | []}
 */
const getCategoryOfWineSlug = (categories) => {
  if (Array.isArray(categories)) {
    return categories.filter(
      (category) => category.slug === 'wine' || category.slug === 'wine1'
    )
  }
  return []
}

/**
 * Convert the `text` content in `rawContentBlock` data (h2, h3, unstyled)
 * and combine the first 160 characters as a plain text description for `og-description`.
 * @param {import('../type/draft-js').Draft} rawContentBlock
 * @returns {string | undefined}
 */
const convertDraftToText = (rawContentBlock) => {
  if (
    rawContentBlock &&
    rawContentBlock?.blocks &&
    rawContentBlock.blocks.length > 0
  ) {
    const text = rawContentBlock.blocks.map((block) => block.text).join('')

    const ogDescription =
      text && text.length > 160
        ? text.trim().slice(0, 160) + '...'
        : text.trim()

    return ogDescription
  } else {
    return undefined
  }
}

/**
 * To get the URL link for `og-image`, sorted in ascending order based on file size.
 * Skip w480 to prevent image size minimum 200 x 200.
 * It's recommended for using images which is at least 1200 * 630 pixels on high resolution devices, so we use w1600 at first.
 * @see https://developers.facebook.com/docs/sharing/webmasters/images
 * @param {Partial<Record<keyof import('../apollo/fragments/photo').Resized, string | null>> | undefined | null} resized
 * @returns {string | undefined}
 */
const getResizedUrl = (resized) => {
  if (resized) {
    return resized?.w1600 || resized?.w2400 || resized?.original
  } else {
    return undefined
  }
}

/**
 * Returns a string representation of a number with commas as thousand separators.
 *
 * @param {number} num - The number to convert to a string with commas.
 * @return {string} The string representation of the number with commas.
 */
const getNumberWithCommas = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Return sections that are in `active` state and sorted.
 *
 * @param {Sections | null | undefined} sections
 * @param {Sections | null | undefined} sectionsInInputOrder
 * @return {Sections}
 */
const getActiveOrderSection = (sections, sectionsInInputOrder) => {
  /**
   * Because `sections` can be filtered by `where` in GraphQL based on whether `state` is active,
   * but `sectionsInInputOrder` doesn't have `where`.
   *
   * Need to filter state of `sectionsInInputOrder` to match the results of sections.
   */
  const activeSectionsOrder = Array.isArray(sectionsInInputOrder)
    ? sectionsInInputOrder.filter((section) => section?.state === 'active')
    : []

  /**
   * Although `sections` already filter `state` at GraphQL ,
   * for the sake of maintaining same logic between `sectionsInInputOrder` and `sections`,
   * filter `state` status of `sections` again.
   * */
  const activeSections = Array.isArray(sections)
    ? sections.filter((section) => section?.state === 'active')
    : []

  if (activeSectionsOrder.length > 0) {
    return activeSectionsOrder
  } else if (activeSections.length > 0) {
    return activeSections
  } else {
    return []
  }
}

/**
 * Return categories that are in `active` state and sorted.
 *
 * @param {Categories | null} categories
 * @param {Categories} categoriesInInputOrder
 * @return {Categories}
 */
const getActiveOrderCategory = (categories, categoriesInInputOrder) => {
  /**
   * Because `categories` can be filtered by `where` in GraphQL based on whether `state` is active,
   * but `categoriesInInputOrder` doesn't have `where`.
   *
   * Need to filter state of `categoriesInInputOrder` to match the results of categories.
   */
  const activeCategoriesOrder = Array.isArray(categoriesInInputOrder)
    ? categoriesInInputOrder.filter((category) => category.state === 'active')
    : []

  /**
   * Although `categories` already filter `state` at GraphQL ,
   * for the sake of maintaining same logic between `categoriesInInputOrder` and `categories`,
   * filter `state` status of `categories` again.
   * */
  const activeCategories = Array.isArray(categories)
    ? categories.filter((category) => category.state === 'active')
    : []

  if (activeCategoriesOrder.length > 0) {
    return activeCategoriesOrder
  } else if (activeCategories.length > 0) {
    return activeCategories
  } else {
    return []
  }
}

/**
 * Verify email input
 *
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return regex.test(email)
}

/**
 * Verify if the email is a company email
 *
 * @param {string} email
 * @returns {boolean}
 */
const isCompanyEmail = (email) => {
  const validSuffixes = [
    '@mnews.com.tw',
    '@mnews.tw',
    '@mirrormedia.mg',
    '@mirrorfiction.com',
    '@mirrordaily.news',
  ]
  return validSuffixes.some((suffix) => email.endsWith(suffix))
}

/**
 * @param {import('next/router').NextRouter} router
 * @returns {import('next/link').LinkProps['href']}
 */
const getLoginHref = (router) => {
  const pathname = router.pathname

  // 404 是 auto-export 頁，SSR 的 asPath 被 Next 固定成 /404，client 端則是使用者真正打的網址，
  // asPath 會造成 hydration mismatch。登入後導回一個不存在的網址，本來就沒意義，所以固定回首頁。
  if (pathname === '/404') {
    return {
      pathname: '/login',
      query: {
        destination: '/',
      },
    }
  }

  if (pathname === '/login') {
    const queryParam = router.query
    let destination = queryParam.destination

    if (Array.isArray(destination)) {
      destination = destination.join(',')
    }

    if (destination) {
      return {
        pathname: '/login',
        query: {
          ...queryParam,
        },
      }
    } else {
      return {
        pathname: '/login',
        query: {
          destination: '/',
          ...queryParam,
        },
      }
    }
  } else {
    const urlObject = new URL(
      router.asPath,
      'https://www.google.com' /** sample base */
    )
    const searchParams = Object.fromEntries(urlObject.searchParams.entries())

    return {
      pathname: '/login',
      query: {
        destination: urlObject.pathname, // avoid dynamic route repreentaion, e.g., /story/[slug]
        ...searchParams,
      },
    }
  }
}

/**
 * True when `asPath` has any `utm_*`, `fb_*` or `fbclid` query param.
 * @param {string} [asPath] - Next.js `router.asPath`
 * @returns {boolean}
 */
const hasUtmOrFbParamsInAsPath = (asPath) => {
  if (!asPath || typeof asPath !== 'string') return false
  try {
    const urlObject = new URL(
      asPath,
      'https://www.google.com' /** sample base; same as getLoginHref */
    )

    for (const key of urlObject.searchParams.keys()) {
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.startsWith('utm_') ||
        lowerKey.startsWith('fb_') ||
        lowerKey.startsWith('fbclid')
      )
        return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Links from the CMS or from constants are hard-coded to the production
 * domain regardless of which environment is currently serving the page, so
 * this checks against the `mirrormedia.mg` domain family (not just the
 * env-varying `SITE_URL`, which would otherwise misclassify production links
 * as external when viewed on dev/staging). `SITE_URL` is also checked so
 * relative paths and same-origin absolute urls resolve correctly for the
 * current environment (e.g. a `localhost` link while running `pnpm dev`).
 * @param {string} url
 * @returns {boolean}
 */
const isInternalUrl = (url) => {
  try {
    const { hostname } = new URL(url, `https://${SITE_URL}`)
    return (
      hostname === SITE_URL ||
      hostname === 'mirrormedia.mg' ||
      hostname.endsWith('.mirrormedia.mg')
    )
  } catch {
    return false
  }
}

/**
 * Whether a link points at the current site's host, for deciding `target`:
 * any other host, including other `mirrormedia.mg` subdomains, opens in a new
 * tab. `rel` still uses `isInternalUrl`, so subdomains keep the referrer.
 * @param {string} url
 * @returns {boolean}
 */
const isSiteUrl = (url) => {
  try {
    return new URL(url, `https://${SITE_URL}`).hostname === SITE_URL
  } catch {
    return false
  }
}

const isServer = () => {
  return typeof window === 'undefined' ? true : false
}

/**
 * @param {string} functionName
 * @returns
 */
const getClientSideOnlyError = (functionName) => {
  return new Error(`Method ${functionName} is client-side only`)
}

/**
 * @param {import('querystring').ParsedUrlQuery} query
 * @param {string} key
 * @returns {string | string[] | undefined}
 */
const getSearchParamFromApiKeyUrl = (query, key) => {
  if (key in query) {
    return query[key]
  }

  const apiKeyUrl = Object.keys(query).find((key) => key.includes('apiKey'))
  return new URLSearchParams(apiKeyUrl).get(key)
}

/**
 * @param {import('http').IncomingMessage} req
 */
const getLogTraceObject = (req) => {
  const traceHeader = req?.headers?.['x-cloud-trace-context']
  let globalLogFields = {}
  if (traceHeader && !Array.isArray(traceHeader)) {
    const [trace] = traceHeader.split('/')
    globalLogFields['logging.googleapis.com/trace'] =
      `projects/${GCP_PROJECT_ID}/traces/${trace}`
  }
  return globalLogFields
}

export {
  convertDraftToText,
  getActiveOrderCategory,
  getActiveOrderSection,
  getArticleHref,
  getCategoryOfWineSlug,
  getClientSideOnlyError,
  getLoginHref,
  getLogTraceObject,
  getMagazineHrefFromSlug,
  getNumberWithCommas,
  getResizedUrl,
  getSearchParamFromApiKeyUrl,
  getSectionNameGql,
  getSectionSlugGql,
  hasUtmOrFbParamsInAsPath,
  isCompanyEmail,
  isInternalUrl,
  isServer,
  isSiteUrl,
  isValidEmail,
  sortArrayWithOtherArrayId,
  toTaipeiISOString,
  transformTimeData,
  transformTimeDataIntoDotFormat,
  transformTimeDataIntoSlashFormat,
}
