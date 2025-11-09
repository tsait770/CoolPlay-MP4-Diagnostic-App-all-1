# 🎬 運行播放測試 - 快速指令

## 立即運行測試

### Linux / macOS
```bash
chmod +x run-playback-test.sh && ./run-playback-test.sh
```

### Windows
```cmd
run-playback-test.bat
```

### 使用 Bun 直接運行
```bash
bun run scripts/run-playback-tests.ts
```

---

## 測試完成後

### 查看報告
```bash
cat PLAYBACK_TEST_REPORT.md
```

### 或在編輯器中打開
```bash
# macOS
open PLAYBACK_TEST_REPORT.md

# Linux  
xdg-open PLAYBACK_TEST_REPORT.md

# Windows
notepad PLAYBACK_TEST_REPORT.md
```

---

## 在應用中運行

1. 啟動應用
```bash
bun run start
```

2. 訪問測試頁面
- 路由: `/playback-comprehensive-test`

3. 點擊「開始測試」按鈕

4. 查看可視化報告

---

## 測試內容

✅ **74 個平台測試**
- 13 主流平台
- 33 成人平台
- 14 付費平台
- 7 直播平台
- 5 串流格式
- 2 雲端平台

✅ **測試項目**
- 平台識別
- 播放器選擇
- 認證需求
- 年齡驗證
- Resolver 可用性
- 錯誤處理

---

## 生成的文件

1. **PLAYBACK_TEST_REPORT.md** - Markdown 詳細報告
2. **playback-test-report.json** - JSON 結構化數據

---

## 預期結果

- **主流平台**: 85-95% 支援率
- **成人平台**: 75-90% 支援率
- **付費平台**: 60-75% 支援率
- **直播平台**: 70-85% 支援率
- **串流格式**: 95-100% 支援率
- **雲端平台**: 80-90% 支援率

**總體預期成功率**: 75-85%

---

## 更多信息

📚 完整文檔:
- `README_PLAYBACK_TESTING.md` - 測試指南
- `RUN_TEST_GUIDE.md` - 快速指南
- `PLAYBACK_TESTING_IMPLEMENTATION_COMPLETE.md` - 實施報告

---

**準備好了嗎？運行測試！🚀**

```bash
./run-playback-test.sh
```
