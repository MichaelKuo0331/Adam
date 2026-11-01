import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import countryOptions from 'constants/lib/countries.json'
import taiwanDisTrictOptions from 'constants/lib/taiwan-districts.json'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import styled from 'styled-components'

import client from '../../apollo/apollo-client'
import { updateMember } from '../../apollo/membership/mutation/member'
import { fetchMemberProfile } from '../../apollo/membership/query/member'
import { useMembership } from '../../context/membership'
import { MODE } from '../../pages/profile'
import { generateErrorReportInfo } from '../../utils/log/error-log'
import { sendErrorLog } from '../../utils/log/send-log'
import DefaultButton from '../shared/buttons/default-button'
import PrimaryButton from '../shared/buttons/primary-button'

import DropdownMenu from './dropdown-menu'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  row-gap: 40px;

  ${({ theme }) => theme.breakpoint.xl} {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    padding: 40px;
  }
`

const EmailWrapper = styled.div`
  word-wrap: break-word;
  h2 {
    font-size: 18px;
    font-weight: 500;
    line-height: 27px;
    margin-bottom: 8px;
  }

  p {
    min-height: 27px;
    font-size: 18px;
    font-weight: 400;
    line-height: 27px;
    color: rgba(0, 0, 0, 0.87);
  }
`

const PasswordWrapper = styled.div`
  h2 {
    font-size: 18px;
    font-weight: 500;
    line-height: 27px;
    margin-bottom: 8px;
  }
`
const PasswordButtonWrapper = styled.div`
  width: 104px;
  height: 48px;
`

const FlexRowContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;

  ${({ theme }) => theme.breakpoint.md} {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }
`

const FlexRowBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  ${({ theme }) => theme.breakpoint.md} {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  input {
    height: 48px;
    font-size: 18px;
    line-height: 150%;
    border: 1px solid rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 12px;
    &::placeholder {
      color: rgba(0, 0, 0, 0.3);
    }
    outline: none;
    &:active,
    &:hover {
      border: 1px solid rgba(0, 0, 0, 0.87);
    }
  }
`

const FormDetails = styled.div`
  h2 {
    font-size: 18px;
    font-weight: 500;
    line-height: 27px;
    margin-bottom: 8px;

    ${({ theme }) => theme.breakpoint.md} {
      margin-bottom: 16px;
    }
  }
`

const ItemsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 0;

  input {
    width: 100%;
    font-size: 18px;
    line-height: 150%;
    height: 48px;
    border: 1px solid rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 12px;
    &::placeholder {
      color: rgba(0, 0, 0, 0.3);
    }
    outline: none;
    &:active,
    &:hover {
      border: 1px solid rgba(0, 0, 0, 0.87);
    }
  }

  ${({ theme }) => theme.breakpoint.md} {
    margin-bottom: 0;
  }
`
const AddressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const LargeLabel = styled.label`
  font-size: 18px;
  font-weight: 500;
  line-height: 27px;
  margin-bottom: 8px;
`

const SmallLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  line-height: 28px;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
`

const ButtonWrapper = styled.div`
  ${({ theme }) => theme.breakpoint.md} {
    width: 132px;
    height: 48px;
    margin: auto;
  }
`

/**
 * @typedef {import('../../type/profile.js').Option} Option
 */

/**
 * @typedef {Option[]} GenderOptions
 */
const genderOptions = [
  { id: 1, name: '不透露' },
  { id: 2, name: '男' },
  { id: 3, name: '女' },
]

/**
 * @typedef {Option[]} MonthOptions
 */
const monthOptions = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
  { id: 3, name: '3' },
  { id: 4, name: '4' },
  { id: 5, name: '5' },
  { id: 6, name: '6' },
  { id: 7, name: '7' },
  { id: 8, name: '8' },
  { id: 9, name: '9' },
  { id: 10, name: '10' },
  { id: 11, name: '11' },
  { id: 12, name: '12' },
]

/**
 * @param {string} timestamp
 * @returns {{year: string, month: string, day: string}}
 */
const formatBirthday = (timestamp) => {
  if (!timestamp) return { year: '', month: '', day: '' }

  const dateObj = new Date(timestamp)
  const year = dateObj.getFullYear().toString()
  const month = (dateObj.getMonth() + 1).toString()
  const day = dateObj.getDate().toString()

  return { year, month, day }
}

/**
 * @param {string} year
 * @param {string} month
 * @param {string} day
 * @returns {string}
 */
const dateFormatter = (year, month, day) => {
  dayjs.extend(utc)
  const dateString = `${year}-${month}-${day}`
  const utcDate = dayjs(dateString).utc().format()
  return utcDate
}

/**
 * @type {{ F: string, M: string, 'NA': string }}
 */
const genderMap = {
  F: '女',
  M: '男',
  NA: '不透露',
}

const getGenderKey = (/** @type {String} */ value) => {
  return Object.keys(genderMap).find((key) => genderMap[key] === value)
}

/**
 * @typedef {import('../../type/profile.js').Member} Member
 */

/**
 * @param {Object} props
 * @param {(value: string) => void} props.onSaved
 * @param {string} props.signInProvider
 * @returns {import('react').JSX.Element}
 */
export default function UserProfileForm({ onSaved, signInProvider }) {
  const [userName, setUserName] = useState('')
  const [userGender, setUserGender] = useState('')
  const [userYear, setUserYear] = useState('')
  const [userMonth, setUserMonth] = useState('')
  const [userDay, setUserDay] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userCountry, setUserCountry] = useState('')
  const [userCity, setUserCity] = useState('')
  const [userDistrict, setUserDistrict] = useState('')
  const [userAddress, setUserAddress] = useState('')
  const [districtData, setDistrictData] = useState([])
  const idRef = useRef('')

  const router = useRouter()
  const { accessToken, firebaseId, userEmail, memberInfo } = useMembership()
  const { memberType } = memberInfo

  useEffect(() => {
    const getMemberProfile = async () => {
      try {
        const response = await client.query({
          query: fetchMemberProfile,
          variables: { firebaseId: firebaseId },
          context: {
            uri: '/member/graphql',
            headers: {
              authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
          },
        })
        /**
         * @type {Member | undefined}
         */
        const profile = response?.data?.member
        if (profile) {
          const {
            id,
            name,
            gender,
            birthday,
            phone,
            country,
            city,
            district,
            address,
          } = profile

          idRef.current = id
          setUserName(name)
          setUserGender(genderMap[gender])
          setUserYear(formatBirthday(birthday).year)
          setUserMonth(formatBirthday(birthday).month)
          setUserDay(formatBirthday(birthday).day)
          setUserPhone(phone)
          setUserCountry(country)
          handleCitySelect(city)
          setUserDistrict(district)
          setUserAddress(address)
        }
      } catch (error) {
        const errorReport = generateErrorReportInfo(error, {
          userEmail: userEmail,
          firebaseId: firebaseId,
          memberType: memberType,
        })
        sendErrorLog(errorReport)
        router.push('/500')
      }
    }
    if (firebaseId && accessToken) {
      getMemberProfile()
    }
  }, [firebaseId, accessToken, memberType, userEmail, router])

  const cityNames = useMemo(() => {
    return taiwanDisTrictOptions.map((data) => {
      return { name: data.name }
    })
  }, [])

  /**
   * @param {string} country
   */
  const handleCountrySelect = (country) => {
    setUserCountry(country)
    if (country !== '台灣') {
      setUserCity('')
      setUserDistrict('')
    }
  }

  /**
   * @param {string} city
   */
  const handleCitySelect = (city) => {
    setUserCity(city)
    const cityData = taiwanDisTrictOptions.find(function (el) {
      return el.name === city
    })
    if (cityData) {
      setDistrictData(cityData.districts)
    }
  }

  const handleUpdatePasswordClick = () => {
    router.push('/update-password')
  }

  const handleUpdateProfile = async () => {
    try {
      await client.mutate({
        mutation: updateMember,
        context: {
          uri: '/member/graphql',
          headers: {
            authorization: accessToken ? `Bearer ${accessToken}` : '',
          },
        },
        variables: {
          id: idRef.current,
          name: userName,
          gender: getGenderKey(userGender),
          birthday: dateFormatter(userYear, userMonth, userDay),
          phone: userPhone,
          country: userCountry,
          city: userCity,
          district: userDistrict,
          address: userAddress,
        },
      })
      onSaved(MODE.SUCCESS)
    } catch (error) {
      const errorReport = generateErrorReportInfo(error, {
        userEmail: userEmail,
        firebaseId: firebaseId,
        memberType: memberType,
      })
      sendErrorLog(errorReport)
      onSaved(MODE.FAIL)
    }
  }

  return (
    <>
      <Form>
        <EmailWrapper>
          <h2>Email</h2>
          <p>{userEmail}</p>
        </EmailWrapper>

        {signInProvider == 'password' && (
          <PasswordWrapper>
            <h2>密碼</h2>
            <PasswordButtonWrapper>
              <DefaultButton onClick={handleUpdatePasswordClick}>
                變更密碼
              </DefaultButton>
            </PasswordButtonWrapper>
          </PasswordWrapper>
        )}

        <FlexRowContainer>
          <FormGroup>
            <LargeLabel htmlFor="name">姓名</LargeLabel>
            <input
              id="name"
              placeholder="請輸入姓名"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <LargeLabel>性別</LargeLabel>
            <DropdownMenu
              keyField="id"
              value="name"
              options={genderOptions}
              selectedOption={userGender}
              onSelect={setUserGender}
              placeholder="請選擇"
            />
          </FormGroup>
        </FlexRowContainer>

        <FormDetails>
          <h2>生日</h2>

          <FlexRowBox>
            <ItemsWrapper>
              <SmallLabel htmlFor="year">西元年</SmallLabel>
              <input
                id="year"
                placeholder="西元年"
                value={userYear}
                onChange={(e) => setUserYear(e.target.value)}
              />
            </ItemsWrapper>
            <ItemsWrapper>
              <SmallLabel>月份</SmallLabel>
              <DropdownMenu
                options={monthOptions}
                keyField="id"
                value="name"
                selectedOption={userMonth}
                onSelect={setUserMonth}
                placeholder="月份"
              />
            </ItemsWrapper>
            <ItemsWrapper>
              <SmallLabel htmlFor="day">日期</SmallLabel>
              <input
                id="day"
                placeholder="日期"
                value={userDay}
                onChange={(e) => setUserDay(e.target.value)}
              />
            </ItemsWrapper>
          </FlexRowBox>
        </FormDetails>

        <FormGroup>
          <LargeLabel htmlFor="phone">電話</LargeLabel>
          <input
            id="phone"
            type="tel"
            placeholder="請輸入電話"
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
          />
        </FormGroup>
        <FormDetails>
          <h2>地址</h2>
          <AddressWrapper>
            <ItemsWrapper>
              <SmallLabel>國家</SmallLabel>
              <DropdownMenu
                options={countryOptions}
                keyField="English"
                value="Taiwan"
                selectedOption={userCountry}
                onSelect={handleCountrySelect}
              />
            </ItemsWrapper>
            <FlexRowBox>
              <ItemsWrapper>
                <SmallLabel htmlFor="city">縣市</SmallLabel>
                <DropdownMenu
                  options={cityNames}
                  keyField="name"
                  value="name"
                  selectedOption={userCity}
                  onSelect={handleCitySelect}
                  disabled={userCountry !== '臺灣'}
                />
              </ItemsWrapper>
              <ItemsWrapper>
                <SmallLabel htmlFor="district">行政區</SmallLabel>
                <DropdownMenu
                  options={districtData}
                  keyField="zip"
                  value="name"
                  selectedOption={userDistrict}
                  onSelect={setUserDistrict}
                  disabled={userCountry !== '臺灣' || userCity == ''}
                />
              </ItemsWrapper>
            </FlexRowBox>

            <ItemsWrapper>
              <SmallLabel htmlFor="address">詳細地址</SmallLabel>
              <input
                id="address"
                placeholder="請輸入街道、門號、巷弄、樓層等資訊"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
              />
            </ItemsWrapper>
          </AddressWrapper>
        </FormDetails>
        <ButtonWrapper>
          <PrimaryButton
            isLoading={false}
            onClick={handleUpdateProfile}
            disabled={!accessToken}
          >
            儲存
          </PrimaryButton>
        </ButtonWrapper>
      </Form>
    </>
  )
}
