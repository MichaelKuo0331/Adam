import { useState } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'
import { XIcon } from 'lucide-react'

import { cn } from '@/components/cn'
import {
  shellBracketTextLinkOnDarkClass,
  shellBrandLinkClass,
} from '@/components/shell/link-styles'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Topics } from '@/utils/api'

import {
  type ShellNavigationItem,
  shellPartnerLinks,
  shellUtilityLinks,
} from './navigation'
import { ShellSearch } from './shell-search'
import { useHorizontalWheelScroll } from './use-horizontal-wheel-scroll'

type MobileMenuProps = {
  navigation: ShellNavigationItem[]
  topics: Topics
}

const mobilePrimaryLinkClass =
  'relative outline-none after:absolute after:inset-x-[10px] after:bottom-1 after:h-mm-sx after:origin-left after:scale-x-0 after:rounded-full after:bg-white after:transition-transform after:duration-150 after:content-[""] hover:text-white hover:after:scale-x-100 active:after:scale-x-100 aria-expanded:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid motion-reduce:after:transition-none'

const mobileTextLinkOnDarkClass =
  'rounded-mm-xs no-underline outline-none transition-colors hover:text-white hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid'

/** Use a solid triangle that points left when collapsed and down when open. */
function AccordionCaret() {
  return (
    <svg
      aria-hidden="true"
      className="ml-auto size-3 shrink-0 -rotate-90 text-white transition-transform group-aria-expanded/accordion-trigger:rotate-180"
      data-slot="accordion-trigger-icon"
      fill="currentColor"
      viewBox="0 0 12 12"
    >
      <path d="M6 0.75 11.196 9H0.804z" />
    </svg>
  )
}

function MobileMenu({ navigation, topics }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const visibleTopics = topics.slice(0, 7)
  const topicStripRef = useHorizontalWheelScroll()

  function closeMenu() {
    setOpen(false)
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        aria-label="開啟主選單與搜尋"
        render={<Button size="icon-sm" variant="ghost" />}
      >
        {/* Mirror-specific combined menu + search glyph; not a Lucide icon. */}
        <Image
          alt=""
          aria-hidden="true"
          className="h-6 w-7"
          height={24}
          src="/images-next/shell-menu-search.svg"
          width={28}
        />
      </SheetTrigger>
      <SheetContent
        className="w-full max-w-none gap-0 overflow-hidden border-0 bg-mm-base-600 p-0 focus-visible:outline-white data-[side=left]:w-full sm:max-w-none data-[side=left]:sm:max-w-none"
        closeLabel="關閉主選單"
        showCloseButton={false}
        side="left"
      >
        <SheetTitle className="sr-only">主選單</SheetTitle>
        <SheetClose
          render={
            <Button
              aria-label="關閉主選單"
              className="absolute top-mm-3xl right-mm-xl z-10 size-7 rounded-full bg-mm-base-500 p-0 text-mm-neutral-100 hover:bg-mm-base-400 hover:text-mm-neutral-100 focus-visible:outline-white md:right-mm-4xl"
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          <XIcon aria-hidden="true" className="size-3" />
        </SheetClose>
        <div className="bg-mm-base-700 px-mm-4xl pt-mm-3xl pb-mm-xl md:px-11">
          <Image
            alt="鏡週刊"
            className="h-auto w-20"
            height={34}
            priority
            src="/images-next/weekly-logo-white.svg"
            width={80}
          />
          <ShellSearch className="mt-mm-xl" compact onNavigate={closeMenu} />
          {visibleTopics.length > 0 && (
            <nav
              aria-label="專題推薦"
              ref={topicStripRef}
              className="-mx-mm-m mt-mm-m flex [scrollbar-width:none] gap-mm-xl overflow-x-auto px-mm-m font-mm-body text-mm-body2 whitespace-nowrap text-white [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleTopics.map((topic) => (
                <NextLink
                  className={shellBracketTextLinkOnDarkClass}
                  href={`/topic/${topic.slug}`}
                  key={topic.id}
                  onClick={closeMenu}
                >
                  {topic.name}
                </NextLink>
              ))}
              <NextLink
                className={shellBracketTextLinkOnDarkClass}
                href="/section/topic"
                onClick={closeMenu}
              >
                更多
              </NextLink>
            </nav>
          )}
        </div>

        <nav
          aria-label="主要分類"
          className="min-h-0 flex-1 [scrollbar-color:rgb(0_0_0/0.32)_transparent] overflow-y-auto px-10 py-mm-3xl md:px-11 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/30 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {/* Keep the 10px inset; snapping ten rows to 12px changes the menu height. */}
          <Accordion className="gap-mm-xl">
            {navigation.map((item) =>
              item.categories.length > 0 ? (
                <AccordionItem
                  className="not-last:border-b-0"
                  key={item.slug}
                  value={item.slug}
                >
                  <AccordionTrigger
                    className={cn(
                      'items-center rounded-mm-m bg-mm-base-500 p-[10px] text-mm-h5 text-white',
                      mobilePrimaryLinkClass
                    )}
                    icon={<AccordionCaret />}
                  >
                    {item.name}
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-wrap gap-x-mm-2xl gap-y-mm-l px-mm-2xl pt-mm-l pb-0 [&_a]:text-mm-body-m [&_a]:text-mm-base-100">
                    <NextLink
                      className={mobileTextLinkOnDarkClass}
                      href={item.href}
                      onClick={closeMenu}
                    >
                      全部
                    </NextLink>
                    {item.categories.map((category) => (
                      <NextLink
                        className={mobileTextLinkOnDarkClass}
                        href={category.href}
                        key={category.slug}
                        onClick={closeMenu}
                      >
                        {category.name}
                      </NextLink>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <NextLink
                  className={cn(
                    'flex items-center rounded-mm-m bg-mm-base-500 p-[10px] font-mm-sans text-mm-h5 text-white',
                    mobilePrimaryLinkClass
                  )}
                  href={item.href}
                  key={item.slug}
                  onClick={closeMenu}
                >
                  {item.name}
                </NextLink>
              )
            )}
          </Accordion>
        </nav>

        <nav
          aria-label="其他服務"
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-mm-m bg-mm-base-400 px-mm-xl py-mm-l font-mm-sans text-mm-subtitle text-mm-second-100"
        >
          {shellUtilityLinks.map((link) => (
            <NextLink
              className={mobileTextLinkOnDarkClass}
              href={link.href}
              key={link.label}
              onClick={closeMenu}
            >
              {link.label}
            </NextLink>
          ))}
        </nav>

        <div className="flex items-center justify-center gap-mm-2xl bg-white px-mm-xl py-mm-xl">
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
                className="h-4 w-auto object-contain"
                height={link.height}
                src={link.src}
                width={link.width}
              />
            </NextLink>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { MobileMenu }
