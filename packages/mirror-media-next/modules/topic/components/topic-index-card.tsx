import NextLink from 'next/link'
import Image from '@readr-media/react-image'

import { Typography } from '@/components/ui/typography'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { getTopicIndexCardImages } from '@/modules/topic/topic-data'
import type { TopicIndexItem } from '@/modules/topic/topic-types'
import { transformTimeData } from '@/utils'

type TopicIndexCardProps = {
  item: TopicIndexItem
}

function TopicIndexCard({ item }: TopicIndexCardProps) {
  const images = getTopicIndexCardImages(item)
  const createdAt = item.createdAt
    ? transformTimeData(item.createdAt, 'dot')
    : undefined

  return (
    <NextLink
      className="mx-auto flex w-full max-w-82.5 flex-col gap-mm-m md:mx-0 md:w-70 md:max-w-70 md:shrink-0"
      href={`/topic/${item.slug}`}
    >
      <div className="relative h-46.5 max-h-46.5 w-full overflow-hidden">
        <Image
          alt={item.name}
          defaultImage={DEFAULT_OG_IMAGE_URL}
          images={images}
          loadingImage="/images-next/loading.gif"
          objectFit="cover"
          rwd={{ tablet: '320px', desktop: '500px' }}
        />
      </div>
      <div className="flex flex-col gap-mm-m">
        <Typography
          as="h2"
          className="line-clamp-2 text-mm-neutral-800"
          variant="h5"
        >
          {item.name}
        </Typography>
        {createdAt ? (
          <Typography
            as="time"
            className="text-mm-neutral-400"
            dateTime={item.createdAt ?? undefined}
            variant="caption-l"
          >
            {createdAt}
          </Typography>
        ) : null}
      </div>
    </NextLink>
  )
}

export { TopicIndexCard }
export type { TopicIndexCardProps }
