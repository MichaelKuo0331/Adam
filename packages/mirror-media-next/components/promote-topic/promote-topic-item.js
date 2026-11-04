import CustomImage from '@readr-media/react-image'
import styled from 'styled-components'

import { DEFAULT_OG_IMAGE_URL } from '../../constants'

const Card = styled.a`
  display: block;
  width: 100%;
  background-color: #054f77;
`

const ImageFrame = styled.div`
  position: relative;
  width: 100%;
  height: 120px;
  background-color: #d8d8d8;

  picture,
  img {
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: cover;
  }
`

const TitleFrame = styled.div`
  height: 76px;
  padding: 10px 10px 20px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`

const Title = styled.p`
  margin: 0;
  width: 100%;
  font-size: 16px;
  font-weight: 500;
  line-height: 23px;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

/**
 * @typedef {Object} PromoteTopicHeroImage
 * @property {Record<string, string>} [resized]
 * @property {Record<string, string>} [resizedWebp]
 *
 * @typedef {Object} PromoteTopicData
 * @property {string} id
 * @property {number | string | null} [order]
 * @property {string} slug
 * @property {string} name
 * @property {PromoteTopicHeroImage} heroImage
 */

/**
 * @param {Object} props
 * @param {PromoteTopicData} props.topic
 * @returns {React.ReactElement}
 */
export default function PromoteTopicItem({ topic }) {
  const images = topic.heroImage.resized ?? {}
  const imagesWebP = topic.heroImage.resizedWebp ?? null

  return (
    <Card href={`/topic/${topic.slug}`}>
      <ImageFrame>
        <CustomImage
          images={images}
          imagesWebP={imagesWebP}
          loadingImage="/images-next/loading.gif"
          defaultImage={DEFAULT_OG_IMAGE_URL}
          rwd={{
            mobile: '124px',
            tablet: '124px',
            desktop: '124px',
            default: '124px',
          }}
          alt={`推廣專題-${topic.name}`}
        />
      </ImageFrame>
      <TitleFrame>
        <Title>{topic.name}</Title>
      </TitleFrame>
    </Card>
  )
}
