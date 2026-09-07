# 訂單系統產品基準｜ORDER_SYSTEM_DEMO_BASELINE_V1

狀態：**PHASE_0_BASELINE_SEALED_BY_COMMIT**  
生效日期：2026-09-07（Asia/Taipei）

## 0. Baseline Identity

- Baseline 名稱：`ORDER_SYSTEM_DEMO_BASELINE_V1`
- Baseline GitHub commit：`ee2fbc5fa22e5313d500c128024117dd6e271893`
- Baseline Authority：**上述不可變 Git commit 即為 DEMO Baseline 的正式回復／比對 Authority。**
- GitHub repository：`jikong0709/my-first-project`
- 唯一正式目錄：`訂單系統app/`
- 正式分支：`main`
- Supabase project：`uuefhkqtslcdkdgeyiof`
- Baseline tag 名稱：`ORDER_SYSTEM_DEMO_BASELINE_V1`
- Git tag 狀態：`PENDING_TOOL_CAPABILITY`
- 目前工具環境沒有正式 Git tag ref 寫入能力，因此**不得再嘗試建立、模擬或以 branch 取代 tag**。
- 未來具備正式 Git tag 寫入能力時，`ORDER_SYSTEM_DEMO_BASELINE_V1` **只能指向** `ee2fbc5fa22e5313d500c128024117dd6e271893`。
- 不得將該 tag 指向當時最新 `main`、本文件後續 commit、Phase 1 commit 或任何其他 SHA。
- Git tag pending **不阻塞 Phase 1**；Phase 1 的回復／比對基準永遠使用上述 Baseline commit。

> 本 Baseline 固定「目前可運作的脆日炸雞 DEMO」，不是產品核心品牌定義。不得以複製本 Baseline 網站或資料夾方式建立新店家。

---

# 一、DEMO Tenant 基準

## 1.1 Tenant Identity

| 欄位 | Baseline 值 | Authority |
| --- | --- | --- |
| `store_id` / `smallshop_stores.id` | `e00ec1b3-8157-442d-a50e-034a0c3ac294` | 永久 UUID／資料隔離 Authority／不可修改 |
| `slug` | `crisp-day` | 公開網址識別／unique／建立後原則不可修改／QR 使用 |
| `name` | `脆日炸雞` | Tenant Data，可修改，不影響 `store_id` 與 QR |
| `brand_en` | `CRISP DAY` | Tenant Data |
| phone | `0900-000-000` | Tenant Data |
| address | `台中市南區忠孝路・忠孝夜市` | Tenant Data |
| active | `true` | Tenant Data |
| business_open | `true` | Tenant Data |
| cash_enabled | `true` | Tenant Data |
| linepay_enabled | `true` | Tenant Data |
| linepay_live | `false` | Tenant Data／目前尚未正式串接 LINE Pay |

Phase 0 已存在 DB guardrail：

- `smallshop_stores.id` 不可直接 UPDATE。
- `smallshop_stores.slug` 不可直接 UPDATE。
- `smallshop_menu.store_id` 不可改掛 Tenant。
- `smallshop_orders.store_id` 不可改掛 Tenant。
- `smallshop_store_sessions.store_id` 不可改掛 Tenant。

對應 migration：`20260907081137_smallshop_productization_phase0_tenant_identity_guard`。

## 1.2 菜單基準

Baseline 菜單總數：**25**；Baseline 時全部為 active。

| 分類 | 數量 |
| --- | ---: |
| 夜市人氣 | 6 |
| 招牌炸雞 | 5 |
| 經典鹹酥 | 6 |
| 蔬菜炸物 | 4 |
| 薯物點心 | 4 |
| **合計** | **25** |

Baseline 建立時既有訂單資料：**12 筆**。訂單資料不是 Template，不得複製到新 Tenant。

---

# 二、Supabase Schema Baseline

截至 Baseline，訂單系統主要資料表：

## `smallshop_stores`

`id uuid`, `slug text`, `name text`, `brand_en text`, `phone text`, `address text`, `active boolean`, `business_open boolean`, `cash_enabled boolean`, `linepay_enabled boolean`, `linepay_live boolean`, `admin_secret_hash text`, `created_at timestamptz`, `updated_at timestamptz`, `setup_token uuid`。

## `smallshop_menu`

`id bigint`, `name text`, `price integer`, `category text`, `active boolean`, `sort_order integer`, `created_at timestamptz`, `store_id uuid`, `updated_at timestamptz`。

## `smallshop_orders`

`id bigint`, `order_no text`, `dining_type text`, `payment_method text`, `payment_status text`, `status text`, `items jsonb`, `total integer`, `note text`, `table_no text`, `created_at timestamptz`, `updated_at timestamptz`, `store_id uuid`, `public_token uuid`, `customer_name text`, `customer_phone text`。

## Session / Login tables

- `smallshop_store_sessions`
- `smallshop_store_login_attempts`
- `smallshop_admin_sessions`（legacy/global admin compatibility）
- `smallshop_admin_login_attempts`（legacy/global admin compatibility）

Smallshop tables 的 RLS 保持啟用。正式前端不直接操作資料表，透過明確 RPC 存取。

---

# 三、RPC Baseline

## 3.1 正式前端目前使用／可公開執行 RPC

- `smallshop_admin_change_passcode(uuid,text,text)`
- `smallshop_admin_login(text,text)`
- `smallshop_admin_logout(uuid)`
- `smallshop_admin_menu(uuid)`
- `smallshop_admin_menu_save(uuid,bigint,text,integer,text,boolean,integer)`
- `smallshop_admin_orders(uuid)`
- `smallshop_admin_session_info(uuid)`
- `smallshop_admin_store_save(uuid,text,text,text,text,boolean,boolean,boolean)`
- `smallshop_admin_update(uuid,bigint,text)`
- `smallshop_create_order(text,jsonb,text,text,text,text,text,text)`
- `smallshop_get_menu(text)`
- `smallshop_ledger(uuid,date,date)`
- `smallshop_public_order_status(text,text,uuid)`
- `smallshop_public_store(text)`

以上目前採 `SECURITY DEFINER` + publishable key + app-issued session/public token contract；Phase 0 不改其操作流程。

## 3.2 Internal / 已撤銷 public execute

- `smallshop_require_store_session(uuid)`
- `smallshop_enforce_tenant_identity_immutability()`
- `smallshop_admin_setup(text,uuid,text)`
- legacy `smallshop_admin_orders(text)`
- legacy `smallshop_admin_update(text,bigint,text)`
- legacy `smallshop_get_menu()`
- legacy `smallshop_ledger(text,date,date)`

不得因產品化而重新開放 legacy PIN／無 slug RPC。

---

# 四、功能 Baseline

## 4.1 顧客點餐

Core baseline 已具備：

- 依 `slug` 讀取店家與菜單
- 分類菜單
- 購物車增減／刪除
- 結帳
- 姓名、手機驗證
- 內用／外帶
- 內用桌號驗證
- 現金／LINE Pay 選擇
- 訂單備註
- 後端依 menu id 重算價格
- 建立訂單
- 取餐號碼
- 訂單 `public_token`
- 狀態追蹤
- 我的訂單（本機只保存查詢 reference）
- 5 秒狀態更新輪詢

## 4.2 店家管理

Core baseline 已具備：

- 店家 slug + 管理密碼登入
- 可撤銷、具期限的店家 session token
- 今日訂單
- 即時接單輪詢
- 確認收款
- 開始製作
- 完成
- 取消
- 72mm 瀏覽器列印
- 菜單新增／修改
- 價格／分類／排序／上下架
- 店名、英文名、電話、地址設定
- 營業開關
- 現金／LINE Pay 開關
- 管理密碼變更
- 登出
- 顧客點餐網址顯示／複製

## 4.3 流水帳

- 今日／本月／自訂日期範圍
- 營業額
- 訂單數
- 現金／LINE Pay
- 未收款
- 每日摘要
- 商品銷售排行
- 訂單流水
- CSV 匯出

## 4.4 PWA Baseline

- `manifest.webmanifest`
- `sw.js`
- `offline.html`
- `icon.svg`
- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`
- 安裝提示／iOS、Android 操作說明
- GitHub Pages HTTPS

目前 PWA metadata、icons、cache namespace 仍含 crisp-day / CRISP DAY Demo 耦合；Phase 0 只記錄，不改機制。

## 4.5 QR Baseline

- 正式顧客 URL：`https://jikong0709.github.io/my-first-project/order-app/order.html?store=crisp-day`
- 店家管理頁 runtime 會依目前 store slug 顯示顧客網址。
- 實際顯示／下載 QR 圖仍為固定靜態資產 `customer-qr.svg`。

Phase 0 不改 QR 機制、不改正式網址。

---

# 五、產品架構 Authority

## 5.1 Core

訂單系統核心程式只有一套，固定在 `訂單系統app/`。

Core 固定包括：

- 顧客點餐
- 購物車
- 結帳
- 我的訂單
- 取餐號碼
- 狀態追蹤
- 店家接單
- 菜單管理功能
- 流水帳
- 列印
- QR 邏輯
- PWA
- 登入
- 權限
- Supabase RPC

不得為新店家複製 HTML、JS、CSS、PWA 或 Supabase RPC。

## 5.2 Default Template

Default Template 是未來「建立新 Tenant 時的基本設定來源」。

- Default Template **不等於 `crisp-day`**。
- 不得把脆日炸雞的名稱、菜單、Theme、QR、icon 或品牌內容當成 Default Template。
- Default Template 應保存產品預設值，不保存 Demo 訂單或 Demo credentials。
- Default Template 的正式 DB 表／欄位於 Phase 1 才以 migration 建立或定案。

## 5.3 Demo Tenant

`crisp-day = 脆日炸雞 CRISP DAY`。

用途只有：

- Demo
- regression
- 多 Tenant 驗收基準
- 產品展示

它不是產品 Core，也不是 Default Template。

## 5.4 Production Tenant

未來正式店家：

- 全部使用同一套 Core。
- 只建立新的 `smallshop_stores` Tenant Identity 與其 Tenant Data。
- 所有店家資料以 `store_id` 隔離。
- 不建立網站副本。
- 不新增 V11/V12 等版本資料夾。

---

# 六、店家識別 Authority

## `store_id`

- 系統內永久 UUID。
- 資料隔離 Authority。
- 由 `smallshop_stores.id` 提供。
- 建立後不可修改。
- Menu / Orders / Sessions 等 Tenant-owned rows 一律以 `store_id` 關聯。

## `slug`

- 公開網址識別。
- unique。
- 建立後原則上不可修改。
- QR Code 及公開點餐 URL 使用。
- `slug` 不是資料隔離 Authority；真正 Authority 仍是 `store_id`。

## `name`

- 店家顯示名稱。
- 可隨時修改。
- 不影響 `store_id`。
- 不影響 QR target；QR 依 slug。

---

# 七、Tenant Data Authority

Tenant Data 包括：

- 店名 `name`
- 英文名稱 `brand_en`
- Logo（目前 schema 尚缺正式欄位）
- 電話 `phone`
- 地址 `address`
- 菜單 `smallshop_menu`
- 分類 `smallshop_menu.category`
- 價格 `smallshop_menu.price`
- 營業狀態 `business_open` / `active`
- 付款方式 `cash_enabled` / `linepay_enabled` / `linepay_live`
- 品牌色（目前 schema 尚缺正式欄位）
- Theme（目前 schema 尚缺正式欄位）
- QR 對應 slug

---

# 八、Phase 0 技術債盤點

盤點範圍：`訂單系統app/` 正式 runtime code / static assets；文件中的歷史描述不計入。

**共識別 48 個可獨立施工的單店家硬編碼點，分布於 13 組 runtime 檔案／資產。**「48」是按獨立改造位置計算，不是單純 grep 字串總次數。

| # | 位置 | 硬編碼 | 分類 |
| ---: | --- | --- | --- |
| 1 | `config.js` | `CRISP_CONFIG` 品牌化 global namespace | A |
| 2 | `config.js` | `defaultStore: crisp-day` | A |
| 3 | `config.js` | `appName: 脆日炸雞` | A |
| 4 | `index.html` | `theme-color #F5C842` | B |
| 5 | `index.html` | apple web app title `脆日店家` | C |
| 6 | `index.html` | document title `脆日炸雞` | A |
| 7 | `index.html` | `CRISP DAY · STORE` | A |
| 8 | `index.html` | initial H1 `脆日炸雞` | A |
| 9 | `index.html` | `忠孝夜市 · 店家管理` | A |
| 10 | `index.html` | customer link `?store=crisp-day` | A |
| 11 | `index.html` | login slug default `crisp-day` | A |
| 12 | `index.html` | QR 固定 `customer-qr.svg` | C |
| 13 | `index.html` | QR alt 固定脆日品牌 | A |
| 14 | `index.html` | QR download filename 固定脆日品牌 | A |
| 15 | `index.html` | inline QR 區塊固定品牌 palette | B |
| 16 | `order.html` | `theme-color #F5C842` | B |
| 17 | `order.html` | document title `脆日炸雞` | A |
| 18 | `order.html` | initial `CRISP DAY` | A |
| 19 | `order.html` | initial `脆日炸雞` | A |
| 20 | `order.html` | `現點現炸 · 忠孝夜市` | A |
| 21 | `order.html` | Demo 地址 `忠孝夜市` | A |
| 22 | `order.js` | localStorage key `crispday.customer...` | A |
| 23 | `order.js` | 店名 fallback `脆日炸雞` | A |
| 24 | `order.js` | 英文名 fallback `CRISP DAY` | A |
| 25 | `order.js` | 地址 fallback `忠孝夜市` | A |
| 26 | `admin.js` | session localStorage key `crispday...` | A |
| 27 | `admin.js` | applyStore 店名 fallback | A |
| 28 | `admin.js` | applyStore 地址 fallback | A |
| 29 | `admin.js` | printReceipt 店名 fallback | A |
| 30 | `admin.js` | printReceipt 地址 fallback | A |
| 31 | `admin-enhancements.js` | printReceipt 店名 fallback | A |
| 32 | `admin-enhancements.js` | printReceipt 地址 fallback | A |
| 33 | `manifest.webmanifest` | manifest `id` 固定 `crisp-day` | C |
| 34 | `manifest.webmanifest` | name / short_name / description 固定 Demo 品牌 | C |
| 35 | `manifest.webmanifest` | `start_url` 固定 `crisp-day` | C |
| 36 | `manifest.webmanifest` | shortcuts 固定 `crisp-day` | C |
| 37 | `manifest.webmanifest` | background/theme color 固定脆日 palette | C |
| 38 | `sw.js` | cache namespace `crispday-store-*` | C |
| 39 | `sw.js` | precache `./?store=crisp-day` | C |
| 40 | `sw.js` | precache 固定 `customer-qr.svg` | C |
| 41 | `offline.html` | title 固定 `脆日炸雞` | C |
| 42 | `offline.html` | 固定脆日 palette | C |
| 43 | `icon.svg` | `CRISP` logo / palette | C |
| 44 | PNG icon assets | 固定 Demo icon 衍生圖 | C |
| 45 | `customer-qr.svg` | 固定 Demo QR static asset | C |
| 46 | `app.css` | `:root` 固定品牌色 token | B |
| 47 | `app.css` | 多處額外固定品牌色 literal | B |
| 48 | `enhancements.css` | 多處固定品牌色 literal | B |

## A. 可直接資料化

已有 DB 欄位或可改為 Core generic namespace / runtime store data：店名、英文名、電話、地址、slug URL、菜單、分類、價格、營業狀態、付款方式、HTML fallback、localStorage namespace。

## B. 需要 schema migration

目前 DB 沒有正式 Tenant branding/template 欄位，因此以下不可只在前端自行發明：

- Logo / icon reference
- 品牌主色
- Theme / theme token
- Default Template Authority

Phase 0 不新增上述 schema。

## C. 需要 PWA／QR 架構調整

- manifest identity / name / start_url / shortcuts
- apple mobile web app metadata
- service worker cache namespace / precache
- Tenant-specific icon
- offline branding
- 固定 `customer-qr.svg`
- QR 產生與下載策略

GitHub Pages 為 static hosting；Phase 1 必須先決定「產品共用 generic PWA」或「動態 Tenant manifest endpoint」，不可為每家店複製一份 manifest。

## D. 不應修改

Phase 0 / Phase 1 不應因產品化而改動：

- `crisp-day` 現有 `store_id`
- `crisp-day` 現有 slug
- 現有 25 項 Demo 菜單內容
- 現有正式網址 contract
- 既有訂單 ownership
- `public_token` 查單 contract
- store session → `store_id` 隔離 contract
- 已撤銷的 legacy RPC 不重新開放

---

# 九、已知未完成項目

- LINE Pay：`linepay_live=false`，仍為測試／人工確認模式，尚未完成正式商戶 API / callback。
- 列印：目前為瀏覽器 72mm 列印，不是 silent printer bridge。
- 即時接單：目前 5 秒輪詢，尚未改 Supabase Realtime / push。
- Theme：仍是 shared CSS 固定 palette，尚未 Tenant Data 化。
- Logo / icon：仍是 crisp-day Demo icon，schema 尚無 Tenant logo authority。
- QR：管理頁顯示 URL 可依 slug，但 QR 圖仍是固定 static asset。
- PWA：manifest / cache / icon / metadata 仍是 crisp-day Demo 專用。
- Default Template：產品 Authority 已定義，但正式 schema / seed contract 尚未建立。
- 首次設定：`smallshop_admin_setup` 目前 public execute 已撤銷，正式 Provisioning 流程需在後續產品化另行設計，不在 Phase 0 重啟。

---

# 十、Phase 0 Freeze Rule

完成本文件後：

- 不建立第二家店。
- 不改 Theme schema。
- 不重寫 CSS。
- 不改 QR 機制。
- 不重寫 PWA。
- 不執行大規模 migration。
- 不修改 crisp-day 現有菜單。
- 不改正式網址。
- 不複製網站。
- 不建立新版資料夾。

Phase 0 正式狀態：`PHASE_0_BASELINE_SEALED_BY_COMMIT`。

下一步僅依 `PHASE1_MULTI_TENANT_PLAN.md` 進入 Phase 1；Git tag `PENDING_TOOL_CAPABILITY` 不阻塞 Phase 1。Phase 0 不自動開始 Phase 1。
