# Tenant Operations｜新客戶建立與既有客戶維護 SOP

狀態：**FORMAL｜Operations SOP**  
生效日期：2026-09-13（Asia/Taipei）

> 本文件是日常接新客戶、修改既有客戶時的標準操作流程。  
> 最高產品化規則仍以 `PRODUCTIZATION_AUTHORITY.md` 為準；若兩者衝突，以 `PRODUCTIZATION_AUTHORITY.md` 為最高 Authority。

---

## 1. 正式 Authority

- GitHub：`jikong0709/my-first-project`
- 正式分支：`main`
- 唯一正式目錄：`訂單系統app/`
- Supabase：既有正式專案 `uuefhkqtslcdkdgeyiof`
- 正式部署：GitHub Pages `/order-app/`
- Tenant Identity / Data Isolation Authority：`smallshop_stores.id` / `store_id`
- `slug`：公開網址識別，建立後不可由一般應用流程修改
- Core：只能有一套，固定在 `訂單系統app/`

任何新店家或既有店家維護，開始前都必須先核對：

1. `PRODUCTIZATION_AUTHORITY.md`
2. 正式 GitHub `main` 最新 HEAD
3. 正式 Supabase 目前 schema / migration / RPC / Tenant Data

不得以聊天記憶覆蓋正式狀態。

---

## 2. 任務分類

日常 Tenant 作業分成三類：

### A. NEW TENANT｜新客戶建立

適用於：

- 新客戶 Demo
- 新客戶正式上線
- 新品牌 / 新店家需要獨立資料隔離

原則：建立新的 Tenant 與新的 `store_id`，不得複製網站或建立第二套 Core。

### B. UPDATE TENANT｜既有客戶修改

適用於：

- 換菜單
- 改價格
- 新增 / 下架商品
- 改分類 / 排序
- 換配色 / Theme
- 改店名 / 品牌文字
- 更新電話 / 地址
- 增加或更換 Logo

原則：沿用原本 `store_id` 與 `slug`，只修改該 Tenant 的資料；既有訂單必須保留。

### C. CORE FEATURE REQUEST｜產品功能缺口

例如：

- 商品 Modifier / 客製選項
- 尺寸加價
- 套餐組合
- 甜度 / 冰量
- POS
- 廚房列印
- 會員
- 金流
- 發票
- 外送
- 其他目前 Core / schema 無法安全支援的能力

此類不得為單一店家 hardcode。必須先停止 Tenant 維護作業，回報功能缺口，再由產品化流程另外評估共用 Core 功能。

---

## 3. 可接受的輸入資料

新客戶與既有客戶都可直接提供：

- 菜單照片
- 多張菜單照片
- Logo 圖片
- PDF
- Excel / CSV
- 純文字菜單
- 品牌色 / 色碼
- 參考風格圖片
- 店家基本資料

### 圖片 / 文件處理規則

1. 先整理出可確認資料：分類、商品名稱、價格、排序、加價文字、店家文字、Logo / 品牌資訊。
2. 看不清楚、不確定、互相矛盾的內容必須標記「待確認」。
3. 不得自行猜測價格、電話、地址、營業時間、付款方式或其他營業資訊。
4. 若只是視覺參考，不得把參考圖中的文字 / 商品誤當成正式 Tenant Data。
5. 若照片顯示目前 Core 不支援的功能，依 `CORE FEATURE REQUEST` 規則處理。

---

## 4. NEW TENANT｜新客戶標準流程

### 4.1 必要輸入

至少取得：

- 店名
- 用途：`DEMO` 或正式店家
- 預計 `slug`
- 菜單來源

選填：

- 電話
- 地址
- Logo
- 品牌配色 / Theme 方向
- 付款方式
- 其他現有 Core 已支援設定

沒有資料就保持未設定，不得虛構。

### 4.2 施工前檢查

必須確認：

- `main` 最新 HEAD
- 目標 `slug` 是否已存在
- 是否已有同一店家 Tenant
- Core 目前是否支援客戶需求
- 是否需要 schema / RPC / migration 變更
- 是否有其他施工線正在處理同一 Tenant

若 `slug` 或 Tenant 已存在，不得重複 INSERT；必須先判斷是接續施工，還是應改走 `UPDATE TENANT`。

### 4.3 建立原則

1. 建立新的 `smallshop_stores` Tenant。
2. 取得新的 `store_id`。
3. 後續所有菜單、Branding、Theme、訂單、Session 等資料必須以該 `store_id` 隔離。
4. 新店家只能新增 Tenant Data；不得為新增店家複製 Core。
5. 不建立 V11、V12 或其他新版資料夾。
6. 不複製 `crisp-day` 或其他店家程式。
7. 不以店名 hardcode JS / CSS / HTML。
8. 若 DB schema 需要變更，必須停止並先回報；正式 schema 變更只能使用 Supabase migration。

### 4.4 菜單建立

菜單資料至少包括：

- `store_id`
- category
- name
- price
- sort_order
- active

規則：

- 價格必須以原始資料為準。
- 分類與排序依客戶資料建立。
- 不新增未提供的商品。
- 若目前 Core 不支援某些 Modifier / 加價選項，不得假裝已完整實作。
- 若有授權採 Compatibility Demo workaround，必須明確標示為暫時方案，不得視為正式產品模型。

### 4.5 Branding / Theme / Logo

優先使用現有 Tenant Branding / Theme 資料模型。

規則：

- 不建立店家專用 CSS。
- 不把品牌文字寫死進 Core。
- Logo 必須使用現有正式 Logo / Branding 機制。
- 若正式 Logo 儲存或 URL 流程尚未支援，先回報缺口，不得做臨時 hardcode。

### 4.6 新 Tenant 驗收

至少確認：

- 公開 URL 能以 `slug` resolve 正確 `store_id`
- 店名正確
- Theme / Branding 正確
- Logo 正確（若有）
- 菜單分類正確
- 商品名稱 / 價格正確
- 購物車正常
- 現有結帳流程正常
- 訂單 `store_id` 正確
- QR 指向正確 Tenant URL
- 不顯示其他 Tenant 菜單 / Theme / 訂單

### 4.7 NEW TENANT 完成回報

至少回報：

- START_HEAD
- FINAL_HEAD
- store_id
- slug
- 店名
- DEMO / 正式
- 分類數
- 商品數
- Theme / Branding
- Logo 狀態
- 公開 URL
- QR 狀態
- 測試結果
- Tenant Isolation 結果
- 是否新增 migration
- 是否修改 Core
- Git commit
- push 狀態
- deploy 狀態
- `【此店是否已可提供客戶查看：YES / NO】`

若 `NO`，只列真正阻塞點。

---

## 5. UPDATE TENANT｜既有客戶標準流程

### 5.1 身份解析

既有客戶維護必須先使用現有 `slug` 找到正確 Tenant，再確認 `store_id`。

後續所有更新以 `store_id` 為 Authority。

禁止：

- 建立第二個 Tenant 來取代原店
- 修改既有 `store_id`
- 一般流程修改 `slug`
- 把商品改掛到別的 `store_id`
- 把訂單改掛到別的 `store_id`
- 刪除既有歷史訂單

### 5.2 更新前快照

施工前至少記錄：

- store_id
- slug
- 店名
- 目前商品數
- 目前分類
- 目前 Theme / Branding
- 目前 Logo
- 目前訂單數

重大菜單更新時，建議同時整理「目前菜單 vs 新菜單」差異。

### 5.3 菜單更新規則

更新動作分為：

- 新增商品
- 修改商品名稱
- 修改價格
- 修改分類
- 修改排序
- 上架
- 下架

若新菜單已不存在某商品：

- 優先 `active = false` / 下架
- 除非有明確理由與授權，不直接 hard delete

歷史訂單必須保留原有訂單快照，不因目前菜單更新而消失或被改寫。

### 5.4 Theme / 配色更新

優先修改現有 Tenant Branding / Theme 資料。

可更新例如：

- theme_key
- brand_color
- accent_color
- background_color
- surface_color
- text_color
- button_color
- button_text_color
- border_radius

禁止：

- 為單一店家建立專屬 CSS
- 修改共享 Theme 造成其他 Tenant 跟著改變

### 5.5 店家文字更新

例如：

- 店名
- 品牌副標
- 電話
- 地址
- 其他已資料化欄位

必須更新 Tenant Data，不得把文字寫進 Core HTML / JS。

### 5.6 Logo 更新

若客戶提供新 Logo：

- 使用目前正式 Branding / Logo 機制
- 更新後確認顧客頁顯示正確
- 確認其他 Tenant 不受影響
- 舊 Logo 不再被此 Tenant runtime 使用

若目前系統不存在正式 Logo 儲存 / URL 機制，停止 Logo 項目並回報功能缺口，不得自行 hardcode。

### 5.7 UPDATE TENANT 驗收

至少確認：

- `store_id` 不變
- `slug` 不變
- 原公開 URL 繼續可用
- QR 原 URL 繼續可用
- 新菜單正確
- 價格正確
- 下架商品不出現在顧客頁
- Theme / Branding 正確
- Logo 正確（若有修改）
- 店家文字正確
- 歷史訂單仍存在
- 測試訂單寫入正確 Tenant
- 其他 Tenant 完全未被修改

### 5.8 UPDATE TENANT 完成回報

至少回報：

- store_id
- slug
- 更新前商品數
- 更新後商品數
- 新增商品
- 修改商品
- 下架商品
- Theme 修改
- 文字修改
- Logo 修改
- 歷史訂單是否保留
- Core 是否修改
- 是否新增 migration
- Git commit
- deploy 狀態
- 正式 URL
- `【此次店家更新是否完成：YES / NO】`

---

## 6. Tenant Isolation 必做規則

任何 Tenant 建立或重大更新後，都必須驗證隔離。

至少檢查：

1. 每家店 `store_id` 不同。
2. 菜單資料以 `store_id` 隔離。
3. 訂單以 `store_id` 隔離。
4. Branding / Theme 不串店。
5. 顧客 URL 使用不同 `slug` 時，只取得對應 Tenant。
6. 購物車 / localStorage / history 等客戶端狀態不得跨 Tenant 共用。
7. 店家後台 Session 不得操作其他 Tenant。

若發現跨 Tenant 越權或資料混用，視為阻塞，不得判定可交付。

---

## 7. Core Gate｜何時必須停止 Tenant 作業

以下任一情況出現時，先停止並回報，不得直接為單一店施工：

- 必須修改 Core HTML 才能顯示某店資料
- 必須新增某店專用 JS
- 必須新增某店專用 CSS
- 必須修改共享 RPC 才能完成店家特例
- 必須新增 DB schema 才能支援需求
- 必須新增產品共用功能，例如 Modifier / 套餐 / POS
- 需求可能影響其他 Tenant

回報格式：

> `這不是 Tenant Data 異動，而是產品功能缺口。`

並列出：

- 現有能力
- 缺口
- 受影響功能
- 建議的 Generic Core 解法
- 是否需要 migration

取得明確授權後，才進入 Core Feature 開發。

---

## 8. Git / DB 作業規則

### 純 Tenant Data 更新

如果只需要修改 Supabase Tenant Data：

- 不需要為了留下 commit 而修改 Core
- Git commit 可以是 `N/A`
- 不得製造無意義 repository 變更

### Core / 文件修改

若真的需要修改正式 Core 或正式文件：

- 施工前記錄 START_HEAD
- 修改必須在正式 `main` 流程中可追蹤
- 不得覆蓋其他施工線的新 commit
- 完成後記錄 FINAL_HEAD / commit

### Schema 變更

所有 DB schema / function 結構性變更必須使用 Supabase migration。

一般 Tenant Data 建立 / 修改不得包裝成 schema migration。

---

## 9. 並行施工安全規則

如果可能有另一個對話 / Agent 同時施工：

開始前重新確認：

- `main` 最新 HEAD
- 目標 slug 是否已存在
- Tenant 是否已建立
- 菜單是否已部分建立
- 是否有未預期的新 commit

若發現另一施工線已開始建立相同 Tenant：

- 不得建立第二份 Tenant
- 不得重複插入第二套菜單
- 應讀取目前實際狀態後安全接續

同一 Tenant 不建議由兩個寫入 Agent 同時施工。

---

## 10. 日常最短操作指令

### 新客戶

```text
依 TENANT_OPERATIONS.md 執行 NEW TENANT。

新客戶：
店名：【店名】
用途：【DEMO / 正式】
預計 slug：【slug】

附件是客戶的菜單 / Logo / 品牌參考。
請先整理資料，標出不確定項目；確認可施工後建立 Tenant，並完成驗收。
```

### 舊客戶

```text
依 TENANT_OPERATIONS.md 執行 UPDATE TENANT。

既有客戶：
slug：【既有 slug】

附件是新的菜單 / Logo / 品牌參考。
本次需求：
- 【換菜單】
- 【改配色】
- 【改文字】
- 【換 Logo】

保留原 store_id、原 slug、所有歷史訂單。
先比較現況與新資料，再執行更新與驗收。
```

### 只做資料盤點，不施工

```text
依 TENANT_OPERATIONS.md 盤點此 Tenant，但不要修改任何資料。
slug：【slug】
請回報目前店家資料、菜單、Branding、Logo、訂單與可能的功能缺口。
```

---

## 11. 後續平台總控原則

未來若建立 Platform / Super Admin，應以本文件流程為基礎把日常操作 UI 化，例如：

- Tenant 建立
- Tenant 狀態
- DEMO / 正式
- Plan / Feature Entitlement
- 菜單維護
- Branding / Logo
- 快速開啟顧客頁 / 店家後台
- Tenant Isolation / 異常檢查

在平台總控正式落地前，本文件即為 Tenant 日常營運 SOP。

不得因未有總控後台而另外建立第二套 Tenant Authority。
