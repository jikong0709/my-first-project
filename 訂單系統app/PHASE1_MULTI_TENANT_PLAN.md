# 訂單系統產品化｜Phase 1 Multi-Tenant Plan

狀態：**PLAN ONLY｜DO NOT EXECUTE IN PHASE 0**  
前置 Baseline：`ORDER_SYSTEM_DEMO_BASELINE_V1`  
Baseline commit：`ee2fbc5fa22e5313d500c128024117dd6e271893`

本文件只定義下一階段施工範圍。Phase 0 完成後停止，不直接執行本計畫。

---

# 一、Phase 1 目標

在不複製網站、不建立 V11/V12、不改 `crisp-day` Tenant Identity 的前提下，讓同一套 `訂單系統app/` Core 可以依 Tenant Data 正確呈現不同店家。

Phase 1 完成的核心驗收不是「做第二套網站」，而是：

1. Core 只有一套。
2. Tenant 解析只有一套。
3. 所有 store-owned data 仍以 `store_id` 隔離。
4. `slug` 只負責公開入口解析，不取代 `store_id` Authority。
5. `crisp-day` 回歸結果與 Baseline 一致。
6. 新 Tenant 未來只需 Provision Tenant Data，不需修改 Core。

---

# 二、施工順序

## P1-1 Tenant Resolver

先建立統一 Tenant resolution contract，再動 UI。

### 規則

- 公開顧客頁：URL `store=<slug>` → RPC → `smallshop_stores.id`。
- 店家頁：登入前以 slug 找登入目標；登入後 **session token → store_id** 為 Authority。
- 不允許前端自行以 name / brand / localStorage 推測 Tenant。
- 不允許管理 RPC 直接信任 caller 傳入 `store_id`。

### GitHub 檔案

- `訂單系統app/config.js`
- `訂單系統app/order.js`
- `訂單系統app/admin.js`

### 預計修改

- 將 `CRISP_CONFIG` 改為 generic Core config namespace。
- 移除 Core 對 `defaultStore='crisp-day'` 的產品依賴。
- URL 缺少 slug 時定義明確行為：generic landing/error 或 Demo redirect，必須由產品規格決定，不得默默假定 crisp-day。
- localStorage key 改為 Core namespace；Tenant-specific state 必須含 slug/store identity scope。

### DB / RPC

優先沿用：

- `smallshop_public_store(text)`
- `smallshop_get_menu(text)`
- `smallshop_admin_login(text,text)`
- `smallshop_admin_session_info(uuid)`
- `smallshop_require_store_session(uuid)`

除非驗收證明 contract 不足，否則不新增重複 resolver RPC。

---

# 三、Store Data Model

## 3.1 已存在欄位：直接沿用

`smallshop_stores`：

- `id`：永久 Tenant UUID，不改。
- `slug`：public identifier，不改。
- `name`
- `brand_en`
- `phone`
- `address`
- `active`
- `business_open`
- `cash_enabled`
- `linepay_enabled`
- `linepay_live`

`smallshop_menu`：

- `store_id`
- `name`
- `price`
- `category`
- `active`
- `sort_order`

## 3.2 Phase 1 需要 migration 才能正式加入的欄位／資料結構

Phase 1 migration 應保持 additive，禁止重建現有 tables。

### 建議 Tenant branding 欄位

可採「`smallshop_store_branding` 1:1 table」或經審核後加入 `smallshop_stores`；優先建獨立 table，降低核心身份欄位 churn。

建議欄位：

- `store_id uuid primary key references smallshop_stores(id)`
- `logo_url text null`
- `icon_url text null`
- `theme_key text not null default 'default'`
- `brand_color text null`
- `accent_color text null`
- `background_color text null`
- `updated_at timestamptz`

顏色欄位若採自由 hex 必須 DB / RPC 驗證格式；若採固定 Theme Catalog，優先只保存 `theme_key`，避免 store 任意 CSS。

### Default Template Authority

Default Template 不得使用 `crisp-day` row。

建議新增：

`smallshop_templates`

- `id uuid`
- `template_key text unique`
- `name text`
- `is_default boolean`
- `store_defaults jsonb`
- `branding_defaults jsonb`
- `menu_seed jsonb` 或另建 normalized template menu table
- `version integer`
- `active boolean`
- `created_at / updated_at`

若 Phase 1 只需完成 multi-tenant runtime，也可先只建立 `default-v1` 的 store/branding defaults，菜單 seed 延到 provisioning phase；不得直接 copy crisp-day 菜單。

### Migration 原則

- 新 migration 僅 additive。
- 不修改 crisp-day `id` / `slug`。
- 不回填脆日品牌值成為 global default。
- 不刪除現有欄位。
- 不修改既有訂單 ownership。
- migration 必須可在 transaction 中 rollback；若含 data backfill，backfill 必須可重跑且有 deterministic WHERE。

---

# 四、RPC 計畫

## 4.1 優先保留、不重寫

Phase 1 應優先保留既有正式 RPC 名稱及 caller contract：

- `smallshop_admin_change_passcode`
- `smallshop_admin_login`
- `smallshop_admin_logout`
- `smallshop_admin_menu`
- `smallshop_admin_menu_save`
- `smallshop_admin_orders`
- `smallshop_admin_session_info`
- `smallshop_admin_store_save`
- `smallshop_admin_update`
- `smallshop_create_order`
- `smallshop_get_menu`
- `smallshop_ledger`
- `smallshop_public_order_status`
- `smallshop_public_store`

## 4.2 可能需要 additive extension

只有在 Tenant branding / template 欄位落地後新增：

- `smallshop_public_store(text)`：回傳 branding/theme read model；優先擴充 JSON result，不改 caller 必填參數。
- `smallshop_admin_session_info(uuid)`：回傳 store + branding management read model。
- `smallshop_admin_store_save(...)`：**不要直接塞大量 Theme 參數破壞既有 signature**；建議新增獨立 `smallshop_admin_branding_save(...)`。
- Provisioning：若未來需要正式建店，建立受限 internal/admin RPC，例如 `smallshop_provision_store_from_template(...)`；不得開 anon execute。

## 4.3 不可重新開放

- legacy PIN overloads
- no-slug `smallshop_get_menu()`
- public `smallshop_admin_setup`，除非 Provisioning / one-time setup 安全規格另案驗收

---

# 五、前端檔案施工清單

## `config.js`

- 改 generic Core config namespace。
- 移除 Demo brand appName 作為 Core identity。
- 移除 `crisp-day` implicit default dependency。
- Core version / Supabase endpoint 保留。

## `order.html`

- 將脆日 initial DOM 內容改 generic loading placeholders。
- `<title>` / header / contact 由 resolved Tenant Data 套入。
- Theme metadata 是否 runtime 更新需配合 PWA strategy。

## `order.js`

- 統一 Tenant resolver。
- store-scoped history key。
- 所有 fallback 改 generic，不再 fallback 到脆日。
- 仍以 `smallshop_get_menu(p_store_slug)` / `smallshop_create_order(p_store_slug...)` 走 server-side store resolution。

## `index.html`

- 初始品牌內容改 generic placeholders。
- login slug 不固定 crisp-day。
- QR `<img>` 不再固定 Demo asset（待 QR strategy）。
- 不改功能 tab / 操作流程。

## `admin.js`

- Core session storage namespace。
- store-scoped session persistence，避免多 Tenant session key collision。
- print fallback 改 resolved Tenant Data / generic fallback。
- QR URL 仍以 `store.slug` 生成。

## `admin-enhancements.js`

- 去除 Demo fallback。
- install help 保持 generic。

## `admin-ledger-enhancements.js`

- 原則上不需 Multi-tenant 邏輯重構；確認所有資料都來自 session-scoped ledger RPC。

## `app.css`

- 不重寫 CSS。
- 將品牌 token 抽象為 CSS custom properties contract。
- Default Theme 保留產品 generic defaults。
- 不把 crisp-day palette 當 global Authority。

## `enhancements.css`

- 移除可由 CSS variables 取代的品牌 literal。
- 不改元件 layout / interaction。

## `manifest.webmanifest`

先決定 PWA strategy 後再修改；禁止建立 `manifest-crisp-day.webmanifest`、`manifest-store2.webmanifest` 這種 per-store Core copy。

## `sw.js`

- generic cache namespace。
- 不 precache 特定 `?store=crisp-day`。
- Tenant-specific runtime pages 使用 runtime cache strategy。
- 不讓 A 店 cache 汙染 B 店資料畫面。

## `offline.html`

- generic offline shell 或安全讀取已解析 Tenant branding；不得寫死脆日。

## icons

- `icon.svg` / PNG assets：若產品採 generic Core PWA，改為 Core generic icon。
- 若採 Tenant PWA，icon 由正式 dynamic manifest/icon strategy 解決，不建立每店 Core 資料夾。

## `customer-qr.svg`

- Phase 1 決定替代策略後停止作為 shared fixed QR。
- Demo asset 可保留作 Baseline reference，但 runtime 不得假定它適用所有 Tenant。

---

# 六、PWA Strategy Decision Gate

GitHub Pages 是 static hosting，Tenant-specific manifest 不能靠複製檔案解決。

Phase 1 開工前必須二選一：

## Option A｜Generic Product PWA

- manifest name / icon / identity 為訂單系統產品本身。
- 安裝後由 URL / session 解析目前 Tenant。
- 優點：最符合「Core 一套」。
- 缺點：App 安裝名稱不是每店品牌。

## Option B｜Dynamic Tenant PWA

- manifest / icons 由 dynamic endpoint 依 slug 產生。
- endpoint 可在 Cloudflare / Supabase Edge /其他正式 runtime。
- GitHub Pages Core 仍一套。
- 需驗證 browser 對 dynamic manifest、start_url、scope、icon caching 的行為。

**禁止 Option C：每家店複製 manifest / icon / app 資料夾。**

---

# 七、QR Strategy

Phase 1 QR contract：

`QR payload = canonical customer URL + immutable slug`

例如：

`.../order.html?store=<slug>`

要求：

- name 改名不換 QR。
- logo/theme 改動不換 QR target。
- slug 原則不可修改。
- QR 生成可在 client-side 或受控 backend 完成。
- 不再使用單一 fixed `customer-qr.svg` 代表所有 Tenant。
- 不能把 QR 圖 binary 當 Tenant Identity Authority；真正 Authority 是 slug → store_id resolution。

---

# 八、測試矩陣

Phase 1 不可只測 crisp-day UI。至少要有隔離 fixture；是否正式建立第二 Tenant 必須在 Phase 1 開工時另行授權，Phase 0 不建立。

## 8.1 crisp-day regression

- 顧客頁正常載入 25 項 Demo 菜單。
- 內用／外帶。
- 購物車。
- 結帳。
- 建立訂單。
- 取餐號碼。
- public token 查單。
- 我的訂單。
- 店家登入。
- 即時訂單。
- 狀態更新。
- 收款。
- 菜單管理。
- 流水帳。
- CSV。
- 列印。
- QR URL。
- PWA install/offline shell。

## 8.2 Tenant isolation

測試 fixture 必須證明：

- A 店 session 無法讀 B 店 orders。
- A 店 session 無法改 B 店 order id。
- A 店 session 無法讀／改 B 店 menu。
- A 店 menu id 不能被 B 店 checkout 使用。
- `p_store_slug=A` + B 店 public order token 無法查單。
- 不同 Tenant 的 localStorage/session key 不碰撞。
- service worker/cache 不把 A 店 branded shell 錯給 B 店。

## 8.3 Identity immutability

- `smallshop_stores.id` UPDATE → reject。
- `slug` UPDATE → reject。
- menu/order/session `store_id` reassignment → reject。
- name UPDATE → allowed，QR target 不變。

## 8.4 Theme / branding

- 缺 branding row → Default Template / generic fallback。
- branding row 不可改變 store identity。
- 非法 color/theme value → DB/RPC reject 或安全 fallback。

---

# 九、Rollback Plan

## 9.1 GitHub rollback

Baseline Authority：

`ORDER_SYSTEM_DEMO_BASELINE_V1` → commit `ee2fbc5fa22e5313d500c128024117dd6e271893`

Phase 1 每個施工單元使用小 commit；不得一次混合 resolver + DB + PWA + QR 大重構。

Rollback 優先：

1. revert Phase 1 frontend commits；
2. GitHub Pages 重新部署；
3. 驗證 crisp-day URL 回到 Baseline 行為。

不要透過複製 Baseline 資料夾 rollback。

## 9.2 Supabase rollback

- 每個 migration 必須 additive。
- Phase 1 新欄位／新 table 初期不得成為 crisp-day 舊流程的 NOT NULL blocking dependency。
- 先 deploy schema → 相容 RPC → frontend；rollback frontend 時舊 RPC contract 仍可用。
- 若需回退 DB，使用新的 rollback migration；不要直接手改 production schema migration history。
- 絕不 rollback / 改寫 `store_id`、slug、既有 orders ownership。

## 9.3 Data rollback

- Default Template seed 與 branding seed 必須有明確 `template_key` / `store_id` target。
- 不執行「全表 UPDATE」式品牌 backfill。
- crisp-day 現有 25 菜單不作 Phase 1 migration seed source。

---

# 十、Phase 1 完成條件

必須全部 PASS：

- [ ] Core 仍只有 `訂單系統app/` 一套。
- [ ] Core runtime 無 implicit `crisp-day` default。
- [ ] Demo branding 不再作 generic fallback。
- [ ] Tenant-owned data 全以 `store_id` 隔離。
- [ ] slug 只作 public resolver。
- [ ] Default Template 與 Demo Tenant 分離。
- [ ] Theme / Logo 有正式 Tenant Data Authority。
- [ ] QR 不再是 shared fixed Demo asset。
- [ ] PWA strategy 不靠複製 per-store files。
- [ ] crisp-day regression 全 PASS。
- [ ] cross-tenant negative tests 全 PASS。
- [ ] rollback 已演練。

完成以上條件後，才可進入正式 Production Tenant provisioning；不得在 Phase 1 前半段先建立客戶店家繞過驗收。
