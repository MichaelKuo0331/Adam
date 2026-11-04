import { useEffect, useState } from 'react'
import Image from '@readr-media/react-image'
import dayjs from 'dayjs'
import type { EmblaCarouselType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'

import type { PopularNewsApiPost } from '@/apollo/fragments/post'
import { cn } from '@/components/cn'
import { Link, Typography } from '@/components/ui'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import useMediaQuery from '@/hooks/use-media-query'

type PopularNewsItemProps = {
  items: PopularNewsApiPost[]
}

export function PopularNewsItem({ items }: PopularNewsItemProps) {
  const { matches: isDesktop } = useMediaQuery('(min-width: 1280px)')

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [selectedSnap, setSelectedSnap] = useState(0)

  const goTo = (index: number) => emblaApi?.scrollTo(index)
  const setupSnaps = (emblaApi: EmblaCarouselType) =>
    setScrollSnaps(emblaApi.scrollSnapList())
  const setActiveSnap = (emblaApi: EmblaCarouselType) =>
    setSelectedSnap(emblaApi.selectedScrollSnap())

  useEffect(() => {
    if (!emblaApi) return

    setupSnaps(emblaApi)
    setActiveSnap(emblaApi)

    emblaApi.on('reInit', setupSnaps)
    emblaApi.on('reInit', setActiveSnap)
    emblaApi.on('select', setActiveSnap)
  }, [emblaApi])

  if (isDesktop) {
    return (
      <div className="grid grid-cols-3 gap-x-13 gap-y-7 py-6">
        {items.map((item, index) => (
          <div key={index}>
            <Link
              data-story-list="idlepage"
              href={`/story/${item.slug}`}
              className="GTM-idle-window-click-popular-list"
            >
              <div className="relative space-y-2">
                <div className="absolute top-0 z-1 bg-mm-base-600 px-2.5 py-1 text-mm-second-100">
                  {item.sectionsInInputOrder?.[0]?.name ||
                    item.sections?.[0]?.name}
                </div>
                <picture className="relative block aspect-video w-full">
                  <Image
                    images={item?.heroImage?.resized}
                    alt={item.title}
                    loadingImage="/images-next/loading.gif"
                    defaultImage={DEFAULT_OG_IMAGE_URL}
                  />
                </picture>
                <Typography
                  variant="subtitle"
                  className="line-clamp-2 max-h-12 min-h-12 text-base text-mm-neutral-800"
                >
                  {item.title}
                </Typography>
              </div>
            </Link>
            <Typography
              variant="caption-l"
              className="pointer-events-none text-mm-neutral-400"
            >
              {dayjs(item.publishedDate).format('YYYY.MM.DD HH:mm')}
            </Typography>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="embla_viewport overflow-hidden" ref={emblaRef}>
      <div className="embla__container flex touch-pan-y touch-pinch-zoom">
        {items.map((item, index) => (
          <div
            key={index}
            className="embla__slide min-w-0 shrink-0 grow-0 basis-full px-10.25"
          >
            <Link
              data-story-list="idlepage"
              href={`/story/${item.slug}`}
              className="GTM-idle-window-click-popular-list"
            >
              <div className="relative space-y-2">
                <div className="absolute top-0 z-1 bg-mm-base-600 px-2.5 py-1 text-mm-second-100">
                  {item.sectionsInInputOrder?.[0]?.name ||
                    item.sections?.[0]?.name}
                </div>
                <picture className="relative block aspect-23/15 w-full">
                  <Image
                    images={item?.heroImage?.resized}
                    alt={item.title}
                    loadingImage="/images-next/loading.gif"
                    defaultImage={DEFAULT_OG_IMAGE_URL}
                  />
                </picture>
                <Typography
                  as="h2"
                  variant="subtitle"
                  className="line-clamp-2 max-h-12 min-h-12 text-base text-mm-neutral-800"
                >
                  {item.title}
                </Typography>
              </div>
              <Typography
                as="div"
                variant="caption-l"
                className="text-mm-neutral-400"
              >
                {dayjs(item.publishedDate).format('YYYY.MM.DD HH:mm')}
              </Typography>
            </Link>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-x-1 py-3">
        {scrollSnaps.map((_, index) => (
          <button
            className={cn('aspect-square w-2 rounded-full bg-mm-neutral-300', {
              'bg-mm-base-300': index === selectedSnap,
            })}
            key={index}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  )
}
