import Image from 'next/image'
import Link from 'next/link'
import styled from 'styled-components'

import { Z_INDEX } from '../../constants/index'

const StyledLink = styled(Link)`
  display: block;

  ${({ theme }) => theme.breakpoint.md} {
    display: none;
  }
`
const ImageWrapper = styled.div`
  padding: 16px;
  position: fixed;
  bottom: 25%;
  right: 0;
  z-index: ${Z_INDEX.articleRightArrow};
`

const rightArrow = '/images-next/right-arrow.svg'

/**
 * `heroImage` is intentionally untyped: this component never reads it, and
 * consumers pass shapes that differ across GraphQL- and MISO-sourced relateds.
 * @typedef {(Omit<import('../../apollo/fragments/post').Related, 'heroImage'> & {
 *  id: string, slug: string, title: string, heroImage: unknown, url: string, type: 'story' | 'external'})[]
 * } Relateds
 */

/**
 *
 * @param {Object} props
 * @param {Relateds} [props.relateds]
 * @returns {import('react').JSX.Element | null}
 */
export default function ArticleRightArrow({ relateds = [] }) {
  const firstRelated = relateds[0]

  if (!firstRelated?.url) {
    return null
  }

  return (
    <StyledLink href={firstRelated.url}>
      <ImageWrapper>
        <Image
          src={rightArrow}
          width={24}
          height={24}
          alt="點按看下一則延伸閱讀文章"
        />
      </ImageWrapper>
    </StyledLink>
  )
}
