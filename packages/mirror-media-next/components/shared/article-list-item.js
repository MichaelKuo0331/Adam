import Image from '@readr-media/react-image'
import styled from 'styled-components'

import { DEFAULT_OG_IMAGE_URL } from '../../constants'
import { transformTimeDataIntoDotFormat } from '../../utils'

/**
 * @typedef {import('../../type/theme').Theme} Theme
 */

const ItemWrapper = styled.a`
  display: block;
  position: relative;
  width: 100%;
  margin: 0 auto;
  font-size: 18px;
`

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 214px;
  ${({ theme }) => theme.breakpoint.xl} {
    height: 147px;
  }
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
  margin: 20px 20px 36px 20px;
  ${({ theme }) => theme.breakpoint.md} {
    margin: 20px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    margin: 8px 8px 40px 8px;
  }
`

const ItemTitle = styled.div`
  color: #054f77;
  line-height: 25px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  ${({ theme }) => theme.breakpoint.md} {
    height: 75px;
  }
  ${({ theme }) => theme.breakpoint.xl} {
    font-size: 18px;
  }
`

const ItemDate = styled.div`
  color: rgb(156, 183, 198);
  font-family: 'PingFang TC';
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 14px;
  margin-top: 8px;
  margin-bottom: -8px;
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
    margin-top: 20px;
    -webkit-line-clamp: 4;
  }
`

/**
 * @typedef {import('../../apollo/fragments/section').Section } Section
 *
 * @typedef {Pick<import('../../apollo/fragments/category').Category, 'id' |'name' | 'slug'>} Category
 *
 * @typedef {import('../../apollo/fragments/photo').Photo} HeroImage
 *
 * @typedef {import('../../apollo/fragments/post').ListingPost } Article
 */

/**
 * @param {Object} props
 * @param {Article} props.item
 * @param {Section} [props.section]
 * @param {boolean} [props.priority]
 * @returns {React.ReactElement}
 */
export default function ArticleListItem({ item, section, priority }) {
  const { publishedDate } = item
  const formattedPublishedDate = transformTimeDataIntoDotFormat(publishedDate)
  const itemSection =
    section || item.sections.find((section) => section.slug !== 'member')

  return (
    <ItemWrapper
      href={
        item.type === 'external'
          ? `/external/${item.slug}`
          : `/story/${item.slug}`
      }
    >
      <ImageContainer>
        <Image
          images={item.heroImage?.resized}
          imagesWebP={item.heroImage?.resizedWebp}
          alt={item.title}
          loadingImage="/images-next/loading.gif"
          defaultImage={DEFAULT_OG_IMAGE_URL}
          rwd={{ mobile: '400px', tablet: '400px', desktop: '400px' }}
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
        <ItemDate>{formattedPublishedDate}</ItemDate>
        <ItemBrief>{item.brief?.blocks?.[0]?.text}</ItemBrief>
      </ItemDetail>
    </ItemWrapper>
  )
}
