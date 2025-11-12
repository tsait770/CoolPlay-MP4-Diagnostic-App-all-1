# iOS 本地 MP4 快取修復 - 測試清單

## 📋 快速測試指南

### 🎯 測試目標
驗證 iOS 上本地 MP4 檔案不再出現 `CACHE_UNAVAILABLE` 錯誤，並能正常播放。

---

## ✅ 測試步驟

### 步驟 1: 打開診斷器
1. 啟動 App (iOS 真機)
2. 進入語音控制或播放器頁面
3. 打開「MP4 錯誤診斷器」

### 步驟 2: 選擇本地檔案
1. 點擊「📁 選擇影片」按鈕
2. 從相簿或檔案 App 選擇一個本地 MP4 或 MOV 檔案
3. 等待自動診斷

### 步驟 3: 檢查日誌輸出
打開 Xcode 或 React Native Debugger，查看控制台日誌：

**✅ 預期輸出 (成功)**:
```
[VideoHelpers] ========== prepareLocalVideo START ==========
[VideoHelpers] Platform: ios
[VideoHelpers] Original URI: file:///.../Library/Caches/DocumentPicker/...
[VideoHelpers] File already in iOS cache directory
[VideoHelpers] Verifying direct access...
[VideoHelpers] ✅ File accessible directly from cache
[VideoHelpers] File size: XXXXX bytes
[VideoHelpers] Using original URI without copy
[VideoHelpers] ========== prepareLocalVideo END ==========
[VideoHelpers] Duration: XX ms
```

**❌ 錯誤輸出 (如果仍有問題)**:
```
[VideoHelpers] ❌ copyToCache FAILED
[VideoHelpers] Error: CACHE_UNAVAILABLE: Cache directory not available
```

### 步驟 4: 檢查診斷結果
在診斷器 UI 中應顯示：

- ✅ **本地文件處理**: 「使用已快取文件」或「直接訪問」
- ✅ **文件大小**: 顯示正確的檔案大小 (MB)
- ✅ **狀態圖示**: 綠色 ✅ (而不是紅色 ❌)

### 步驟 5: 測試播放
1. 如果診斷成功，點擊「載入並播放」
2. 確認影片能正常播放
3. 測試播放控制（暫停、快進、音量等）

---

## 🧪 測試案例

### 案例 1: 小檔案 (<10MB)
- 選擇一個小型 MP4 檔案
- ✅ 應立即載入（<100ms）
- ✅ 不應出現複製進度

### 案例 2: 大檔案 (>100MB)
- 選擇一個大型 MOV 檔案
- ✅ 應直接使用，不複製
- ✅ 節省時間和空間

### 案例 3: 不同來源
- **相簿選擇**: ✅ 應成功
- **檔案 App**: ✅ 應成功
- **iCloud Drive**: ✅ 應成功

### 案例 4: 連續選擇
- 快速選擇多個不同檔案
- ✅ 每個都應成功處理
- ✅ 不應崩潰或卡住

---

## 🔍 檢查項目

### 必須通過
- [ ] 不再出現 `CACHE_UNAVAILABLE` 錯誤
- [ ] 檔案可直接使用，無需複製
- [ ] 診斷器顯示「直接訪問」或「使用已快取文件」
- [ ] 影片可正常播放

### 效能檢查
- [ ] 載入時間 < 500ms (之前可能需要 2-5 秒)
- [ ] 不佔用額外儲存空間 (之前會複製一份)
- [ ] CPU 使用率低 (無複製操作)

### 錯誤處理
- [ ] 如果檔案損壞，顯示明確錯誤訊息
- [ ] 如果權限不足，提示使用者授權
- [ ] 提供有用的建議（recommendations）

---

## 📊 預期結果對比

| 指標 | 修復前 | 修復後 |
|-----|-------|-------|
| 錯誤率 | ~30% (CACHE_UNAVAILABLE) | <1% |
| 載入時間 | 2-5 秒 | <100ms |
| 儲存空間 | 2倍檔案大小 | 1倍檔案大小 |
| 使用者體驗 | ❌ 經常失敗 | ✅ 順暢流暢 |

---

## 🐛 如果測試失敗

### 問題: 仍然出現 CACHE_UNAVAILABLE
**可能原因**:
1. DocumentPicker 沒有使用 `copyToCacheDirectory: true`
2. 檔案不在 `/Caches/` 路徑
3. FileSystem.getInfoAsync 失敗

**解決方法**:
```bash
# 檢查日誌找出實際錯誤
# 查看 sourceUri 是否包含 /Caches/
# 驗證 expo-file-system 版本 (應為 ~19.0.17)
```

### 問題: 檔案可存取但無法播放
**可能原因**:
1. 檔案格式不支援 (檢查 codec)
2. 權限問題 (security-scoped resource)
3. 播放器設定問題

**解決方法**:
- 使用診斷器查看詳細錯誤
- 嘗試網路 URL 測試播放器本身
- 檢查檔案是否已損壞

---

## 📝 測試報告範本

```markdown
## 測試報告

**測試日期**: YYYY-MM-DD
**測試人員**: [姓名]
**測試裝置**: iPhone [型號], iOS [版本]

### 測試結果

| 測試案例 | 結果 | 備註 |
|---------|------|-----|
| 小檔案 (<10MB) | ✅/❌ | |
| 大檔案 (>100MB) | ✅/❌ | |
| 相簿選擇 | ✅/❌ | |
| 檔案 App | ✅/❌ | |
| 連續選擇 | ✅/❌ | |

### 效能數據
- 平均載入時間: ___ ms
- 錯誤發生次數: ___ / 10
- 儲存空間節省: ___ MB

### 問題與建議
[記錄任何問題或改進建議]

### 結論
[通過/失敗] - [簡短說明]
```

---

## 🎉 成功標準

修復被認為成功，如果：

1. ✅ **零 CACHE_UNAVAILABLE 錯誤** (至少 10 次測試)
2. ✅ **載入時間 < 500ms** (之前 2-5 秒)
3. ✅ **播放成功率 > 95%** (排除檔案本身問題)
4. ✅ **使用者體驗流暢** (無等待、無卡頓)

---

**最後更新**: 2025-01-12  
**修復版本**: iOS Cache Fix v1.0
