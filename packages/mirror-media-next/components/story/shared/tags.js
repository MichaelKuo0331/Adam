import styled from 'styled-components'

/**
 * @typedef {import('../../../apollo/fragments/tag').Tag[]}Tags
 */

/**
 * @typedef {import('../../../type/theme').Theme} Theme
 */

const TagsWrapper = styled.section`
  display: flex;
  justify-content: start;
  width: fit-content;
  flex-wrap: wrap;
`
const Tag = styled.a`
  font-size: 14px;
  line-height: 20px;
  padding: 4px 8px;
  margin-bottom: 8px;
  margin-right: 8px;
  border-radius: 2px;
  background-color: ${
    /**
     * @param {{theme:Theme, tagColor: ?string}} param
     */
    ({ theme, tagColor }) =>
      tagColor && theme.color.brandColor[tagColor]
        ? `${theme.color.brandColor[tagColor]}`
        : '#000'
  };

  color: white;
  font-weight: 400;
`
/**
 *
 * @param {Object} props
 * @param {Tags} props.tags
 * @param {string} [props.tagColor]
 * @param {string} [props.className] - Attribute for updating style by styled-component
 * @returns {import('react').JSX.Element}
 */
export default function Tags({ tags, tagColor = 'darkBlue', className = '' }) {
  const shouldShowTags = tags && tags.length
  const tagsJsx = shouldShowTags ? (
    <TagsWrapper className={className}>
      {tags.map((tag) => (
        <Tag tagColor={tagColor} key={tag.id} href={`/tag/${tag.slug}`}>
          {tag.name}
        </Tag>
      ))}
    </TagsWrapper>
  ) : null

  return <>{tagsJsx}</>
}
