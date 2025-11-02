# ⚡ 快速測試檢查清單

## 🎯 5分鐘快速驗證

### ✅ 第一步：啟動應用
```bash
bun start
# 或
npm start
```

等待服務器啟動，出現 QR code 和 URL。

---

### ✅ 第二步：打開測試頁面

在瀏覽器中訪問：
```
http://localhost:8081/connection-test
```

或者在應用中導航至 Connection Test 頁面。

---

### ✅ 第三步：運行自動測試

1. **點擊「開始測試」按鈕**
2. **等待所有測試完成（約 5-10 秒）**

預期結果：
- ✅ 環境變數驗證 → **成功**（綠色）
- ✅ Supabase 連接測試 → **成功**（綠色）
- ✅ 數據庫表驗證 → **成功**（綠色）
- ⏸️ Google 認證測試 → **等待手動測試**（灰色）
- ⚠️ tRPC API 連接測試 → **可能失敗**（如果後端未啟動）
- ⚠️ 會員系統測試 → **需要登入**
- ⚠️ 設備綁定測試 → **需要登入**
- ⚠️ 語音配額測試 → **需要登入**

---

### ✅ 第四步：測試 Google 登入

在測試頁面下方找到：

```
🔵 Google 認證測試
點擊按鈕測試 Google 登入功能
```

**點擊「測試 Google 登入」按鈕**

#### 預期流程：

1. **彈出 Google 登入窗口**
   - Web: 新標籤頁
   - Mobile: 內嵌瀏覽器

2. **選擇 Google 帳號**

3. **授權應用**

4. **返回應用**
   - 看到「✅ 測試成功」提示
   - Google 認證測試變為綠色
   - 顯示當前用戶信息

#### 如果失敗，會看到：
- ❌ 錯誤提示
- 詳細錯誤信息
- 修復建議

---

### ✅ 第五步：驗證登入狀態

測試成功後，檢查：

1. **測試頁面底部顯示：**
   ```
   👤 當前用戶: your-email@gmail.com
   🔑 登入方式: google
   ```

2. **控制台日誌顯示：**
   ```
   🔵 開始測試 Google 認證...
   ✅ Google 認證成功!
   ```

3. **自動測試結果更新：**
   - ✅ 會員系統測試 → **成功**
   - ✅ 設備綁定測試 → **成功**
   - ✅ 語音配額測試 → **成功**

---

## 🚨 常見問題快速修復

### ❌ 問題：環境變數驗證失敗
**修復：**
```bash
# 檢查 .env 文件
cat .env

# 確認包含：
EXPO_PUBLIC_SUPABASE_URL=https://djahnunbkbrfetktossw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 重啟服務器
bun start
```

---

### ❌ 問題：Supabase 連接失敗
**修復：**
1. 檢查網絡連接
2. 確認 Supabase URL 正確
3. 檢查 API Key 是否過期

---

### ❌ 問題：數據庫表驗證失敗
**修復：**
1. 前往 Supabase Dashboard
2. 打開 SQL Editor
3. 執行 `database-complete-reset.sql` 或 `database-safe-reset-and-setup.sql`

---

### ❌ 問題：Google 認證失敗 - "provider is not enabled"
**修復：**
1. 前往 Supabase Dashboard
2. Authentication > Providers
3. 啟用 Google
4. 填寫 Client ID 和 Client Secret
5. 保存設置
6. 等待 1-2 分鐘讓設置生效

**如何獲取 Google Client ID 和 Secret：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建或選擇專案
3. 啟用 Google+ API
4. 創建 OAuth 2.0 憑證
5. 複製 Client ID 和 Client Secret
6. 貼到 Supabase

---

### ❌ 問題：Redirect 錯誤
**修復：**

在 Supabase > Authentication > URL Configuration 添加：

```
Site URL: http://localhost:8081

Redirect URLs:
http://localhost:8081/**
https://your-domain.com/**
com.rork.instaplay://**
exp://**
```

---

### ❌ 問題：彈窗被阻止（Web）
**修復：**
1. 點擊瀏覽器地址欄的彈窗圖標
2. 允許來自此網站的彈窗
3. 重新測試

---

## 📊 測試結果解讀

### ✅ 全綠 = 完美
所有功能正常，可以開始開發！

### ⚠️ 部分黃色/灰色 = 可接受
- tRPC API: 如果不使用後端，可以忽略
- 會員系統: 登入後會變綠
- 設備綁定: 登入後會變綠
- 語音配額: 登入後會變綠

### ❌ 關鍵紅色 = 需要修復
必須修復的：
- 環境變數驗證
- Supabase 連接測試
- 數據庫表驗證
- Google 認證測試（如果要使用 Google 登入）

---

## 🎉 成功標準

**最低要求（可以開始開發）：**
- ✅ 環境變數驗證 - 成功
- ✅ Supabase 連接測試 - 成功
- ✅ Google 認證測試 - 成功

**推薦標準（完整功能）：**
- ✅ 所有自動測試 - 成功
- ✅ Google 認證測試 - 成功
- ✅ 成功登入並看到用戶信息

---

## ⏱️ 預計時間

- ✅ 啟動應用：30 秒
- ✅ 運行自動測試：10 秒
- ✅ Google 認證測試：30 秒
- ✅ 驗證結果：10 秒

**總計：約 2 分鐘**

---

## 📸 成功截圖示例

**應該看到：**
```
系統連接測試

[開始測試] 按鈕

✅ 環境變數驗證 - 環境變數正確配置
✅ Supabase 連接測試 - Supabase 連接成功
✅ 數據庫表驗證 - 所有表都已創建
✅ Google 認證測試 - Google 認證成功
...

🔵 Google 認證測試
已登入，點擊測試 Google 帳號關聯
[測試 Google 登入] 按鈕

👤 當前用戶: your-email@gmail.com
🔑 登入方式: google
```

---

**準備好了嗎？開始測試吧！** 🚀
