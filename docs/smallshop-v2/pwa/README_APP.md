# 脆日炸雞｜店家管理 PWA

此目錄為可安裝式店家管理 App（PWA）。

- `index.html`：店家後台 App
- `order.html`：客戶點餐頁
- `manifest.webmanifest`：PWA 安裝資訊
- `sw.js`：Service Worker / 離線殼層
- `icon-192.png`：App 圖示
- `icon-512.png`：高解析 App 圖示
- `icon-maskable-512.png`：Android maskable 圖示

## 安裝條件

必須透過 HTTPS 正式網址開啟。GitHub Pages 啟用後，Android Chrome 可直接顯示「安裝 App」，iPhone / iPad 可用 Safari「加入主畫面」。

## 後端

資料與操作仍透過現有 Supabase RPC：菜單、建單、店家訂單、狀態更新、營業流水帳。
