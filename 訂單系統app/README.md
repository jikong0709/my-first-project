# 訂單系統app｜正式主線

產品核心：**訂單系統 Core（單一 Core）**  
Demo Tenant：**crisp-day／脆日炸雞 CRISP DAY**

本資料夾是唯一正式開發目錄。舊的 `docs/smallshop-v2/*` 僅保留歷史參考，不再作為正式版本。

產品化最高 Authority：[`PRODUCTIZATION_AUTHORITY.md`](./PRODUCTIZATION_AUTHORITY.md)。

## 正式架構
- 顧客端：`order.html`
- 店家 PWA：`index.html`
- 後端：Supabase Postgres + PostgREST RPC
- 正式部署：GitHub Pages，發布為 `/order-app/`
- Demo 店家網址：`https://jikong0709.github.io/my-first-project/order-app/`
- Demo 顧客網址：`https://jikong0709.github.io/my-first-project/order-app/order.html?store=crisp-day`
- Tenant Identity Authority：`smallshop_stores.id`
- Tenant Data Isolation Authority：所有店家資料的 `store_id`
- 公開網址識別：`slug`；建立後不可由一般應用流程修改

## 產品化規則
- 不建立 V11、V12 或其他新版網站資料夾。
- 不複製網站建立新店家；新店家只新增 Tenant Data。
- Core 程式固定只有 `訂單系統app/` 一套。
- `crisp-day` 是 Demo Tenant，不是 Core default brand。
- DB schema / function / trigger 等結構變更一律使用 migration。

## 安全
- 公開前端只包含 Supabase publishable key，不包含 service role。
- 店家管理密碼不寫在前端，後端使用 bcrypt/crypt 雜湊驗證。
- 店家登入後取得可撤銷、具期限的 Session token。
- 訂單、菜單與流水帳依 `store_id` 隔離。
- `store_id` 已有 DB immutable guardrail，禁止既有資料改掛其他 Tenant。
- `smallshop_stores.id` 與 `slug` 已有 DB immutable guardrail；例外變更必須以明確 migration 處理。
- RLS 保持啟用，公開角色無直接資料表權限；前端只透過明確授權 RPC 存取。
- 舊版硬編碼 PIN／無 slug RPC 已撤銷公開執行權限。
- 首次設定碼只可使用一次；已設定密碼的店家不可再次使用首次設定流程。
- 顧客查詢訂單狀態需同時持有店家代碼、訂單編號與隨機 `public_token`。

## 已完成（Demo Baseline）
- 25 項／5 分類炸物菜單，無飲料
- 外帶／內用切換，內用桌號前後端強制驗證
- 購物車與 ORDER TOTAL
- 現金／LINE Pay 選擇
- 送單、訂單編號、顧客訂單狀態自動更新
- 店家即時接單、確認收款、製作中、完成、取消
- 訂單狀態轉移後端驗證
- 72mm 瀏覽器列印
- 今日營業資訊、日期流水帳、商品銷售排行、CSV 匯出
- 菜單新增／修改／價格／分類／排序／上下架
- 店名、英文名、電話、地址、營業狀態與付款方式設定
- 管理密碼登入、變更密碼、登出
- 固定 Demo 顧客 QR Code 顯示與下載
- PWA manifest、service worker、離線基本頁面、App icon
- GitHub Pages 自動部署 workflow

## 產品化待拆
目前正式 Core 仍有部分 `crisp-day`／脆日品牌 hardcode，包含 `config.js`、HTML fallback、localStorage namespace、PWA manifest、固定 QR 與 Theme。這些是 Demo/Core 耦合債務，已在 `PRODUCTIZATION_AUTHORITY.md` 登記；不得以複製網站方式解決。

## 尚未視為正式完成
- LINE Pay 目前仍為測試／人工確認模式，尚未串正式商戶金流與 callback。
- 列印目前為瀏覽器列印；靜默熱感應自動列印需另做印表機整合。
- 店家目前以 5 秒安全輪詢接單；推播通知／Realtime 可列入後續強化。
- Theme、QR、PWA metadata、Default Template 尚未完整 Tenant Data 化。
- 正式自訂品牌網域可後續綁定，現階段以 GitHub Pages HTTPS 為正式 PWA 網址。

## 驗收原則
每次修改都以「正式主線直接更新 → 前後端檢查 → GitHub Actions 部署 → 正式網址驗證」為準，不再建立 V11/V12 等平行版本。
