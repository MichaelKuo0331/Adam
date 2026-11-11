import Link from 'next/link'

import { AD_MEDIA_QUERIES } from '@/components/ads/ad-breakpoints'
import { AD_SLOT_LAYOUTS } from '@/components/ads/ad-slot-layouts'
import { CompassFitAd } from '@/components/ads/compass-fit/compass-fit-ad'
import {
  COMPASS_FIT_ARTICLE_SLOT_INDEXES,
  COMPASS_FIT_UNITS,
} from '@/components/ads/compass-fit/compass-fit-config'
import { PrismAdSlot } from '@/components/ads/prism/prism-ad-slot'
import { PRISM_ARTICLE_FURTHER_PLACEMENT } from '@/components/ads/prism/prism-config'
import { cn } from '@/components/cn'
import { ThemeElement } from '@/components/shell/article/theme-element'
import { Typography } from '@/components/ui'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import useMediaQuery from '@/hooks/use-media-query'
import { useDisplayAd } from '@/hooks/useDisplayAd'
import type { ExternalRelatedStory } from '@/modules/external/external-types'

import NextResponsiveImage from './next-responsive-image'

export function NextUpPosts({
  items,
  hiddenAdvertised = false,
}: {
  items: ExternalRelatedStory[]
  hiddenAdvertised?: boolean
}) {
  const {
    isMediaQueryResolved: isArticleViewportResolved,
    matches: isArticlePc,
  } = useMediaQuery(AD_MEDIA_QUERIES.articleCompassFitPc)
  const { isLoggedIn, isLogInProcessFinished, shouldShowAd } =
    useDisplayAd(hiddenAdvertised)
  const keepsAdSlots =
    !hiddenAdvertised &&
    !isLoggedIn &&
    (!isLogInProcessFinished || shouldShowAd)

  if (items.length === 0) return null

  return (
    <ThemeElement as="section">
      <ThemeElement
        as="span"
        theme="accent"
        className="inline-flex rounded-t-lg bg-mm-second-700 px-3 py-1"
      >
        <Typography
          as="span"
          variant="subtitle"
          className="text-mm-neutral-100"
        >
          延伸閱讀
        </Typography>
      </ThemeElement>
      <ThemeElement
        as="ul"
        theme="post"
        className="rounded-lg rounded-tl-none p-2.5 md:grid md:grid-cols-2 md:gap-x-6 xl:px-6"
      >
        {items.map((postItem) => (
          <li key={postItem.id} className="border-b border-b-black py-4">
            <Link
              data-story-list="referral_bottom"
              href={`/${postItem.type}/${postItem.slug}`}
              className={cn(
                'grid grid-cols-[90px_1fr] items-center gap-x-4 md:grid-cols-[96px_1fr]',
                'article-title GTM-story-related-list',
                postItem.isMesoRecommend
                  ? 'GTM-story-related-miso'
                  : 'GTM-story-related-editor'
              )}
            >
              <picture className="relative block aspect-4/3">
                <NextResponsiveImage
                  fill
                  className="aspect-4/3 object-cover"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="/images-next/loading.gif"
                  src={
                    typeof postItem.heroImage?.resized?.original === 'string'
                      ? postItem.heroImage?.resized?.original?.replace(
                          /\.(jpg|png)$/i,
                          '.webP'
                        )
                      : DEFAULT_OG_IMAGE_URL
                  }
                  sizes="(max-width: 768px) 50vw, 30vw"
                  srcSet={[480, 800]}
                  alt={postItem.title ?? ''}
                  priority={false}
                  fallback={
                    typeof postItem.heroImage?.resized?.original === 'string'
                      ? postItem.heroImage?.resized?.original
                      : DEFAULT_OG_IMAGE_URL
                  }
                  errorImage={DEFAULT_OG_IMAGE_URL}
                />
              </picture>
              <Typography
                as="h2"
                variant="h6"
                className="line-clamp-3 text-mm-base-700"
              >
                {postItem.title}
              </Typography>
            </Link>
          </li>
        ))}
        {keepsAdSlots && (
          <>
            {COMPASS_FIT_ARTICLE_SLOT_INDEXES.map((slotIndex) => {
              const unitId = !isArticleViewportResolved
                ? null
                : COMPASS_FIT_UNITS.article[isArticlePc ? 'PC' : 'MB'][
                    slotIndex
                  ]

              return (
                <li className="min-w-0 py-4" key={`compass-fit-${slotIndex}`}>
                  <CompassFitAd
                    className={
                      AD_SLOT_LAYOUTS.compassFit.articleFurtherRow.className
                    }
                    enabled={shouldShowAd}
                    unitId={unitId}
                  />
                </li>
              )
            })}
            <li className="min-w-0 py-4">
              <PrismAdSlot
                className={AD_SLOT_LAYOUTS.prism.articleFurtherRow.className}
                enabled={shouldShowAd}
                placement={PRISM_ARTICLE_FURTHER_PLACEMENT}
              />
            </li>
          </>
        )}
      </ThemeElement>
    </ThemeElement>
  )
}
