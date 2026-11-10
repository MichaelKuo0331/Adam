import { useEffect } from 'react'
import { useRouter } from 'next/router'
import styled from 'styled-components'

import client from '../../../apollo/apollo-client'
import { fetchWeeklys } from '../../../apollo/query/magazines'
import Layout from '../../../components/shared/layout'
import { useStickyHeader } from '../../../components/shell/header/sticky-header-context'
import { getLogTraceObject } from '../../../utils'
import { fetchShellHeaderData } from '../../../utils/api'
import { setPageCache } from '../../../utils/cache-setting'
import { processSettledResult } from '../../../utils/response-processor'
import redirectToLoginWhileUnauthed from '../../../utils/server-side-only/redirect-to-login-while-unauthed'

const Page = styled.div`
  padding: 0;

  iframe {
    display: block;
    width: 100%;
    height: calc(100dvh - 48px);
    border: 0;
  }
`

// Its own component so it renders inside Layout: StickyHeaderProvider lives in
// PageShell, and the page component that renders Layout sits above it, so
// reading the context there only gets the default value.
function MagazineIframe({ src, title }) {
  const { stickyOffset } = useStickyHeader()

  // Scroll to where the site header collapses, so its full height no longer
  // covers the iframe and swallows clicks meant for the magazine.
  useEffect(() => {
    if (stickyOffset) {
      window.scrollTo({ top: stickyOffset })
    }
  }, [src, stickyOffset])

  return <iframe src={src} title={title} />
}

export default function BookBIssuePublish({ headerData, weeklys }) {
  const router = useRouter()
  const { book, issue } = router.query
  const issueString = Array.isArray(issue) ? issue.join('') : issue
  const iframeSrc = `https://storage.googleapis.com/mm-magazine/${book}/${issueString}/index.html`

  // Check if iframeSrc is valid, if not, redirect to /404 page

  useEffect(() => {
    const validSrcs = weeklys.map((weekly) => {
      const issueNumber = weekly.slug.match(/\d+/)[0]
      const bookLetter = weekly.slug.endsWith('A本') ? 'A' : 'B'
      return `https://storage.googleapis.com/mm-magazine/Book_${bookLetter}/${bookLetter}${issueNumber}-Publish/index.html`
    })

    if (!validSrcs.includes(iframeSrc)) {
      router.push('/404')
    }
  }, [weeklys, iframeSrc, router])

  return (
    <Layout
      head={{ title: `動態雜誌 ${issueString.split('-')[0]}` }}
      header={{ type: 'default', data: headerData }}
      withFooter={false}
    >
      <Page>
        <MagazineIframe
          src={iframeSrc}
          title={`動態雜誌 ${issueString.split('-')[0]}`}
        />
      </Page>
    </Layout>
  )
}

/**
 * @type {import('next').GetServerSideProps}
 */
export const getServerSideProps = redirectToLoginWhileUnauthed()(async ({
  params,
  req,
  res,
}) => {
  setPageCache(res, { cachePolicy: 'no-store' }, req.url)

  const globalLogFields = getLogTraceObject(req)
  const { issue } = params

  const responses = await Promise.allSettled([
    fetchShellHeaderData({ logFields: globalLogFields }),
    client.query({
      query: fetchWeeklys,
    }),
  ])

  const headerData = processSettledResult(
    responses[0],
    (data) =>
      data ?? {
        flashNewsData: [],
        navigationData: [],
        sectionPostsData: {},
        topicsData: [],
      },
    `Error occurs while getting shell header data in magazine page (issue: ${issue})`,
    globalLogFields
  )

  const weeklys = processSettledResult(
    responses[1],
    (
      /** @type {import('@apollo/client').ApolloQueryResult<any> | undefined} */ gqlData
    ) => {
      return gqlData?.data?.magazines || []
    },
    `Error occurs while getting data in magazine page (issue: ${issue})`,
    globalLogFields
  )

  return {
    props: {
      headerData,
      weeklys,
    },
  }
})
