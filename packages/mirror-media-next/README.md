# mirror-media-next

Mirror Media 的主要新聞網站，採 Next.js 15、React 19、Pages Router（頁面路由器）、Apollo Client 與 styled-components，並以 server-side rendering（伺服器端渲染）提供內容與會員個人化頁面。

## Requirements（執行需求）

- Node.js `>=24.0.0 <25.0.0`
- pnpm `10.17.1`

Monorepo（單一儲存庫）相依套件必須從 repository root（儲存庫根目錄）安裝：

```bash
pnpm install
```

## Getting Started

Go to this package directory:

```bash
cd packages/mirror-media-next
```

Run package commands:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm codegen:check
pnpm test:smoke
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Storybook（元件展示與文件工具）

本專案提供兩種 Storybook 開啟方式，兩者用途不同，請不要混用：

### Live Storybook dev server（即時 Storybook 開發伺服器）

用於開發 UI component（使用者介面元件）stories（元件案例），有較快的 hot reload（熱更新）：

```bash
pnpm storybook
```

開啟：

```text
http://localhost:6006
```

### Next.js static embedded route（Next.js 靜態嵌入路由）

用於檢查 non-prod（非正式環境）同站 `/storybook` 發布結果。這條路由只讀取 `public/_storybook` static artifact（靜態產物），local 要查看的話需要先 build 過：

```bash
pnpm dev:storybook-route
```

開啟：

```text
http://localhost:3000/storybook
```

注意事項：

- `pnpm dev:storybook-route` 會用 `NEXT_PUBLIC_ENV=local` 啟動 Next.js，避免本機 `.env` 若設為 `NEXT_PUBLIC_ENV="prod"` 時 `/storybook` 依正式環境規則回 404。
- `pnpm dev:storybook-route` 已內含 `pnpm storybook:build`，因此每次啟動都會重建產物。若改用 `pnpm dev` 直接開 `/storybook`，看到的是上一次 build 的舊產物；新增的 story、argTypes 或 addon 不會出現。
- 若 `public/_storybook` 不存在，`/storybook` 會顯示 static artifact missing（缺少靜態產物）的提示頁。
- Production（正式環境）不應包含 `public/_storybook`，且 `/storybook` 必須回 404。

## Docker

Dockerfile 需要完整的 pnpm workspace（pnpm 工作區），因此 image（映像檔）必須從 repository root 建置，不可在本 package 目錄直接使用 `docker build .`：

```bash
docker build \
  -f packages/mirror-media-next/Dockerfile \
  --build-arg NEXT_PUBLIC_ENV=dev \
  -t mirror-media-next \
  .
```

一般 runtime（執行期）：

```bash
docker run --rm -p 3000:3000 mirror-media-next
```

AMP proxy runtime（AMP 代理執行期）：

```bash
docker run --rm -e PROXY_AMP=true -p 3000:3000 mirror-media-next
```

## Repository architecture（程式庫架構）

本節是 `packages/mirror-media-next/` 的 committed reference（進版控參考）。架構依 ownership（所有權）與 dependency direction（依賴方向）說明，不把交付階段當作檔案分類，也不能把尚未建立的 target directory（目標目錄）當成已落地功能。

狀態定義：

- **Current**：目前可直接使用且已有真實 consumer（使用端）。
- **Transitional**：仍服務既有 routes（路由），但新功能不應延續其 ownership（所有權）模式。
- **Target when needed**：只有達到下列建立條件時才新增；不可先建空目錄或 facade（門面）檔案。

### Target ownership map（目標所有權架構）

這張圖表達完成遷移後的 ownership，不代表所有目錄目前都已實體建立：

```text
packages/mirror-media-next/
├── pages/                              # Next.js routes, GSSP, route composition and policy
│   ├── index.tsx                       # Homepage route composition
│   └── podcasts/index.tsx              # Podcast route composition
├── modules/                            # Business capabilities, shallow by default
│   ├── authentication/
│   │   └── password-policy.ts          # Login and new-password validation and hints
│   ├── homepage/
│   │   ├── homepage-types.ts           # Homepage-owned view-model types
│   │   ├── homepage-data.ts            # Server data aggregation
│   │   ├── homepage-client-data.ts     # Browser load-more boundary
│   │   ├── homepage-static-json.schema.ts
│   │   └── components/                 # Homepage-owned UI
│   └── podcast/
│       ├── podcast-types.ts            # Podcast-owned view-model types
│       ├── podcast-data.ts             # Fetch, validate and normalize Podcast data
│       └── components/                 # Podcast-owned UI
│           ├── audio-player.tsx
│           ├── author-select-dropdown.tsx
│           ├── play-pause-button.tsx
│           ├── podcast-card.tsx
│           ├── podcast-list.tsx
│           └── podcast-modal.tsx
├── components/
│   ├── ui/                             # Domain-neutral design-system primitives
│   ├── common/                         # Proven domain-neutral composed UI/controllers
│   │   └── carousel-ticker.tsx         # Shared carousel cadence and pause coordination
│   └── shell/                          # Application Layout/Header/Footer ownership
├── apollo/                             # GraphQL clients, sources, and generated output
├── axios/                              # Existing HTTP compatibility wrapper
├── config/                             # Environment configuration
├── constants/                          # Cross-cutting constants; review touched files
├── context/                            # Existing React context state
├── firebase/                           # Firebase client/admin integration boundary
├── hooks/                              # Proven cross-cutting browser hooks
├── mocks/                              # Development fixtures and mock server
├── public/                             # Runtime assets and generated public artifacts
├── scripts/                            # Package tooling
├── service-worker/                     # Auth-only service worker source
├── slice/                              # Existing Redux slices
├── store/                              # Redux store infrastructure
├── styles/                             # Tailwind source/theme and legacy styling
├── type/                               # Legacy JSDoc/global types; no new entries
├── types/                              # Ambient external module declarations only
├── utils/
│   ├── api/                            # Transitional shared/domain transports
│   ├── log/                            # Cross-cutting logging
│   ├── server-side-only/               # Strict Node/SSR-only utilities
│   └── <shared files>                  # Proven cross-module utilities
├── .storybook/                         # Storybook configuration
├── next.config.mjs                     # Next.js configuration
├── postcss.config.mjs                  # Tailwind/PostCSS entry
└── components.json                     # shadcn source aliases and generator settings
```

Target map（目標架構圖）可以列出尚未完成的 ownership，但不以 `.gitkeep`、空 barrel 或 placeholder（占位檔）製造實體目錄。`components/common/`、`components/shell/`、`modules/<capability>/components/` 與任何 shared capability module（共用能力模組）仍必須由真實 consumer（使用端）與明確 ownership 賺得。

### Current Podcast migration state（Podcast 目前遷移狀態）

目前 type／data 已進入 capability module；六個 JavaScript UI 仍是 Legacy capability UI bridge（舊版能力 UI 橋接）：

```text
packages/mirror-media-next/
├── pages/
│   └── podcasts/
│       └── index.tsx                   # Route composition + GSSP
├── modules/
│   └── podcast/
│       ├── podcast-types.ts
│       └── podcast-data.ts
└── components/
    └── podcast/                        # Legacy capability UI bridge
        ├── audio-player.js
        ├── author-select-dropdown.js
        ├── play-pause-button.js
        ├── podcast-card.js
        ├── podcast-list.js
        └── podcast-modal.js
```

Legacy bridge 不承接新的 ownership。等六個元件完成 `.tsx` 遷移、互動與無障礙驗證，並將所有 consumers 更新到 `modules/podcast/components/` 後，刪除 `components/podcast/` 舊路徑。執行時程與 owner 放在 local-only execution 文件，不寫入這份長期架構表。

### Ownership and placement（所有權與放置規則）

| 位置                                                     | 責任                                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pages/**`                                               | Next.js route exports、GSSP、cache／redirect／404、SEO 與頁面組合                       |
| `modules/<capability>/`                                  | 能力擁有的 types、data、logic、components 與 hooks；預設保持扁平                        |
| `components/ui/**`                                       | 採 shadcn conventions（shadcn 慣例）的無領域、低階基礎元件                              |
| `components/common/**`                                   | 無領域且經不相關 consumers 證明可重用的 composed UI（組合式介面）／controller（控制器） |
| `components/shell/**`                                    | Layout、Header、Footer 等 application shell（應用外殼）                                 |
| `components/shared/**`、`components/<legacy-feature>/**` | Legacy compatibility（舊版相容）路徑；不新增 ownership，consumer 歸零後刪除             |
| `utils/**`、`hooks/**`                                   | 真正跨能力且符合執行環境的共用工具／hooks；單一能力內容回到最近 module                  |
| `type/**`、`types/**`                                    | `type/` 不再新增；`types/` 只放 ambient declarations（環境宣告）                        |

`components/ui/` 以 shadcn UI 為主。由 shadcn 衍生／客製，以及專案依相同慣例撰寫的低階 primitives 都可放在這裡；元件不得包含 route 或 business behavior（業務行為）。
新程式碼直接從 `@/components/ui/<component>` 匯入；既有 `components/ui/index.ts` 只保留 compatibility exports（相容匯出），不擴張為第二個 public registry（公開登錄庫）。

`PageShell` 是 `components/shell/` 唯一的頁面外殼組合入口，也是一般非 AMP UI routes（使用者介面路由）的標準入口。它直接擁有 application shell（應用外殼）的 flex／`min-h-dvh` 結構與 slot order（插槽順序），固定組合 `CustomHead`、`SiteHeader`、`GDPRNotification` 與 `BackToTop`，預設加入 `SiteFooter` 與 `IdleTimeoutModal`。route-specific metadata（路由專屬中繼資料）透過 `head` prop（屬性）傳入；route 只有在補充文章時間、AMP link 或 JSON-LD 等特殊標籤時才另外使用 `next/head`，不應再自行 render `CustomHead`。只有已確認需保留原畫面的頁面才可使用 `withFooter={false}` 或 `withIdleTimeout={false}`；route 不應自行建立另一套 shell variant（外殼變體）。AMP routes 維持獨立 `components/amp/amp-layout`；`pages/500.js` 是不依賴資料與 shell 的靜態錯誤後備，兩者都不使用 `PageShell`，並直接組合 `CustomHead`。`_app.js` 也必須在 `/500` 排除 client-only `PromoteTopic`（僅用戶端專題推薦），避免錯誤畫面重新引入內容請求。

`CustomHead` 提供站台預設的 `<meta name="robots" content="index, max-image-preview:large">` 與預設分享圖片；特殊頁面可透過 `robotsMetaContent` 覆寫，傳入 `null` 則代表該 route 的另一個 `Head` 負責 robots 規則。帳號流程與 404／500 必須明確使用 `noindex`，不可落回公開頁面的預設值。

`components/shared/layout.js`、`components/shared/layout-full.js` 與 `LegacyLayoutAdapter` 只保留既有 JavaScript routes 的 compatibility facade（相容介面），render path（渲染路徑）同樣委派給 `PageShell`，不再保留裸 DOM flow、premium header 或 empty shell 分支；consumer（使用端）遷移完畢後刪除。

`PageShell` 不在 render path 自行取得 Header data；使用它的 Pages Router route 必須在所屬 data boundary（資料邊界）呼叫 `fetchShellHeaderData()`，再以 serializable props（可序列化屬性）傳入。`fetchShellHeaderData()` 固定取得 flash news（快訊），不提供 opt-in；active navigation（作用中導覽）仍由 route 提供。仍使用 legacy header fetcher（舊頁首資料函式）的 compatibility routes 也必須把 `flashNewsData` 傳入 facade。500 的靜態錯誤後備不取任何 shell data，因此不受此契約約束。

### Component placement guide（元件放置指南）

React component（React 元件）是呈現單位，不是 ownership 類別；`components/` 與 `modules/` 都可以包含 `.tsx`。本專案的 `components/` 只承接跨領域呈現責任，`modules/` 則承接會隨特定 business concept、use case 或 lifecycle（業務概念、使用案例或生命週期）共同變更的完整能力。Figma component（設計元件）、檔案種類、外觀相似或 consumer 數量都不能單獨決定放置位置。

新增元件時依序判斷，第一個成立就停止：

1. **責任只在特定 URL 與 route policy（路由政策）中成立**：放 `pages/**`。
2. **責任是所有適用 routes 共同的外框、全域導覽呈現或 slot order（插槽順序）**：放 `components/shell/**`。
3. **責任包含業務實體、規則、資料語意、狀態轉換或 use case**：放 `modules/<capability>/**`；一個或多個 consumers 都不改變此 ownership，也不另建 `modules/shared/`。
4. **責任是無領域、低階的 design-system contract（設計系統契約）**：放 `components/ui/**`。
5. **責任無領域，且不相關 consumers 已證明需要相同的 composed UI（組合式介面）或 controller（控制器）責任**：放 `components/common/**`。
6. **仍無法判斷**：留在目前最明確的 owner boundary（所有權邊界）並提出 ownership review；不得先放入 `shared`／`common`、建立空 module 或複製第二份。

若同一個元件同時符合 shell 與 capability、route 與 capability 等多項責任，不以前後順序掩蓋混合 ownership；先拆開責任，或在建立 public contract 前完成 architecture review（架構審查）。

Route 與 capability 是不同分類軸：route 是 framework／runtime entry（框架／執行期入口），capability 是 change／ownership boundary（變更／所有權邊界）。兩者是多對多關係；不因新增 route 自動建立同名 module，也不因 module 只有一個 consumer 就視為 route-owned。

### Core rules（核心規則）

- Page 依 URL 拆分並保留 route policy；module 依 business capability（業務能力）與共同生命週期拆分，兩者不做一對一鏡像。
- 建立 module 時必須能指出穩定的業務責任、明確 owner／public contract，並在不 import route policy 的情況下成立；名稱不得只描述暫時 URL、畫面位置、元件尺寸或檔案種類。
- Module 預設扁平放 `<capability>-types.ts`、`<capability>-data.ts` 與單一 logic／hook；只有同類檔案形成真實集合時才建立 `components/`、`hooks/` 或 `data/`。
- Capability component 可知道領域型別與行為；`components/common/` 與 `components/ui/` 不可知道 business entity（業務實體），也不可用 slots（插槽）或泛型 props 隱藏原本清楚的領域耦合。
- 手寫型別與 validation schema（驗證結構）跟隨其 owner；route-only 型別留在 route，capability 型別留在 module，generated output（生成產物）維持 generator-owned boundary（生成器所有權邊界）。
- 不建立空目錄、`.gitkeep`、props-only page facade 或雙軌新舊實作。
- 新 application files 一律使用 `.ts`／`.tsx`；Legacy `.js`／`.jsx` 搬移時必須同步完成型別遷移。

### Dependency boundaries（依賴邊界）

以下 dependency boundaries（依賴邊界）是目前的 code-review contract（程式碼審查契約），尚未由專用 ESLint 規則自動強制。

- `pages/**` 可組合 modules、shell、common、design-system UI 與遷移中的 Legacy components，但不可依賴另一個 page 的 route policy。
- Module components／hooks 可依賴同 module、核准的其他 capability public contract、common、design-system UI 與 browser-safe utilities。
- `components/common/**` 與 `components/ui/**` 不得反向依賴 modules、pages 或 shell。
- Shell 可以呈現 capability 提供的公開狀態與操作，但不接管其資料生命週期或 route policy；是否允許特定 direct module import 必須另以 dependency contract 核准，不能只由放置位置推定。
- Browser UI／hooks 不得 import `utils/server-side-only/**` 或 `firebase/admin`。
- `utils/server-side-only/` 是既有的 Node／credential 安全邊界，不是 module 的固定子目錄；production build（正式建置）仍須確認這些程式沒有進入 client bundle（瀏覽器套件）。

### Shared roots and styling（共用根目錄與樣式）

- Root `hooks/`／`utils/` 只保留跨能力、符合執行環境的內容；capability-specific code（能力專屬程式）放回最近 module。
- `type/` 不再新增；feature-owned types 放最近 module，`types/` 只保留外部套件的 ambient declarations。
- Tailwind current breakpoints（現行斷點）為 `sm: 640px`、`md: 768px`、`lg: 1024px`、`xl: 1280px`、`2xl: 1536px`；舊版視覺一致性使用 `legacy-*`。
- Tailwind `@source` 只在真實 module component 開始產生 classes 時加入；AMP code 必須保持可排除。

### Minimum checks（最低檢查）

```bash
pnpm lint
pnpm typecheck
NO_NEW_JS_BASE_REF=upstream/dev pnpm check:no-new-js
pnpm codegen:check
pnpm build
```

另外驗證受影響 route；變更涉及 client／server、Tailwind 或 AMP 邊界時，再補對應的 bundle、CSS 或 validator 證據。

## v4.0 架構基準

`mirror-media-next` v4.0 的現行架構與維護限制如下；只有在對應實作完成變更後，才應同步更新或移除這些限制：

- Framework and routing（框架與路由）：使用 Next.js 15.5.22、React 19.2.7 與 Pages Router（頁面路由器），並保留 `/story/amp/[slug]`、`/external/amp/[slug]` 內建 AMP 路由。Next.js 16 已移除內建 AMP API；升級前必須先決定 AMP 的替代或退場方式，並驗證 Turbopack（打包工具）與 SVG、GraphQL 等既有 webpack loaders（webpack 載入器）的相容性。
- App Router（應用程式路由器）：目前未使用。若要導入，必須同時設計 `getServerSideProps`、styled-components SSR、Apollo SSR 與會員個人化驗證流程的替代方案；不可只搬移路由檔案。
- Deployment（部署）：Docker runtime（Docker 執行期）依賴 `output: 'standalone'`、monorepo output tracing（單一儲存庫輸出追蹤）與 repository-root build context（儲存庫根目錄建置上下文）。調整 Next.js、pnpm workspace 或 Dockerfile 後，必須確認一般模式及 `PROXY_AMP=true` 都能建置與啟動。
- TypeScript：採 `strict: true`、`allowJs: true` 漸進遷移；既有 JavaScript 可繼續維護，但不得新增 application（應用程式）`.js`／`.jsx` 檔，請使用 `.ts`／`.tsx`。

### Auth-only Service Worker（僅供身分驗證的服務工作執行緒）

Mirror 不是 PWA（漸進式網頁應用程式）。目前 Service Worker 只負責替 same-origin（同來源）的 HTML 與 `/_next/data` SSR（伺服器端渲染）request 注入 Firebase ID token 的 `Authorization: Bearer` header，以保留會員個人化內容：

- Source：`service-worker/index.js`
- Build output：`public/sw.js`
- Build command：`pnpm build:sw`；`pnpm build` 會先自動執行
- Registration：由 `pages/_app.js` 在 production mode（正式模式）手動註冊

請勿把它改造成 offline cache（離線快取）、precache（預先快取）或 installable PWA（可安裝式 PWA），也不要重新引入 `next-pwa`／Workbox。若要改寫或移除，必須先另外規劃 Pages Router 個人化 SSR authentication flow（身分驗證流程）的替代方案，並驗證登入與 `/_next/data` 的 Authorization header。

### Data contracts（資料契約）

- GraphQL 的 content、member 與 story schema snapshots（結構快照）存放於 `apollo/schema/`，GraphQL Codegen（GraphQL 程式碼生成）的輸出存放於 `apollo/__generated__/`。Schema 或 query 變更後執行 `pnpm codegen`，並以 `pnpm codegen:check` 確認生成結果一致；GraphQL response 不重複執行 Zod parse。
- GCS static JSON（GCS 靜態 JSON）、REST 與 repo 內的 SearchLite API 等沒有 server-enforced contract（伺服器強制契約）的資料邊界使用 Zod runtime validation（Zod 執行期驗證）。Monitor mode（監測模式）只記錄 schema 差異並保留既有 response；enforcement mode（強制模式）才會拒絕不符合 schema 的資料。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Reminder

### 使用 `.mjs` 副檔名的時機

為了要能讓 `node` 能用 ES module 的方式來處理 import/export，可以藉由選擇以下其中一個方法來達成：

1. 副檔名為 `.mjs`
2. 在 `package.json` 中，設定 `type` 為 `"module"`

而我們選擇方法 1，將 `node` 使用到的 ES module 檔案的副檔名設定為 `.mjs`，在有限的範圍內控制其行為

Ref: [ECMAScript modules | Node.js](https://nodejs.org/api/esm.html#enabling)

### 請勿刪除前綴為 `GTM-` 的className

如果有元件具有前綴為`GTM-` 的className，比如説：

```
<div className="GTM-some-component">
  //...
</div>
```

該className是用於Google Tag Manager 蒐集事件數據，除非為Google Tag Manager相關的改動，
否則請勿隨意刪除該className，以避免無法正確蒐集數據等錯誤發生。

該className僅用於協助Google Tag Manager蒐集數據，請勿使用該className切版。

### 在調整 element 的 className 時需注意

在調整 element 的 `className` 時，請特別留意 story、topic 頁面：
這些頁面上的部分 `className` 可能是前人刻意保留，用於 CMS 傳遞的自訂 CSS style，用來覆寫原有樣式。

請勿隨意刪除或更動，避免造成某些特定頁面樣式錯誤。

### 既有 JavaScript 使用 JSDoc 寫出與 TypeScript 中 `as const` 等效的註解

此寫法只供尚未遷移的既有 JavaScript 使用；新增或重寫的 application code 請使用 TypeScript 與 `as const`，不得新增 `.js`／`.jsx` 檔。

```
/** @type {const} */ ([something])
```

ref: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#casts

## Environment Variables (環境變數)

| 變數名稱                    | 資料型態   | 初始值                    | 變數說明                                                                                                                                                                                                                                       |
| --------------------------- | ---------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NEXT_PUBLIC_ENV             | 字串       | 'local'                   | 系統環境 (`local`, `dev`, `staging`, `prod`)                                                                                                                                                                                                   |
| NEXT_PUBLIC_IS_PREVIEW_MODE | 字串(布林) | `undefined`               | 是否為 preview mode                                                                                                                                                                                                                            |
| PROXY_AMP                   | 字串       | `undefined`               | 是否為 proxy AMP 模式                                                                                                                                                                                                                          |
| PROXY_SERVER_PORT           | 字串(整數) | `3000`                    | proxy server port                                                                                                                                                                                                                              |
| PROXIED_SERVER_PORT         | 字串(整數) | `3001`                    | 被 proxy 的 next.js server port                                                                                                                                                                                                                |
| FIREBASE_ADMIN_CREDENTIAL   | 字串(JSON) | ''                        | Firebase 專案所屬服務帳號的密鑰資訊，參考：[Initialize the SDK in non-Google environments#To generate a private key file for your service account](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments) |
| NEWEBPAY_PAPERMAG_KEY       | 字串       | `'newebpay-papermag-key'` | 藍新商店 key                                                                                                                                                                                                                                   |
| NEWEBPAY_PAPERMAG_IV        | 字串       | `'newebpay-papermag-iv'`  | 藍新商店 iv                                                                                                                                                                                                                                    |
| GOOGLE_SHEETS_PRIVATE_KEY   | 字串(JSON) | `''`                      | 呼叫 google sheet API 所使用的 service account token 資訊                                                                                                                                                                                      |
| GOOGLE_SHEETS_CLIENT_EMAIL  | 字串       | `undefined`               | 呼叫 google sheet API 所使用的 service account 名稱                                                                                                                                                                                            |
| GOOGLE_SHEETS_CLIENT_ID     | 字串       | `undefined`               | 呼叫 google sheet API 所使用的 service account ID                                                                                                                                                                                              |
| GOOGLE_SHEET_SLOT_ID        | 字串       | `undefined`               | 抽獎資訊所使用的 spreadsheet ID                                                                                                                                                                                                                |
| STORY_GQL_ENDPOINT          | 字串       | 依 `NEXT_PUBLIC_ENV` 決定 | 覆寫 story GraphQL endpoint；未設定時使用各環境預設值                                                                                                                                                                                          |
| GCS_FUSE_MOUNT_DIR          | 字串       | `/statics`                | Server-side static JSON 的 GCS FUSE mount path                                                                                                                                                                                                 |
| GCS_FUSE_STATIC_BUCKET      | 字串       | 依 `NEXT_PUBLIC_ENV` 決定 | GCS FUSE static bucket 名稱                                                                                                                                                                                                                    |

提醒：新增的環境變數若在 dev/prod 環境無法正常讀取， 須到 GCP (Google Cloud Platform) 的編輯觸發條件更新替代變數

## Environment Variables for search only (Search 限定的環境變數)

此組變數只供 repo 內的 `/api/search` SearchLite／Redis 路徑使用。目前 `/search/[keyword]` 使用 MISO client SDK，不應假設它會呼叫 `/api/search`；雲端環境也可能把同一路徑 routing（路由）到獨立 Search service，部署時需另外確認。

| 變數名稱                 | 資料型態     | 初始值      | 變數說明                        |
| ------------------------ | ------------ | ----------- | ------------------------------- |
| URL_SEARCH               | 字串         | `''`        | SearchLite API 的網址           |
| REDIS_AUTH               | 字串         | `undefined` | Redis 認證密碼                  |
| REDIS_HOST               | 字串         | `''`        | Redis 位址資訊                  |
| REDIS_DB                 | 字串（數字） | `0`         | Redis DB 資訊                   |
| REDIS_EX                 | 字串(整數)   | `3600`      | redis 資料有效期長度 (秒)       |
| REDIS_CONNECTION_TIMEOUT | 字串（整數） | `10000`     | Redis 連線 timeout 時間（毫秒） |
