import Link from 'next/link'
import Image from '@readr-media/react-image'
import styled from 'styled-components'

import { DEFAULT_OG_IMAGE_URL } from '../../constants'
import ReadingSvg from '../../public/images-next/magazine-online.svg'
import { getMagazineHrefFromSlug } from '../../utils/index'

const CardsList = styled.ul`
  margin: auto;
  margin-top: 32px;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  width: 280px;
  grid-gap: 20px;
  gap: 20px;

  ${({ theme }) => theme.breakpoint.md} {
    width: 672px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    grid-template-columns: repeat(2, 1fr);
    margin-top: 48px;
    width: 1104px;
  }
`

const IssueCard = styled.li`
  display: flex;
  flex-direction: column;
  border: 1px solid #9b9b9b;
  border-radius: 2px;
  width: 100%;
  padding: 24px;
  justify-content: center;
  align-items: center;

  ${({ theme }) => theme.breakpoint.md} {
    align-items: flex-start;
    flex-direction: row;
    width: 544px;
  }

  ${({ theme }) => theme.breakpoint.xl} {
    width: 544px;
  }

  &:hover button {
    background:
      linear-gradient(0deg, rgba(29, 159, 184, 0.5), rgba(29, 159, 184, 0.5)),
      #054f77;
  }
`

const ImageWrapper = styled.div`
  background: #f4f4f4;
  width: 160px;
  height: 212px;
  overflow: hidden;

  img {
    width: 100%;
    z-index: 0;
  }

  ${({ theme }) => theme.breakpoint.md} {
    margin-right: 32px;
  }

  ${({ theme }) => theme.breakpoint.xl} {
    width: 200px;
    height: 265px;
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 212px;

  ${({ theme }) => theme.breakpoint.md} {
    height: 212px;
    width: 264px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    height: 265px;
    width: 264px;
  }
`

const IssueName = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 150%;
  color: #1d9fb8;
  padding: 12px;
`
const IssueTitle = styled.p`
  font-weight: 400;
  font-size: 22px;
  line-height: 30.8px;
  color: #4a4a4a;
  ${({ theme }) => theme.breakpoint.xl} {
    line-height: 33.6px;
  }
`

const ReadingBtn = styled.button`
  margin-top: auto;
  width: 100%;
  height: 48px;
  background: #054f77;
  border-radius: 2px;
  color: #ffffff;
  font-weight: 400;
  font-size: 18px;
  line-height: 24px;

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
 * @property {Magazine[]} features
 * @param {Props} props
 * @returns {import('react').JSX.Element}
 */

export default function MagazineFeatures({ features }) {
  return (
    <CardsList>
      {features.map((magazine) => (
        <Link href={getMagazineHrefFromSlug(magazine.slug)} key={magazine.id}>
          <IssueCard>
            <ImageWrapper>
              <Image
                images={magazine.coverPhoto?.resized}
                loadingImage="/images-next/loading.gif"
                defaultImage={DEFAULT_OG_IMAGE_URL}
                alt={magazine.title}
                rwd={{ tablet: '160px', desktop: '200px', default: '100%' }}
              />
            </ImageWrapper>
            <ContentWrapper>
              <IssueName>{magazine.slug}</IssueName>
              <IssueTitle>{magazine.title}</IssueTitle>
              <ReadingBtn>
                <ReadingSvg />
                線上閱讀
              </ReadingBtn>
            </ContentWrapper>
          </IssueCard>
        </Link>
      ))}
    </CardsList>
  )
}
