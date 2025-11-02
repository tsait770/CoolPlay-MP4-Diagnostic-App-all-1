# Supabase 數據庫部署指南

## 當前狀態
根據連接測試結果，需要完成以下步驟：

### ❌ 問題清單
1. ✗ 環境變數已配置但需驗證
2. ✗ 數據庫表未創建
3. ✗ tRPC API 連接失敗

---

## 📋 部署步驟

### 步驟 1：驗證環境變數
您的 `.env` 文件已包含以下配置：

```env
EXPO_PUBLIC_SUPABASE_URL=https://djahnunbkbrfetktossw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...（您的密鑰）
```

✅ 環境變數已正確配置

---

### 步驟 2：在 Supabase 創建數據庫表

#### 2.1 登入 Supabase Dashboard
1. 訪問：https://supabase.com/dashboard
2. 登入您的帳號
3. 選擇專案：`djahnunbkbrfetktossw`

#### 2.2 執行 SQL Schema
1. 在左側菜單中點擊 **SQL Editor**
2. 點擊 **+ New query** 創建新查詢
3. 打開專案根目錄下的 `database-schema-complete.sql` 文件
4. **複製全部內容** 並貼到 SQL Editor 中
5. 點擊 **Run** 按鈕執行

#### 2.3 驗證表已創建
執行後，您應該會看到成功訊息。可以通過以下方式驗證：

1. 在左側菜單點擊 **Table Editor**
2. 確認以下表已創建：
   - ✓ `profiles` - 用戶檔案
   - ✓ `bound_devices` - 已綁定設備
   - ✓ `usage_logs` - 使用記錄
   - ✓ `bookmarks` - 書籤
   - ✓ `folders` - 資料夾
   - ✓ `device_verifications` - 設備驗證
   - ✓ `subscriptions` - 訂閱記錄

---

### 步驟 3：測試數據庫連接

#### 3.1 重啟應用
```bash
# 停止當前運行的應用 (Ctrl+C)
# 重新啟動
npm start
# 或
bun expo start
```

#### 3.2 運行連接測試
1. 在應用中打開 **Settings (設置)** 頁面
2. 向下滾動找到 **Developer Options (開發者選項)**
3. 輸入管理員密碼：`680142`
4. 點擊 **Connection Test (連接測試)**
5. 點擊 **開始測試** 按鈕

#### 3.3 預期結果
所有測試應該顯示：
- ✅ 環境變數驗證 - 成功
- ✅ Supabase 連接測試 - 成功
- ✅ 數據庫表驗證 - 成功
- ⚠️ tRPC API 連接測試 - 可能需要後端服務器運行
- ⚠️ 會員系統測試 - 需要先登入
- ⚠️ 設備綁定測試 - 需要先登入
- ⚠️ 語音配額測試 - 需要先登入

---

## 🔧 常見問題排查

### 問題 1: SQL 執行失敗
**症狀**：執行 SQL 時出現錯誤

**解決方案**：
1. 確認您有適當的權限
2. 檢查是否有舊表衝突，如果有，請先刪除：
   ```sql
   DROP TABLE IF EXISTS public.profiles CASCADE;
   DROP TABLE IF EXISTS public.bound_devices CASCADE;
   DROP TABLE IF EXISTS public.usage_logs CASCADE;
   DROP TABLE IF EXISTS public.bookmarks CASCADE;
   DROP TABLE IF EXISTS public.folders CASCADE;
   DROP TABLE IF EXISTS public.device_verifications CASCADE;
   DROP TABLE IF EXISTS public.subscriptions CASCADE;
   ```
3. 然後重新執行完整的 schema

---

### 問題 2: 連接測試失敗
**症狀**：仍然看到 "Could not find the table" 錯誤

**可能原因與解決方案**：

1. **表未成功創建**
   - 重新檢查 Supabase Table Editor
   - 確認所有表都存在

2. **RLS 策略問題**
   - 在 Supabase Dashboard 中檢查每個表的 RLS 設置
   - 確認策略已啟用

3. **緩存問題**
   - 重啟應用
   - 清除應用緩存
   - 重新載入頁面

---

### 問題 3: tRPC API 連接失敗
**症狀**：顯示 "Failed to fetch"

**解決方案**：
1. 確認後端服務器正在運行
2. 檢查 API URL 配置
3. 測試基本的 HTTP 連接：
   ```bash
   curl http://localhost:8081/api/trpc/example.hi
   ```

---

## 📊 數據庫架構說明

### 核心表結構

#### 1. profiles (用戶檔案)
- 擴展 Supabase Auth 的用戶資訊
- 包含會員等級和配額管理
- 自動觸發器：新用戶註冊時自動創建

#### 2. bound_devices (綁定設備)
- 管理用戶的綁定設備
- 支持多設備管理
- 限制：根據會員等級

#### 3. usage_logs (使用記錄)
- 記錄所有用戶操作
- 追蹤語音命令使用
- 用於配額計算

#### 4. bookmarks (書籤)
- 用戶保存的視頻書籤
- 支持資料夾分類
- 包含視頻元數據

#### 5. folders (資料夾)
- 書籤分類管理
- 支持層級結構
- 自定義圖標和顏色

#### 6. device_verifications (設備驗證)
- 臨時驗證碼管理
- 用於新設備綁定
- 自動過期機制

#### 7. subscriptions (訂閱)
- PayPal 訂閱整合
- 追蹤付費狀態
- 自動續訂管理

---

## 🚀 下一步

執行完 SQL schema 後：

1. ✅ 運行連接測試
2. ✅ 創建測試用戶帳號
3. ✅ 測試會員功能
4. ✅ 測試設備綁定
5. ✅ 測試語音配額

---

## 📞 需要幫助？

如果在部署過程中遇到任何問題：

1. 檢查 Supabase Dashboard 的日誌
2. 查看應用的控制台輸出
3. 運行連接測試並截圖結果
4. 提供錯誤訊息的完整內容

---

## ✅ 部署檢查清單

在繼續之前，請確認：

- [ ] Supabase 專案已創建
- [ ] 環境變數已配置 (`.env` 文件)
- [ ] SQL schema 已在 Supabase 執行
- [ ] 所有 7 個表已成功創建
- [ ] RLS 策略已啟用
- [ ] 應用已重啟
- [ ] 連接測試已通過

---

**準備好了嗎？** 

請按照上述步驟執行 SQL schema，然後回來運行連接測試！
