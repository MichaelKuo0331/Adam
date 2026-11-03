import { z } from 'zod'

import { URL_STATIC_COLUMN_SECTION_POSTS } from '@/config/index.mjs'
import { toImageSet } from '@/modules/list-article/list-article-data'
import type { ArticleListItemData } from '@/modules/list-article/list-article-types'
import { fetchStaticJsonByUrl } from '@/utils/api'
import { logZodMonitorFailure, monitorZodSafeParse } from '@/utils/zod-monitor'

const imageSetSchema = z.record(z.string()).nullish()

/**
 * 這份 JSON 一筆可能是 story 也可能是 external，兩種的圖片和 brief 放在不同欄位，
 * 所以兩邊的欄位都是選填，由 `type` 決定實際讀哪一組。
 */
const columnItemSchema = z.object({
  /** story 的 brief，draft 的 block 陣列 */
  apiDataBrief: z
    .array(z.object({ content: z.array(z.string()).nullish() }))
    .nullish(),
  /** external 的 brief，純字串 */
  brief: z.string().nullish(),
  /** story 的圖 */
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
  /** external 的圖，單一 URL */
  thumb: z.string().nullish(),
  title: z.string().nullish(),
  type: z.string().nullish(),
})

const columnSectionSchema = z.object({
  section: z.object({
    items: z.array(z.unknown()),
  }),
})

type ColumnItem = z.infer<typeof columnItemSchema>

function toBriefText(item: ColumnItem) {
  if (item.type === 'story') {
    return (item.apiDataBrief?.[0]?.content ?? []).join(' ')
  }
  return item.brief ?? ''
}

function toHeroImage(item: ColumnItem): ArticleListItemData['heroImage'] {
  if (item.heroImage) {
    return {
      resized: toImageSet(item.heroImage.resized),
      resizedWebp: toImageSet(item.heroImage.resizedWebp),
    }
  }
  return item.thumb
    ? { resized: { original: item.thumb }, resizedWebp: null }
    : null
}

/** 一筆壞掉的文章只掉自己，不會讓整頁變成空的 */
function toColumnListItems(
  items: unknown[],
  boundary: string
): ArticleListItemData[] {
  const articles: ArticleListItemData[] = []
  const invalidIssues: z.ZodIssue[] = []
  let invalidItemCount = 0

  items.forEach((item, index) => {
    const itemResult = columnItemSchema.safeParse(item)

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

    const columnItem = itemResult.data

    articles.push({
      brief: { blocks: [{ text: toBriefText(columnItem) }] },
      heroImage: toHeroImage(columnItem),
      id: columnItem.id,
      publishedDate: columnItem.publishedDate ?? '',
      sections: (columnItem.sections ?? []).map((section) => ({
        name: section.name ?? '',
        slug: section.slug ?? null,
      })),
      slug: columnItem.slug ?? '',
      title: columnItem.title ?? '',
      type: columnItem.type ?? undefined,
    })
  })

  if (invalidIssues.length > 0) {
    logZodMonitorFailure({
      boundary,
      schemaName: 'columnItemSchema',
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
 * 只讀 `URL_STATIC_COLUMN_SECTION_POSTS` 指到的那一個檔案，跟舊版一樣。這份 JSON
 * 其實還有 `_2` / `_3`，但在 config 當中寫死 _1 了。
 */
async function fetchColumnSectionPostsJSON(): Promise<ArticleListItemData[]> {
  const boundary = 'gcs-static-json:latest_content_section_column'

  try {
    const response = await fetchStaticJsonByUrl<unknown>(
      URL_STATIC_COLUMN_SECTION_POSTS
    )

    const result = monitorZodSafeParse(columnSectionSchema, response.data, {
      boundary,
      schemaName: 'columnSectionSchema',
    })

    if (!result.success) {
      return []
    }

    return toColumnListItems(result.data.section.items, boundary)
  } catch (err) {
    console.error(
      'Failed to fetch JSON of URL_STATIC_COLUMN_SECTION_POSTS: ',
      JSON.stringify(err)
    )
    return []
  }
}

export { fetchColumnSectionPostsJSON }
