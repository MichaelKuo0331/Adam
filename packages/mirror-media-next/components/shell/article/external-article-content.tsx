import ExternalEmbedCodeBlock from '@/components/external/external-embed-code-block'
import ArticleRightArrow from '@/components/shared/article-right-arrow'
import type { ExternalRelatedStory } from '@/modules/external/external-types'

import { EmbeddedCode } from './blocks-components/embedded-code'
import styles from './external-article-content.module.css'

// Threads 官方 embed 是 blockquote + embed.js。External 常只留下 blockquote，
// 而且包在 <div><div> 裡。整段一起交給 EmbeddedCode，避免把未閉合的 div 留在
// dangerouslySetInnerHTML，造成 hydration 對不上。缺 script 時補上 embed.js。
const THREADS_EMBED_SCRIPT =
  '<script async src="https://www.threads.com/embed.js"></script>'
const THREADS_BLOCKQUOTE =
  '<blockquote\\b[^>]*\\bclass=["\'][^"\']*\\btext-post[\\w-]*\\b[^"\']*["\'][^>]*>[\\s\\S]*?<\\/blockquote>'
const EMBED_SOURCE = [
  `(?:<div\\b[^>]*>\\s*){0,2}${THREADS_BLOCKQUOTE}(?:\\s*<script\\b[^>]*>[\\s\\S]*?<\\/script>)?(?:\\s*<\\/div>){0,2}`,
  '<iframe[\\s\\S]*?<\\/iframe>',
].join('|')

type ExternalArticleContentProps = {
  content?: string
  allRelatedStories?: ExternalRelatedStory[]
}

function embedKind(part: string): 'iframe' | 'threads' | null {
  const trimmed = part.trim()
  if (/^<iframe\b/i.test(trimmed)) return 'iframe'
  if (
    /<blockquote\b[^>]*\bclass=["'][^"']*\btext-post[\w-]*\b/i.test(trimmed)
  ) {
    return 'threads'
  }
  return null
}

function withThreadsScript(html: string) {
  if (/threads\.(?:com|net)\/embed\.js/i.test(html)) return html
  return `${html}${THREADS_EMBED_SCRIPT}`
}

export default function ExternalArticleContent({
  content = '',
  allRelatedStories = [],
}: ExternalArticleContentProps) {
  const parts = content
    .split(new RegExp(`(${EMBED_SOURCE})`, 'gi'))
    .filter((part) => part.trim())

  return (
    <div className={`mt-8 md:mt-5 ${styles.content}`}>
      {parts.map((part, index) => {
        const kind = embedKind(part)
        if (kind === 'iframe') {
          return <ExternalEmbedCodeBlock key={index} embedCode={part} />
        }
        if (kind === 'threads') {
          return (
            <EmbeddedCode key={index} embeddedCode={withThreadsScript(part)} />
          )
        }
        return (
          <div
            key={index}
            className="font-mm-body text-mm-body-l"
            dangerouslySetInnerHTML={{ __html: part }}
          />
        )
      })}

      {allRelatedStories.length > 0 && (
        <ArticleRightArrow relateds={allRelatedStories} />
      )}
    </div>
  )
}
