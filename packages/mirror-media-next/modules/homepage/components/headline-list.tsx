import NextLink from 'next/link'

import { AD_SLOT_LAYOUTS } from '@/components/ads/ad-slot-layouts'
import { PrismAdSlot } from '@/components/ads/prism/prism-ad-slot'
import { PRISM_SIDE_PLACEMENTS } from '@/components/ads/prism/prism-config'
import { cn } from '@/components/cn'
import { Typography } from '@/components/ui/typography'
import { useDisplayAd } from '@/hooks/useDisplayAd'
import type { StoryList } from '@/utils/gtm/story-list'

import { HOMEPAGE_POPULAR_NEWS_COUNT } from '../homepage-constants'
import type { HomepageArticle } from '../homepage-types'

import { ArticleImage } from './article-image'
import { homepageCardLinkFocusClass } from './homepage-card-styles'
import { SectionTitle } from './section-title'

type HeadlineListProps = {
  articles: HomepageArticle[]
  className?: string
  storyList?: StoryList
  title: string
  titleId: string
  trackingClassName?: string
  withPrismAds?: boolean
}

type HeadlineListItem =
  | {
      article: HomepageArticle
      itemKey: string
      type: 'article'
    }
  | {
      itemKey: string
      placement: (typeof PRISM_SIDE_PLACEMENTS.homepage)[number]
      type: 'ad'
    }

const homepagePrismItemIndexes = [2, 4] as const

function HeadlineList({
  articles,
  className,
  storyList,
  title,
  titleId,
  trackingClassName,
  withPrismAds = false,
}: HeadlineListProps) {
  const { isLogInProcessFinished, shouldShowAd } = useDisplayAd()

  if (!articles.length) return null

  const reservesPrismAds =
    withPrismAds && (!isLogInProcessFinished || shouldShowAd)
  const listItems: HeadlineListItem[] = []

  if (reservesPrismAds) {
    let articleIndex = 0

    for (
      let itemIndex = 0;
      itemIndex < HOMEPAGE_POPULAR_NEWS_COUNT;
      itemIndex += 1
    ) {
      const slotIndex = homepagePrismItemIndexes.findIndex(
        (adIndex) => adIndex === itemIndex
      )

      if (slotIndex !== -1) {
        listItems.push({
          itemKey: `homepage-popular-${itemIndex}`,
          placement: PRISM_SIDE_PLACEMENTS.homepage[slotIndex],
          type: 'ad',
        })
        continue
      }

      const article = articles[articleIndex]

      if (!article) break

      listItems.push({
        article,
        itemKey: `homepage-popular-${itemIndex}`,
        type: 'article',
      })
      articleIndex += 1
    }
  } else {
    articles.forEach((article, index) => {
      listItems.push({
        article,
        itemKey: withPrismAds ? `homepage-popular-${index}` : article.key,
        type: 'article',
      })
    })
  }

  return (
    <section aria-labelledby={titleId} className={className}>
      <SectionTitle id={titleId}>{title}</SectionTitle>
      <ol className="mt-mm-xl xl:mt-mm-l">
        {listItems.map((item) => (
          <li
            className="border-t border-mm-neutral-300 py-mm-m"
            key={item.itemKey}
          >
            {item.type === 'ad' ? (
              <PrismAdSlot
                className={AD_SLOT_LAYOUTS.prism.homepageHeadlineRow.className}
                enabled={shouldShowAd}
                placement={item.placement}
              />
            ) : (
              <NextLink
                className={cn(
                  'group grid min-h-16 grid-cols-[96px_minmax(0,1fr)] items-center gap-mm-m xl:gap-mm-l',
                  homepageCardLinkFocusClass,
                  trackingClassName
                )}
                data-story-list={storyList}
                href={item.article.href}
              >
                <span className="relative block h-16 w-24 overflow-hidden bg-mm-neutral-100">
                  <ArticleImage
                    alt=""
                    sizes="96px"
                    src={item.article.imageUrl}
                  />
                </span>
                <Typography
                  as="h3"
                  className="line-clamp-2 text-mm-neutral-700 group-hover:underline"
                  variant="body-l"
                >
                  {item.article.title}
                </Typography>
              </NextLink>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

export { HeadlineList }
