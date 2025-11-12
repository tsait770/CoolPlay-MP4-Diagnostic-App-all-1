# 📱 iOS 本地 MP4 播放測試指南

**測試目標**：驗證 iOS 本地 MP4 檔案播放功能  
**預計測試時間**：15-20 分鐘  
**測試設備**：iPhone（iOS 16+）

---

## 🎯 快速開始

### 步驟 1：準備測試檔案

在 iPhone 上準備以下測試檔案：
- ✅ 小型 MP4（< 10MB）
- ✅ 中型 MP4（10-50MB）  
- ✅ 大型 MP4（> 100MB）

**獲取測試檔案方式**：
- 從 Safari 下載到「檔案」App
- 使用 AirDrop 傳輸
- 從照片庫選擇

---

## 📋 測試案例

### 測試 1：基本本地播放

**步驟**：
1. 開啟 App
2. 前往「語音控制」頁面
3. 點擊「從網址載入」下方的「MP4 錯誤診斷器」按鈕
4. 點擊「📁 選擇影片」
5. 選取一個本地 MP4 檔案

**預期結果**：
- ✅ 檔案選取成功
- ✅ 自動開始診斷
- ✅ 顯示「本地文件處理」卡片
- ✅ 狀態顯示「✅ 已複製到快取」
- ✅ 診斷結果顯示「✅ 完美！視頻完全兼容」

**如果失敗**：
- 檢查控制台日誌（`[VideoHelpers]` 標籤）
- 確認錯誤類型（權限/空間/檔案不存在）

---

### 測試 2：實際播放

**步驟**：
1. 完成測試 1 的診斷
2. 點擊「載入並播放」按鈕
3. 等待播放器載入

**預期結果**：
- ✅ 顯示「Preparing local video...」
- ✅ 成功載入播放器
- ✅ 影片開始播放
- ✅ 控制介面正常（播放/暫停/快轉）

**如果失敗**：
- 檢查錯誤訊息
- 確認檔案格式（H.264 + AAC）
- 嘗試其他檔案

---

### 測試 3：重複選取相同檔案

**目的**：驗證快取重用機制

**步驟**：
1. 選取同一個 MP4 檔案
2. 再次診斷

**預期結果**：
- ✅ 診斷更快（< 100ms）
- ✅ 顯示「✅ 使用已快取文件」
- ✅ 無重複複製動作

---

### 測試 4：大檔案處理

**步驟**：
1. 選取 > 100MB 的 MP4
2. 觀察複製進度

**預期結果**：
- ✅ 顯示「Preparing local video...」
- ✅ 複製時間合理（< 10 秒）
- ✅ 成功播放

**效能標準**：
- 100MB 檔案：< 5 秒
- 500MB 檔案：< 15 秒

---

### 測試 5：照片庫影片

**步驟**：
1. 在診斷器選擇影片
2. 切換到「照片」
3. 選取照片庫中的影片

**預期結果**：
- ✅ 成功選取 `ph://` URI
- ✅ 自動複製到快取
- ✅ 診斷與播放成功

---

### 測試 6：權限拒絕

**步驟**：
1. 前往 iPhone 設定
2. 找到 App → 檔案與資料夾
3. 關閉所有權限
4. 嘗試選取檔案

**預期結果**：
- ✅ 顯示權限請求
- ✅ 或顯示友善錯誤訊息
- ✅ 提供解決建議

---

### 測試 7：儲存空間不足

**模擬方式**：選取超大檔案（> 可用空間）

**預期結果**：
- ✅ 顯示「NO_SPACE」錯誤
- ✅ 提示清理空間
- ✅ App 不崩潰

---

### 測試 8：遠端 URL（對照組）

**步驟**：
1. 在診斷器輸入遠端 MP4 URL
2. 診斷並播放

**測試 URL**：
```
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```

**預期結果**：
- ✅ 不執行檔案準備
- ✅ 直接診斷 URL
- ✅ 播放正常

---

## 📊 測試報告模板

```markdown
### iOS 本地 MP4 播放測試報告

**測試日期**：[日期]  
**測試設備**：[iPhone 型號 + iOS 版本]  
**測試人員**：[姓名]

#### 測試結果

| # | 測試案例 | 結果 | 備註 |
|---|---------|------|------|
| 1 | 基本本地播放 | ✅/❌ | |
| 2 | 實際播放 | ✅/❌ | |
| 3 | 重複選取 | ✅/❌ | |
| 4 | 大檔案處理 | ✅/❌ | |
| 5 | 照片庫影片 | ✅/❌ | |
| 6 | 權限拒絕 | ✅/❌ | |
| 7 | 儲存空間不足 | ✅/❌ | |
| 8 | 遠端 URL | ✅/❌ | |

#### 發現的問題

[列出所有問題與錯誤截圖]

#### 日誌摘要

[貼上關鍵日誌片段]

#### 建議

[測試人員的改進建議]
```

---

## 🔍 除錯指南

### 檢查日誌

**關鍵標籤**：
```
[VideoHelpers]  - 檔案準備工具
[MP4Player]     - 播放器
[MP4DiagnosticTool] - 診斷器
```

**成功的日誌模式**：
```
[VideoHelpers] ========== prepareLocalVideo START ==========
[VideoHelpers] Platform: ios
[VideoHelpers] 📋 iOS local file detected
[VideoHelpers] ✅ File copy completed
[VideoHelpers] ========== COPY SUCCESS ==========
```

**失敗的日誌模式**：
```
[VideoHelpers] ❌ copyToCache FAILED
[VideoHelpers] Error: PERMISSION_DENIED: ...
```

### 常見問題排查

**問題 1：診斷成功但播放失敗**

檢查項：
- [ ] 檔案格式（僅支援 H.264 + AAC）
- [ ] 檔案是否損壞
- [ ] 檢查播放器錯誤訊息

**問題 2：複製超時**

檢查項：
- [ ] 檔案大小
- [ ] 可用空間
- [ ] 裝置效能

**問題 3：權限錯誤**

檢查項：
- [ ] App 檔案權限設定
- [ ] 照片庫權限（若選取照片）
- [ ] iOS 版本限制

---

## 📝 提交測試結果

### 成功案例

請提供：
1. ✅ 測試通過截圖
2. ✅ 播放影片截圖
3. ✅ 關鍵日誌

### 失敗案例

請提供：
1. ❌ 錯誤訊息截圖
2. ❌ 完整日誌檔案
3. ❌ 測試檔案資訊（大小、格式）
4. ❌ 裝置資訊（型號、iOS 版本）

### 提交方式

- Email：[專案經理信箱]
- Slack：#testing 頻道
- GitHub Issue：帶標籤 `test-report`

---

## 🚀 自動化測試（未來）

### 單元測試範例

```typescript
describe('prepareLocalVideo', () => {
  it('should copy iOS local file to cache', async () => {
    const uri = 'file:///test/video.mp4';
    const result = await prepareLocalVideo(uri);
    
    expect(result.success).toBe(true);
    expect(result.uri).toContain('cacheDirectory');
    expect(result.needsCopy).toBe(true);
  });
  
  it('should handle remote URL without copying', async () => {
    const uri = 'https://example.com/video.mp4';
    const result = await prepareLocalVideo(uri);
    
    expect(result.success).toBe(true);
    expect(result.uri).toBe(uri);
    expect(result.needsCopy).toBe(false);
  });
});
```

---

## ✅ 驗收標準

測試通過條件：
- ✅ 所有 8 個測試案例通過
- ✅ 無崩潰或嚴重錯誤
- ✅ 錯誤訊息清晰友善
- ✅ 效能符合標準

---

**祝測試順利！** 🎉

如有任何問題，請參考 `IOS_LOCAL_MP4_FIX_COMPLETE.md` 完整文件。
