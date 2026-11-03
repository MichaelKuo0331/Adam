import type { FetchExternalsQuery } from '@/apollo/__generated__/content/graphql'
import type { ArticleListItemData } from '@/modules/list-article/list-article-types'
import { getExternalSectionTitle } from '@/utils/external'

type ExternalListItemSource = NonNullable<
  FetchExternalsQuery['externals']
>[number]

/**
 * external 跟 post 是兩套資料模型，所以這裡不只是把 nullable 收乾淨，
 * 有三個欄位是刻意調整成要符合
 * modules/list-article/components/article-list-item 的格式
 *
 * - `brief`：external 是普通字串欄位，post 是 draft 結構。列表列讀的是
 *   `blocks[0].text`，所以包一層它本來沒有的巢狀。
 *
 * - `heroImage`：external 只有一個 `thumb` URL，post 有整組尺寸和 webp。這裡填成單一 `original`
 *
 * - `sections`：external 沒有 section，badge 的文字由 partner 決定
 *   （`getExternalSectionTitle`：showOnIndex 為真是「時事」，否則是「生活」）。
 */
function toExternalListItemData(
  external: ExternalListItemSource
): ArticleListItemData {
  return {
    brief: { blocks: [{ text: external.brief ?? '' }] },
    heroImage: external.thumb
      ? { resized: { original: external.thumb }, resizedWebp: null }
      : null,
    id: external.id,
    publishedDate: external.publishedDate ?? '',
    sections: [
      { name: getExternalSectionTitle(external.partner) ?? '', slug: null },
    ],
    slug: external.slug ?? '',
    title: external.title ?? '',
    // 讓列表列的連結指向 `/external/<slug>` 而不是 `/story/<slug>`。
    type: 'external',
  }
}

export { toExternalListItemData }
export type { ExternalListItemSource }
