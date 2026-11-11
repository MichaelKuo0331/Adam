import { Fragment, useMemo } from 'react'
import NextImage from 'next/image'
import type { RawDraftContentState } from 'draft-js'
import { CircleDollarSignIcon } from 'lucide-react'

import { Badge, Link, Typography } from '@/components/ui'
import { SITE_BASE_PATH, SITE_URL } from '@/config/index.mjs'
import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { RelatedStory, StoryPost } from '@/modules/story/story-types'

import { Blocks, renderTextWithLinks } from './blocks'
import { CopyLinkButton } from './copy-link-button'
import { IconLink } from './icon-link'
import { PublicDate } from './public-date'
import { RelativePostLink } from './relative-post-link'
import { type ElementVariantProps, ThemeElement } from './theme-element'

/** 手機文中廣告只接在第 1、第 5 段有文字的內文後面。 */
const MB_AD_AFTER_TEXT_PARAGRAPH = {
  1: 'MB_AT1',
  5: 'MB_AT2',
} as const

type MbInContentAdKey =
  (typeof MB_AD_AFTER_TEXT_PARAGRAPH)[keyof typeof MB_AD_AFTER_TEXT_PARAGRAPH]

function getTextParagraphOrdinals(blocks: RawDraftContentState['blocks']) {
  const ordinalByKey = new Map<string, number>()
  let count = 0

  for (const block of blocks) {
    if (block.type !== 'unstyled' || block.text.trim().length === 0) continue
    count += 1
    ordinalByKey.set(block.key, count)
  }

  return { ordinalByKey, count }
}

type PostLayoutProps = Pick<
  StoryPost,
  | 'categories'
  | 'title'
  | 'subtitle'
  | 'isAdvertised'
  | 'publishedDate'
  | 'updatedAt'
  | 'heroImage'
  | 'heroCaption'
  | 'photographers'
  | 'camera_man'
  | 'designers'
  | 'engineers'
  | 'vocals'
  | 'extend_byline'
  | 'writers'
  | 'brief'
  | 'content'
  | 'tags'
  | 'tags_algo'
  | 'slug'
  | 'sections'
  | 'relateds'
> & {
  relativeStory: RelatedStory
  renderAside?: (summary: string[]) => React.ReactNode
  renderDable?: () => React.ReactNode
  renderNextUp?: () => React.ReactNode
  renderAdInContent?: () => React.ReactNode
  renderMbAdInContent?: (adKey: MbInContentAdKey) => React.ReactNode
  renderAdBelowRelated?: () => React.ReactNode
}

const actionList = [
  {
    resource: `${SITE_BASE_PATH}/images/sns-line.svg`,
    label: '加入',
    href: 'https://lin.ee/dkD1s4q',
  },
  {
    resource: `${SITE_BASE_PATH}/images/sns-ig.svg`,
    label: '追蹤',
    href: 'https://www.instagram.com/mirror_media/',
  },
  {
    resource: `${SITE_BASE_PATH}/images/yt.svg`,
    label: '訂閱',
    href: 'https://www.youtube.com/channel/UCYkldEK001GxR884OZMFnRw?sub_confirmation=1',
  },
  {
    resource: `${SITE_BASE_PATH}/images/sns-mm.png`,
    label: '下載',
    href: 'https://www.mirrormedia.mg/story/20161228corpmkt001/?utm_source=magzine&utm_campaign=mm_app_download&utm_medium=qrcode',
  },
] as const

export default function PostLayout(props: PostLayoutProps) {
  const {
    categories,
    sections,
    title,
    isAdvertised,
    publishedDate,
    updatedAt,
    heroImage,
    heroCaption,
    photographers,
    camera_man,
    designers,
    engineers,
    vocals,
    extend_byline,
    writers,
    brief,
    content,
    tags,
    tags_algo,
    relateds,
    slug,
    relativeStory,
    renderAdInContent,
    renderMbAdInContent,
    renderAdBelowRelated,
    renderAside,
    renderNextUp,
    renderDable,
  } = props

  const theme: ElementVariantProps['theme'] = isAdvertised
    ? 'marketing'
    : 'post'

  const canonicalUrl = `https://${SITE_URL}/story/${slug}`
  const sectionList = sections ?? []
  const categoryList = categories ?? []
  const seenTagSlugs = new Set<string | null | undefined>()
  const displayTags = [...(tags ?? []), ...(tags_algo ?? [])].filter((tag) => {
    if (seenTagSlugs.has(tag?.slug)) return false
    seenTagSlugs.add(tag?.slug)
    return true
  })

  const mainCategory =
    sectionList.length === 1
      ? sectionList[0]
      : sectionList.find((section) => section?.slug !== 'marketing')

  const subCategories =
    categoryList.length === 1
      ? categoryList[0]
      : categoryList.find((category) => category?.slug !== 'marketing')

  const textParagraphs = useMemo(
    () => getTextParagraphOrdinals(content.blocks),
    [content.blocks]
  )
  const SIZES_HERO =
    '(min-width: 1280px) 800px, (min-width: 768px) calc(100vw - 48px), 100vw'
  const webpSrcSet = buildSrcSet(heroImage?.resizedWebp)
  const defaultSrcSet = buildSrcSet(heroImage?.resized)
  const rawHeroWidth = heroImage?.imageFile?.width
  const rawHeroHeight = heroImage?.imageFile?.height
  const heroWidth = rawHeroWidth && rawHeroHeight ? rawHeroWidth : undefined
  const heroHeight = rawHeroWidth && rawHeroHeight ? rawHeroHeight : undefined

  const summary = useMemo(() => {
    return content.blocks
      .filter((text) =>
        [
          'header-two',
          'header-three',
          'header-four',
          'header-five',
          'header-six',
        ].includes(text.type)
      )
      .map((block) => block?.text)
      .filter((text) => !!text)
  }, [content])

  return (
    <div className="max-w-7xl pt-4 md:mx-6 md:grid-cols-12 lg:px-10 xl:mx-auto xl:grid xl:grid-cols-[repeat(12,minmax(0,1fr))_424px] xl:gap-x-14">
      <article className="relative grid-cols-subgrid space-y-7 gap-x-0 xl:col-span-12 xl:grid xl:grid-rows-[repeat(5,min-content)_auto]">
        {categories && Array.isArray(categories) && (
          <div className="order-1 col-span-full flex items-center justify-center md:col-span-4 md:justify-start">
            <Link href="/">
              <Typography
                as="span"
                variant="subtitle"
                className="text-mm-base-500"
              >
                首頁
              </Typography>
            </Link>

            <span className="text-mm-base-500">／</span>
            <Link
              className="text-sm font-bold text-mm-base-500"
              href={`/section/${mainCategory?.slug ?? 'news'}`}
            >
              <Typography
                as="span"
                variant="subtitle"
                className="text-mm-base-500"
              >
                {mainCategory?.name || '最新'}
              </Typography>
            </Link>

            {subCategories && (
              <>
                <span className="text-mm-base-500">／</span>
                <Link
                  className="text-sm font-bold text-mm-base-500"
                  href={`/category/${subCategories?.slug}`}
                >
                  <Typography
                    as="span"
                    variant="subtitle"
                    className="text-mm-base-500"
                  >
                    {subCategories?.name}
                  </Typography>
                </Link>
              </>
            )}
          </div>
        )}

        <Typography
          as="h1"
          variant="h1"
          className="order-2 col-span-full mb-3 px-2 md:order-3 md:mb-4 md:px-0"
        >
          {title}
        </Typography>
        <PublicDate
          className="order-3 col-span-full ml-2 md:col-span-6 xl:col-span-7"
          publishedDate={publishedDate}
          updatedAt={updatedAt}
        />
        <div className="sticky top-27 z-1 order-4 col-span-full flex items-start justify-around gap-x-3 bg-white p-2 md:static md:col-start-8 md:justify-end md:py-0">
          <IconLink
            target="_blank"
            href="https://google.com/preferences/source?q=mirrormedia.mg"
            className="GTM-click-preferred-source flex h-7 items-center rounded-full border px-1.5 py-1 md:gap-1 md:px-2.5"
          >
            <NextImage
              width={14}
              height={14}
              src={`${SITE_BASE_PATH}/images/google-logo.svg`}
              alt="google-logo"
            />
            <ThemeElement
              as="span"
              className="GTM-click-preferred-source hidden w-13 text-[0.5rem] font-medium md:block"
            >
              加入為Google 偏好來源
            </ThemeElement>
          </IconLink>
          <IconLink
            href={`https://www.facebook.com/share.php?u=${canonicalUrl}`}
            src={`${SITE_BASE_PATH}/images/fb-logo.svg`}
            alt="facebook-logo"
            rel="noopener noreferrer"
            target="_blank"
            className="GTM-share-facebook"
          />
          <IconLink
            href={`https://social-plugins.line.me/lineit/share?url=${canonicalUrl}`}
            src={`${SITE_BASE_PATH}/images/line-logo.svg`}
            alt="line-logo"
            rel="noopener noreferrer"
            target="_blank"
            className="GTM-share-line"
          />
          <IconLink
            href={`https://www.threads.com/intent/post?u=${encodeURIComponent(
              canonicalUrl
            )}`}
            className="GTM-share-threads rounded-full bg-black"
            rel="noopener noreferrer"
            target="_blank"
          >
            <NextImage
              width={28}
              height={28}
              src={`${SITE_BASE_PATH}/images/threads-logo.svg`}
              alt="threads-logo"
              className="scale-70 transform invert-100"
            />
          </IconLink>
          <CopyLinkButton
            renderContent={() => (
              <ThemeElement
                as="span"
                theme="accent"
                className="GTM-share-link rounded-lg px-4 py-2 text-mm-neutral-100 md:text-xl"
              >
                已複製連結
              </ThemeElement>
            )}
          >
            <NextImage
              width={28}
              height={28}
              src={`${SITE_BASE_PATH}/images/link-logo.svg`}
              alt="link-logo"
            />
          </CopyLinkButton>
        </div>
        <figure className="order-5 col-span-full">
          <picture className="block">
            {webpSrcSet && (
              <source
                type="image/webp"
                srcSet={webpSrcSet}
                sizes={SIZES_HERO}
              />
            )}
            <img
              className="h-auto w-full"
              srcSet={defaultSrcSet}
              sizes={SIZES_HERO}
              src={
                heroImage?.resized?.w1200 ||
                heroImage?.resized?.w1600 ||
                heroImage?.resized?.original ||
                DEFAULT_OG_IMAGE_URL
              }
              alt={heroCaption ?? title ?? ''}
              width={heroWidth}
              height={heroHeight}
              fetchPriority="high"
            />
          </picture>
          {heroCaption && (
            <Typography
              as="figcaption"
              variant="caption-l"
              className="pt-2 text-center text-mm-neutral-500 md:text-start"
            >
              {heroCaption}
            </Typography>
          )}
        </figure>
        <section className="order-6 col-span-full flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pb-5 md:order-2 md:col-span-8 md:col-end-0 md:justify-start md:py-0 lg:py-0">
          <CreditNames label="文" creditPeoples={writers} />
          <CreditNames label="攝影" creditPeoples={photographers} />
          <CreditNames label="影音" creditPeoples={camera_man} />
          <CreditNames label="設計" creditPeoples={designers} />
          <CreditNames label="工程" creditPeoples={engineers} />
          <CreditNames label="主播" creditPeoples={vocals} />
          {!!extend_byline && (
            <Typography as="span" variant="subtitle" className="line-clamp-1">
              協力｜{extend_byline}
            </Typography>
          )}
        </section>
        {brief?.blocks &&
          brief?.blocks.length > 0 &&
          brief?.blocks[0].text.trim().length > 0 && (
            <ThemeElement
              className="order-7 col-span-full mx-2 rounded-md px-6 py-4 md:mx-0"
              as="blockquote"
              theme={theme}
            >
              {brief.blocks.map((block, index) => (
                <Typography
                  key={`brief-${index}`}
                  as="p"
                  variant="body-l"
                  className="text-mm-neutral-600"
                >
                  {renderTextWithLinks(block, brief.entityMap)}
                </Typography>
              ))}
            </ThemeElement>
          )}
        <div className="order-8 col-span-full flex flex-col gap-y-7 md:gap-y-8">
          <Blocks
            className="mx-2 scroll-m-20 md:mx-0"
            contents={content}
            renderPostInContent={(block, paragraphCount) => {
              const textOrdinal = textParagraphs.ordinalByKey.get(block.key)
              const adKey =
                textOrdinal === 1 || textOrdinal === 5
                  ? MB_AD_AFTER_TEXT_PARAGRAPH[textOrdinal]
                  : undefined
              // 下一段沒有文字就不出現（後面還有 unstyled 文字段落才渲染）。
              const mobileAd =
                adKey &&
                textOrdinal != null &&
                textOrdinal < textParagraphs.count
                  ? renderMbAdInContent?.(adKey)
                  : null

              return (
                <Fragment key={`paragraph-${paragraphCount}`}>
                  <Typography
                    as="p"
                    variant="body-l"
                    className={
                      paragraphCount === 4
                        ? 'mx-2 scroll-m-20 md:mx-0'
                        : 'mx-2 md:mx-0'
                    }
                  >
                    {renderTextWithLinks(block, content.entityMap)}
                  </Typography>
                  {mobileAd}
                  {paragraphCount === 2 && relativeStory && (
                    <div className="mx-2 scroll-m-20 md:mx-0">
                      <ThemeElement className="w-fit rounded-md rounded-b-none bg-mm-second-700 px-3 pt-1 text-sm text-mm-neutral-100">
                        延伸閱讀
                      </ThemeElement>
                      <Link
                        data-story-list="referral_contents"
                        href={`/story/${relativeStory.slug}`}
                      >
                        <ThemeElement
                          className="rounded-md rounded-tl-none p-2 text-lg font-bold text-mm-neutral-700 decoration-mm-neutral-700"
                          as="div"
                          theme="post"
                        >
                          {relativeStory.title}
                        </ThemeElement>
                      </Link>
                    </div>
                  )}
                  {paragraphCount === 3 && renderAdInContent?.()}
                  {paragraphCount === 4 && (
                    <RelativePosts relateds={relateds} />
                  )}
                </Fragment>
              )
            }}
          />
        </div>
        <div className="order-9 col-span-full mx-8 flex flex-wrap gap-2">
          {displayTags.map((tag, index) => (
            <Link key={`tag-${tag?.slug ?? index}`} href={`/tag/${tag?.slug}`}>
              <Badge className="text-mm-h6">{tag?.name}</Badge>
            </Link>
          ))}
        </div>
        {renderNextUp && (
          <section className="order-10 col-span-full mx-2 md:mx-0">
            {renderNextUp()}
          </section>
        )}
        {renderAdBelowRelated?.()}
        <div className="order-11 col-span-full grid gap-y-5 md:grid-cols-12">
          <div className="flex items-center justify-center gap-x-3 md:col-span-4 md:justify-start">
            <Link
              href="/donate"
              target="_blank"
              className="inline-flex items-center gap-x-1 rounded-full border-mm-base-700 bg-mm-base-700 px-3 py-2 hover:bg-mm-base-600"
            >
              <CircleDollarSignIcon className="size-4 text-white" />
              <Typography
                as="span"
                className="text-sm leading-none font-normal text-white"
              >
                贊助本文
              </Typography>
            </Link>
            <Link href="/subscribe" className="inline-flex">
              <Typography
                as="span"
                className="items-center gap-x-1 rounded-full border-mm-second-700 bg-mm-second-700 px-3 py-2 text-sm leading-[1.125] font-normal text-white hover:bg-mm-second-600"
              >
                加入訂閱會員
              </Typography>
            </Link>
          </div>
          <ul className="flex justify-around space-x-3 md:col-span-6 md:col-start-7 md:space-x-4 xl:col-span-6 xl:col-start-7">
            {actionList.map((item) => (
              <li key={item.label}>
                <IconLink
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-x-2"
                >
                  <NextImage
                    width={32}
                    height={32}
                    src={item.resource}
                    alt={item.label}
                    loading="lazy"
                  />
                  <Typography
                    as="span"
                    variant="subtitle"
                    className="text-mm-base-700"
                  >
                    {item.label}
                  </Typography>
                </IconLink>
              </li>
            ))}
          </ul>
        </div>
        <ThemeElement
          as="section"
          theme="accent"
          className="order-12 col-span-full mx-2 rounded-lg p-8 pb-10 text-lg md:mx-0"
        >
          鏡週刊掌握趨勢，領先一步：
          從國際大事到生活小確幸，我們確保您不錯過任何一個重要瞬間，誠摯邀請您
          <Link
            href="https://www.mirrormedia.mg/login?destination=https%3A%2F%2Fwww.mirrormedia.mg%2Fmagazine"
            className="text-lg text-mm-second-200 underline"
          >
            立即加入閱讀
          </Link>
          。
        </ThemeElement>
        <div className="order-13 col-span-full">{renderDable?.()}</div>
      </article>

      <aside className="hidden max-w-106 gap-y-4 xl:relative xl:mr-0 xl:block xl:space-y-6">
        {renderAside?.(summary)}
      </aside>
    </div>
  )
}

type CreditPerson = { id: string | null; name: string | null } | null

function CreditNames({
  label,
  creditPeoples,
}: {
  label: string
  creditPeoples: CreditPerson[] | null | undefined
}) {
  const namedPeople = (creditPeoples ?? []).filter(
    (person): person is { id: string; name: string } =>
      !!person?.id && !!person?.name
  )
  if (namedPeople.length === 0) return null

  return (
    <Typography as="span" variant="subtitle" className="line-clamp-1">
      {label}｜
      {namedPeople.map((person, index) => (
        <Fragment key={person.id}>
          {index > 0 && ' '}
          <Link
            href={`/author/${person.id}`}
            variant="muted"
            className="text-mm-subtitle"
          >
            {person.name}
          </Link>
        </Fragment>
      ))}
    </Typography>
  )
}

function RelativePosts({ relateds }: { relateds: StoryPost['relateds'] }) {
  if (!relateds) return null

  if (relateds[0] && relateds[1]) {
    return (
      <div className="mx-2 mt-6 space-y-2 xl:hidden">
        <RelativePostLink
          className="flex overflow-hidden rounded-lg bg-mm-base-700 text-neutral-100"
          type="next"
          data-story-list="story_updown"
          href={`/story/${relateds[0]?.slug}`}
        >
          {relateds[0]?.title}
        </RelativePostLink>
        <RelativePostLink
          className="flex overflow-hidden rounded-lg bg-mm-base-700 text-neutral-100"
          type="prev"
          data-story-list="story_updown"
          href={`/story/${relateds[1]?.slug}`}
        >
          {relateds[1]?.title}
        </RelativePostLink>
      </div>
    )
  }
  if (relateds[0]) {
    return (
      <RelativePostLink
        className="flex overflow-hidden rounded-lg bg-mm-base-700 text-neutral-100 xl:hidden"
        type="next"
        data-story-list="story_updown"
        href={`/story/${relateds[0]?.slug}`}
      >
        {relateds[0]?.title}
      </RelativePostLink>
    )
  }
  if (relateds[1]) {
    return (
      <RelativePostLink
        className="flex overflow-hidden rounded-lg bg-mm-base-700 text-neutral-100 xl:hidden"
        type="prev"
        data-story-list="story_updown"
        href={`/story/${relateds[1]?.slug}`}
      >
        {relateds[1]?.title}
      </RelativePostLink>
    )
  }

  return null
}

function buildSrcSet(
  resized?: Record<string, string | null | undefined> | null
) {
  if (!resized) return undefined
  return Object.entries(resized)
    .filter(
      ([key, value]) =>
        !['original', '__typename'].includes(key) && Boolean(value)
    )
    .sort(
      (a, b) =>
        parseInt(a[0].replace('w', ''), 10) -
        parseInt(b[0].replace('w', ''), 10)
    )
    .map(([key, value]) => `${value} ${key.replace('w', '')}w`)
    .join(', ')
}
