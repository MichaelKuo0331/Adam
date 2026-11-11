import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import NextLink from 'next/link'

import { cn } from '@/components/cn'
import {
  shellBracketTextLinkOnDarkClass,
  shellBrandLinkClass,
} from '@/components/shell/link-styles'
import { ENV } from '@/config/index.mjs'
import { useDisplayAd } from '@/hooks/useDisplayAd'
import type {
  HeadersDataSection,
  ShellFlashNews,
  ShellSectionPosts,
  Topics,
} from '@/utils/api'

import { FlashNews } from './flash-news'
import {
  navLinkClassName,
  navLinkRuleAlways,
  navLinkRuleOnHover,
} from './nav-link'
import {
  createShellNavigation,
  shellPartnerLinks,
  shellUtilityLinks,
} from './navigation'
import { ShellSearch } from './shell-search'
import { useSetStickyLayout, useStickyHeader } from './sticky-header-context'
import { useHorizontalWheelScroll } from './use-horizontal-wheel-scroll'

const DesktopNavigationItem = dynamic(() =>
  import('./desktop-navigation-item').then(
    (module) => module.DesktopNavigationItem
  )
)
const MemberMenu = dynamic(() =>
  import('./member-menu').then((module) => module.MemberMenu)
)
const DesktopNavigationFlyout = dynamic(() =>
  import('./desktop-navigation-flyout').then(
    (module) => module.DesktopNavigationFlyout
  )
)
const MobileMenu = dynamic(() =>
  import('./mobile-menu').then((module) => module.MobileMenu)
)
const GPTAd = dynamic(() => import('@/components/ads/gpt/gpt-ad'), {
  ssr: false,
})

type SiteHeaderProps = {
  activeNavigationSlug?: string
  flashNewsData?: ShellFlashNews[]
  navigationData: HeadersDataSection[]
  sectionPostsData?: ShellSectionPosts
  topicsData: Topics
}

type HeaderAdStatus = 'empty' | 'filled' | 'pending'

function SiteHeader({
  activeNavigationSlug,
  flashNewsData,
  navigationData,
  sectionPostsData,
  topicsData,
}: SiteHeaderProps) {
  const { shouldShowAd } = useDisplayAd()
  const [headerAdStatus, setHeaderAdStatus] =
    useState<HeaderAdStatus>('pending')
  const { showStickyControls } = useStickyHeader()
  const setStickyLayout = useSetStickyLayout()
  const categoryStripRef = useHorizontalWheelScroll()
  const [openFlyoutSlug, setOpenFlyoutSlug] = useState<string | null>(null)
  const [renderedFlyoutSlug, setRenderedFlyoutSlug] = useState<string | null>(
    null
  )
  const navigationRegionRef = useRef<HTMLDivElement | null>(null)
  const flashNewsRowRef = useRef<HTMLDivElement | null>(null)
  const logoRowRef = useRef<HTMLDivElement | null>(null)
  const navigation = createShellNavigation(navigationData, sectionPostsData)
  const openFlyoutItem = navigation.find(
    (item) => item.slug === openFlyoutSlug && item.categories.length > 0
  )
  const renderedFlyoutItem = navigation.find(
    (item) => item.slug === renderedFlyoutSlug && item.categories.length > 0
  )
  const hasFlyoutItems = navigation.some((item) => item.categories.length > 0)
  const visibleTopics = topicsData.slice(0, 7)
  const flashNews = flashNewsData ?? []
  const hasFlashNewsRow = flashNews.length > 0 || visibleTopics.length > 0
  const shouldShowHeaderAdPreview =
    ENV !== 'prod' && (!shouldShowAd || headerAdStatus !== 'filled')

  const handleHeaderAdRenderEnded = useCallback(
    (event: googletag.events.SlotRenderEndedEvent) =>
      setHeaderAdStatus(event.isEmpty ? 'empty' : 'filled'),
    []
  )

  useEffect(() => setHeaderAdStatus('pending'), [shouldShowAd])

  // Measured while nothing is fixed or hidden yet: reading the live values once
  // the header sticks would feed that state back into the threshold producing it.
  useLayoutEffect(() => {
    const flashNewsRowHeight = flashNewsRowRef.current?.offsetHeight ?? 0
    const logoRowHeight = logoRowRef.current?.offsetHeight ?? 0
    const navigationRowHeight = navigationRegionRef.current?.offsetHeight ?? 0
    setStickyLayout({
      height: navigationRowHeight,
      offset: flashNewsRowHeight + logoRowHeight,
    })
  }, [hasFlashNewsRow, setStickyLayout])

  useEffect(() => {
    if (!openFlyoutSlug) {
      return
    }
    const activeFlyoutSlug = openFlyoutSlug

    function closeOnFocusOutside(event: FocusEvent) {
      const target = event.target
      const focusedTrigger =
        target instanceof Element &&
        target.matches('[data-slot="desktop-navigation-trigger"]')
      const focusedInsideFlyout = navigationRegionRef.current
        ?.querySelector('[data-slot="navigation-flyout"]')
        ?.contains(target as Node)

      if (!focusedTrigger && !focusedInsideFlyout) {
        setOpenFlyoutSlug(null)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      const trigger = [
        ...(navigationRegionRef.current?.querySelectorAll<HTMLAnchorElement>(
          '[data-slot="desktop-navigation-trigger"]'
        ) ?? []),
      ].find((element) => element.dataset.navigationSlug === activeFlyoutSlug)

      // Focus first: the trigger's focus handler reopens the flyout, then the
      // state updates below close it in the same event.
      trigger?.focus()
      setOpenFlyoutSlug(null)
    }

    function closeOnNavigation(event: MouseEvent) {
      const target = event.target
      if (
        target instanceof Element &&
        navigationRegionRef.current?.contains(target) &&
        target.closest('a')
      ) {
        setOpenFlyoutSlug(null)
      }
    }

    document.addEventListener('focusin', closeOnFocusOutside)
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('click', closeOnNavigation)
    return () => {
      document.removeEventListener('focusin', closeOnFocusOutside)
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('click', closeOnNavigation)
    }
  }, [openFlyoutSlug])

  function openFlyoutFromPointerOrFocus(slug: string) {
    const item = navigation.find((entry) => entry.slug === slug)
    if (!item || item.categories.length === 0) {
      setOpenFlyoutSlug(null)
      return
    }

    setRenderedFlyoutSlug(slug)
    setOpenFlyoutSlug(slug)
  }

  return (
    <header
      className="relative z-(--mm-z-shell-header) bg-white"
      data-slot="site-header"
    >
      {(flashNews.length > 0 || visibleTopics.length > 0) && (
        <div
          // Must stay in the flow: hiding it here takes its height out of the
          // document and the page jumps under the reader.
          className="flex h-12 items-center bg-mm-base-500 px-mm-2xl text-mm-error-300 lg:px-mm-2xl"
          ref={flashNewsRowRef}
        >
          <div className="mx-auto flex w-full max-w-310 min-w-0 items-center justify-between gap-mm-xl">
            {flashNews.length > 0 ? (
              <FlashNews items={flashNews} />
            ) : (
              <span aria-hidden="true" />
            )}
            {visibleTopics.length > 0 && (
              <nav
                aria-label="專題推薦"
                // The row clips its overflow, and each link's hover rules sit
                // just outside its margin box, so the first and last would be
                // cut off. Widen the padding box and take the width back out of
                // the layout again.
                className="-mx-mm-m hidden min-w-0 gap-mm-xl overflow-hidden px-mm-m font-mm-body text-mm-body2 whitespace-nowrap text-white lg:flex"
              >
                {visibleTopics.map((topic) => (
                  <NextLink
                    className={shellBracketTextLinkOnDarkClass}
                    href={`/topic/${topic.slug}`}
                    key={topic.id}
                  >
                    {topic.name}
                  </NextLink>
                ))}
                <NextLink
                  className={shellBracketTextLinkOnDarkClass}
                  href="/section/topic"
                >
                  更多
                </NextLink>
              </nav>
            )}
          </div>
        </div>
      )}

      <div className="bg-white">
        <div
          className="mx-auto flex h-15 w-full max-w-7xl items-center gap-mm-2xl px-mm-2xl"
          ref={logoRowRef}
        >
          <div className="flex min-w-0 flex-1 items-center gap-mm-4xl">
            <NextLink
              aria-label="回到鏡週刊首頁"
              className={cn('GTM-header-logo shrink-0', shellBrandLinkClass)}
              href="/"
            >
              <Image
                alt="鏡週刊 Mirror Media"
                // Keep the logo at its intrinsic size.
                className="h-auto w-27"
                height={46}
                priority
                src="/images-next/mirror-media-logo.svg"
                width={108}
              />
            </NextLink>

            <div className="@container min-w-0 flex-1">
              {/* The real slot is environment-independent; only the second
                  preview slot is excluded from production. */}
              <div className="flex items-center gap-mm-l">
                {(shouldShowAd || ENV !== 'prod') && (
                  <div
                    className="relative hidden h-[50px] w-[110px] shrink-0 items-center justify-center @min-[110px]:flex"
                    data-slot="header-ad-slot"
                  >
                    {shouldShowAd && (
                      <GPTAd
                        adKey="RWD_LOGO"
                        onSlotRenderEnded={handleHeaderAdRenderEnded}
                        pageKey="global"
                      />
                    )}
                    {shouldShowHeaderAdPreview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-mm-error-100 font-mm-sans text-mm-caption-s text-mm-neutral-800">
                        110×50
                      </div>
                    )}
                  </div>
                )}
                {ENV !== 'prod' && (
                  <div
                    className="hidden h-[30px] w-30 shrink-0 items-center justify-center bg-mm-error-100 font-mm-sans text-mm-caption-s text-mm-neutral-800 @min-[242px]:flex"
                    data-slot="header-ad-slot"
                  >
                    120×30
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-mm-l lg:hidden">
            <MemberMenu />
            <MobileMenu navigation={navigation} topics={topicsData} />
          </div>

          <div className="hidden shrink-0 items-center gap-mm-2xl lg:flex">
            <nav
              aria-label="合作品牌"
              // Keep each lockup centred at its own size within the 28px row.
              className="flex h-7 items-center gap-mm-2xl"
            >
              {shellPartnerLinks.map((link) => (
                <NextLink
                  aria-label={link.label}
                  className={shellBrandLinkClass}
                  href={link.href}
                  key={link.label}
                  rel="noopener"
                  target="_blank"
                >
                  <Image
                    alt=""
                    className="w-auto object-contain"
                    height={link.height}
                    src={link.src}
                    // Each lockup keeps its own design height; without this the
                    // optimiser's output size would drive the rendered box.
                    style={{ height: link.height }}
                    width={link.width}
                  />
                </NextLink>
              ))}
            </nav>
            <ShellSearch className="w-55" />
            <MemberMenu />
          </div>
        </div>

        <div
          className={cn(
            'relative z-(--mm-z-shell-header) flex h-12 w-full items-center border-b border-mm-neutral-200 bg-white',
            showStickyControls && 'fixed inset-x-0 top-0'
          )}
          onMouseLeave={() => {
            setOpenFlyoutSlug(null)
          }}
          ref={navigationRegionRef}
        >
          <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-mm-xl px-mm-2xl">
            {/* Only rendered while stuck: a zero-width placeholder would still
                contribute the flex gap and push the category row out of the
                20px column shared by the flash news bar and the logo. */}
            {showStickyControls && (
              <NextLink
                aria-label="回到鏡週刊首頁"
                className={cn('GTM-header-logo shrink-0', shellBrandLinkClass)}
                href="/"
              >
                <Image
                  alt="鏡週刊 Mirror Media"
                  className="h-auto w-14"
                  height={24}
                  src="/images-next/mirror-media-logo.svg"
                  width={56}
                />
              </NextLink>
            )}
            <nav
              aria-label="主要分類"
              ref={categoryStripRef}
              className="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-mm-2xl overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] md:justify-between lg:justify-start lg:gap-[clamp(1rem,6.25vw-3rem,2rem)] [&::-webkit-scrollbar]:hidden"
            >
              {navigation.map((item) => (
                <div className="lg:hidden" key={`compact-${item.slug}`}>
                  <NextLink
                    className={cn(
                      navLinkClassName,
                      activeNavigationSlug === item.slug
                        ? navLinkRuleAlways
                        : navLinkRuleOnHover
                    )}
                    href={item.href}
                  >
                    {item.name}
                  </NextLink>
                </div>
              ))}
              {navigation.map((item) => (
                <div className="hidden lg:block" key={`desktop-${item.slug}`}>
                  <DesktopNavigationItem
                    active={activeNavigationSlug === item.slug}
                    expanded={openFlyoutSlug === item.slug}
                    item={item}
                    onOpen={openFlyoutFromPointerOrFocus}
                  />
                </div>
              ))}
            </nav>
            <nav
              aria-label="其他服務"
              className="hidden shrink-0 items-center gap-mm-4xl lg:flex"
            >
              {shellUtilityLinks.map((link) => (
                <NextLink
                  className={cn(navLinkClassName, navLinkRuleOnHover)}
                  href={link.href}
                  key={link.label}
                  onFocus={() => setOpenFlyoutSlug(null)}
                  onMouseEnter={() => setOpenFlyoutSlug(null)}
                >
                  {link.label}
                </NextLink>
              ))}
            </nav>
          </div>

          {hasFlyoutItems && (
            <DesktopNavigationFlyout
              item={renderedFlyoutItem}
              open={Boolean(openFlyoutItem)}
            />
          )}
        </div>
      </div>

      {showStickyControls && (
        <div
          aria-hidden="true"
          // Must equal the category row that left the flow.
          className="h-12"
        />
      )}
    </header>
  )
}

export { SiteHeader }
export type { SiteHeaderProps }
