import type { NextApiRequest, NextApiResponse } from 'next'
import type { TypedDocumentNode } from '@apollo/client'
import NewebPay from '@mirrormedia/newebpay-node'
import errors from '@twreporter/errors'

import type {
  FetchPaymentDataOfPapermagMutation,
  FetchPaymentDataOfPapermagMutationVariables,
} from '../../apollo/__generated__/member/graphql'
import client from '../../apollo/apollo-client'
import { fetchPaymentDataOfPapermag } from '../../apollo/membership/mutation/magazine-order'
import {
  ENV,
  NEWEBPAY_PAPERMAG_IV,
  NEWEBPAY_PAPERMAG_KEY,
  SITE_URL,
} from '../../config/index.mjs'
import { PLAN_LIST } from '../../constants/papermag'

type PapermagTradeInfoInput =
  FetchPaymentDataOfPapermagMutationVariables['data']

type TradeInfo = FetchPaymentDataOfPapermagMutationVariables & {
  data: PapermagTradeInfoInput & {
    Amt?: unknown
    merchandise: {
      connect: {
        code: string
      }
    }
    itemCount: number
    promoteCode?: string | null
  }
}

type NewebpayTradeInfo = NonNullable<
  FetchPaymentDataOfPapermagMutation['createNewebpayTradeInfoForMagazineOrder']
> & {
  ReturnURL: string
  CREDIT: number
  Version: string
}

type PaymentDataOfMagazineOrders = {
  createNewebpayTradeInfoForMagazineOrder: NewebpayTradeInfo
}

async function fireGqlRequest(
  mutation: TypedDocumentNode<
    FetchPaymentDataOfPapermagMutation,
    FetchPaymentDataOfPapermagMutationVariables
  >,
  variables: FetchPaymentDataOfPapermagMutationVariables
): ReturnType<typeof client.mutate<FetchPaymentDataOfPapermagMutation>> {
  let result: Awaited<
    ReturnType<typeof client.mutate<FetchPaymentDataOfPapermagMutation>>
  >
  try {
    result = await client.mutate({
      mutation: mutation,
      context: {
        uri: '/member/graphql',
        headers: {
          'content-type': 'application/json',
          'Cache-Control': 'no-cache',
          // Server-side only: lets the weekly-api-server proxy allow this
          // mutation and attach the member session. Never exposed to clients.
          'X-Internal-Api-Key': process.env.INTERNAL_API_KEY ?? '',
        },
      },
      variables,
    })
    if (result.errors) {
      throw new Error(String(result.errors))
    }
  } catch (e) {
    throw new Error(String(e))
  }

  return result
}

async function getPaymentDataOfMagazineOrders(
  variables: FetchPaymentDataOfPapermagMutationVariables
): Promise<PaymentDataOfMagazineOrders> {
  const { data } = await fireGqlRequest(fetchPaymentDataOfPapermag, variables)
  const tradeInfo = data?.createNewebpayTradeInfoForMagazineOrder
  if (!tradeInfo) {
    throw new Error('Failed to create NewebPay trade info')
  }

  return {
    createNewebpayTradeInfoForMagazineOrder: {
      ...tradeInfo,
      ReturnURL:
        ENV === 'local'
          ? `http://localhost:3000/papermag/return`
          : `https://${SITE_URL}/papermag/return`,
      CREDIT: 1,
      Version: '2.2',
    },
  }
}

export default async function EncryptInfo(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const tradeInfo = req.body as TradeInfo
  try {
    // 防止使用者自行修改 Amt 的值
    // 詳見：https://app.asana.com/1/614399484723017/project/1210077071799813/task/1210384428427743?focus=true
    const hasInputAmt = Object.prototype.hasOwnProperty.call(
      tradeInfo.data,
      'Amt'
    )
    const paymentInput = { ...tradeInfo.data }
    delete paymentInput.Amt
    if (hasInputAmt) {
      throw new Error('Amt is not correct input')
    }

    const variables: FetchPaymentDataOfPapermagMutationVariables = {
      data: paymentInput,
    }
    const data = await getPaymentDataOfMagazineOrders(variables)
    const infoForNewebpay = data.createNewebpayTradeInfoForMagazineOrder

    const itemCode = tradeInfo.data.merchandise.connect.code
    const item = PLAN_LIST.find((item) => item.code === itemCode)
    if (!item) {
      throw new Error('item is not correct input')
    }
    const itemPrice = item.price
    const itemCount = tradeInfo.data.itemCount
    const hasPromoteCode = !!tradeInfo.data.promoteCode
    const promoteCodeDiscount = hasPromoteCode ? 80 * itemCount : 0
    const totalPrice = itemPrice * itemCount - promoteCodeDiscount
    if (totalPrice !== infoForNewebpay.Amt) {
      throw new Error(
        `Amt is not correct input, Amt is ${infoForNewebpay.Amt}, but should be ${totalPrice}`
      )
    }

    const newebpay = new NewebPay(NEWEBPAY_PAPERMAG_KEY, NEWEBPAY_PAPERMAG_IV)
    const encryptPostData =
      await newebpay.getEncryptedFormPostData(infoForNewebpay)

    res.send({
      status: 'success',
      data: encryptPostData,
    })
  } catch (e) {
    const error = e as Error
    const helpers = errors.helpers as typeof errors.helpers & {
      wrap: (error: unknown, name: string, message: string) => Error
    }
    const annotatingError = helpers.wrap(
      error.message,
      'UnhandledError',
      'Error occurs while submit papermag'
    )
    console.log(
      JSON.stringify({
        severity: 'ERROR',
        message: errors.helpers.printAll(
          annotatingError,
          {
            withStack: true,
            withPayload: true,
          },
          0,
          0
        ),
      })
    )
    // console.error(
    //   JSON.stringify({
    //     message: `papermag payload:`,
    //     debugPayload: {
    //       'req.body': req.body,
    //       error: e.message, // Print the whole error object
    //     },
    //     'logging.googleapis.com/trace': `projects/mirrormedia-1470651750304/traces/papermag`,
    //   })
    // )
    res.status(500).send({
      status: 'error',
      message: error.message,
    })
  }
}
