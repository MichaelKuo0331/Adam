/**
 * What the article list needs from a section: the name it prints on the hero
 * image, and the slug that picks the GPT page key.
 */
export type ArticleListSection = {
  name: string
  slug: string
}

/**
 * 列表中一列所需要的資料。刻意比 `apollo/fragments/post` 的 `ListingPost` 窄：
 * 列表完全沒有讀 `categories`，而 `ListingPost` 宣告的 `categories` type 是
 * `fetchPosts` 這個 query 根本沒有 select 的。
 */
export type ArticleListItemData = {
  /** JSON 欄位是空的時候，後端會給 `'DbNull'` 這個字串而不是 null。 */
  brief: { blocks?: { text?: string }[] } | 'DbNull' | null
  /*
    heroImage 最後要傳入 react-image 元件，目前 type 定義透過 external-modules.d.ts 處理。
    resized, resizedWebp 是 Record<string, string>
  */
  heroImage: {
    resized?: Record<string, string> | null
    resizedWebp?: Record<string, string> | null
  } | null
  id: string
  publishedDate: string
  /**
   * 角標用。`slug` 用來跳過行銷分類；靜態 JSON 或 external 合成的 section
   * 沒有 slug 時是 null，選擇時會把它當成非 marketing。
   */
  sections: { name: string; slug: string | null }[]
  slug: string
  title: string
  type?: string
}
