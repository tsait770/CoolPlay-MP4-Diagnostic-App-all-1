# 🎬 影片播放系統測試報告執行指南

## 🚀 快速運行測試

### Linux / macOS

```bash
# 給予執行權限（首次需要）
chmod +x run-playback-test.sh

# 運行測試
./run-playback-test.sh
```

### Windows

```cmd
# 直接運行
run-playback-test.bat
```

### 或使用 Bun 直接運行

```bash
bun run scripts/run-playback-tests.ts
```

---

## 📊 測試將檢測以下平台

### ✅ 完整測試列表（74個平台）

#### 主流平台（13個）
- YouTube, YouTube Shorts
- Vimeo, Vimeo On Demand
- Twitch, Facebook Watch
- TikTok, Twitter/X
- Instagram Reels, Dailymotion
- Rumble, Odysee, Bilibili

#### 成人平台（33個）
- Pornhub, XVideos, XNXX
- RedTube, Tktube, YouPorn
- SpankBang, XHamster, Tube8
- Beeg, Slutload, Empflix
- TNAFlix, PornoTube, DrPorn
- Nuvid, Porn.com, PornHD
- XTube, FreeOnes, PornMD
- PornPros, PornRabbit, PornSharing
- PornTrex, PornTube, PornVid
- PornVideos, PornVids, PornX
- PornXXX, Porny, PornZog, Porzo

#### 付費平台（14個）
- Brazzers, Reality Kings
- Naughty America, BangBros
- Evil Angel, Wicked
- Vixen, Blacked, Tushy, Deeper
- POVD, POVR, POVTube, POVXXX

#### 直播平台（7個）
- Chaturbate, Stripchat
- LiveJasmin, BongaCams
- MyFreeCams, Cam4, Camsoda

#### 串流格式（5個）
- Direct MP4 Video
- HLS (m3u8)
- DASH (mpd)
- RTMP Stream
- RTSP Stream

#### 雲端平台（2個）
- Google Drive
- Dropbox

---

## 📈 測試輸出

測試完成後會生成：

1. **終端輸出** - 即時顯示測試進度和結果摘要
2. **PLAYBACK_TEST_REPORT.md** - 完整的 Markdown 報告
3. **playback-test-report.json** - 結構化 JSON 數據

---

## 🎯 預期結果

基於當前系統實現，預期成功率：

| 類別 | 預期支援率 |
|------|-----------|
| 主流平台 | 85-95% |
| 成人平台 | 75-90% |
| 付費平台 | 60-75% |
| 直播平台 | 70-85% |
| 串流格式 | 95-100% |
| 雲端平台 | 80-90% |
| **總體** | **75-85%** |

---

## 💡 閱讀報告

### 快速查看

```bash
# Linux/macOS
cat PLAYBACK_TEST_REPORT.md

# Windows
type PLAYBACK_TEST_REPORT.md
```

### 用編輯器打開

```bash
# macOS
open PLAYBACK_TEST_REPORT.md

# Linux
xdg-open PLAYBACK_TEST_REPORT.md

# Windows
notepad PLAYBACK_TEST_REPORT.md
```

### 在應用中查看

1. 啟動應用
2. 訪問 `/playback-comprehensive-test`
3. 點擊「開始測試」
4. 查看可視化報告

---

## 🔧 故障排除

### 測試失敗

如果測試失敗，檢查：
1. 網路連線是否正常
2. 所有依賴是否已安裝（`bun install`）
3. TypeScript 是否有編譯錯誤

### 成功率低

如果成功率低於預期：
1. 查看報告中的「改進建議」章節
2. 檢查不支援平台的錯誤訊息
3. 驗證 `videoSourceDetector.ts` 配置

---

## 📚 更多信息

詳細文檔請參閱：
- `README_PLAYBACK_TESTING.md` - 完整測試指南
- `PLAYBACK_TEST_REPORT.md` - 最新測試報告

---

**準備好了嗎？運行測試吧！🚀**
