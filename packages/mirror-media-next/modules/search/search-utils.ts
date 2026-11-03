import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import { pickDisplaySection } from '@/modules/list-article/list-article-data'
import type { ArticleListItemData } from '@/modules/list-article/list-article-types'
import { transformTimeDataIntoDotFormat } from '@/utils'

import type { MisoLayout, MisoProduct } from './search-types'

/**
 * Miso `tags` 是重複的 `[name, slug]`。一組就只有一個 section；
 * 多組時交給 `pickDisplaySection` 跳過 marketing。
 */
function sectionsFromSearchTags(
  tags: string[] | undefined
): ArticleListItemData['sections'] {
  const sections: ArticleListItemData['sections'] = []
  const values = tags ?? []

  for (let index = 0; index < values.length; index += 2) {
    const name = values[index] ?? ''
    const slug = values[index + 1]
    sections.push({ name, slug: slug ?? null })
    if (slug === undefined) {
      break
    }
  }

  return sections
}

/**
 * 一列的 markup 要跟 `modules/list-article/components/article-list-item.tsx` 對齊。
 * 兩邊沒辦法共用：那支是 React 元件，這裡 Miso 只收 HTML 字串，所以改版面時兩邊都要動。
 */
export function renderProduct(
  _layout: MisoLayout,
  _state: unknown,
  product: MisoProduct
) {
  const sectionName =
    pickDisplaySection(sectionsFromSearchTags(product.tags))?.name ?? ''
  const publishedDate = transformTimeDataIntoDotFormat(
    String(product.published_at)
  )
  const href = product.url

  return `
    <a
      class="relative block hover:no-underline sm:flex sm:items-center sm:gap-mm-xl"
      data-role="item"
      data-miso-product-id="${product.product_id}"
      data-story-list="search_list"
      href="${href}"
      target="_blank"
    >
      <div class="relative mb-mm-l aspect-[330/220] w-full overflow-hidden sm:mb-0 sm:aspect-auto sm:h-[127px] sm:w-[179px] sm:shrink-0">
        <img
          class="h-full w-full object-cover"
          src="${product.cover_image ?? DEFAULT_OG_IMAGE_URL}"
          alt="${product.title}"
          loading="lazy"
        />
      </div>
      ${
        sectionName
          ? `<span class="m-0 font-mm-sans text-mm-subtitle absolute top-0 left-0 flex h-6 items-center bg-mm-base-600 px-2.5 text-mm-second-100 sm:hidden">${sectionName}</span>`
          : ''
      }
      <div>
        <h2 class="m-0 font-mm-sans text-mm-h5 mb-mm-l line-clamp-2 text-mm-neutral-800 sm:mb-1">${
          product.title
        }</h2>
        <span class="m-0 font-mm-sans text-mm-caption-l block text-[#a1a1a1] sm:text-mm-caption-s sm:text-mm-neutral-700">${
          publishedDate ?? ''
        }</span>
        <p class="m-0 font-mm-body text-mm-body-s hidden text-mm-neutral-500 sm:line-clamp-2">${
          product.snippet ?? ''
        }</p>
      </div>
    </a>`
}

export function renderList(
  layout: MisoLayout,
  state: unknown,
  products: MisoProduct[]
) {
  return `<div class="flex flex-col gap-mm-2xl" data-role="list">${layout.templates.items(
    layout,
    state,
    products
  )}</div>`
}

export function renderItems(
  layout: MisoLayout,
  state: unknown,
  products: MisoProduct[]
) {
  return products
    .map(
      (item) => `<div>${layout.templates.product(layout, state, item)}</div>`
    )
    .join('')
}

export function insertSortElement(html: string) {
  return html.replace(
    '<miso-facets></miso-facets>',
    `<div class="miso-hybrid-search-combo__search-results-filters__right"><div class="miso-hybrid-search-combo__search-results-filters__sort-header">Sort</div><miso-sort></miso-sort></div>`
  )
}
