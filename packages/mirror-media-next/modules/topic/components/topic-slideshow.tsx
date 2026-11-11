import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import { useCallback, useState } from 'react'
import NextLink from 'next/link'
import CustomImage from '@readr-media/react-image'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { Swiper as SwiperClass } from 'swiper'
import { A11y, Navigation } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import {
  CAROUSEL_TRANSITION_MS,
  useCarouselTicker,
} from '@/components/common/carousel-ticker'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { toTopicImageSet } from '@/modules/topic/topic-data'
import type { TopicSlideshowImage } from '@/modules/topic/topic-types'
import { isSiteUrl } from '@/utils'

type TopicSlideshowProps = {
  images: TopicSlideshowImage[]
}

function TopicSlideshow({ images }: TopicSlideshowProps) {
  const [swiper, setSwiper] = useState<SwiperClass | null>(null)
  const shouldLoop = images.length > 1
  const { carouselRef, interactionProps } = useCarouselTicker<HTMLElement>({
    isActive: shouldLoop,
    onTick: () => swiper?.slideNext(),
    skipWhenOffscreen: true,
  })

  const handlePrevious = useCallback(() => {
    swiper?.slidePrev()
  }, [swiper])

  const handleNext = useCallback(() => {
    swiper?.slideNext()
  }, [swiper])

  if (images.length === 0) {
    return null
  }

  return (
    <section
      {...interactionProps}
      aria-label="專題圖片輪播"
      aria-roledescription="carousel"
      className="leading relative mx-auto w-[87.5%] max-w-[450px] md:w-1/2 md:max-w-[830px] [&_.swiper-button-next]:hidden [&_.swiper-button-prev]:hidden"
      ref={carouselRef}
      onKeyDownCapture={(event) => {
        if (!(event.target instanceof HTMLButtonElement)) return

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          handlePrevious()
        } else if (event.key === 'ArrowRight') {
          event.preventDefault()
          handleNext()
        }
      }}
    >
      {shouldLoop && (
        <>
          <button
            aria-label="上一張"
            className="absolute top-1/2 left-2 z-10 flex size-7 -translate-y-1/2 items-center justify-center text-mm-base-700 md:left-[-24px]"
            onClick={handlePrevious}
            type="button"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-7" />
          </button>
          <button
            aria-label="下一張"
            className="absolute top-1/2 right-2 z-10 flex size-7 -translate-y-1/2 items-center justify-center text-mm-base-700 md:right-[-24px]"
            onClick={handleNext}
            type="button"
          >
            <ChevronRightIcon aria-hidden="true" className="size-7" />
          </button>
        </>
      )}
      <Swiper
        a11y={{
          itemRoleDescriptionMessage: 'slide',
          slideLabelMessage: '{{index}} / {{slidesLength}}',
        }}
        allowTouchMove={shouldLoop}
        centeredSlides
        className="[--swiper-wrapper-transition-timing-function:ease-in-out]"
        loop={shouldLoop}
        modules={[A11y, Navigation]}
        navigation={shouldLoop}
        onSwiper={setSwiper}
        spaceBetween={100}
        speed={CAROUSEL_TRANSITION_MS}
      >
        {images.map((item) => (
          <SwiperSlide key={item.id}>
            {item.topicKeywords?.startsWith('@-') ? (
              <NextLink
                href={item.topicKeywords.slice(2)}
                target={
                  isSiteUrl(item.topicKeywords.slice(2)) ? undefined : '_blank'
                }
              >
                <CustomImage
                  alt={item.name ?? ''}
                  defaultImage={DEFAULT_OG_IMAGE_URL}
                  images={toTopicImageSet(item.resized)}
                  imagesWebP={toTopicImageSet(item.resizedWebp)}
                  loadingImage="/images-next/loading@4x.gif"
                  priority
                  rwd={{
                    mobile: '450px',
                    tablet: '850px',
                    desktop: '850px',
                    default: '850px',
                  }}
                />
              </NextLink>
            ) : (
              <CustomImage
                alt={item.name ?? ''}
                defaultImage={DEFAULT_OG_IMAGE_URL}
                images={toTopicImageSet(item.resized)}
                imagesWebP={toTopicImageSet(item.resizedWebp)}
                loadingImage="/images-next/loading@4x.gif"
                priority
                rwd={{
                  mobile: '450px',
                  tablet: '850px',
                  desktop: '850px',
                  default: '850px',
                }}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export { TopicSlideshow }
export type { TopicSlideshowProps }
