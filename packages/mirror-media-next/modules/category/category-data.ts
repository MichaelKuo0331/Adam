import { z } from 'zod'

import type { FetchCategorySectionsQuery } from '@/apollo/__generated__/content/graphql'
import {
  URL_STATIC_NEWS_CATEGORY_INFO,
  URL_STATIC_NEWS_CATEGORY_POSTS,
} from '@/config/index.mjs'
import { toImageSet } from '@/modules/list-article/list-article-data'
import type { ArticleListItemData } from '@/modules/list-article/list-article-types'
import { fetchStaticJsonByUrl } from '@/utils/api'
import { logZodMonitorFailure, monitorZodSafeParse } from '@/utils/zod-monitor'

import type { CategorySummary } from './category-types'

/**
 * The static JSON is a dump of the GraphQL category query, so the schema mirrors
 * that shape exactly — every field but `id` nullable — and its result feeds the
 * same `toCategorySummary` the GraphQL path uses.
 */
const newsCategorySectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable(),
  slug: z.string().nullable(),
  state: z.string().nullable(),
})

const newsCategoryInfoSchema = z.object({
  category: z.object({
    id: z.string().min(1),
    isMemberOnly: z.boolean().nullable(),
    name: z.string().nullable(),
    sections: z.array(newsCategorySectionSchema).nullable(),
    slug: z.string().nullable(),
    state: z.string().nullable(),
  }),
})

/**
 * The query returns every field as nullable and selects no nested categories,
 * so the shape the page renders is built here. `state` stays for
 * the route's 404 rule reads it directly.
 */
function toCategorySummary(
  category: FetchCategorySectionsQuery['category']
): CategorySummary | null {
  if (!category) {
    return null
  }

  return {
    id: category.id,
    isMemberOnly: category.isMemberOnly ?? false,
    name: category.name ?? '',
    sections: (category.sections ?? []).map((section) => ({
      id: section.id,
      name: section.name ?? '',
      slug: section.slug ?? '',
    })),
    slug: category.slug ?? '',
    state: category.state,
  }
}

async function fetchNewsCategoryInfo(): Promise<CategorySummary | null> {
  const response = await fetchStaticJsonByUrl<unknown>(
    URL_STATIC_NEWS_CATEGORY_INFO
  )

  const result = monitorZodSafeParse(newsCategoryInfoSchema, response.data, {
    boundary: 'gcs-static-json:category_news',
    schemaName: 'newsCategoryInfoSchema',
  })

  if (!result.success) {
    return null
  }

  return toCategorySummary(result.data.category)
}

/**
 * One JSON file holds 120 posts and the generator writes at most four of them,
 * so a page beyond the fourth file has nothing to read.
 */
const POSTS_PER_JSON = 120
const LAST_JSON_FILE_ORDER = 4

/**
 * A post has a large structure and the listing only reads part of it, so the
 * schema covers everything except `items`.
 */
const newsCategoryPostsSchema = z.object({
  posts: z.object({
    items: z.array(z.unknown()),
    counts: z.object({
      posts: z.number().nonnegative(),
      externals: z.number().nonnegative(),
    }),
  }),
})

const imageSetSchema = z.record(z.string()).nullish()

/**
 * 這份 JSON 是同一組 GraphQL 查詢的 dump，形狀跟查詢結果幾乎一樣，多了 `type`
 * （區分 story / external）和 `__typename` 之類的欄位。
 */
const newsCategoryPostSchema = z.object({
  brief: z
    .union([
      z.literal('DbNull'),
      z.object({
        blocks: z.array(z.object({ text: z.string().optional() })).optional(),
      }),
    ])
    .nullish(),
  heroImage: z
    .object({
      resized: imageSetSchema,
      resizedWebp: imageSetSchema,
    })
    .nullish(),
  id: z.string().min(1),
  publishedDate: z.string().nullish(),
  sections: z
    .array(z.object({ name: z.string().nullish(), slug: z.string().nullish() }))
    .nullish(),
  slug: z.string().nullish(),
  title: z.string().nullish(),
  type: z.string().nullish(),
})

/**
 * 一筆壞掉的文章只掉自己，不會讓整頁變成空的
 */
function toArticleListItems(
  items: unknown[],
  boundary: string
): ArticleListItemData[] {
  const articles: ArticleListItemData[] = []
  const invalidIssues: z.ZodIssue[] = []
  let invalidItemCount = 0

  items.forEach((item, index) => {
    const itemResult = newsCategoryPostSchema.safeParse(item)

    if (!itemResult.success) {
      invalidItemCount += 1
      invalidIssues.push(
        ...itemResult.error.issues.map((issue) => ({
          ...issue,
          path: [index, ...issue.path],
        }))
      )
      return
    }

    const post = itemResult.data

    articles.push({
      brief: post.brief ?? null,
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
      type: post.type ?? undefined,
    })
  })

  if (invalidIssues.length > 0) {
    logZodMonitorFailure({
      boundary,
      schemaName: 'newsCategoryPostSchema',
      error: new z.ZodError(invalidIssues),
      debugPayload: {
        invalidItemCount,
        totalItemCount: items.length,
      },
    })
  }

  return articles
}

/**
 * Reads one page out of the pre-generated JSON files. Failures resolve to an
 * empty list: server side that becomes a 404, and the infinite scroll on the
 * client stops asking for more.
 */
async function fetchNewsCategoryPostsJSON(
  page = 1,
  take = 24
): Promise<{ items: ArticleListItemData[]; counts: number }> {
  const takePerJson = POSTS_PER_JSON / take
  const jsonFileOrder = Math.ceil(page / takePerJson)
  const jsonUrl = `${URL_STATIC_NEWS_CATEGORY_POSTS}_${jsonFileOrder}.json`
  const boundary = 'gcs-static-json:latest_content_category_news'

  try {
    const response = await fetchStaticJsonByUrl<unknown>(jsonUrl)

    const result = monitorZodSafeParse(newsCategoryPostsSchema, response.data, {
      boundary,
      schemaName: 'newsCategoryPostsSchema',
    })

    if (!result.success) {
      return { items: [], counts: 0 }
    }

    const startIndex = ((page - 1) % takePerJson) * take
    const pageItems = result.data.posts.items.slice(
      startIndex,
      startIndex + take
    )

    return {
      items:
        jsonFileOrder <= LAST_JSON_FILE_ORDER
          ? toArticleListItems(pageItems, boundary)
          : [],
      counts:
        result.data.posts.counts.posts + result.data.posts.counts.externals,
    }
  } catch (err) {
    console.error(
      'Failed to fetch JSON of URL_STATIC_NEWS_CATEGORY_POSTS: ',
      JSON.stringify(err)
    )
    return { items: [], counts: 0 }
  }
}

export { fetchNewsCategoryInfo, fetchNewsCategoryPostsJSON, toCategorySummary }
