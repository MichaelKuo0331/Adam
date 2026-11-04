import { DEFAULT_OG_IMAGE_URL } from '@/constants'
import type { HeadersDataSection, ShellSectionPosts } from '@/utils/api'

type ShellNavigationCategory = {
  href: string
  name: string
  slug: string
}

type ShellNavigationPost = {
  heroImage: string
  href: string
  publishedDate: string
  title: string
}

type ShellNavigationItem = {
  categories: ShellNavigationCategory[]
  href: string
  name: string
  posts: ShellNavigationPost[]
  slug: string
}

type ShellUtilityLink = {
  href: string
  label: string
}

function getCategoryHref(slug: string) {
  // The header payload only supplies category slugs, so most destinations can
  // be derived as /category/<slug>. Mirror 3.0's legacy header already treated
  // daily_forum as a route exception, and the current dev and prod payloads
  // still contain it: its owned route is /externals/dailycolumn, while the
  // derived /category/daily_forum is a 404. The V4 shell preserves that behavior
  // to avoid a migration regression. Remove this exception if the header
  // contract later supplies canonical hrefs.
  if (slug === 'daily_forum') {
    return '/externals/dailycolumn'
  }

  return `/category/${slug}`
}

const shellUtilityLinks: readonly ShellUtilityLink[] = [
  { href: '/podcasts', label: 'PODCAST' },
  { href: '/magazine', label: '動態雜誌' },
  { href: '/papermag', label: '訂閱紙本雜誌' },
]

/**
 * Order and artwork follow the Figma menu footer (鏡報新聞網 → mnews・鏡新聞 →
 * 鏡文學 → 鏡好聽). Sizes are each lockup's own height from the design, which
 * differs per brand; the shared 28px belongs to the row that holds them, not
 * to the artwork, so they stay centred at their design size.
 * Three lockups are vector; 鏡報新聞網 is raster in the design file itself
 * (its icon is a bitmap), so exporting it as SVG would only embed that bitmap.
 *
 * TODO(D6): the destination URLs for 鏡報新聞網 and mnews・鏡新聞 are not in the
 * repository or the design file and still need PM/Content confirmation.
 */
const shellPartnerLinks = [
  {
    height: 20,
    href: 'https://www.mirrordaily.news/',
    label: '鏡報新聞網',
    src: '/images-next/shell-partner-mirrordaily.png',
    width: 80,
  },
  {
    height: 20,
    href: 'https://www.mnews.tw/',
    label: 'mnews・鏡新聞',
    src: '/images-next/shell-partner-mnews.svg',
    width: 110,
  },
  {
    height: 17,
    href: 'https://www.mirrorfiction.com/',
    label: '鏡文學',
    src: '/images-next/shell-partner-mirrorfiction.svg',
    width: 70,
  },
  {
    height: 17,
    href: 'https://voice.mirrorfiction.com/',
    label: '鏡好聽',
    src: '/images-next/shell-partner-mirrorvoice.svg',
    width: 70,
  },
] as const

/**
 * The navigation is whatever the header sections file says it is: its order,
 * its names, its slugs and its categories. Nothing about the sections is
 * declared here, so a section added or renamed upstream shows up without a
 * code change.
 *
 * Both static files key sections by the same slug, so the two latest posts of
 * a section join on it directly.
 */
function createShellNavigation(
  sections: HeadersDataSection[],
  sectionPosts: ShellSectionPosts = {}
): ShellNavigationItem[] {
  // Both data paths converge here, so order is applied once.
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      categories: section.categories.map((category) => ({
        href: getCategoryHref(category.slug),
        name: category.name,
        slug: category.slug,
      })),
      href: `/section/${section.slug}`,
      name: section.name,
      // The feed's post_url points at the environment that produced the file, so
      // the href is rebuilt here to keep the reader in this one.
      posts: (sectionPosts[section.slug] ?? []).slice(0, 2).map((post) => ({
        heroImage: post.heroImage ?? DEFAULT_OG_IMAGE_URL,
        href: `/story/${post.slug}`,
        publishedDate: post.publishedDate,
        title: post.title,
      })),
      slug: section.slug,
    }))
}

export { createShellNavigation, shellPartnerLinks, shellUtilityLinks }
export type {
  ShellNavigationCategory,
  ShellNavigationItem,
  ShellNavigationPost,
}
