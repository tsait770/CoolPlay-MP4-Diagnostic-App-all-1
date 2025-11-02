# 系統連接測試指南

## 測試頁面位置
訪問測試頁面：`/connection-test`

## 測試項目

### 1. 環境變數驗證 ✓
檢查以下環境變數是否正確配置：
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase 項目 URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名金鑰
- `EXPO_PUBLIC_RORK_API_BASE_URL` 或 `EXPO_PUBLIC_API_URL`: API 基礎 URL

**預期結果**：
- ✅ 所有環境變數都已設置
- ✅ URL 格式正確

**如果失敗**：
1. 檢查 `.env` 檔案是否存在
2. 確認環境變數名稱正確
3. 重新啟動開發服務器

---

### 2. Supabase 連接測試 ✓
測試應用是否能成功連接到 Supabase 數據庫。

**預期結果**：
- ✅ 成功連接到數據庫
- ✅ 可以執行基本查詢

**如果失敗**：
1. 檢查 Supabase URL 和 Key 是否正確
2. 確認 Supabase 項目是否已啟動
3. 檢查網絡連接
4. 查看 Supabase 項目儀表板的狀態

---

### 3. 數據庫表驗證 ✓
驗證以下表是否已創建：
- `profiles` - 用戶資料表
- `bookmarks` - 書籤表
- `folders` - 資料夾表
- `device_verifications` - 設備驗證表
- `bound_devices` - 已綁定設備表
- `usage_logs` - 使用記錄表

**預期結果**：
- ✅ 所有 6 個表都已創建
- ✅ 表結構正確

**如果失敗**：
1. 登入 Supabase 儀表板
2. 進入 SQL Editor
3. 執行數據庫 schema 文件：
   - `database-schema-part1-core.sql`
   - `database-schema-part2-data.sql`
   - `database-schema-part3-functions.sql`
4. 重新運行測試

---

### 4. tRPC API 連接測試 ✓
測試 tRPC API 是否正常運行。

**預期結果**：
- ✅ API 服務正在運行
- ✅ 端點響應正常

**如果失敗**：
1. 確認開發服務器正在運行
2. 檢查 API 路由配置
3. 查看控制台錯誤訊息
4. 確認 `backend/hono.ts` 和 `backend/trpc/app-router.ts` 配置正確

---

### 5. 會員系統測試 ✓
測試會員系統功能。

**預期結果**：
- ✅ 可以查詢用戶資料
- ✅ 會員等級正確顯示
- ✅ 配額資訊正確

**如果失敗**：
- ⚠️ 如果顯示「未登入」：需要先註冊/登入
- ❌ 如果顯示「會員資料不存在」：
  1. 確認 `profiles` 表已創建
  2. 確認註冊時有觸發創建 profile 的函數
  3. 手動在 Supabase 中創建用戶 profile

---

### 6. 設備綁定測試 ✓
測試設備綁定系統。

**預期結果**：
- ✅ 可以查詢設備列表
- ✅ 顯示已綁定設備數量

**如果失敗**：
- ⚠️ 如果顯示「未登入」：需要先註冊/登入
- ❌ 如果查詢失敗：確認 `bound_devices` 表已創建

---

### 7. 語音配額測試 ✓
測試語音配額系統。

**預期結果**：
- ✅ 可以查詢使用記錄
- ✅ 顯示使用次數

**如果失敗**：
- ⚠️ 如果顯示「未登入」：需要先註冊/登入
- ❌ 如果查詢失敗：確認 `usage_logs` 表已創建

---

## 使用步驟

### 步驟 1: 啟動應用
```bash
# 確保開發服務器正在運行
bun run start
```

### 步驟 2: 訪問測試頁面
在應用中導航到 `/connection-test` 路由

### 步驟 3: 運行測試
點擊「開始測試」按鈕，系統會自動運行所有測試項目

### 步驟 4: 查看結果
- ✅ 綠色勾勾：測試通過
- ❌ 紅色叉叉：測試失敗
- ⚠️ 黃色警告：需要注意的項目

### 步驟 5: 修復問題
根據測試結果中的詳細資訊進行修復

---

## 常見問題排查

### 問題 1: 環境變數未找到
**解決方案**：
1. 確認 `.env` 檔案存在於項目根目錄
2. 確認變數名稱使用 `EXPO_PUBLIC_` 前綴
3. 重新啟動開發服務器

### 問題 2: Supabase 連接失敗
**解決方案**：
1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 確認項目狀態為 "Active"
3. 複製 Project URL 和 anon key
4. 更新 `.env` 檔案
5. 重新啟動應用

### 問題 3: 數據庫表缺失
**解決方案**：
1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 依序執行以下 SQL 文件：
   ```
   database-schema-part1-core.sql
   database-schema-part2-data.sql
   database-schema-part3-functions.sql
   ```
4. 確認所有表都已創建

### 問題 4: tRPC API 連接失敗
**解決方案**：
1. 確認 `backend/hono.ts` 配置正確
2. 確認 `backend/trpc/app-router.ts` 路由正確
3. 檢查控制台錯誤訊息
4. 確認 API URL 環境變數正確

### 問題 5: 需要登入才能測試
**解決方案**：
1. 訪問 `/auth/sign-up` 註冊新帳號
2. 或訪問 `/auth/sign-in` 登入現有帳號
3. 登入後重新運行測試

---

## 測試通過後的下一步

當所有測試都通過後，您可以：

1. **測試核心功能**：
   - 訪問 `/player-demo` 測試播放器
   - 測試書籤管理功能
   - 測試語音控制功能

2. **配置付費功能**：
   - 設置 Stripe API 密鑰
   - 配置 PayPal 訂閱計劃
   - 測試訂閱流程

3. **部署應用**：
   - 準備生產環境配置
   - 設置 CI/CD 流程
   - 部署到生產環境

---

## 技術支持

如果遇到無法解決的問題：

1. 檢查控制台日誌
2. 查看 Supabase 項目日誌
3. 參考文檔：
   - `QUICK_START.md`
   - `IMPLEMENTATION_GUIDE.md`
   - `SUPABASE_DATABASE_DEPLOYMENT.md`
