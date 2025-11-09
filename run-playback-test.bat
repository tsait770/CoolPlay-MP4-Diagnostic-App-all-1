@echo off
REM 🎬 影片播放系統測試執行腳本 (Windows)

echo 🎬 影片播放系統測試工具
echo ========================================
echo.

REM 檢查 bun 是否安裝
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 錯誤: 找不到 bun
    echo 請安裝 bun: https://bun.sh
    exit /b 1
)

echo 📋 開始測試...
echo.

REM 運行測試
bun run scripts/run-playback-tests.ts

REM 檢查測試是否成功
if %errorlevel% equ 0 (
    echo.
    echo ✅ 測試完成！
    echo.
    echo 📄 報告已生成:
    echo   - PLAYBACK_TEST_REPORT.md (Markdown 格式^)
    echo   - playback-test-report.json (JSON 格式^)
    echo.
    echo 💡 查看報告:
    echo   type PLAYBACK_TEST_REPORT.md
    echo   或
    echo   notepad PLAYBACK_TEST_REPORT.md
) else (
    echo.
    echo ❌ 測試失敗
    echo 請檢查錯誤訊息
    exit /b 1
)
