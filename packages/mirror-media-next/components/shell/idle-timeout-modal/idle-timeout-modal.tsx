import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Dialog } from '@base-ui/react'
import axios from 'axios'

import type { PopularNewsApiPost } from '@/apollo/fragments/post'
import { cn } from '@/components/cn'
import { useCarouselTickerPause } from '@/components/common/carousel-ticker'
import { PopularNewsItem } from '@/components/shell/idle-timeout-modal/popular-news-item'
import { Typography } from '@/components/ui'
import { API_TIMEOUT, URL_STATIC_POPULAR_NEWS } from '@/config/index.mjs'
import { IDLE_MODAL_LINK } from '@/constants'
import { CUSTOMER_SERVICE_INFOS } from '@/constants/footer'
import { useIdleTimeout } from '@/hooks/use-idle-timeout'
import { isInternalUrl, isSiteUrl } from '@/utils'

const IDLE_TIMEOUT = 60 * 2 * 1000 // 2 minutes in milliseconds

type IdleTimeoutModalProps = {
  pauseCarouselTicker?: boolean
}

/**
 * IdleTimeoutModal Component
 * This modal appears after the user has been idle for a specified amount of time.
 */
function IdleTimeoutModal({
  pauseCarouselTicker = false,
}: IdleTimeoutModalProps) {
  const [isIdle, setIsIdle] = useIdleTimeout(IDLE_TIMEOUT)
  const [popularNews, setPopularNews] = useState<PopularNewsApiPost[]>([])
  useCarouselTickerPause(pauseCarouselTicker && isIdle)

  useEffect(() => {
    if (popularNews.length) return
    axios({
      method: 'get',
      url: URL_STATIC_POPULAR_NEWS,
      timeout: API_TIMEOUT,
    })
      .then((res) => {
        if (!Array.isArray(res?.data)) return

        const data: PopularNewsApiPost[] = res.data.slice(0, 6)
        setPopularNews(data)
      })
      .catch((error) => {
        console.error('Error fetching popular news:', error)
      })
  }, [popularNews.length])

  const handleClose = () => {
    setIsIdle(false)
  }

  if (!isIdle) return null

  return (
    <Dialog.Root open={isIdle} onOpenChange={setIsIdle}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-(--mm-z-shell-top) bg-black/50" />
        {/* Viewport 只負責置中。pointer-events 留給 Backdrop，點白卡以外才會關閉。 */}
        <Dialog.Viewport className="pointer-events-none fixed inset-0 z-(--mm-z-shell-top) overflow-y-auto">
          <div className="flex min-h-full w-full items-center justify-center">
            <Dialog.Popup className="pointer-events-auto w-full max-w-90 bg-white px-4 py-6 xl:max-w-200 xl:scale-[clamp(70%,calc(100vh/768px*100%),100%)] xl:px-21.5 xl:pt-13">
              <div className="relative">
                <div className="flex flex-col gap-y-3 pb-3 xl:flex-row xl:justify-between xl:pb-0">
                  <Image
                    src="/images-next/mirror-media-logo.svg"
                    alt="mirrormedia"
                    width={107}
                    height={45}
                    loading="lazy"
                  />

                  <div className="font-mm-sans text-mm-h5 text-mm-base-400 xl:self-end">
                    您已閒置2分鐘，請點擊關閉按鈕或空白處，即可回到鏡週刊網站
                  </div>
                </div>
                <Image
                  src="/images-next/close-modal.svg"
                  alt="mirrormedia"
                  width={32}
                  height={32}
                  loading="eager"
                  className="absolute -top-5 -right-3 cursor-pointer xl:-top-7 xl:-right-15.5"
                  onClick={handleClose}
                />

                {popularNews.length ? (
                  <PopularNewsItem items={popularNews} />
                ) : null}

                <hr className="border-4 border-mm-base-400" />
              </div>
              <div className="space-y-3.5 pt-3">
                <ul className="grid grid-cols-2 gap-x-7 gap-y-3 xl:flex xl:flex-wrap xl:gap-x-4">
                  {IDLE_MODAL_LINK.map((link, index) => {
                    return (
                      <a
                        key={index}
                        href={link.href}
                        target={isSiteUrl(link.href) ? undefined : '_blank'}
                        className="grow-1"
                        rel={
                          isInternalUrl(link.href)
                            ? undefined
                            : 'noopener noreferrer'
                        }
                      >
                        <Typography variant="h6" className="text-mm-base-500">
                          {link.title}
                        </Typography>
                      </a>
                    )
                  })}
                </ul>

                <div className="xl:flex xl:gap-x-2">
                  {CUSTOMER_SERVICE_INFOS.map((item, index) => {
                    return (
                      <div
                        key={index}
                        className={cn({
                          inline: item.name !== 'customer-service-email',
                          'ml-3 xl:ml-0': item.name === 'customer-service-hour',
                        })}
                      >
                        <Typography
                          as="span"
                          variant="caption-s"
                          className="text-xs text-mm-base-700"
                        >
                          {item.title} {item.description}
                        </Typography>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Dialog.Popup>
          </div>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { IdleTimeoutModal }
