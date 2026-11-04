import { useEffect, useState } from 'react'
import Link from 'next/link'
import CustomImage from '@readr-media/react-image'
import axios from 'axios'

import type { AsideListingPost, Post } from '@/apollo/fragments/post'
import { PageShell } from '@/components/shell/page-shell'
import { API_TIMEOUT, URL_STATIC_404_POPULAR_NEWS } from '@/config/index.mjs'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import type { ShellHeaderData } from '@/utils/api'
import { fetchShellHeaderData } from '@/utils/api'

type PopularNewsPost = AsideListingPost & { brief: Post['brief'] }

const emptyHeaderData: ShellHeaderData = {
  flashNewsData: [],
  navigationData: [],
  sectionPostsData: {},
  topicsData: [],
}

export default function Custom404() {
  const [popularNews, setPopularNews] = useState<PopularNewsPost[]>([])
  const [headerData, setHeaderData] = useState<ShellHeaderData>(emptyHeaderData)

  useEffect(() => {
    let ignore = false

    const fetchPopularNews = async (): Promise<PopularNewsPost[]> => {
      try {
        const { data } = await axios.get<PopularNewsPost[]>(
          URL_STATIC_404_POPULAR_NEWS,
          { timeout: API_TIMEOUT }
        )

        return data
      } catch (err) {
        console.log(
          JSON.stringify({
            severity: 'WARNING',
            message: `Unable fetch popular news in 404 page`,
          })
        )
        return []
      }
    }

    fetchPopularNews().then((res) => {
      if (!ignore) {
        setPopularNews(res.slice(0, 6))
      }
    })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    fetchShellHeaderData()
      .then((res) => {
        if (!ignore) {
          setHeaderData(res)
        }
      })
      .catch(() => {
        console.log(
          JSON.stringify({
            severity: 'WARNING',
            message: `Unable fetch header data in 404 page`,
          })
        )
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <PageShell
      head={{ title: '找不到頁面', robotsMetaContent: 'noindex' }}
      headerData={headerData}
    >
      <main className="flex flex-col items-center pb-[46px]">
        <div className="flex w-65 flex-col items-center border-b border-black py-[58px]">
          <h1 className="text-[128px] leading-[128px] font-normal text-mm-base-500">
            404
          </h1>
          <p className="text-2xl text-black">抱歉！找不到這個網址</p>
        </div>

        <p className="pt-7 pb-2 text-xl font-medium text-mm-base-500 xl:pt-[41px] xl:pb-3 xl:text-[28px] xl:font-bold">
          熱門文章
        </p>

        <Link href="/subscribe">
          <button
            type="button"
            className="mb-3 h-[30px] w-[78px] cursor-pointer rounded-[38px] bg-mm-base-500 text-sm font-medium text-white transition-colors duration-100 ease-in outline-none hover:bg-mm-base-400 active:border active:border-mm-base-500 active:bg-white active:text-mm-base-500 xl:mb-4"
          >
            加入會員
          </button>
        </Link>

        <div className="flex max-w-[284px] flex-wrap justify-center gap-x-7 gap-y-6 pt-5 xl:max-w-[1025px]">
          {popularNews.map((post) => (
            <div
              key={post.id}
              className="group flex cursor-pointer flex-col items-center"
            >
              <Link
                href={`/story/${post.slug}`}
                className="flex flex-col items-center"
              >
                <div className="h-[139px] w-[284px] overflow-hidden rounded-[53px] xl:h-[159px] xl:w-[323px]">
                  <CustomImage
                    loadingImage="/images-next/loading.gif"
                    defaultImage={DEFAULT_OG_IMAGE_URL}
                    images={post.heroImage?.resized}
                    imagesWebP={post.heroImage?.resizedWebp}
                    rwd={{
                      mobile: '284px',
                      tablet: '284px',
                      desktop: '323px',
                      default: '323px',
                    }}
                  />
                </div>
                <p className="line-clamp-1 w-68 pt-3 text-xl leading-[150%] font-normal text-[#4a4a4a] group-hover:underline group-hover:decoration-[#4a4a4a] group-hover:decoration-[1.2px] group-hover:underline-offset-[5px]">
                  {post.title}
                </p>
                <p className="line-clamp-3 w-68 pt-2 text-base leading-[150%] font-normal text-[#9b9b9b]">
                  {post.brief?.blocks?.[0]?.text}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  )
}
