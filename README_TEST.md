# 🎬 播放系統測試 - README

> 全面測試您的影片播放器，支援 74+ 平台

---

## ⚡ 快速開始

### 運行測試（30秒）

**Linux/macOS:**
```bash
chmod +x run-playback-test.sh && ./run-playback-test.sh
```

**Windows:**
```cmd
run-playback-test.bat
```

**或使用 Bun:**
```bash
bun run scripts/run-playback-tests.ts
```

---

## 📊 測試內容

✅ **74 個平台測試**

| 類別 | 數量 |
|------|------|
| 主流平台 | 13 |
| 成人平台 | 33 |
| 付費平台 | 14 |
| 直播平台 | 7 |
| 串流格式 | 5 |
| 雲端平台 | 2 |

---

## 📈 測試指標

每個平台檢測：
- ✅ 平台識別
- ✅ 播放器選擇
- ✅ 認證需求
- ✅ 年齡驗證
- ✅ Resolver 可用性
- ✅ 錯誤處理

---

## 📄 輸出報告

運行後生成：

1. **PLAYBACK_TEST_REPORT.md** - 詳細 Markdown 報告
2. **playback-test-report.json** - JSON 結構化數據
3. **終端摘要** - 即時統計結果

---

## 🎯 預期成功率

- **主流平台**: 85-95%
- **成人平台**: 75-90%
- **串流格式**: 95-100%
- **總體**: 75-85%

---

## 📚 完整文檔

| 文檔 | 說明 |
|------|------|
| `TEST_NOW.md` | 快速命令參考 |
| `TESTING_SYSTEM_SUMMARY.md` | 系統摘要 |
| `README_PLAYBACK_TESTING.md` | 完整測試手冊 |
| `RUN_TEST_GUIDE.md` | 執行指南 |
| `PLAYBACK_TESTING_IMPLEMENTATION_COMPLETE.md` | 技術實施報告 |

---

## 💡 使用方式

### 1. 命令行測試
```bash
./run-playback-test.sh
```

### 2. 應用內測試
訪問: `/playback-comprehensive-test`

### 3. 代碼調用
```typescript
import { playbackTester } from '@/utils/playbackTester';
const report = await playbackTester.runAllTests();
```

---

## 🔍 查看報告

```bash
# Markdown 報告
cat PLAYBACK_TEST_REPORT.md

# JSON 報告  
cat playback-test-report.json

# 在編輯器中打開
open PLAYBACK_TEST_REPORT.md
```

---

## ✅ 完成檢查清單

- [ ] 運行測試
- [ ] 查看成功率
- [ ] 檢查不支援平台
- [ ] 閱讀改進建議
- [ ] 實施優化
- [ ] 重新測試驗證

---

## 🚀 立即開始

```bash
./run-playback-test.sh
```

等待 30-60 秒，查看報告！

---

**系統已就緒 | 開始測試 | 🎬**
