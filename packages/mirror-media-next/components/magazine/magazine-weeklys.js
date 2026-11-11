import Link from 'next/link'
import Image from '@readr-media/react-image'
import styled from 'styled-components'

import { DEFAULT_OG_IMAGE_URL } from '../../constants'
import ReadingSvg from '../../public/images-next/magazine-online.svg'
import {
  getMagazineHrefFromSlug,
  transformTimeDataIntoSlashFormat,
} from '../../utils/index'

const CardsList = styled.ul`
  margin: auto;
  margin-top: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  width: 280px;
  grid-gap: 48px 16px;
  gap: 48px 16px;

  ${({ theme }) => theme.breakpoint.md} {
    grid-template-columns: repeat(4, 1fr);
    width: 672px;
    grid-gap: 48px 32px;
    gap: 48px 32px;
  }

  ${({ theme }) => theme.breakpoint.xl} {
    grid-template-columns: repeat(6, 1fr);
    margin-top: 48px;
    width: 1104px;
    grid-gap: 60px 48px;
    gap: 60px 48px;
  }
`
const IssueCard = styled.li`
  position: relative;
  width: 132px;
  ${({ theme }) => theme.breakpoint.md} {
    width: 144px;
  }

  img {
    width: 100%;
    z-index: 0;
  }

  &:hover button {
    background:
      linear-gradient(0deg, rgba(5, 79, 119, 0.05), rgba(5, 79, 119, 0.05)),
      #ffffff;
  }
`

const ImageWrapper = styled.div`
  background: #f7f7f7;
  position: relative;
  z-index: 0;
  width: 132px;
  height: 178px;
  overflow: hidden;

  ${({ theme }) => theme.breakpoint.md} {
    width: 144px;
    height: 194px;
  }

  svg {
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translate(-50%, -50%);
    fill: white;
    z-index: 2;
    opacity: 0;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      0deg,
      rgba(5, 79, 119, 0.87),
      rgba(5, 79, 119, 0.87)
    );
    opacity: 0;
    z-index: 1;
  }

  &::after {
    content: '線上閱讀';
    position: absolute;
    top: 75%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ffffff;
    font-weight: 400;
    font-size: 15px;
    line-height: 21px;
    z-index: 2;
    opacity: 0;
  }

  &:hover {
    &::before {
      opacity: 0.8;
      transition: opacity 0.3s ease-in;
    }

    &::after {
      top: 60%;
      opacity: 1;
      transition: all 0.3s ease-in;
    }

    svg {
      top: 40%;
      opacity: 1;
      transition: all 0.3s ease-in;
    }
  }
`

const Date = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 150%;
  text-align: center;
  color: #1d9fb8;
  padding: 12px 0 8px 0;
`
const IssueTitle = styled.p`
  font-weight: 400;
  font-size: 18px;
  line-height: 150%;
  text-align: center;
  color: #4a4a4a;
`

const ReadingBtn = styled.button`
  margin-top: 8px;
  width: 100%;
  height: 38px;
  background: #ffffff;
  border: 1px solid #054f77;
  border-radius: 2px;
  color: #054f77;
  font-weight: 400;
  font-size: 16px;
  line-height: 22px;

  display: grid;
  grid-auto-flow: column;
  justify-content: center;
  align-items: center;
  grid-column-gap: 10px;

  &:focus {
    outline: none;
  }
`

/**
 * @typedef {import('../../apollo/fragments/magazine').Magazine} Magazine
 * @typedef {object} Props
 * @property {Magazine[]} weeklys
 * @param {Props} props
 * @returns {import('react').JSX.Element}
 */

export default function MagazineWeeklys({ weeklys }) {
  return (
    <CardsList>
      {weeklys.map((magazine) => (
        <IssueCard key={magazine.id}>
          <Link href={getMagazineHrefFromSlug(magazine.slug)}>
            <ImageWrapper>
              <Image
                images={magazine.coverPhoto?.resized}
                imagesWebP={magazine.coverPhoto?.resizedWebp}
                loadingImage="/images-next/loading.gif"
                defaultImage={DEFAULT_OG_IMAGE_URL}
                alt={magazine.title}
                rwd={{ mobile: '132px', tablet: '144px', default: '100%' }}
              />
              <ReadingSvg />
            </ImageWrapper>
            <Date>
              {transformTimeDataIntoSlashFormat(magazine.publishedDate, false)}
            </Date>
            <IssueTitle>{magazine.slug}</IssueTitle>
            <ReadingBtn>
              <ReadingSvg fill="#054f77" />
              線上閱讀
            </ReadingBtn>
          </Link>
        </IssueCard>
      ))}
    </CardsList>
  )
}
