import Link from 'next/link'
import Image from '@readr-media/react-image'
import styled from 'styled-components'

import { DEFAULT_OG_IMAGE_URL } from '../../../constants'
import { defaultSerifFontFamily } from '../../../styles/shared-style'
/**
 * @typedef {Pick<import('../../../apollo/fragments/post').HeroImage ,'id' | 'resized' | 'resizedWebp'>} HeroImage
 */

/**
 * @typedef {(import('../../../apollo/fragments/post').Related & {
 *  id: string, slug: string, title: string, heroImage: HeroImage})[]
 * } Relateds
 */

const Wrapper = styled.div`
  margin-bottom: 100px;
`

const Title = styled.div`
  color: white;
  font-weight: 600;
  font-size: 21px;
  line-height: 150%;
  text-align: center;
  margin-bottom: 16px;

  ${({ theme }) => theme.breakpoint.md} {
    font-weight: 500;
    font-size: 28px;
    margin-bottom: 48px;
  }
`

const PostsList = styled.ul`
  margin: 0 auto;
  width: 280px;
  display: flex;
  flex-wrap: wrap;

  ${({ theme }) => theme.breakpoint.md} {
    width: 640px;
    justify-content: space-between;
  }
`
const PostCard = styled.div`
  color: white;
  width: 280px;
  margin-bottom: 24px;

  ${({ theme }) => theme.breakpoint.md} {
    width: 276px;
    margin-bottom: 28px;
  }

  figcaption {
    font-weight: 400px;
    font-size: 18px;
    margin-top: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    ${({ theme }) => theme.breakpoint.md} {
      margin-top: 16px;
      font-size: 18px;
      ${defaultSerifFontFamily};
      font-weight: 500;
      line-height: 150%;
    }
  }
`

const ImageWrapper = styled.div`
  height: 186.67px;
  overflow: hidden;

  ${({ theme }) => theme.breakpoint.md} {
    height: 184px;
  }
`
/**
 * @param {Object} props
 
 */

export default function RelatedPosts({ relateds = [] }) {
  if (!relateds.length) {
    return null // not to render anything if relateds is empty
  }

  return (
    <Wrapper>
      <Title>延伸閱讀</Title>
      <PostsList>
        {relateds.map((related) => (
          <li key={related.id}>
            <PostCard>
              <Link href={`/story/${related.slug}`} className="article-image">
                <ImageWrapper>
                  <Image
                    images={related.heroImage?.resized}
                    imagesWebP={related.heroImage?.resizedWebp}
                    alt={related.title}
                    rwd={{
                      mobile: '280px',
                      tablet: '87px',
                      laptop: '135px',
                    }}
                    defaultImage={DEFAULT_OG_IMAGE_URL}
                    loadingImage={'/images-next/loading.gif'}
                  />
                </ImageWrapper>
              </Link>

              <figcaption className="article-title">
                <Link href={`/story/${related.slug}`}>{related.title}</Link>
              </figcaption>
            </PostCard>
          </li>
        ))}
      </PostsList>
    </Wrapper>
  )
}
