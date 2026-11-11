import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import styled from 'styled-components'

import { NEWEBPAY_PAPERMAG_API_URL } from '../../config/index.mjs'
import { RECEIPT_OPTION } from '../../constants/papermag'
import { SECOND } from '../../constants/time-unit'
import { useReferrer } from '../../context/referrer'
import { generateErrorReportInfo } from '../../utils/log/error-log'
import { sendErrorLog } from '../../utils/log/send-log'
import {
  checkOrdererValues,
  checkRecipientValues,
  getPlanInfoByIdAndShouldFreight,
} from '../../utils/papermag'

import AcceptingTermsAndConditions from './form-detail/accepting-terms-and-conditions'
import ApplyDiscount from './form-detail/apply-discount'
import CheckoutBtn from './form-detail/checkout-btn'
import MerchandiseItem from './form-detail/merchandise-item'
import NewebpayForm from './form-detail/newebpay-form'
import Orderer from './form-detail/orderer'
import PurchaseInfo from './form-detail/purchase-info'
import Receipt from './form-detail/receipt'
import Recipient from './form-detail/recipient'
import Shipping from './form-detail/shipping'

const Form = styled.form`
  display: flex;
  flex-direction: column-reverse;
  justify-content: center;
  padding: 0 8px;

  ${({ theme }) => theme.breakpoint.md} {
    flex-direction: row;
  }
`

const LeftWrapper = styled.div`
  width: 100%;
  padding: 0 10px;

  ${({ theme }) => theme.breakpoint.md} {
    max-width: 500px;
    margin-right: 20px;
  }

  ${({ theme }) => theme.breakpoint.lg} {
    margin-right: 60px;
    padding: 0;
  }
`
const RightWrapper = styled.div`
  width: 100%;

  ${({ theme }) => theme.breakpoint.md} {
    max-width: 400px;
  }
`

/**
 * @typedef OrderValues
 * @property {string} username
 * @property {string} cellphone
 * @property {string} phone
 * @property {string} phoneExt
 * @property {string} address
 * @property {string} email
 */

/**
 * @typedef RecipientValues
 * @property {string} username
 * @property {string} cellphone
 * @property {string} phone
 * @property {string} phoneExt
 * @property {string} address
 */

/**
 * @typedef {import('./form-detail/receipt').DonateOption} DonateOption
 * @typedef {import('./form-detail/receipt').CarrierOption} CarrierOption
 * @typedef {import('./form-detail/receipt').OtherOption} OtherOption
 * @typedef {import('./form-detail/receipt').Data} Data
 * @typedef {import('../../constants/papermag').ReceiptOptionEnum} ReceiptOptionEnum
 */

/**
 * @typedef Props
 * @property {import('../../constants/papermag').PlanEnum} plan
 *
 * @param {Props} props
 * @returns {React.ReactNode}
 */
export default function SubscribePaperMagForm({ plan }) {
  const router = useRouter()
  const getReferrer = useReferrer()
  const formMerchantIDRef = useRef(/** @type {HTMLInputElement} */ (null))
  const [isProcessing, setIsProcessing] = useState(false)

  const [count, setCount] = useState(1)
  const [renewCouponApplied, setRenewCouponApplied] = useState(false)
  const [shouldCountFreight, setShouldCountFreight] = useState(false)
  const [promoteCode, setPromoteCode] = useState(
    /** @type {string | null} */ (null)
  )

  const [ordererValues, setOrdererValues] = useState(
    /** @type {OrderValues} */ ({
      username: '',
      cellphone: '',
      phone: '',
      phoneExt: '',
      address: '',
      email: '',
    })
  )

  const [recipientValues, setRecipientValues] = useState(
    /** @type {RecipientValues} */ ({
      username: '',
      cellphone: '',
      phone: '',
      phoneExt: '',
      address: '',
    })
  )

  const [paymentPayload, setPaymentPayload] = useState({
    MerchantID: '',
    TradeInfo: '',
    TradeSha: '',
    Version: '',
  })

  const [sameAsOrderer, setSameAsOrderer] = useState(false)
  const [isAcceptedConditions, setIsAcceptedConditions] = useState(false)
  const [receiptOption, setReceiptOption] = useState(
    /** @type {ReceiptOptionEnum} */ (null)
  )

  //show a warning message if the isAcceptedConditions is true but the receiptOption is null
  const showWarning = useMemo(
    () => isAcceptedConditions && receiptOption === null,
    [isAcceptedConditions, receiptOption]
  )

  const [receiptData, setReceiptData] = useState(
    /** @type {Data | null} */ (null)
  ) // update the receiptData state

  const checkValidation = () => {
    let recipient = recipientValues //收件者資料
    if (sameAsOrderer) {
      recipient = { ...ordererValues } //收件者同訂購人資訊
    }

    if (
      checkOrdererValues(ordererValues) &&
      checkRecipientValues(recipient) &&
      isAcceptedConditions &&
      receiptOption !== null
    ) {
      return true
    } else {
      return false
    }
  }

  const formateOrderPayload = () => {
    const { code: merchandiseName, title: orderDesc } =
      getPlanInfoByIdAndShouldFreight(plan, shouldCountFreight)

    const promoteCodeStr = promoteCode ? `MR${promoteCode}` : ''
    const loveCode =
      receiptOption === RECEIPT_OPTION.DONATE
        ? Number(/** @type {DonateOption} */ (receiptData.value).code)
        : null
    const receiptType = receiptOption === RECEIPT_OPTION.TRIPPLE ? 'B2B' : 'B2C'
    const buyerName =
      receiptOption === RECEIPT_OPTION.TRIPPLE
        ? /** @type {OtherOption}*/ (receiptData.value)['抬頭']
        : ''
    const buyerUBN =
      receiptOption === RECEIPT_OPTION.TRIPPLE
        ? /** @type {OtherOption}*/ (receiptData.value)['統一編號']
        : ''

    let carrierType = '' //載具類別
    let carrierNum = '' //載具編號
    let recipient = recipientValues //收件者資料

    if (sameAsOrderer) {
      recipient = { ...ordererValues }
    }

    if (receiptOption === RECEIPT_OPTION.WITH_CARRIER) {
      switch (receiptData.name) {
        case '二聯式發票（含載具）- 手機條碼':
          carrierType = '0'
          carrierNum = /** @type {string}*/ (receiptData.value)
          break
        case '二聯式發票（含載具）- 自然人憑證':
          carrierType = '1'
          carrierNum = /** @type {string}*/ (receiptData.value)
          break
        case '二聯式發票（含載具）- 電子發票載具':
          carrierType = '2'
          carrierNum = ordererValues.email
          break
        default:
          carrierNum = ''
          carrierType = ''
          break
      }
    }

    return {
      merchandiseName,
      orderDesc,
      promoteCodeStr,
      loveCode,
      receiptType,
      buyerName,
      buyerUBN,
      carrierNum,
      carrierType,
      recipient,
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isProcessing) return

    // Check form validity again: if invalid, redirect to return fail page
    if (!checkValidation()) {
      setIsProcessing(false)
      router.push(`/papermag/return?order-fail=true`)
      return
    }

    setIsProcessing(true)

    const {
      merchandiseName,
      orderDesc,
      promoteCodeStr,
      loveCode,
      receiptType,
      buyerName,
      buyerUBN,
      carrierNum,
      carrierType,
      recipient,
    } = formateOrderPayload()

    // If everything is valid, proceed with submitting the form data
    // carry encrypted paymentPayload and submit to newebpay
    const requestBody = {
      data: {
        desc: orderDesc, //訂單描述
        comment: '', //約定事項
        merchandise: {
          connect: {
            code: merchandiseName, //商品名稱
          },
        },
        promoteCode: promoteCodeStr, //使用優惠碼
        itemCount: count, //商品數量
        purchaseDatetime: new Date(), // 訂購時間
        purchaseName: ordererValues.username, //購買者姓名
        purchaseAddress: ordererValues.address, //購買者地址
        purchaseEmail: ordererValues.email, //購買者信箱
        purchaseMobile: ordererValues.cellphone, //購買者手機
        purchasePhone: `${ordererValues.phone} ${ordererValues.phoneExt}`, //購買者電話
        receiveName: recipient.username, //收件者姓名
        receiveAddress: recipient.address, //收件者地址
        receiveMobile: recipient.cellphone, //收件者手機
        receivePhone: `${recipient.phone} ${recipient.phoneExt}`, //收件者電話
        category: receiptType, //發票種類
        loveCode: loveCode, // 捐贈碼
        carrierType: carrierType, //載具類別
        carrierNum: carrierNum, //載具編號（二聯式發票）
        buyerName: buyerName, //買受人名稱（三聯式發票）
        buyerUBN: buyerUBN, //買受人統一編號（三聯式發票）
      },
    }

    try {
      const { data } = await axios.post(
        `${window.location.origin}/api/papermag`,
        requestBody
      )
      if (data?.status !== 'success') {
        console.error(data.message)
        router.push(`/papermag/return?order-fail=true`)
      }

      setPaymentPayload(data.data)
    } catch (err) {
      setIsProcessing(false)

      const errorReport = generateErrorReportInfo(err, {
        referrer: getReferrer(),
      })
      sendErrorLog(errorReport)

      return
    }

    // 為了確保資料先填入 form 中
    let intervalId = window.setInterval(() => {
      if (formMerchantIDRef.current) {
        const merchantId = formMerchantIDRef.current.value

        if (merchantId) {
          formMerchantIDRef.current.form.submit()
          setIsProcessing(false)
          clearInterval(intervalId) // 停止 interval
        }
      }
    }, SECOND)
  }

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <LeftWrapper>
          <MerchandiseItem count={count} setCount={setCount} plan={plan} />
          <ApplyDiscount
            setRenewCouponApplied={setRenewCouponApplied}
            renewCouponApplied={renewCouponApplied}
            promoteCode={promoteCode}
            setPromoteCode={setPromoteCode}
          />
          <Orderer
            ordererValues={ordererValues}
            setOrdererValues={setOrdererValues}
          />
          <Recipient
            recipientValues={recipientValues}
            setRecipientValues={setRecipientValues}
            sameAsOrderer={sameAsOrderer}
            setSameAsOrderer={setSameAsOrderer}
            ordererValues={ordererValues}
          />
          <Shipping
            shouldCountFreight={shouldCountFreight}
            setShouldCountFreight={setShouldCountFreight}
          />
          <Receipt
            receiptOption={receiptOption}
            setReceiptOption={setReceiptOption}
            showWarning={showWarning}
            onReceiptDataChange={setReceiptData}
          />
          <AcceptingTermsAndConditions
            isAcceptedConditions={isAcceptedConditions}
            setIsAcceptedConditions={setIsAcceptedConditions}
          />
          <CheckoutBtn
            isAcceptedConditions={isAcceptedConditions}
            receiptOption={receiptOption}
            isProcessing={isProcessing}
          />
        </LeftWrapper>
        <RightWrapper>
          <PurchaseInfo
            count={count}
            plan={plan}
            renewCouponApplied={renewCouponApplied}
            shouldCountFreight={shouldCountFreight}
          />
        </RightWrapper>
      </Form>

      <NewebpayForm
        merchantId={paymentPayload.MerchantID}
        tradeInfo={paymentPayload.TradeInfo}
        tradeSha={paymentPayload.TradeSha}
        version={paymentPayload.Version}
        newebpayApiUrl={NEWEBPAY_PAPERMAG_API_URL}
        ref={formMerchantIDRef}
      />
    </>
  )
}
