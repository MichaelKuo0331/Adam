import Image from '@readr-media/react-image'

import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { getArticleHref, transformTimeDataIntoDotFormat } from '@/utils'
import type { StoryList } from '@/utils/gtm/story-list'

import type { ArticleStyle, AsideArticle } from '../aside-types'

type AsideArticleItemProps = {
  article: AsideArticle
  storyList?: StoryList
}

export function AsideArticleItem({
  article,
  storyList,
}: AsideArticleItemProps) {
  return (
    <Link
      className="flex items-center gap-mm-3xl hover:no-underline"
      data-story-list={storyList}
      href={getArticleHref(
        article.slug,
        // The JSON is not validated down to the style names, and only
        // 'campaign' and 'projects' change the href anyway.
        article.style as ArticleStyle,
        /*
          此 component 是從舊的 story 頁移植過來，
          因為新版 v4 週刊，category 等相關頁面都有 <aside> 的設計
          目前檢查舊文章頁都沒有帶入 partner 這個參數，
          所以維持 空字串
         */
        ''
      )}
    >
      <div className="relative h-[114px] w-40 shrink-0">
        <Image
          images={article.heroImage?.resized}
          imagesWebP={article.heroImage?.resizedWebp}
          alt={article.title}
          loadingImage="/images-next/loading.gif"
          defaultImage={DEFAULT_OG_IMAGE_URL}
          rwd={{ mobile: '400px', tablet: '400px', desktop: '400px' }}
        />
      </div>

      <div className="min-w-0">
        <Typography
          as="h3"
          variant="h5"
          className="line-clamp-3 text-[rgba(0,0,0,0.87)]"
        >
          {article.title}
        </Typography>
        {article.publishedDate && (
          <Typography
            as="p"
            variant="caption-l"
            className="mt-mm-l text-mm-neutral-400"
          >
            {transformTimeDataIntoDotFormat(article.publishedDate)}
          </Typography>
        )}
      </div>
    </Link>
  )
}
