import Image from '@readr-media/react-image'

import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { transformTimeDataIntoDotFormat } from '@/utils'
import type { StoryList } from '@/utils/gtm/story-list'

import { pickDisplaySection } from '../list-article-data'
import type { ArticleListItemData } from '../list-article-types'

type ArticleListItemProps = {
  item: ArticleListItemData
  priority?: boolean
  storyList?: StoryList
}

export function ArticleListItem({
  item,
  priority,
  storyList,
}: ArticleListItemProps) {
  const sectionName = pickDisplaySection(item.sections)?.name

  return (
    <Link
      className="relative block hover:no-underline sm:flex sm:items-center sm:gap-mm-xl"
      data-story-list={storyList}
      href={
        item.type === 'external'
          ? `/external/${item.slug}`
          : `/story/${item.slug}`
      }
      target="_blank"
    >
      <div className="relative mb-mm-l aspect-[330/220] w-full sm:mb-0 sm:aspect-auto sm:h-[127px] sm:w-[179px] sm:shrink-0">
        <Image
          images={item.heroImage?.resized}
          imagesWebP={item.heroImage?.resizedWebp}
          alt={item.title}
          loadingImage="/images-next/loading.gif"
          defaultImage={DEFAULT_OG_IMAGE_URL}
          rwd={{ mobile: '400px', tablet: '400px', desktop: '400px' }}
          priority={priority}
        />
      </div>

      {sectionName && (
        <Typography
          as="span"
          variant="subtitle"
          className="absolute top-0 left-0 flex h-6 items-center bg-mm-base-600 px-2.5 text-mm-second-100 sm:hidden"
        >
          {sectionName}
        </Typography>
      )}

      <div>
        <Typography
          as="h2"
          variant="h5"
          className="mb-1.25 line-clamp-2 text-mm-neutral-800 sm:mb-1"
        >
          {item.title}
        </Typography>
        <Typography
          as="p"
          variant="caption-l"
          className="text-[#a1a1a1] sm:text-mm-caption-s sm:text-mm-neutral-700"
        >
          {transformTimeDataIntoDotFormat(item.publishedDate)}
        </Typography>
        <Typography
          as="p"
          variant="body-s"
          className="hidden text-mm-neutral-500 sm:line-clamp-2"
        >
          {item.brief !== 'DbNull' && item.brief?.blocks?.[0]?.text}
        </Typography>
      </div>
    </Link>
  )
}
