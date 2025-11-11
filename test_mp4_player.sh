#!/bin/bash
echo "========================================="
echo "MP4 播放器模組測試"
echo "========================================="
echo ""

# 檢查檔案是否存在
echo "1. 檢查檔案存在性..."
if [ -f "components/Mp4Player.tsx" ]; then
    echo "   ✅ Mp4Player.tsx 存在"
else
    echo "   ❌ Mp4Player.tsx 不存在"
    exit 1
fi

if [ -f "components/Mp4Player.tsx.backup" ]; then
    echo "   ✅ 備份檔案存在"
else
    echo "   ⚠️  備份檔案不存在"
fi

echo ""

# 檢查檔案大小
echo "2. 檢查檔案大小..."
SIZE=$(wc -c < components/Mp4Player.tsx)
LINES=$(wc -l < components/Mp4Player.tsx)
echo "   檔案大小: $SIZE bytes"
echo "   程式碼行數: $LINES 行"

if [ $LINES -gt 400 ]; then
    echo "   ✅ 程式碼行數正常"
else
    echo "   ❌ 程式碼行數異常"
    exit 1
fi

echo ""

# 檢查關鍵 import
echo "3. 檢查關鍵依賴..."
if grep -q "expo-video" components/Mp4Player.tsx; then
    echo "   ✅ expo-video 導入正確"
else
    echo "   ❌ 缺少 expo-video 導入"
fi

if grep -q "lucide-react-native" components/Mp4Player.tsx; then
    echo "   ✅ lucide-react-native 導入正確"
else
    echo "   ❌ 缺少 lucide-react-native 導入"
fi

if grep -q "@/constants/colors" components/Mp4Player.tsx; then
    echo "   ✅ Colors 導入正確"
else
    echo "   ❌ 缺少 Colors 導入"
fi

echo ""

# 檢查關鍵功能
echo "4. 檢查關鍵功能實作..."
if grep -q "useExpoVideoPlayer" components/Mp4Player.tsx; then
    echo "   ✅ 使用 expo-video player"
else
    echo "   ❌ 未使用 expo-video player"
fi

if grep -q "voiceCommand" components/Mp4Player.tsx; then
    echo "   ✅ 語音控制整合存在"
else
    echo "   ❌ 缺少語音控制整合"
fi

if grep -q "handleSeek" components/Mp4Player.tsx; then
    echo "   ✅ 跳轉功能存在"
else
    echo "   ❌ 缺少跳轉功能"
fi

if grep -q "handlePlayPause" components/Mp4Player.tsx; then
    echo "   ✅ 播放/暫停功能存在"
else
    echo "   ❌ 缺少播放/暫停功能"
fi

echo ""

# 檢查其他播放器未被修改
echo "5. 檢查其他播放器未被修改..."
if [ -f "components/UniversalVideoPlayer.tsx" ]; then
    echo "   ✅ UniversalVideoPlayer.tsx 存在"
else
    echo "   ❌ UniversalVideoPlayer.tsx 不存在"
fi

if [ -f "components/DedicatedYouTubePlayer.tsx" ]; then
    echo "   ✅ DedicatedYouTubePlayer.tsx 存在"
else
    echo "   ❌ DedicatedYouTubePlayer.tsx 不存在"
fi

if [ -f "components/SocialMediaPlayer.tsx" ]; then
    echo "   ✅ SocialMediaPlayer.tsx 存在"
else
    echo "   ❌ SocialMediaPlayer.tsx 不存在"
fi

echo ""
echo "========================================="
echo "測試完成"
echo "========================================="
