import { useEffect, useRef, useState } from 'react'
import NextLink from 'next/link'

import { AD_MEDIA_QUERIES } from '@/components/ads/ad-breakpoints'
import { CompassFitAd } from '@/components/ads/compass-fit/compass-fit-ad'
import {
  COMPASS_FIT_HOMEPAGE_ITEM_INDEXES,
  COMPASS_FIT_UNITS,
  getHomepageCompassFitSlotIndex,
} from '@/components/ads/compass-fit/compass-fit-config'
import { cn } from '@/components/cn'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import useMediaQuery from '@/hooks/use-media-query'
import { useDisplayAd } from '@/hooks/useDisplayAd'

import { fetchMoreHomepageNews } from '../homepage-client-data'
import { HOMEPAGE_DESKTOP_MEDIA_QUERY } from '../homepage-constants'
import type { HomepageArticle } from '../homepage-types'

import { ArticleImage } from './article-image'
import { homepageCardLinkFocusClass } from './homepage-card-styles'
import { SectionTitle } from './section-title'

type MoreNewsProps = {
  excludedKeys: string[]
  initialArticles: HomepageArticle[]
  initialHasMore: boolean
}

type MoreNewsGridItem =
  | {
      article: HomepageArticle
      itemKey: string
      type: 'article'
    }
  | {
      article: HomepageArticle
      itemKey: string
      slotIndex: number
      type: 'ad'
    }

const focusViewportTop = 64
const minimumVisibleFocusHeight = 40

function formatPublishedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const parts = new Intl.DateTimeFormat('zh-TW', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Taipei',
    year: 'numeric',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )

  return `${values.year}.${values.month}.${values.day} ${values.hour}:${values.minute}`
}

function MoreNews({
  excludedKeys,
  initialArticles,
  initialHasMore,
}: MoreNewsProps) {
  const initialArticleCountRef = useRef(initialArticles.length)
  const [articles, setArticles] = useState(initialArticles)
  const [errorMessage, setErrorMessage] = useState('')
  const [focusArticleKey, setFocusArticleKey] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [hasLoadedMore, setHasLoadedMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [statusAnnouncement, setStatusAnnouncement] = useState('')
  const endStatusRef = useRef<HTMLSpanElement | null>(null)
  const firstAppendedArticleRef = useRef<HTMLAnchorElement | null>(null)
  const loadMoreButtonRef = useRef<HTMLButtonElement | null>(null)
  const nextFileNumberRef = useRef(1)
  const requestInFlightRef = useRef(false)
  const shouldFocusEndStatusRef = useRef(false)
  const shouldRestoreFocusRef = useRef(false)
  const { isLogInProcessFinished, shouldShowAd } = useDisplayAd()
  const {
    isMediaQueryResolved: isHomepageViewportResolved,
    matches: isHomepagePc,
  } = useMediaQuery(AD_MEDIA_QUERIES.homepageCompassFitPc)
  const reservesAdSlots = !isLogInProcessFinished || shouldShowAd
  const initialArticleCount = initialArticleCountRef.current
  const initialBatchArticles = articles.slice(0, initialArticleCount)
  const appendedArticles = articles.slice(initialArticleCount)
  const carryOverArticleCount = Math.min(
    COMPASS_FIT_HOMEPAGE_ITEM_INDEXES.length,
    initialBatchArticles.length
  )
  const initialCarryOverArticles = carryOverArticleCount
    ? initialBatchArticles.slice(-carryOverArticleCount)
    : []
  const initialVisibleArticles = carryOverArticleCount
    ? initialBatchArticles.slice(0, -carryOverArticleCount)
    : initialBatchArticles
  // Put the previous batch's tail first in the next batch (下一批), then
  // carry the newest tail forward without rearranging visible cards.
  const appendedArticlePool =
    reservesAdSlots && hasLoadedMore
      ? [...initialCarryOverArticles, ...appendedArticles]
      : appendedArticles
  const visibleAppendedArticles =
    reservesAdSlots && hasLoadedMore && hasMore && carryOverArticleCount
      ? appendedArticlePool.slice(0, -carryOverArticleCount)
      : appendedArticlePool
  const initialGridItems = reservesAdSlots
    ? initialBatchArticles.flatMap<MoreNewsGridItem>(
        (sizingArticle, itemIndex) => {
          const slotIndex = getHomepageCompassFitSlotIndex(itemIndex)
          if (slotIndex !== null) {
            return [
              {
                article: sizingArticle,
                itemKey: `initial-${itemIndex}`,
                slotIndex,
                type: 'ad',
              },
            ]
          }

          const precedingSlotCount = COMPASS_FIT_HOMEPAGE_ITEM_INDEXES.filter(
            (slotItemIndex) => slotItemIndex < itemIndex
          ).length
          const article = initialVisibleArticles[itemIndex - precedingSlotCount]

          return article
            ? [
                {
                  article,
                  itemKey: `initial-${itemIndex}`,
                  type: 'article',
                },
              ]
            : []
        }
      )
    : initialBatchArticles.map<MoreNewsGridItem>((article, itemIndex) => ({
        article,
        itemKey: `initial-${itemIndex}`,
        type: 'article',
      }))
  const gridItems: MoreNewsGridItem[] = [
    ...initialGridItems,
    ...visibleAppendedArticles.map((article) => ({
      article,
      itemKey: `appended-${article.key}`,
      type: 'article' as const,
    })),
  ]

  useEffect(() => {
    if (isLoading) return

    if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false
      loadMoreButtonRef.current?.focus()
      return
    }

    if (focusArticleKey) {
      const article = firstAppendedArticleRef.current
      if (article) {
        // Suppress auto-scroll only while a meaningful part of the article is
        // visible below the fixed shell; otherwise let the browser reveal it.
        const { bottom, top } = article.getBoundingClientRect()
        const visibleHeight =
          Math.min(bottom, window.innerHeight) - Math.max(top, focusViewportTop)
        article.focus({
          preventScroll:
            window.matchMedia(HOMEPAGE_DESKTOP_MEDIA_QUERY).matches &&
            visibleHeight >= minimumVisibleFocusHeight,
        })
      }
      return
    }

    if (shouldFocusEndStatusRef.current) {
      shouldFocusEndStatusRef.current = false
      endStatusRef.current?.focus()
    }
  }, [focusArticleKey, isLoading])

  async function handleLoadMore() {
    if (requestInFlightRef.current || !hasMore || !isLogInProcessFinished) {
      return
    }

    requestInFlightRef.current = true
    shouldFocusEndStatusRef.current = false
    shouldRestoreFocusRef.current = false
    setIsLoading(true)
    setErrorMessage('')
    setStatusAnnouncement('')

    try {
      const deferredArticlesBeforeLoad =
        shouldShowAd && carryOverArticleCount
          ? hasLoadedMore
            ? [...initialCarryOverArticles, ...appendedArticles].slice(
                -carryOverArticleCount
              )
            : initialCarryOverArticles
          : []
      const existingKeys = [
        ...excludedKeys,
        ...articles.map((article) => article.key),
      ]
      const result = await fetchMoreHomepageNews(
        existingKeys,
        nextFileNumberRef.current
      )

      nextFileNumberRef.current = result.nextFileNumber
      const newlyVisibleArticleCount =
        result.articles.length +
        (!result.hasMore ? deferredArticlesBeforeLoad.length : 0)
      setArticles((current) => current.concat(result.articles))
      setHasMore(result.hasMore)
      setHasLoadedMore(true)
      setFocusArticleKey(
        deferredArticlesBeforeLoad[0]?.key ?? result.articles[0]?.key ?? null
      )
      shouldFocusEndStatusRef.current =
        !newlyVisibleArticleCount && !result.hasMore
      const announcements: string[] = []
      if (newlyVisibleArticleCount) {
        announcements.push(`已載入 ${newlyVisibleArticleCount} 則新聞。`)
      }
      if (!result.hasMore) announcements.push('目前沒有更多新聞。')
      setStatusAnnouncement(announcements.join(' '))
    } catch (error) {
      console.error(error)
      shouldFocusEndStatusRef.current = false
      shouldRestoreFocusRef.current = true
      setErrorMessage('載入更多新聞失敗，請稍後重試。')
    } finally {
      requestInFlightRef.current = false
      setIsLoading(false)
    }
  }

  return (
    <section
      aria-labelledby="more-news-title"
      className="[overflow-anchor:none]"
    >
      <SectionTitle id="more-news-title">更多新聞</SectionTitle>

      {articles.length > 0 ? (
        <div className="mt-mm-3xl grid grid-cols-1 gap-y-mm-3xl md:grid-cols-2 md:gap-x-mm-5xl md:gap-y-mm-2xl xl:grid-cols-3 xl:gap-x-mm-l">
          {gridItems.map((item) => {
            // Keep the article card in normal flow (一般排版流) as the ad
            // slot's size contract (尺寸契約).
            const { article, itemKey } = item
            const reservesAdSlot = item.type === 'ad'
            const unitId =
              item.type !== 'ad' || !isHomepageViewportResolved
                ? null
                : COMPASS_FIT_UNITS.homepage[isHomepagePc ? 'PC' : 'MB'][
                    item.slotIndex
                  ]

            return (
              <div className="relative h-full min-w-0" key={itemKey}>
                <article
                  aria-hidden={reservesAdSlot || undefined}
                  className="h-full min-w-0"
                >
                  {reservesAdSlot ? (
                    <div className="invisible flex h-full flex-col">
                      <span className="relative block aspect-3/2 w-full overflow-hidden bg-mm-neutral-100" />
                      <Typography
                        as="span"
                        className="mt-mm-m block min-h-[3em] md:mt-mm-l md:text-mm-h6"
                        variant="h5"
                      >
                        &nbsp;
                      </Typography>
                      {article.publishedDate && (
                        <Typography
                          as="span"
                          className="mt-mm-m block md:mt-mm-l"
                          variant="caption-l"
                        >
                          &nbsp;
                        </Typography>
                      )}
                    </div>
                  ) : (
                    <NextLink
                      className={cn(
                        'GTM-homepage-latest-list group flex h-full flex-col',
                        homepageCardLinkFocusClass
                      )}
                      data-story-list="index_list_news"
                      href={article.href}
                      ref={
                        article.key === focusArticleKey
                          ? firstAppendedArticleRef
                          : undefined
                      }
                    >
                      <span className="relative block aspect-3/2 w-full overflow-hidden bg-mm-neutral-100">
                        <ArticleImage
                          alt={article.title}
                          sizes="(min-width: 1280px) 235px, (min-width: 768px) 332px, calc(100vw - 32px)"
                          src={article.imageUrl}
                        />
                        {article.sectionName && (
                          <span className="absolute top-0 left-0 flex h-6 items-center rounded-br-mm-xs bg-mm-base-600 px-mm-l font-mm-sans text-mm-subtitle text-mm-second-100">
                            {article.sectionName}
                          </span>
                        )}
                      </span>
                      <Typography
                        as="h3"
                        className="mt-mm-m line-clamp-2 min-h-[3em] text-mm-neutral-800 group-hover:underline md:mt-mm-l md:text-mm-h6"
                        variant="h5"
                      >
                        {article.title}
                      </Typography>
                      {article.publishedDate && (
                        <Typography
                          as="time"
                          className="mt-mm-m block text-mm-neutral-400 md:mt-mm-l"
                          dateTime={article.publishedDate}
                          variant="caption-l"
                        >
                          {formatPublishedDate(article.publishedDate)}
                        </Typography>
                      )}
                    </NextLink>
                  )}
                </article>

                {reservesAdSlot && (
                  <CompassFitAd
                    className="absolute inset-0 h-full"
                    enabled={shouldShowAd}
                    unitId={unitId}
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : !hasMore ? (
        <Typography className="mt-mm-3xl text-center text-mm-neutral-600">
          目前沒有更多新聞。
        </Typography>
      ) : null}

      {hasMore && (
        <Button
          className="mt-mm-3xl w-full py-0 text-mm-h5"
          disabled={!isLogInProcessFinished}
          isLoading={isLoading}
          onClick={handleLoadMore}
          ref={loadMoreButtonRef}
          size="sm"
          type="button"
          variant="outline"
        >
          {isLoading && <Spinner aria-hidden="true" />}
          看更多
        </Button>
      )}

      <span
        aria-live="polite"
        className="sr-only"
        ref={endStatusRef}
        role="status"
        tabIndex={-1}
      >
        {statusAnnouncement}
      </span>

      {errorMessage && (
        <Typography
          className="mt-mm-m text-center text-mm-neutral-600"
          role="alert"
          variant="body-s"
        >
          {errorMessage}
        </Typography>
      )}
    </section>
  )
}

export { MoreNews }
