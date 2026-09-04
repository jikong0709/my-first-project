# 訂單系統app｜正式主線

品牌：脆日炸雞 CRISP DAY

本資料夾是唯一正式開發目錄。舊的 `docs/smallshop-v2/*` 僅保留歷史參考，不再作為正式版本。

## 正式架構
- 顧客端：`order.html`
- 店家 PWA：`index.html`
- 後端：Supabase Postgres + PostgREST RPC
- 正式部署：GitHub Pages，發布為 `/order-app/`
- 店家網址：`https://jikong0709.github.io/my-first-project/order-app/`
- 顧客網址：`https://jikong0709.github.io/my-first-project/order-app/order.html?store=crisp-day`

## 安全
- 公開前端只包含 Supabase publishable key，不包含 service role。
- 店家管理密碼不寫在前端，後端使用 bcrypt/crypt 雜湊驗證。
- 店家登入後取得可撤銷、具期限的 Session token。
- 訂單、菜單與流水帳依 `store_id` 隔離。
- RLS 保持啟用，公開角色無直接資料表權限；前端只透過明確授權 RPC 存取。
- 舊版硬編碼 PIN RPC 已撤銷公開執行權限。
- 首次設定碼只可使用一次；已設定密碼的店家不可再次使用首次設定流程。
- 顧客查詢訂單狀態需同時持有店家代碼、訂單編號與隨機 `public_token`。

## 已完成
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
- 固定顧客 QR Code 顯示與下載
- PWA manifest、service worker、離線基本頁面、App icon
- GitHub Pages 自動部署 workflow

## 尚未視為正式完成
- LINE Pay 目前仍為測試／人工確認模式，尚未串正式商戶金流與 callback。
- 列印目前為瀏覽器列印；靜默熱感應自動列印需另做印表機整合。
- 店家目前以 5 秒安全輪詢接單；推播通知／Realtime 可列入後續強化。
- 正式自訂品牌網域可後續綁定，現階段以 GitHub Pages HTTPS 為正式 PWA 網址。

## 驗收原則
每次修改都以「正式主線直接更新 → 前後端檢查 → GitHub Actions 部署 → 正式網址驗證」為準，不再建立 V11/V12 等平行版本。
