import Image from '@readr-media/react-image'

import { cn } from '@/components/cn'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { transformTimeDataIntoDotFormat } from '@/utils'
import type { StoryList } from '@/utils/gtm/story-list'

import { pickDisplaySection } from '../list-article-data'
import type { ArticleListItemData } from '../list-article-types'

type LeadArticleProps = {
  className?: string
  item: ArticleListItemData
  priority?: boolean
  storyList?: StoryList
}

/**
 * One of the articles leading the list. It is a card from sm up; below it the
 * design has no card, so it reads as an ordinary list row — which is why the
 * section badge and the date are rendered here and hidden from sm up.
 */
export function LeadArticle({
  className,
  item,
  priority,
  storyList,
}: LeadArticleProps) {
  const sectionName = pickDisplaySection(item.sections)?.name

  return (
    <Link
      className={cn('relative block hover:no-underline', className)}
      data-story-list={storyList}
      href={
        item.type === 'external'
          ? `/external/${item.slug}`
          : `/story/${item.slug}`
      }
      target="_blank"
    >
      <div className="relative aspect-[330/220] w-full sm:aspect-[112/80]">
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

      <Typography
        as="h2"
        variant="h5"
        className="mt-mm-l mb-1.25 line-clamp-2 text-mm-neutral-800 sm:mb-0 sm:text-[rgba(0,0,0,0.87)]"
      >
        {item.title}
      </Typography>

      <Typography
        as="p"
        variant="caption-l"
        className="text-[#a1a1a1] sm:hidden"
      >
        {transformTimeDataIntoDotFormat(item.publishedDate)}
      </Typography>
    </Link>
  )
}
