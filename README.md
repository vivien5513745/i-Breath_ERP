# i-Breath_ERP

公司記帳簿 + 庫存管理工具。前端為單一 `public/index.html`,後端是一個很輕量的 Express
服務,提供一組「key-value 儲存 API」,資料存放在 PostgreSQL,取代原本只能在 Claude
對話裡使用的 `window.storage`。

## 專案結構

```
i-Breath_ERP/
├── server.js         後端伺服器(Express + PostgreSQL)
├── package.json
├── public/
│   └── index.html    前端網頁(記帳簿 + 庫存管理)
└── README.md
```

## 部署到 Zeabur 的步驟

### 1. 更新 GitHub repo

目前您的 GitHub repo 裡只有一個 `index.html`(靜態網站)。請把這個資料夾內的
**全部檔案**上傳上去,取代原本的內容,讓 repo 結構變成上面「專案結構」那樣:

- 在 GitHub repo 頁面,先把原本的 `index.html` 移動/上傳到 `public/index.html`
  (可以先刪除根目錄的 `index.html`,改用「Add file → Upload files」把整個資料夾拖上去)
- 上傳 `server.js`、`package.json`、`.gitignore`

> 提醒:您也可以用 GitHub Desktop 或 `git` 指令,把這個資料夾內容整包 push 上去比較快。

### 2. 在 Zeabur 專案裡新增 PostgreSQL 資料庫

1. 打開您 Zeabur 專案(i-Breath_ERP 所在的專案)
2. 點擊「Add Service」→「Prebuilt」→ 選擇 **PostgreSQL**
3. 等待資料庫服務建立完成(狀態變成 Running)

### 3. 讓後端服務接上這個資料庫

1. 點進您的 **i-Breath_ERP**(Node.js 服務,不是資料庫)
2. 進入「Variables」分頁
3. 新增環境變數 `DATABASE_URL`,值設定為**參照(Reference)PostgreSQL 服務的連線字串**
   (Zeabur 在新增變數時通常會提示可以直接選取其他服務的變數,選擇 PostgreSQL 服務提供的
   `DATABASE_URL` / `POSTGRES_CONNECTION_STRING` 即可自動帶入,不需要手動輸入密碼)
4. 儲存後,服務會自動重新部署

### 4. 重新部署

因為 GitHub repo 內容改變了(從純 HTML 變成 Node.js 專案),Zeabur 這次應該會偵測到
`package.json`,自動改用 Node.js 的建置方式(`npm install` → `npm start`)。如果沒有
自動重新部署,手動點擊「Redeploy」。

看到 Logs 出現：
```
i-Breath_ERP server listening on port 8080
```
就代表後端啟動成功。

### 5. 驗證

打開您的網址(例如 `https://ibreatherp.zeabur.app/api/health`),應該會看到：
```json
{"ok": true, "db": "connected"}
```
代表資料庫連線正常。接著打開網站首頁,新增一筆收入紀錄，重新整理頁面，資料應該會
繼續保留 —— 這樣就代表資料已經真正存進資料庫,不會再因為重新整理或換裝置而消失。

## 本機測試(選用)

```bash
npm install
export DATABASE_URL=postgres://user:password@localhost:5432/dbname
npm start
```

然後打開 http://localhost:8080
