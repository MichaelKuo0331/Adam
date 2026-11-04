import Image from '@readr-media/react-image'
import styled from 'styled-components'

import { DEFAULT_OG_IMAGE_URL } from '../../constants'
import { transformTimeDataIntoSlashFormat } from '../../utils'

/**
 * @typedef {import('../../type/theme').Theme} Theme
 */

const ItemWrapper = styled.a`
  display: block;
  position: relative;
  width: 100%;
  margin: 0 auto;
  font-size: 18px;
  ${({ theme }) => theme.breakpoint.xl} {
    border-radius: 6px;
    overflow: hidden;
  }
`

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 214px;
`

const ItemSection = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  color: white;
  font-size: 18px;
  font-weight: 600;
  padding: 4px 20px;
  background-color: ${
    /**
     * @param {Object} props
     * @param {String } props.sectionName
     * @param {Theme} [props.theme]
     */
    ({ sectionName, theme }) =>
      sectionName && theme.color.sectionsColor[sectionName]
        ? theme.color.sectionsColor[sectionName]
        : theme.color.brandColor.lightBlue
  };
`

const ItemDetail = styled.div`
  padding: 20px 20px 36px 20px;
  background-color: #eee;
  ${({ theme }) => theme.breakpoint.md} {
    padding: 20px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    padding: 16px 24px 20px;
  }
`

const ItemTitle = styled.div`
  line-height: 25px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  ${({ theme }) => theme.breakpoint.md} {
    height: 75px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    line-height: 30px;
    font-size: 20px;
    height: 90px;
  }
`

const ItemBrief = styled.div`
  font-size: 16px;
  color: #979797;
  margin-top: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  ${({ theme }) => theme.breakpoint.md} {
    margin-top: 16px;
  }

  ${({ theme }) => theme.breakpoint.xl} {
    margin-top: 8px;
    -webkit-line-clamp: 3;
  }
`

const ItemDate = styled.div`
  margin-top: 12px;
  color: #9b9b9b;
  font-size: 14px;
  line-height: 1.4;
`

/**
 * @typedef {import('../../apollo/fragments/section').Section } Section
 *
 * @typedef {import('../../apollo/fragments/category').Category} Category
 *
 * @typedef {import('../../apollo/fragments/photo').Photo } HeroImage
 *
 * @typedef {import('../../apollo/fragments/post').ListingPost} Article
 */

/**
 * @param {Object} props
 * @param {Article} props.item
 * @param {Section} [props.section]
 * @param {boolean} [props.priority]
 * @returns {React.ReactElement}
 */
export default function PremiumArticleListItem({ item, section, priority }) {
  const itemSection =
    section || item.sections.find((section) => section.slug === 'member')

  return (
    <ItemWrapper href={`/story/${item.slug}`}>
      <ImageContainer>
        <Image
          images={item.heroImage?.resized}
          imagesWebP={item.heroImage?.resizedWebp}
          alt={item.title}
          loadingImage="/images-next/loading.gif"
          defaultImage={DEFAULT_OG_IMAGE_URL}
          rwd={{ desktop: '320px' }}
          priority={priority}
        />
        {itemSection && (
          <ItemSection sectionName={itemSection?.slug}>
            {itemSection?.name}
          </ItemSection>
        )}
      </ImageContainer>
      <ItemDetail>
        <ItemTitle>{item.title}</ItemTitle>
        <ItemBrief>{item.brief?.blocks[0]?.text}</ItemBrief>
        <ItemDate>
          {transformTimeDataIntoSlashFormat(item.publishedDate)}
        </ItemDate>
      </ItemDetail>
    </ItemWrapper>
  )
}
