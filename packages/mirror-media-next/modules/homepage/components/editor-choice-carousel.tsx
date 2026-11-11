import 'swiper/css'

import { useState } from 'react'
import NextLink from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { Swiper as SwiperInstance } from 'swiper'
import { A11y } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import {
  CAROUSEL_TRANSITION_MS,
  useCarouselTicker,
} from '@/components/common/carousel-ticker'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

import type { HomepageArticle } from '../homepage-types'

import { ArticleImage } from './article-image'
import { CarouselIndicator } from './carousel-indicator'

type EditorChoiceCarouselProps = {
  articles: HomepageArticle[]
}

function EditorChoiceCarousel({ articles }: EditorChoiceCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)
  const shouldLoop = articles.length > 1
  const { carouselRef, interactionProps } = useCarouselTicker<HTMLElement>({
    isActive: shouldLoop,
    onTick: () => swiper?.slideNext(),
    skipWhenOffscreen: true,
  })

  if (!articles.length) return null

  const selectPrevious = () => swiper?.slidePrev()
  const selectNext = () => swiper?.slideNext()
  const selectSlide = (index: number) => {
    if (shouldLoop) swiper?.slideToLoop(index)
    else swiper?.slideTo(index)
  }

  return (
    <section
      {...interactionProps}
      aria-label="編輯精選"
      aria-roledescription="carousel"
      className="relative w-full overflow-hidden bg-white md:bg-mm-neutral-800"
      ref={carouselRef}
      onKeyDownCapture={(event) => {
        if (!(event.target instanceof HTMLButtonElement)) return

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          selectPrevious()
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          selectNext()
        }
      }}
    >
      <div className="relative aspect-3/2 w-full bg-mm-neutral-800">
        <Swiper
          a11y={{
            itemRoleDescriptionMessage: 'slide',
            slideLabelMessage: '{{index}} / {{slidesLength}}',
          }}
          allowTouchMove={shouldLoop}
          className="size-full [--swiper-wrapper-transition-timing-function:ease-in-out]"
          loop={shouldLoop}
          modules={[A11y]}
          onRealIndexChange={(instance) => setActiveIndex(instance.realIndex)}
          onSwiper={setSwiper}
          slidesPerView={1}
          speed={CAROUSEL_TRANSITION_MS}
        >
          {articles.map((article, index) => (
            <SwiperSlide
              className="relative size-full bg-white"
              key={article.key}
            >
              <NextLink
                aria-label={`編輯精選第 ${index + 1} 則，共 ${articles.length} 則：${article.title}`}
                className="GTM-editorchoice-list absolute inset-0 block outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white focus-visible:outline-solid"
                data-story-list="main_index"
                href={article.href}
              >
                <ArticleImage
                  alt={article.title}
                  priority={index === 0}
                  sizes="(min-width: 1280px) 728px, 100vw"
                  src={article.imageUrl}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,rgba(0,0,0,0.88)_100%)]"
                />
                <Typography
                  as="h2"
                  className="absolute right-mm-xl bottom-mm-xl left-mm-xl line-clamp-2 text-white md:right-13 md:bottom-16 md:left-13 md:text-mm-h2 xl:right-9 xl:bottom-12 xl:left-9"
                  variant="h5"
                >
                  {article.title}
                </Typography>
              </NextLink>
            </SwiperSlide>
          ))}
        </Swiper>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-mm-xl left-mm-xl z-10 rounded-mm-m bg-white px-mm-l py-mm-s font-mm-sans text-mm-subtitle text-mm-second-700 md:top-mm-3xl md:left-mm-3xl xl:top-mm-l xl:left-mm-xl"
        >
          編輯精選
        </span>

        {shouldLoop && (
          <>
            <Button
              aria-label="上一則編輯精選"
              className="absolute inset-y-0 left-mm-m z-10 my-auto grid size-7 place-items-center bg-black/65 p-0 focus-visible:outline-white active:not-aria-[haspopup]:translate-y-0 md:left-mm-xl"
              onClick={selectPrevious}
              size="icon-sm"
              type="button"
              variant="icon"
            >
              <ChevronLeftIcon className="relative -left-px block size-5" />
            </Button>
            <Button
              aria-label="下一則編輯精選"
              className="absolute inset-y-0 right-mm-m z-10 my-auto grid size-7 place-items-center bg-black/65 p-0 focus-visible:outline-white active:not-aria-[haspopup]:translate-y-0 md:right-mm-xl"
              onClick={selectNext}
              size="icon-sm"
              type="button"
              variant="icon"
            >
              <ChevronRightIcon className="relative left-px block size-5" />
            </Button>
          </>
        )}

        <div className="pointer-events-none absolute right-0 bottom-mm-4xl left-0 z-10 hidden md:block xl:bottom-mm-2xl">
          <CarouselIndicator
            activeIndex={activeIndex}
            count={articles.length}
            label="編輯精選"
            onSelect={selectSlide}
          />
        </div>
      </div>

      {shouldLoop && (
        <div className="mt-mm-xl md:hidden">
          <CarouselIndicator
            activeIndex={activeIndex}
            count={articles.length}
            label="編輯精選"
            onSelect={selectSlide}
            surface="light"
          />
        </div>
      )}
    </section>
  )
}

export { EditorChoiceCarousel }
