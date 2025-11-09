#!/bin/bash

# 🎬 影片播放系統測試執行腳本

echo "🎬 影片播放系統測試工具"
echo "========================================"
echo ""

# 檢查 bun 是否安裝
if ! command -v bun &> /dev/null; then
    echo "❌ 錯誤: 找不到 bun"
    echo "請安裝 bun: https://bun.sh"
    exit 1
fi

echo "📋 開始測試..."
echo ""

# 運行測試
bun run scripts/run-playback-tests.ts

# 檢查測試是否成功
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 測試完成！"
    echo ""
    echo "📄 報告已生成:"
    echo "  - PLAYBACK_TEST_REPORT.md (Markdown 格式)"
    echo "  - playback-test-report.json (JSON 格式)"
    echo ""
    echo "💡 查看報告:"
    echo "  cat PLAYBACK_TEST_REPORT.md"
    echo "  或"
    echo "  open PLAYBACK_TEST_REPORT.md"
else
    echo ""
    echo "❌ 測試失敗"
    echo "請檢查錯誤訊息"
    exit 1
fi
