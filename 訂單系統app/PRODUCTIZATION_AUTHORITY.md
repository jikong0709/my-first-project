# 訂單系統產品化 Authority

狀態：**FORMAL｜Phase 0 Baseline**  
生效日期：2026-09-07（Asia/Taipei）

## 1. 正式 Authority

- GitHub：`jikong0709/my-first-project`
- 正式分支：`main`
- 唯一正式目錄：`訂單系統app/`
- Supabase：既有正式專案 `uuefhkqtslcdkdgeyiof`
- 正式部署：GitHub Pages `/order-app/`
- 本文件、正式 GitHub 現況、Supabase schema / migration 為訂單系統產品化判定依據；不得依聊天記憶覆蓋正式狀態。

Phase 0 開工 GitHub baseline：`2a32ecb674ecd7fceecd8f74ef1a41b2646fc014`。

## 2. 不可違反的產品化規則

1. 不建立 V11、V12 或其他新版網站資料夾。
2. 不複製網站來建立新店家。
3. Core 程式只能有一套，固定在 `訂單系統app/`。
4. `crisp-day`／脆日炸雞是 **Demo Tenant**，不是產品核心。
5. `smallshop_stores.id` / `store_id` 是永久 Tenant Identity / Data Isolation Authority。
6. `slug` 是公開網址識別；建立後不可由一般應用流程修改。若未來確有例外，只能以明確 migration 處理。
7. 新店家只新增 Tenant Data；不得為新增店家修改或複製 Core。
8. 所有資料庫結構變更一律使用 Supabase migration。
9. 修改前先核對本文件、正式 GitHub 與正式 Supabase 現況。
10. Demo Tenant 的名稱、品牌、Theme、QR、PWA metadata、菜單與店家設定，最終都必須與 Core 解耦並資料化。

## 3. Phase 0 已確認的正式現況

### Core / Deployment

- 正式網站目前已是單一 `訂單系統app/`，未建立產品化複本。
- GitHub Pages workflow 會把 `訂單系統app/` 發佈到 `/order-app/`。
- 顧客端與店家端都使用同一套 Supabase RPC。

### Tenant / Data Isolation

目前正式資料庫已有：

- `smallshop_stores`
- `smallshop_menu.store_id`
- `smallshop_orders.store_id`
- `smallshop_store_sessions.store_id`

使用中的店家管理 RPC 以 session 解析 `store_id`；公開點餐 RPC 以 `slug` 找到店家後，以 `store_id` 限定資料。

Phase 0 migration：`20260907081137_smallshop_productization_phase0_tenant_identity_guard`

此 migration 已建立 DB guardrail：

- `smallshop_stores.id` 不可直接變更。
- `smallshop_stores.slug` 不可直接變更。
- `smallshop_menu.store_id` 不可改掛 Tenant。
- `smallshop_orders.store_id` 不可改掛 Tenant。
- `smallshop_store_sessions.store_id` 不可改掛 Tenant。

### Demo Tenant

目前正式資料庫的既有 Demo Tenant：

- slug：`crisp-day`
- display name：`脆日炸雞`
- brand：`CRISP DAY`

Demo Tenant 保留作為產品化回歸驗收基準，不可被解讀為 Core default brand。

## 4. Phase 0 發現的 Core / Demo 耦合

以下是產品化待拆項，不代表新的正式資料模型已定案：

| 區域 | 現況 | Phase 0 判定 |
| --- | --- | --- |
| `config.js` | `defaultStore='crisp-day'`、`appName='脆日炸雞'` | Demo 值仍滲入 Core |
| `index.html` | 預設品牌、店址、登入 slug、QR 文案仍是脆日 | 應改為 runtime Tenant Data |
| `order.js` | fallback 品牌與 localStorage key 帶 `crispday` | 應改為 tenant-safe key / generic fallback |
| `admin.js` / enhancements | fallback 品牌與 storage key 帶 `crispday` | 應改為 Core namespace + tenant scope |
| `manifest.webmanifest` | PWA name/start_url/shortcut 固定 `crisp-day` | 必須 tenant-aware / productized |
| `customer-qr.svg` | 固定 Demo QR 靜態資產 | QR 必須由 Tenant URL 產生 |
| Theme | 黃色與 CRISP DAY 視覺寫在共享 UI | Theme 應由 Tenant Data / Default Template 決定 |

Phase 0 **不直接拔除上述 fallback**，避免在 Tenant resolver、Default Template、PWA/QR 策略尚未落地前破壞目前 Demo 正式站。

## 5. Phase 0 安全邊界

- Smallshop tables 的 RLS 已啟用，且無 direct table policy；目前採 RPC-only access。
- 舊 PIN / 無 slug RPC 仍可能存在於 DB 作歷史相容，但 public execute 已撤銷；不得重新開放。
- 現行 RPC 使用 `SECURITY DEFINER` 是目前 publishable-key + app-issued session token 架構的一部分；後續變更必須先做跨 Tenant 越權測試，不得只因 advisor 警告就直接改成 invoker 或撤銷正式 RPC。
- `smallshop_admin_setup` 目前不是公開可執行 RPC；首次設定流程若重新啟用，必須另行做正式授權與一次性 token 驗收。

## 6. Phase 0 完成標準

Phase 0 視為完成，必須同時成立：

- [x] 正式 GitHub HEAD / 目錄 / deployment workflow 已盤點。
- [x] 正式 Supabase project / migrations / schema / RPC 已盤點。
- [x] `crisp-day` 被正式定義為 Demo Tenant，而非 Core。
- [x] `store_id` / Tenant identity 的 DB immutable guardrail 已建立。
- [x] `slug` immutable guardrail 已建立。
- [x] Core 中所有已知 Demo hardcode 已列入產品化拆分清單。
- [x] 未建立新版資料夾、未複製網站、未新增第二套 Core。

下一階段應以 **Tenant Resolver + Default Template + Store Data Model + Theme/QR/PWA 資料化** 為主，不以複製 `crisp-day` 方式建立第二店。
