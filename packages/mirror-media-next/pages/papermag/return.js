import { parse as parseQueryString } from 'node:querystring'

import NewebPay from '@mirrormedia/newebpay-node'
import errors from '@twreporter/errors'
import styled from 'styled-components'

import client from '../../apollo/apollo-client'
import { fetchAllMemberByOrderNo } from '../../apollo/query/magazine-orders'
import Failed from '../../components/papermag/failed'
import Succeeded from '../../components/papermag/succeeded'
import Layout from '../../components/shared/layout'
import Steps from '../../components/subscribe-steps'
import {
  NEWEBPAY_PAPERMAG_IV,
  NEWEBPAY_PAPERMAG_KEY,
} from '../../config/index.mjs'
import { COUPON_DISCOUNT } from '../../constants/papermag'
import { fetchHeaderDataInDefaultPageLayout } from '../../utils/api'
import { setPageCache } from '../../utils/cache-setting'
import { getSectionAndTopicFromDefaultHeaderData } from '../../utils/data-process'
import { getLogTraceObject, transformTimeData } from '../../utils/index'
import { getMerchandiseAndShippingFeeInfo } from '../../utils/papermag'
import { processSettledResult } from '../../utils/response-processor'

const Wrapper = styled.main`
  min-height: 50vh;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 8px;

  ${({ theme }) => theme.breakpoint.md} {
    padding: 20;
  }

  ${({ theme }) => theme.breakpoint.lg} {
    padding: 0;
  }
`

const REQUEST_BODY_LIMIT_BYTES = 1024 * 1024

/**
 * Reads and parses the raw POST body for this page's getServerSideProps.
 *
 * Added during the Next.js 14 upgrade: Next 14 removed the private
 * `next/dist/server/api-utils/node` parseBody helper this page previously used.
 * A page's getServerSideProps only receives a raw Node IncomingMessage and
 * Next.js does not parse the body for pages (only for API routes), so we read
 * the request stream ourselves. Enforces a 1mb limit, parses `application/json`
 * and otherwise treats the body as a urlencoded form post (the NewebPay return),
 * and rejects oversized / invalid bodies so the caller's try/catch renders the
 * failure page instead of throwing an uncaught error in the stream callback.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<Record<string, unknown>>}
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let bodySize = 0
    let isSettled = false
    const chunks = []

    const resolveOnce = (value) => {
      if (isSettled) {
        return
      }

      isSettled = true
      resolve(value)
    }

    const rejectOnce = (err) => {
      if (isSettled) {
        return
      }

      isSettled = true
      reject(err)
    }

    req.on('data', (chunk) => {
      bodySize += chunk.length

      if (bodySize > REQUEST_BODY_LIMIT_BYTES) {
        rejectOnce(new Error('Request body exceeded 1mb limit'))
        req.destroy()
        return
      }

      chunks.push(chunk)
    })

    req.on('end', () => {
      if (isSettled) {
        return
      }

      const rawBody = Buffer.concat(chunks).toString('utf8')
      const contentType = req.headers['content-type'] || ''

      if (contentType.includes('application/json')) {
        try {
          resolveOnce(rawBody ? JSON.parse(rawBody) : {})
        } catch (err) {
          rejectOnce(err)
        }

        return
      }

      resolveOnce(parseQueryString(rawBody))
    })

    req.on('error', rejectOnce)
    req.on('close', () => {
      if (!isSettled) {
        rejectOnce(new Error('Request aborted by client'))
      }
    })
  })
}

/**
 * @typedef PurchasedItem
 * @property {string} name
 * @property {number} itemCount
 * @property {number} shippingCost
 * @property {number} costWithoutShipping
 * @property {number} discount
 * @property {number} total
 *
 */

/**
 * @typedef OrderData
 * @property {string} orderId
 * @property {string} date
 * @property {string} [discountCode]
 * @property {string} purchaseName
 * @property {string} purchaseEmail
 * @property {string} purchaseMobile
 * @property {string} receiveName
 * @property {string} receiveMobile
 * @property {string} receiveAddress
 * @property {PurchasedItem} orderInfoPurchasedList
 */

/**
 * @typedef PageProps
 * @property {import('../../utils/api').HeadersData} sectionsData
 * @property {import('../../utils/api').Topics} topicsData
 * @property {string} orderStatus
 * @property {{} | OrderData} orderData
 */

/**
 * @param {PageProps} props
 * @returns {React.ReactNode}
 */
export default function Return({
  flashNewsData = [],
  sectionsData = [],
  topicsData = [],
  orderData,
  orderStatus = 'fail',
}) {
  const isSucceeded = orderStatus === 'SUCCESS'

  return (
    <Layout
      head={{
        title: `紙本雜誌訂閱結果`,
        robotsMetaContent: 'noindex',
      }}
      header={{
        type: 'default',
        data: { flashNewsData, sectionsData, topicsData },
      }}
    >
      <>
        <Steps activeStep={3} />
        <hr />
        <Wrapper>
          {isSucceeded ? <Succeeded orderData={orderData} /> : <Failed />}
        </Wrapper>
      </>
    </Layout>
  )
}

/**
 * @type {import('next').GetServerSideProps<PageProps>}
 */
export async function getServerSideProps({ query, req, res }) {
  setPageCache(res, { cachePolicy: 'no-store' }, req.url)

  const globalLogFields = getLogTraceObject(req)

  // Fetch header data
  const responses = await Promise.allSettled([
    fetchHeaderDataInDefaultPageLayout(),
  ])

  const [sectionsData, topicsData, flashNewsData] = processSettledResult(
    responses[0],
    getSectionAndTopicFromDefaultHeaderData,
    'Error occurs while getting header data in papermag/return page',
    globalLogFields
  )

  let orderData = {}
  let orderStatus = 'fail'

  if (query && Object.prototype.hasOwnProperty.call(query, 'order-fail')) {
    return {
      props: {
        flashNewsData,
        sectionsData,
        topicsData,
        orderStatus,
        orderData,
      },
    }
  } else if (req.method !== 'POST') {
    return {
      redirect: {
        destination: '/papermag',
        permanent: false,
      },
    }
  }

  try {
    // 資料來源：https://github.com/vercel/next.js/discussions/14979
    const infoData = await parseRequestBody(req)
    if (infoData.Status !== 'SUCCESS') {
      return {
        props: { sectionsData, topicsData, orderStatus, orderData },
      }
    }

    const newebpay = new NewebPay(NEWEBPAY_PAPERMAG_KEY, NEWEBPAY_PAPERMAG_IV)
    const decryptedTradeInfo = await newebpay.getDecryptedTradeInfo(
      infoData.TradeInfo
    )

    const MerchantOrderNo =
      decryptedTradeInfo.Result?.MerchantOrderNo ||
      JSON.parse(Object.keys(decryptedTradeInfo)[0]).Result.MerchantOrderNo

    const result = await client.query({
      query: fetchAllMemberByOrderNo,
      context: {
        uri: '/member/graphql',
        headers: {
          // getServerSideProps only: the proxy attaches the member session
          // for internal-key callers so the fresh order can be looked up.
          'X-Internal-Api-Key': process.env.INTERNAL_API_KEY ?? '',
        },
      },
      variables: { orderNumber: MerchantOrderNo },
    })

    const magazineOrderData = result?.data?.magazineOrders?.[0]
    if (!magazineOrderData) {
      return {
        props: { sectionsData, topicsData, orderStatus, orderData },
      }
    }

    const { itemCount, promoteCode, totalAmount } = magazineOrderData

    const { name, shippingFee } = getMerchandiseAndShippingFeeInfo(
      magazineOrderData?.merchandise?.code
    )

    const discount = promoteCode ? COUPON_DISCOUNT * itemCount : 0
    const shippingCost = shippingFee * itemCount

    const orderInfoPurchasedList = {
      name,
      itemCount,
      costWithoutShipping: totalAmount - shippingCost + discount,
      shippingCost,
      discount,
      total: totalAmount,
    }

    orderData = {
      orderId: magazineOrderData.orderNumber,
      date: transformTimeData(magazineOrderData.createdAt, 'dash'),
      discountCode: magazineOrderData.promoteCode,
      orderInfoPurchasedList,
      purchaseName: magazineOrderData.purchaseName,
      purchaseEmail: magazineOrderData.purchaseEmail,
      purchaseMobile: magazineOrderData.purchaseMobile,
      receiveName: magazineOrderData.receiveName,
      receiveMobile: magazineOrderData.receiveMobile,
      receiveAddress: magazineOrderData.receiveAddress,
    }
    orderStatus = infoData.Status
  } catch (err) {
    const annotatingAxiosError = errors.helpers.annotateAxiosError(err)
    console.error(
      JSON.stringify({
        severity: 'ERROR',
        message: errors.helpers.printAll(annotatingAxiosError, {
          withStack: true,
          withPayload: true,
        }),
        ...globalLogFields,
      })
    )
  }

  return {
    props: {
      flashNewsData,
      sectionsData,
      topicsData,
      orderData,
      orderStatus,
    },
  }
}
