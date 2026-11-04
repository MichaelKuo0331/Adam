import Link from 'next/link'
import styled from 'styled-components'

/**
 * @typedef {import('../../../type/theme').Theme} Theme
 */

const CreditsWrapper = styled.section`
  font-size: 16px;
  font-weight: 400;

  margin-top: 24px;

  text-align: left;
  width: 100%;
  max-width: 300px;
  line-height: 1.5;
`

const CreditTitle = styled.figcaption`
  display: block;
  color: rgba(0, 0, 0, 0.5);

  position: relative;

  min-width: 38px;
  max-width: 38px;
  text-align: left;
  margin-right: 14px;

  &::after {
    position: absolute;
    content: ' | ';
    right: -3px;
    transform: translate(50%, 1px);
    top: 0;
    color: rgba(0, 0, 0, 0.5);
  }
`

const CreditList = styled.figure`
  display: flex;
  justify-content: flex-start;
  width: auto;

  ul {
    width: 100%;

    gap: 0 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: start;
    &.no-link-list {
      display: block;
    }
    li {
      width: auto;
      display: block;
      line-height: 1.5;
      &.link {
        position: relative;

        color: ${
          /** @param {{theme:Theme}} param */
          ({ theme }) => theme.color.brandColor.darkBlue
        };
      }

      &.no-link {
        text-align: left;
        color: rgba(52, 73, 94, 1);
      }
    }
  }

  ${({ theme }) => theme.breakpoint.md} {
  }
`

const CREDIT_TITLE_NAME_MAP = {
  writers: '文 ',
  photographers: '攝影',
  camera_man: '影音',
  designers: '設計',
  engineers: '工程',
  vocals: '主播',
  extend_byline: '協力',
}

/**
 * @typedef {import('../../../apollo/fragments/contact').Contact[]} Contacts
 */

/**
 * @typedef {import('../../../apollo/fragments/tag').Tag[]} Tags
 */

/**
 * @typedef {Object} Credit
 * @property {Contacts} [writers]
 * @property {Contacts} [photographers]
 * @property {Contacts} [camera_man]
 * @property {Contacts} [designers]
 * @property {Contacts} [engineers]
 * @property {Contacts} [vocals]
 * @property {string} [extend_byline]
 */

/**
 * @param {Object} props
 * @param {Credit[]} props.credits
 * @param {string} [props.className]
 * @returns {import('react').JSX.Element}
 */
export default function Credits({ credits = [], className = '' }) {
  const shouldShowCredits = credits.some((credit) => {
    const [people] = Object.values(credit)
    return people.length !== 0 || (typeof people === 'string' && people.trim())
  })

  const creditsJsx = shouldShowCredits ? (
    <>
      {credits.map((credit, index) => {
        const title = Object.keys(credit)
        const titleName = CREDIT_TITLE_NAME_MAP[title]
        const [people] = Object.values(credit)
        if (
          !titleName ||
          people.length === 0 ||
          (typeof people === 'string' && !people.trim())
        ) {
          return null
        }
        return (
          <CreditList key={index}>
            {titleName !== '協力' && <CreditTitle>{titleName}</CreditTitle>}
            <ul
              className={Array.isArray(people) ? 'link-list' : 'no-link-list'}
            >
              {Array.isArray(people) ? (
                people.map((person) => (
                  <li key={person.id} className="link">
                    <Link href={`/author/${person.id}`}>{person.name}</Link>
                  </li>
                ))
              ) : (
                <li className="no-link">
                  <span>{people}</span>
                </li>
              )}
            </ul>
          </CreditList>
        )
      })}
    </>
  ) : null

  return <CreditsWrapper className={className}>{creditsJsx}</CreditsWrapper>
}
