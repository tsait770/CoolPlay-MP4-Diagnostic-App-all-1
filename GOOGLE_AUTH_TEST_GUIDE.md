# 🧪 Google 認證測試指南

## 📋 測試前確認事項

### 1. Supabase 配置檢查
前往 Supabase 控制台確認以下設置：

**URL:** https://djahnunbkbrfetktossw.supabase.co

#### 必須啟用 Google 認證
1. 登入 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇您的專案
3. 導航至 **Authentication** > **Providers**
4. 找到 **Google** 並確認：
   - ✅ Google provider 已啟用（Enabled）
   - ✅ Client ID 已填寫
   - ✅ Client Secret 已填寫

#### 確認 Redirect URLs
在 **Authentication** > **URL Configuration** 確認：
- ✅ Site URL 已設定
- ✅ Redirect URLs 包含：
  - `http://localhost:8081/**`（開發環境）
  - `https://your-app-url.com/**`（生產環境）
  - `com.rork.instaplay://` （移動端）
  - `exp://` （Expo Go）

### 2. 環境變數驗證
確認 `.env` 文件包含：

```env
EXPO_PUBLIC_SUPABASE_URL=https://djahnunbkbrfetktossw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 運行測試

### 方法 1: 使用測試頁面（推薦）

1. 啟動應用程式：
```bash
npm start
# 或
bun start
```

2. 在應用中導航至測試頁面：
   - 打開應用
   - 前往 `/connection-test` 路由
   - 或在瀏覽器中訪問：`http://localhost:8081/connection-test`

3. 運行自動測試：
   - 點擊 **「開始測試」** 按鈕
   - 查看所有測試結果

4. 測試 Google 認證：
   - 在測試頁面下方找到 **「🔵 Google 認證測試」** 區塊
   - 點擊 **「測試 Google 登入」** 按鈕
   - 完成 Google 登入流程
   - 查看測試結果

### 方法 2: 使用登入頁面

1. 導航至登入頁面：`/auth/sign-in`
2. 點擊 **「使用 Google 登入」** 按鈕
3. 完成 Google OAuth 流程
4. 確認成功登入並跳轉

### 方法 3: 使用個人資料頁面

1. 如果已登入，前往：`/settings/account/profile`
2. 找到 **「Or With」** 區塊
3. 點擊 **「Google」** 按鈕測試帳號關聯

## 📊 測試項目

測試頁面會自動驗證以下項目：

### ✅ 環境變數驗證
- Supabase URL 是否設定
- Supabase API Key 是否設定
- App URL 配置
- Toolkit URL 配置

### ✅ Supabase 連接測試
- 資料庫連接是否正常
- 能否執行查詢

### ✅ 數據庫表驗證
檢查所有必要的表是否存在：
- `profiles`
- `bookmarks`
- `folders`
- `device_verifications`
- `bound_devices`
- `usage_logs`

### ✅ Google 認證測試（手動）
- Google OAuth 流程是否完整
- 是否成功獲取 token
- 是否成功創建/更新用戶會話
- 設備綁定是否正常

### ✅ 會員系統測試
- Profile 資料是否正確創建
- 會員等級是否正確
- 配額信息是否正常

### ✅ 設備綁定測試
- 設備是否成功綁定到用戶
- 設備信息是否正確記錄

### ✅ 語音配額測試
- 使用記錄表是否可訪問
- 配額系統是否正常運作

## 🔍 故障排除

### 問題 1: "provider is not enabled" 錯誤

**解決方案：**
1. 確認 Supabase > Authentication > Providers > Google 已啟用
2. 確認 Client ID 和 Client Secret 已正確填寫
3. 重啟開發服務器

### 問題 2: Redirect 錯誤

**解決方案：**
1. 檢查 Supabase > Authentication > URL Configuration
2. 確保 Redirect URLs 包含您的應用 URL
3. 對於 Expo：添加 `exp://` 和 `com.rork.instaplay://`

### 問題 3: Google OAuth 彈窗無法打開

**解決方案：**
- **Web:** 檢查瀏覽器是否阻止彈窗
- **Mobile:** 確認已安裝 `expo-web-browser`
- 檢查網絡連接

### 問題 4: 測試通過但無法在實際頁面使用

**解決方案：**
1. 清除應用緩存
2. 重啟開發服務器
3. 檢查控制台日誌
4. 確認 AuthProvider 已正確包裹應用

## 📱 平台特定注意事項

### Web
- Google OAuth 會在新標籤頁打開
- 需要允許彈窗
- Redirect 回到原始 URL

### iOS/Android
- 使用 `expo-web-browser` 打開內嵌瀏覽器
- 需要配置 Deep Link scheme
- 測試時使用真機效果最佳

### Expo Go
- 支持 OAuth 流程
- Redirect URL 使用 `exp://` scheme
- 某些功能可能受限

## ✅ 成功標誌

如果看到以下內容，表示測試成功：

1. **測試頁面：**
   - ✅ 所有測試項目顯示綠色勾選
   - ✅ Google 認證測試顯示「成功」狀態
   - ✅ 彈出提示「測試成功」

2. **登入頁面：**
   - ✅ 成功跳轉到 Google 登入頁
   - ✅ 選擇帳號後返回應用
   - ✅ 自動導航至主頁
   - ✅ 用戶信息正確顯示

3. **控制台日誌：**
   ```
   🔵 開始測試 Google 認證...
   ✅ Google 認證成功!
   ```

## 📞 需要幫助？

如果測試失敗，請提供：
1. 完整的錯誤訊息
2. 控制台日誌
3. 測試頁面的截圖
4. 使用的平台（Web/iOS/Android）
5. Supabase 設定截圖（隱藏敏感信息）

## 🎯 下一步

測試通過後，您可以：
1. ✅ 在生產環境部署
2. ✅ 配置其他 OAuth 提供商（Apple, Facebook 等）
3. ✅ 自定義登入頁面設計
4. ✅ 添加更多用戶資料欄位
5. ✅ 實現進階會員功能

---

**最後更新：** 2025-11-02
**文件版本：** 1.0
