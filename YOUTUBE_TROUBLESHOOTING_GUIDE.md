# YouTube 播放問題排查指南

## 問題現象
- YouTube 影片顯示 "This video is unavailable - Error code: 4"
- 提示 "Video loaded successfully" 但實際無法播放

## 核心問題分析

### YouTube Error Code 4 的含義
Error code 4 通常表示：
1. **嵌入限制**：影片不允許在外部網站嵌入播放
2. **隱私設定**：影片被設為私人或未列出
3. **地區限制**：影片在當前地區不可用
4. **年齡限制**：影片有年齡限制需要登入
5. **版權限制**：內容擁有者限制了播放

## 已實施的修復方案

### 1. 多重 URL 重試機制
系統現在會依序嘗試 3 種不同的載入方式：

**第一次嘗試（retryCount = 0）**
```
https://www.youtube.com/embed/{videoId}?autoplay=0&playsinline=1&rel=0&...
```
- 使用標準 YouTube embed
- 最佳相容性

**第二次嘗試（retryCount = 1）**
```
https://www.youtube.com/watch?v={videoId}&autoplay=0
```
- 使用完整 YouTube 播放頁面
- 適合受限制的影片

**第三次嘗試（retryCount = 2）**
```
https://www.youtube-nocookie.com/embed/{videoId}?autoplay=0&...
```
- 使用 YouTube nocookie 域名
- 最後的備選方案

### 2. WebView 配置優化

**已優化的 WebView 配置：**
```typescript
// 移動端適配的 User-Agent
'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

// 正確的 Referer 和安全標頭
'Referer': 'https://www.youtube.com/',
'Sec-Fetch-Dest': 'iframe',
'Sec-Fetch-Mode': 'navigate',
'Sec-Fetch-Site': 'same-origin',

// WebView 設定
allowsProtectedMedia={true}
allowFileAccess={true}
scalesPageToFit={false}
scrollEnabled={false}
webviewDebuggingEnabled={__DEV__}
```

### 3. 詳細錯誤提示

當所有重試方式都失敗後，系統會顯示：
```
YouTube 視頻載入失敗

可能原因：
• 視頻被設為私人或已刪除
• 視頻限制嵌入播放
• 地區限制
• 網路連線問題

已嘗試 3 種不同的載入方式。

建議：
1. 檢查視頻連結是否正確
2. 在瀏覽器中測試是否能播放
3. 稍後再試
```

## 測試步驟

### 步驟 1：測試不同類型的 YouTube 影片

測試以下 URL 以確認哪些類型的影片可以播放：

1. **公開影片**（應該可以播放）
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

2. **嵌入受限影片**（可能會失敗）
   ```
   https://www.youtube.com/watch?v=DzVKgumDkpo
   ```

3. **短影片**（應該可以播放）
   ```
   https://www.youtube.com/shorts/xyz123
   ```

### 步驟 2：檢查 Console 日誌

在載入 YouTube 影片時，檢查以下日誌：

```
[VideoSourceDetector] Extracted YouTube video ID: {videoId}
[UniversalVideoPlayer] Rendering YouTube with videoId: {videoId} retry: 0
[UniversalVideoPlayer] YouTube embed URL: https://...
[UniversalVideoPlayer] WebView load started for YouTube
```

如果看到錯誤：
```
[UniversalVideoPlayer] YouTube loading error: { ... }
[UniversalVideoPlayer] Retrying YouTube with alternative method (1/3)
```

### 步驟 3：手動測試 Embed URL

在瀏覽器中直接訪問生成的 embed URL：

1. 複製 Console 中的 `YouTube embed URL`
2. 在瀏覽器新標籤頁中打開
3. 檢查是否能正常播放

如果無法播放，說明是 YouTube 本身的限制。

## 常見問題與解決方案

### Q1: 所有 YouTube 影片都無法播放

**可能原因：**
- WebView 配置問題
- 網路連線問題
- YouTube API 限制

**解決方案：**
1. 檢查設備網路連線
2. 嘗試使用 VPN
3. 更新 App 至最新版本

### Q2: 部分 YouTube 影片可以播放，部分不行

**可能原因：**
- 影片本身有嵌入限制
- 版權限制
- 地區限制

**解決方案：**
1. 在瀏覽器中測試該影片
2. 確認影片是否為公開且可嵌入
3. 使用其他可用的影片

### Q3: YouTube 影片載入很慢

**可能原因：**
- 網路速度問題
- YouTube 伺服器響應慢
- WebView 初始化慢

**解決方案：**
1. 檢查網路速度
2. 等待自動重試完成
3. 手動重新載入影片

## 已知限制

### YouTube 平台限制
1. **嵌入限制**：某些影片不允許嵌入播放
2. **年齡限制**：需要登入的影片無法播放
3. **版權保護**：某些版權內容限制播放
4. **地區限制**：某些影片在特定地區不可用

### 技術限制
1. **無法繞過登入**：需要 YouTube 帳號登入的影片無法播放
2. **無法處理付費內容**：YouTube Premium 內容無法播放
3. **Cookie 限制**：某些情況下需要 Cookie 才能播放

## 替代方案

如果 YouTube 影片持續無法播放：

### 方案 1：使用 YouTube 官方 App
建議用戶在 YouTube 官方 App 中打開影片

### 方案 2：使用其他影片來源
支援以下平台作為替代：
- Vimeo
- Dailymotion
- 直接 MP4/M3U8 串流

### 方案 3：聯繫支援
如果特定影片類型持續無法播放，請收集以下資訊：
1. 影片 URL
2. Console 錯誤日誌
3. 設備和系統版本
4. 網路環境

## 開發者調試

### 啟用 WebView 調試

在開發模式下，WebView 調試已啟用：
```typescript
webviewDebuggingEnabled={__DEV__}
```

### 檢查 WebView 請求

使用 Chrome DevTools 檢查 WebView 請求：
1. 打開 Chrome
2. 訪問 `chrome://inspect`
3. 找到 App 的 WebView
4. 點擊 "inspect"
5. 查看 Network 和 Console 標籤

### 修改重試邏輯

如需調整重試邏輯，修改：
```typescript
// UniversalVideoPlayer.tsx
loadTimeout = 30000,  // 載入超時時間（毫秒）
maxRetries = 3,       // 最大重試次數
```

## 最佳實踐建議

### 對用戶
1. 優先使用公開且可嵌入的影片
2. 確保網路連線穩定
3. 定期更新 App
4. 遇到問題時嘗試重新載入

### 對開發者
1. 實施完善的錯誤處理
2. 提供清晰的錯誤訊息
3. 記錄詳細的調試日誌
4. 持續監控播放成功率

## 結論

YouTube Error code 4 是一個常見但複雜的問題。系統已實施：
- ✅ 多重 URL 重試機制
- ✅ 優化的 WebView 配置
- ✅ 詳細的錯誤提示
- ✅ 完整的日誌記錄

但仍需注意 YouTube 平台本身的限制。建議：
1. 測試不同類型的影片
2. 根據 Console 日誌診斷問題
3. 向用戶提供替代方案
4. 持續優化和改進

---

## 更新日誌

**2025-01-03**
- 初始版本
- 實施多重重試機制
- 優化 WebView 配置
- 改進錯誤訊息
