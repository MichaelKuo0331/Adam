import type { FetchPostsQuery } from '@/apollo/__generated__/content/graphql'

import type { ArticleListItemData } from './list-article-types'

type ArticleListItemSource = NonNullable<FetchPostsQuery['posts']>[number]

/**
 * 每個尺寸都可能是 null，但 `@readr-media/react-image` 的 `images` 只收 string，
 * 所以沒有 url 的尺寸在這裡濾掉。靜態 JSON 還會用空字串表示沒有那個尺寸。
 */
function toImageSet(
  sizes: Record<string, string | null> | null | undefined
): Record<string, string> | null {
  if (!sizes) {
    return null
  }
  return Object.fromEntries(
    Object.entries(sizes).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && entry[1] !== ''
    )
  )
}

/**
 * 跟文章頁麵包屑同一套：只有一個 section 就用它（即使是行銷）；
 * 多個時跳過 `slug === 'marketing'`。找不到非行銷的就不顯示角標。
 */
function pickDisplaySection(sections: ArticleListItemData['sections']) {
  if (sections.length === 1) {
    return sections[0]
  }
  return sections.find((section) => section.slug !== 'marketing')
}

/**
 * `fetchPosts` returns every field as nullable, so the shape the rows render is
 * built here rather than asserted at the call site.
 */
function toArticleListItemData(
  post: ArticleListItemSource
): ArticleListItemData {
  return {
    /*
      Codegen types a JSON scalar as `unknown`,
      so this one field still needs an assertion.
    */
    brief: post.brief as ArticleListItemData['brief'],
    heroImage: post.heroImage
      ? {
          resized: toImageSet(post.heroImage.resized),
          resizedWebp: toImageSet(post.heroImage.resizedWebp),
        }
      : null,
    id: post.id,
    publishedDate: post.publishedDate ?? '',
    sections: (post.sections ?? []).map((section) => ({
      name: section.name ?? '',
      slug: section.slug ?? null,
    })),
    slug: post.slug ?? '',
    title: post.title ?? '',
  }
}

export { pickDisplaySection, toArticleListItemData, toImageSet }
export type { ArticleListItemSource }
