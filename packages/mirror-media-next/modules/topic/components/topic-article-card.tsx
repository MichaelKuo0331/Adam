import NextLink from 'next/link'
import Image from '@readr-media/react-image'

import { cn } from '@/components/cn'
import { Typography } from '@/components/ui/typography'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { toTopicImageSet } from '@/modules/topic/topic-data'
import type { TopicArticle } from '@/modules/topic/topic-types'
import { transformTimeData } from '@/utils'

import { TopicSectionBadge } from './topic-card-grid'

type TopicArticleCardProps = {
  item: TopicArticle
  variant?: 'list' | 'group'
}

function TopicArticleCard({ item, variant = 'list' }: TopicArticleCardProps) {
  const section =
    item.sections.length === 1
      ? item.sections[0]
      : item.sections.find((itemSection) => itemSection.slug !== 'marketing')

  const publishedDate = item.publishedDate
    ? transformTimeData(item.publishedDate, 'dot')
    : undefined

  return (
    <NextLink
      className="itemWrapper mx-auto flex w-full max-w-82.5 flex-col gap-mm-m md:mx-0 md:w-70 md:max-w-70 md:shrink-0"
      data-story-list="topic_list"
      href={`/story/${item.slug}`}
    >
      <div
        className={cn(
          'imageContainer relative h-55 max-h-55 w-full overflow-hidden md:h-46.5 md:max-h-46.5',
          variant === 'group' && 'rounded-mm-m [&_img]:rounded-mm-m'
        )}
      >
        <Image
          alt={item.title}
          defaultImage={DEFAULT_OG_IMAGE_URL}
          images={toTopicImageSet(item.heroImage?.resized)}
          imagesWebP={toTopicImageSet(item.heroImage?.resizedWebp)}
          loadingImage="/images-next/loading.gif"
          objectFit="cover"
          rwd={{ mobile: '500px', tablet: '500px', desktop: '500px' }}
        />
        {section ? <TopicSectionBadge>{section.name}</TopicSectionBadge> : null}
      </div>
      <div className="itemDetail flex flex-col gap-mm-m">
        <Typography
          as="h2"
          className="itemTitle line-clamp-2 text-mm-neutral-800"
          variant="h5"
        >
          {item.title}
        </Typography>
        {publishedDate ? (
          <Typography
            as="time"
            className="itemDate text-mm-neutral-400"
            dateTime={item.publishedDate}
            variant="caption-l"
          >
            {publishedDate}
          </Typography>
        ) : null}
      </div>
    </NextLink>
  )
}

export { TopicArticleCard }
export type { TopicArticleCardProps }
