import { Fragment } from 'react'
import MirrorMedia from '@mirrormedia/lilith-draft-renderer/lib/website/mirrormedia'
import type { RawDraftContentState } from 'draft-js'

import { cn } from '@/components/cn'
import { Link, Typography } from '@/components/ui'
import { isInternalUrl } from '@/utils'

import { EmbeddedCode } from './blocks-components/embedded-code'
import { LilithAtomicBlock } from './blocks-components/lilith-atomic-block'

/**
 * Renders a block's text with inline `LINK` entities (draft-js
 * `entityRanges`) turned into actual links and inline style ranges turned
 * into markup: the draft-js built-ins (`BOLD`, `ITALIC`, `UNDERLINE`,
 * `STRIKETHROUGH`, `CODE`) plus the CMS's `FONT_COLOR_<color>` /
 * `BACKGROUND_COLOR_<color>` custom styles, matching what lilith's
 * `DraftRenderer` supports. `ANNOTATION` entities are rendered through
 * lilith's annotation component too. `entityRanges`/`inlineStyleRanges` only
 * carry offset/length into `block.text` (entity data, e.g. the url, lives in
 * `entityMap` keyed by `entityRanges[].key`), and ranges can overlap (e.g.
 * bolded italic link text), so the text is split at every boundary from
 * either set before rendering each segment.
 */
export function renderTextWithLinks(
  block: RawDraftContentState['blocks'][0],
  entityMap: RawDraftContentState['entityMap'],
  linkClassName?: string
): React.ReactNode {
  const linkRanges = block.entityRanges.filter(
    (range) => entityMap[range.key]?.type === 'LINK'
  )
  const annotationRanges = block.entityRanges.filter(
    (range) => entityMap[range.key]?.type === 'ANNOTATION'
  )
  const styleRanges = block.inlineStyleRanges ?? []

  if (
    linkRanges.length === 0 &&
    annotationRanges.length === 0 &&
    styleRanges.length === 0
  ) {
    return block.text
  }

  const breakpoints = new Set([0, block.text.length])
  for (const range of [...linkRanges, ...annotationRanges, ...styleRanges]) {
    breakpoints.add(range.offset)
    breakpoints.add(range.offset + range.length)
  }

  const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b)
  const nodes: React.ReactNode[] = []
  // Style boundaries can split one annotation into several segments, but it
  // needs a single toggle icon, so its segments are collected here and
  // wrapped once the annotation's range ends.
  let annotationSegments: React.ReactNode[] = []

  for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
    const start = sortedBreakpoints[i]
    const end = sortedBreakpoints[i + 1]
    if (start === end) continue

    const isCovering = (range: { offset: number; length: number }) =>
      range.offset <= start && range.offset + range.length >= end
    const linkRange = linkRanges.find(isCovering)
    const annotationRange = annotationRanges.find(isCovering)
    // Custom styles like `FONT_COLOR_#fff` fall outside draft-js's
    // `DraftInlineStyleType` union, hence the widening to `string`.
    const styles = styleRanges
      .filter(isCovering)
      .map((range) => range.style as string)

    let content: React.ReactNode = block.text.slice(start, end)
    if (styles.includes('CODE')) {
      content = <code className="bg-black/5 p-0.5 font-mono">{content}</code>
    }
    if (styles.includes('STRIKETHROUGH')) content = <s>{content}</s>
    if (styles.includes('UNDERLINE')) content = <u>{content}</u>
    if (styles.includes('ITALIC')) content = <em>{content}</em>
    if (styles.includes('BOLD')) content = <strong>{content}</strong>

    const color = styles
      .find((style) => style.startsWith('FONT_COLOR_'))
      ?.slice('FONT_COLOR_'.length)
    const backgroundColor = styles
      .find((style) => style.startsWith('BACKGROUND_COLOR_'))
      ?.slice('BACKGROUND_COLOR_'.length)
    if (color || backgroundColor) {
      content = <span style={{ color, backgroundColor }}>{content}</span>
    }

    // A character carries at most one draft-js entity, so an annotated
    // segment is never also a link.
    if (annotationRange) {
      annotationSegments.push(
        <Fragment key={`text-${start}`}>{content}</Fragment>
      )
      if (end === annotationRange.offset + annotationRange.length) {
        // lilith's annotation component (what the legacy story page gets via
        // `DraftRenderer`), with only the draft-js method it calls shimmed,
        // so `entityKey` is unused. Its expanded body is a `<div>` inside the
        // paragraph's `<p>`, which React flags in dev; `PostLayout` only
        // renders on the client, so the DOM is kept as built.
        const { component: AnnotationBlock, props } =
          MirrorMedia.entityDecorators.annotationDecorator('normal')
        const { data } = entityMap[annotationRange.key]
        nodes.push(
          <AnnotationBlock
            key={`annotation-${annotationRange.offset}`}
            {...props}
            entityKey="0"
            contentState={{ getEntity: () => ({ getData: () => data }) }}
          >
            {annotationSegments}
          </AnnotationBlock>
        )
        annotationSegments = []
      }
      continue
    }

    if (!linkRange) {
      nodes.push(<Fragment key={`text-${start}`}>{content}</Fragment>)
      continue
    }

    const url = entityMap[linkRange.key].data.url
    const isInternalLink = isInternalUrl(url)
    const href = url

    nodes.push(
      <Link
        key={`link-${start}`}
        href={href}
        data-story-list={isInternalLink ? 'referral_bottom' : undefined}
        target="_blank"
        rel={isInternalLink ? 'noopener' : 'noreferrer noopener'}
        className={cn('font-mm-body text-mm-body-l', linkClassName)}
      >
        {content}
      </Link>
    )
  }

  return nodes
}

type BlocksProps = {
  contents: RawDraftContentState
  className?: string
  renderPostInContent?: (
    block: RawDraftContentState['blocks'][0],
    paragraphCount: number
  ) => React.ReactNode
  renderAdInContent?: () => React.ReactNode
}

const listTagByBlockType = {
  'unordered-list-item': 'ul',
  'ordered-list-item': 'ol',
} as const

type ListBlockType = keyof typeof listTagByBlockType

function isListBlockType(type: string | undefined): type is ListBlockType {
  return type === 'unordered-list-item' || type === 'ordered-list-item'
}

export function Blocks({
  contents,
  className,
  renderPostInContent,
}: BlocksProps) {
  let paragraphCount = 0
  let headingCount = 0
  const nodes: React.ReactNode[] = []
  const { blocks, entityMap } = contents

  let index = 0
  while (index < blocks.length) {
    const block = blocks[index]

    if (isListBlockType(block?.type)) {
      const listType = block.type
      const listStartIndex = index
      const items: React.ReactNode[] = []

      while (index < blocks.length && blocks[index]?.type === listType) {
        items.push(
          <Typography key={`list-item-${index}`} as="li" variant="body-l">
            {renderTextWithLinks(blocks[index], entityMap)}
          </Typography>
        )
        index = index + 1
      }

      const ListTag = listTagByBlockType[listType]
      nodes.push(
        <ListTag
          key={`list-${listStartIndex}`}
          className={cn(
            listType === 'ordered-list-item' ? 'list-decimal' : 'list-disc',
            'space-y-1 pl-5',
            className
          )}
        >
          {items}
        </ListTag>
      )
      continue
    }

    switch (block?.type) {
      case 'header-two':
        headingCount = headingCount + 1
        nodes.push(
          <Typography
            key={`heading-${headingCount}`}
            id={`heading-${headingCount}`}
            as="h2"
            variant="h2"
            className={className}
          >
            {block?.text}
          </Typography>
        )
        break
      case 'header-three':
        headingCount = headingCount + 1
        nodes.push(
          <Typography
            key={`heading-${headingCount}`}
            id={`heading-${headingCount}`}
            as="h3"
            variant="h3"
            className={className}
          >
            {block?.text}
          </Typography>
        )
        break
      case 'header-four':
        headingCount = headingCount + 1
        nodes.push(
          <Typography
            key={`heading-${headingCount}`}
            id={`heading-${headingCount}`}
            as="h4"
            variant="h4"
            className={className}
          >
            {block?.text}
          </Typography>
        )
        break
      case 'header-five':
        headingCount = headingCount + 1
        nodes.push(
          <Typography
            key={`heading-${headingCount}`}
            id={`heading-${headingCount}`}
            as="h5"
            variant="h5"
            className={className}
          >
            {block?.text}
          </Typography>
        )
        break
      case 'header-six':
        headingCount = headingCount + 1
        nodes.push(
          <Typography
            key={`heading-${headingCount}`}
            id={`heading-${headingCount}`}
            as="h6"
            variant="h6"
            className={className}
          >
            {block?.text}
          </Typography>
        )
        break
      case 'atomic':
        nodes.push(
          block.entityRanges.map((entityRange) => {
            const entity = entityMap[entityRange.key]

            if (entity.type === 'image') {
              return (
                <figure key={`content-${index}`} className={className}>
                  <picture className="block">
                    <img
                      srcSet={
                        entity.data.resized
                          ? Object.entries(entity.data.resized)
                              .filter(
                                ([key, value]) =>
                                  !['original', '__typename'].includes(key) &&
                                  Boolean(value)
                              )
                              .sort(
                                (a, b) =>
                                  parseInt(a[0].replace('w', '')) -
                                  parseInt(b[0].replace('w', ''))
                              )
                              .map(
                                ([key, value]) =>
                                  `${value} ${key.replace('w', '')}w`
                              )
                              .join(',')
                          : undefined
                      }
                      sizes="(min-width: 768px) 50vw, 100vw"
                      src={
                        entity.data.resized?.w2400 ??
                        entity.data.resized?.original
                      }
                      alt={entity.data.desc ?? ''}
                      width="100%"
                      height="auto"
                      loading="lazy"
                    />
                  </picture>

                  {entity.data.desc && (
                    <Typography
                      as="figcaption"
                      variant="caption-l"
                      className="pt-2 text-center text-mm-neutral-500 md:text-start"
                    >
                      {entity.data.desc}
                    </Typography>
                  )}
                </figure>
              )
            }

            if (entity.type === 'INFOBOX') {
              const infoboxContent = entity.data.rawContentState as
                | RawDraftContentState
                | undefined

              return (
                <div
                  key={`content-${index}`}
                  className={cn(
                    'my-8 rounded-md bg-[#054f77] px-7.5 py-8',
                    className
                  )}
                >
                  {entity.data.title && (
                    <Typography as="p" variant="h2" className="mb-2 text-white">
                      {entity.data.title}
                    </Typography>
                  )}
                  {infoboxContent?.blocks.map((infoboxBlock, blockIndex) => (
                    <Typography
                      key={`infobox-${index}-${blockIndex}`}
                      as="p"
                      variant="body-l"
                      className="text-[#e1e5e9]"
                    >
                      {renderTextWithLinks(
                        infoboxBlock,
                        infoboxContent.entityMap,
                        'text-[#3b82f6] underline'
                      )}
                    </Typography>
                  ))}
                </div>
              )
            }

            if (entity.type === 'YOUTUBE') {
              return (
                <iframe
                  key={entity.data.youtubeId}
                  title={entity.data.description}
                  src={'https://www.youtube.com/embed/' + entity.data.youtubeId}
                  className="aspect-video"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              )
            }

            if (entity.type === 'EMBEDDEDCODE') {
              return (
                <EmbeddedCode
                  key={`content-${index}`}
                  embeddedCode={entity.data.embeddedCode}
                  caption={entity.data.caption}
                  className={className}
                />
              )
            }

            return <LilithAtomicBlock key={block.key} entity={entity} />
          })
        )
        break
      case 'unstyled':
        if (!block.text.trim()) break
        paragraphCount = paragraphCount + 1
        nodes.push(renderPostInContent?.(block, paragraphCount))
        break
      default:
        nodes.push(null)
    }
    index = index + 1
  }

  return nodes
}
