import { useCallback, useRef } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'

import { cn } from '@/components/cn'

import type { ShellNavigationItem } from './navigation'

/**
 * The panel is entirely neutral, so the hover indicator is a white rule rather
 * than a colour shift. How far below the element it sits is left to each
 * use: a 388px card and a four-character label do not want the same gap.
 */
const RULE =
  'after:absolute after:inset-x-0 after:h-mm-sx after:origin-left after:scale-x-0 after:rounded-full after:bg-white after:transition-transform after:duration-150 after:content-[""] motion-reduce:after:transition-none'

type DesktopNavigationFlyoutProps = {
  item?: ShellNavigationItem
  open: boolean
}

function formatPostDate(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Taipei',
    year: 'numeric',
  }).formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${getPart('year')}.${getPart('month')}.${getPart('day')} ${getPart(
    'hour'
  )}:${getPart('minute')}`
}

/**
 * The header owns this full-width panel so category changes swap its joined
 * article data and sub-categories without remounting the panel.
 */
function DesktopNavigationFlyout({ item, open }: DesktopNavigationFlyoutProps) {
  const listRef = useRef<HTMLElement | null>(null)

  // Over the category list the browser scrolls that list, and overscroll-contain
  // keeps the page out of it at either end. Everywhere else in the panel there
  // is nothing to scroll, so the page must not take the gesture instead.
  const panelRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      return
    }

    function handleWheel(event: WheelEvent) {
      if (listRef.current?.contains(event.target as Node)) {
        return
      }

      event.preventDefault()
    }

    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      node.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div
      aria-hidden={!open}
      className={cn(
        'absolute inset-x-0 top-full z-(--mm-z-shell-header) hidden overflow-hidden bg-mm-neutral-800 text-white transition-[max-height] motion-reduce:transition-none lg:block',
        open
          ? 'max-h-62 duration-200 ease-out'
          : 'pointer-events-none max-h-0 duration-150 ease-in'
      )}
      data-slot="navigation-flyout"
      id="site-header-navigation-flyout"
      inert={!open}
      ref={panelRef}
    >
      {item && (
        <div className="mx-auto flex h-62 w-full max-w-7xl items-center gap-mm-3xl px-mm-2xl">
          {/* Laid out even when it has nothing to show. Holding the width is what
            keeps the divider and the category columns where they are when a
            section comes back with fewer than two posts; without it the columns
            slide left and centre themselves against the whole panel.
            2 x (220 image + 16 + 152 title) + 16 between the pair = 792.

            The frame spaces image, title, image, title evenly at 16px rather
            than setting the two articles apart, so the row reads as one strip. */}
          <div className="flex w-198 shrink-0 gap-mm-xl">
            {item.posts.map((post) => (
              <NextLink
                className={cn(
                  'relative flex gap-mm-xl rounded-mm-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid',
                  RULE,
                  'after:-bottom-3 hover:after:scale-x-100'
                )}
                href={post.href}
                key={post.href}
              >
                {/* 220x146 is the frame's image box. The height is off the 4px
                    grid but stays: it sets the ratio the artwork is cropped to,
                    and the panel height and divider are placed against it. */}
                <Image
                  alt=""
                  className="h-[146px] w-55 shrink-0 object-cover"
                  height={146}
                  src={post.heroImage}
                  unoptimized
                  width={220}
                />
                {/* Snap the measured 150px title box to the 4px grid. */}
                <div className="flex w-38 flex-col justify-between">
                  <span className="line-clamp-3 font-mm-sans text-mm-h6 text-white">
                    {post.title}
                  </span>
                  <time
                    className="font-mm-sans text-mm-caption-l text-mm-neutral-400"
                    dateTime={post.publishedDate}
                  >
                    {formatPostDate(post.publishedDate)}
                  </time>
                </div>
              </NextLink>
            ))}
          </div>

          {item.categories.length > 0 && (
            <div
              aria-hidden="true"
              className="h-43 w-px shrink-0 bg-mm-neutral-600"
            />
          )}

          {item.categories.length > 0 && (
            <nav
              aria-label={`${item.name}子分類`}
              ref={listRef}
              className="grid h-43 flex-1 [scrollbar-color:rgb(255_255_255/0.4)_transparent] auto-rows-min grid-cols-2 gap-x-mm-4xl gap-y-mm-xl overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-track]:bg-transparent"
            >
              {item.categories.map((category) => (
                <NextLink
                  className={cn(
                    'relative w-fit justify-self-center rounded-mm-xs pb-1 font-mm-sans text-mm-h6 whitespace-nowrap text-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid',
                    RULE,
                    'after:bottom-0 hover:after:scale-x-100'
                  )}
                  href={category.href}
                  key={category.slug}
                >
                  {category.name}
                </NextLink>
              ))}
            </nav>
          )}
        </div>
      )}
    </div>
  )
}

export { DesktopNavigationFlyout }
