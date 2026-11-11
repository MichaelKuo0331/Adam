import Link from 'next/link'
import styled from 'styled-components'

/**
 * @typedef {import('../../../type/theme').Theme} Theme
 */

const Wrapper = styled.section`
  display: flex;
  margin: 80px auto;
  font-weight: 400;
  font-size: 16px;
`

const CreditsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.breakpoint.md} {
    align-items: center;
  }
`

const CreditTitle = styled.div`
  color: white;
  display: flex;
  min-width: 50px;
`

const CreditList = styled.div`
  display: flex;
  color: #61b8c6;
  justify-content: flex-start;

  ul {
    display: flex;
    flex-wrap: wrap;
  }

  li:not(:last-child)::after {
    content: '・';
    color: #c4c4c4;
    margin-left: 5px;
    margin-right: 5px;
  }
`

const CREDIT_TITLE_NAME_MAP = {
  writers: '文　｜',
  photographers: '攝影｜',
  camera_man: '影音｜',
  designers: '設計｜',
  engineers: '工程｜',
  vocals: '主播｜',
  extend_byline: '協力｜',
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
 * @returns {import('react').JSX.Element}
 */
export default function Credits({ credits }) {
  const shouldShowCredits = credits.some((credit) => {
    const [people] = Object.values(credit)
    return people.length !== 0 || (typeof people === 'string' && people.trim())
  })

  const creditsJsx = shouldShowCredits ? (
    <CreditsWrapper>
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
            {titleName !== '協力｜' && <CreditTitle>{titleName}</CreditTitle>}
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
    </CreditsWrapper>
  ) : null

  return <Wrapper>{creditsJsx}</Wrapper>
}
