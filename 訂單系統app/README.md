# 訂單系統app｜正式主線

品牌：脆日炸雞 CRISP DAY

本資料夾是唯一正式開發目錄。舊的 `docs/smallshop-v2/*` 僅保留歷史參考，不再作為正式版本。

## 架構
- 顧客端：`order.html`
- 店家 PWA：`index.html`
- 後端：Supabase Postgres + RPC
- 正式部署：GitHub Pages，發布為 `/order-app/`

## 安全
- 公開前端只包含 Supabase publishable key，不包含 service role。
- 店家管理密碼不寫在前端，後端使用雜湊驗證。
- 店家登入後取得可撤銷 Session token。
- 訂單、菜單與流水帳依 `store_id` 隔離。
- 首次設定碼只可使用一次。

## 功能
顧客點餐、分類菜單、內用／外帶、桌號、購物車、現金／LINE Pay 測試模式、店家接單、收款、製作、完成、取消、列印、營業流水、菜單管理、店家資訊與營業狀態、付款方式、固定 QR 點餐網址。
