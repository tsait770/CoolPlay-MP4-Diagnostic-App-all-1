# 🎬 影片播放系統測試指南

## 📖 簡介

本測試系統用於全面檢測應用的影片播放能力，涵蓋 70+ 影片平台和格式，包括：
- 主流平台（YouTube, Vimeo, Twitch等）
- 成人平台（30+平台）
- 付費平台（Brazzers, Reality Kings等）
- 直播平台（Chaturbate, Stripchat等）
- 串流格式（MP4, HLS, DASH, RTMP, RTSP）
- 雲端平台（Google Drive, Dropbox）

---

## 🚀 快速開始

### 方法 1: 使用命令行運行測試（推薦）

```bash
# 運行完整測試
bun run test:playback

# 運行測試並顯示完整報告
bun run test:playback:report
```

### 方法 2: 在應用內運行測試

1. 啟動應用
```bash
bun run start
```

2. 訪問測試頁面
   - 在應用中導航到：`/playback-comprehensive-test`
   - 或在瀏覽器中訪問測試路由

3. 點擊「開始測試」按鈕

4. 等待測試完成（約30-60秒）

5. 查看結果並可選擇導出報告

### 方法 3: 使用代碼直接調用

```typescript
import { playbackTester } from '@/utils/playbackTester';

// 運行所有測試
const report = await playbackTester.runAllTests();

// 查看結果
console.log('成功率:', report.successRate);
console.log('支援平台:', report.supportedCount);

// 導出為 Markdown
const markdown = playbackTester.exportReportAsMarkdown(report);
console.log(markdown);
```

---

## 📊 測試報告說明

### 報告內容

測試完成後會生成兩個檔案：

1. **PLAYBACK_TEST_REPORT.md** - 詳細的 Markdown 報告
   - 包含完整統計數據
   - 分類別和平台的詳細分析
   - 支援/不支援平台列表
   - 改進建議

2. **playback-test-report.json** - JSON 格式報告
   - 可供程序讀取的結構化數據
   - 包含每個平台的測試結果
   - 適合自動化分析

### 測試指標

#### 支援級別

- **✅ 完全支援 (High Confidence)**
  - 平台正確識別
  - 播放器選擇正確
  - 所有功能可用
  - 預期可正常播放

- **⚠️ 部分支援 (Medium Confidence)**
  - 平台可識別但需額外配置
  - 可能需要用戶認證
  - 某些功能受限
  - 特定條件下可播放

- **❌ 不支援 (Unsupported)**
  - 平台無法識別
  - 缺少必要組件
  - DRM 保護或技術限制
  - 無法播放

#### 成功率計算

```
成功率 = (完全支援數 + 部分支援數 × 0.5) / 總測試數 × 100%
```

---

## 🔍 測試項目

每個平台測試以下內容：

| 測試項 | 說明 |
|--------|------|
| **平台識別** | 系統能否正確識別平台類型 |
| **來源類型** | 判斷為 direct/stream/hls/youtube/vimeo/adult 等 |
| **播放器選擇** | 選擇 Native Player/WebView/Social Media Player |
| **認證需求** | 是否需要用戶登入 |
| **年齡驗證** | 成人內容是否觸發年齡驗證 |
| **Resolver** | 是否有可用的來源解析器 |
| **錯誤處理** | 錯誤情況的處理機制 |

---

## 📈 測試範圍

### 主流平台（13個）
- YouTube (含 Shorts)
- Vimeo (含 On Demand)
- Twitch
- Facebook Watch
- TikTok
- Twitter/X
- Instagram Reels
- Dailymotion
- Rumble
- Odysee
- Bilibili

### 成人平台（33個）
- 熱門：Pornhub, XVideos, XNXX, RedTube, YouPorn, SpankBang
- 直播：Chaturbate, Stripchat, LiveJasmin, BongaCams
- 其他：XHamster, Tube8, Beeg, 以及 20+ 其他平台

### 付費平台（14個）
- Brazzers, Reality Kings, Naughty America
- BangBros, Evil Angel, Wicked
- Vixen, Blacked, Tushy, Deeper
- POVD, POVR, POVTube, POVXXX

### 直播平台（7個）
- Chaturbate, Stripchat, LiveJasmin
- BongaCams, MyFreeCams, Cam4, Camsoda

### 串流格式（5個）
- Direct MP4
- HLS (m3u8)
- DASH (mpd)
- RTMP
- RTSP

### 雲端平台（2個）
- Google Drive
- Dropbox

**總計：74 個測試項目**

---

## 💡 理解測試結果

### 高成功率（80%+）
✅ 系統運作良好，大部分平台支援正常

### 中等成功率（60-79%）
⚠️ 部分平台需要優化，建議查看改進建議

### 低成功率（<60%）
❌ 需要重大改進，請檢查：
- 平台識別邏輯
- 播放器選擇機制
- Resolver 實現
- 錯誤處理

---

## 🛠️ 常見問題

### Q: 測試需要多久？
A: 約 30-60 秒，取決於網路速度和設備性能。

### Q: 測試會實際播放視頻嗎？
A: 不會。測試只檢查系統的識別和配置能力，不實際載入視頻內容。

### Q: 為什麼某些平台顯示「不支援」？
A: 可能原因：
- DRM 保護（Netflix, Disney+等）
- 缺少必要的 Resolver
- 平台結構變更
- 地區限制

### Q: 如何提高成功率？
A: 
1. 檢查不支援的平台
2. 實現缺失的 Resolver
3. 優化平台識別邏輯
4. 改進錯誤處理機制

### Q: 測試結果準確嗎？
A: 測試評估系統的配置能力，但實際播放還受以下因素影響：
- 網路連線品質
- 視頻可用性
- 地區限制
- 認證狀態

---

## 📝 持續改進

基於測試結果，您可以：

1. **識別弱點**
   - 查看不支援的平台
   - 分析失敗原因
   - 找出模式和趨勢

2. **優先級排序**
   - 先改進高需求平台
   - 處理常見錯誤類型
   - 優化關鍵功能

3. **實施改進**
   - 添加新的 Resolver
   - 優化平台識別
   - 增強錯誤處理
   - 改善用戶體驗

4. **重新測試**
   - 驗證改進效果
   - 追蹤成功率變化
   - 確保沒有退化

---

## 🔗 相關文件

- `utils/playbackTester.ts` - 測試系統實現
- `utils/videoSourceDetector.ts` - 平台識別邏輯
- `lib/player/sources/SourceParserService.ts` - 來源解析服務
- `components/UniversalVideoPlayer.tsx` - 統一播放器組件
- `app/playback-comprehensive-test.tsx` - 測試UI頁面

---

## 📧 支援

如有問題或建議，請：
1. 查看生成的報告中的改進建議
2. 檢查相關代碼實現
3. 聯繫技術支援團隊

---

**祝測試順利！🎉**
