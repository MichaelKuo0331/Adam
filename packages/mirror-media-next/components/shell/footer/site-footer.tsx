import Image from 'next/image'
import NextLink from 'next/link'

import { cn } from '@/components/cn'
import {
  shellBracketBrandLinkOnDarkClass,
  shellBracketTextLinkOnDarkClass,
  shellIconLinkOnDarkClass,
} from '@/components/shell/link-styles'
import { linkVariants } from '@/components/ui/link'
import {
  FACEBOOK_LINK,
  FOOTER_PROMOTION_LINKS,
  INSTAGRAM_LINK,
  LINE_LINK,
  MESH_LINK,
} from '@/constants'
import { isInternalUrl, isSiteUrl } from '@/utils'

const {
  AI_GUIDANCE,
  AUTH_LINK,
  DOWNLOAD_APP_LINK,
  MAGAZINE_LINK,
  MEDIA_DISCIPLINE_LINK,
  PAPER_MAGAZINE_LINK,
} = FOOTER_PROMOTION_LINKS

const promotionLinks = [
  PAPER_MAGAZINE_LINK,
  MAGAZINE_LINK,
  AUTH_LINK,
  MEDIA_DISCIPLINE_LINK,
  { ...AI_GUIDANCE, title: 'AI使用準則' },
  { ...DOWNLOAD_APP_LINK, title: 'APP下載' },
]

const socialLinks = [
  {
    alt: 'LINE',
    height: 20,
    href: LINE_LINK.href,
    src: '/images-next/shell-footer-line.svg',
    width: 20,
  },
  {
    alt: 'Facebook',
    height: 20,
    href: FACEBOOK_LINK.href,
    src: '/images-next/shell-footer-facebook.svg',
    width: 20,
  },
  {
    alt: 'Instagram',
    height: 20,
    href: INSTAGRAM_LINK.href,
    src: '/images-next/shell-footer-instagram.svg',
    width: 20,
  },
  {
    alt: 'YouTube',
    height: 20,
    href: 'https://www.youtube.com/channel/UCYkldEK001GxR884OZMFnRw?sub_confirmation=1',
    src: '/images-next/shell-footer-youtube.svg',
    width: 27,
  },
]

const footnoteLinkClass = cn(
  linkVariants({ variant: 'plain' }),
  'rounded-mm-xs text-mm-second-400 underline-offset-2 focus-visible:outline-white'
)

function SiteFooter() {
  return (
    <footer
      className="bg-mm-base-700 px-mm-xl py-12 font-mm-sans text-white"
      data-slot="site-footer"
    >
      <div className="mx-auto flex w-full max-w-266 flex-col items-center gap-7">
        <div className="flex w-full flex-col items-center justify-center gap-7 lg:flex-row lg:gap-mm-3xl">
          <nav
            aria-label="網站資訊"
            className="grid grid-cols-2 gap-x-7 gap-y-mm-l text-mm-h6 text-mm-base-100 md:flex md:flex-nowrap md:justify-center md:gap-x-7"
          >
            {promotionLinks.map((link) => (
              <NextLink
                className={shellBracketTextLinkOnDarkClass}
                href={link.href}
                key={link.name}
                rel={
                  isInternalUrl(link.href) ? undefined : 'noopener noreferrer'
                }
                target={isSiteUrl(link.href) ? undefined : '_blank'}
              >
                {link.title}
              </NextLink>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-7 md:flex-row md:gap-mm-3xl">
            <div className="flex items-center gap-9 md:gap-mm-3xl">
              <NextLink
                aria-label="READr"
                className={cn(shellBracketBrandLinkOnDarkClass, '-mx-1 px-1')}
                href="https://www.readr.tw/"
                rel="noopener"
                target="_blank"
              >
                <Image
                  alt=""
                  className="h-[22px] w-[76px] object-contain md:w-[75px]"
                  height={22}
                  src="/images-next/shell-footer-readr.svg"
                  width={76}
                />
              </NextLink>
              <NextLink
                aria-label={MESH_LINK.title}
                // Its artwork runs closer to the edge of its own artboard than
                // READr's, so the rules need a step more room here.
                className={cn(shellBracketBrandLinkOnDarkClass, '-mx-2 px-2')}
                href={MESH_LINK.href}
                rel="noopener"
                target="_blank"
              >
                <Image
                  alt=""
                  className="h-[14px] w-9 object-contain md:h-5 md:w-[50px]"
                  height={20}
                  src="/images-next/shell-footer-mesh.svg"
                  width={50}
                />
              </NextLink>
            </div>
            <nav aria-label="社群媒體" className="flex items-center gap-mm-l">
              {socialLinks.map((link) => (
                <NextLink
                  aria-label={link.alt}
                  className={shellIconLinkOnDarkClass}
                  href={link.href}
                  key={link.alt}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Image
                    alt=""
                    className={cn(
                      'h-5 object-contain',
                      link.alt === 'YouTube' ? 'w-[27px]' : 'w-5'
                    )}
                    height={link.height}
                    src={link.src}
                    width={link.width}
                  />
                </NextLink>
              ))}
            </nav>
          </div>
        </div>

        <div className="text-center font-mm-body text-mm-caption-s">
          <p>
            本網頁使用{' '}
            <a
              className={footnoteLinkClass}
              href="https://developers.google.com/youtube/terms/developer-policies?hl=zh-tw#definition-youtube-api-services"
              rel="noopener noreferrer"
              target="_blank"
            >
              YouTube API 服務
            </a>
            ，詳見{' '}
            <a
              className={footnoteLinkClass}
              href="https://www.youtube.com/t/terms"
              rel="noopener noreferrer"
              target="_blank"
            >
              YouTube 服務條款
            </a>
            、{' '}
            <a
              className={footnoteLinkClass}
              href="https://policies.google.com/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google 隱私權與條款
            </a>
          </p>
          <p>瀏覽此頁面即代表您同意上述授權條款及細則</p>
        </div>

        <address className="text-center font-mm-body text-mm-caption-s not-italic">
          <p>
            客服信箱{' '}
            <a
              className={footnoteLinkClass}
              href="mailto:MM-onlineservice@mirrormedia.mg"
            >
              MM-onlineservice@mirrormedia.mg
            </a>
          </p>
          <p>客服電話 02-6633-3966</p>
          <p>服務時間 週一至週五上午10時至下午6時</p>
        </address>
      </div>
    </footer>
  )
}

export { SiteFooter }
