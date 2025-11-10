# 🎬 YouTube Dual-Mode System - Quick Reference Card

## 🎯 Quick Start (30 seconds)

1. Open app → Voice Control tab
2. Tap "Load from URL"
3. Paste YouTube URL
4. Video loads automatically
5. Use voice or tap controls

---

## 🗂️ File Reference

### New Files Created ✅
```
utils/youtubePlaybackManager.ts       ← Mode detection
components/YouTubeWebViewPlayer.tsx   ← WebView player
utils/youtubeVoiceControl.ts          ← Voice integration
utils/__tests__/youtubePlaybackTests.ts ← Test suite
```

### Modified Files ✅
```
components/UniversalVideoPlayer.tsx   ← Router (80 lines)
providers/VoiceControlProvider.tsx    ← Voice integration (80 lines)
```

---

## 🎮 Voice Commands Cheat Sheet

### Playback
- 播放 (play)
- 暫停 (pause)
- 停止 (stop)
- 重播 (replay)

### Skip
- 前進 10/20/30 秒 (forward)
- 後退 10/20/30 秒 (rewind)

### Volume
- 靜音 / 取消靜音 (mute/unmute)
- 音量提高 / 降低 / 最大 (volume up/down/max)

### Speed
- 0.5 / 1.25 / 1.5 / 2 倍速 (playback speed)

---

## 🔍 Troubleshooting (3-Step Fix)

### Video Won't Load
1. ✅ Check network connection
2. ✅ Verify video is public (test in browser)
3. ✅ Wait 30s and tap retry

### Voice Not Working
1. ✅ Enable microphone permission
2. ✅ Toggle "Always Listen" ON
3. ✅ Speak clear command

### Display Size Wrong
1. ✅ Rotate device to refresh
2. ✅ Close and reopen video
3. ✅ Check if video is actually YouTube

---

## 🎯 Mode Detection Logic

```
URL Type               →  Player Mode
─────────────────────────────────────
youtube.com/watch?v=   →  WebView ✅
youtu.be/              →  WebView ✅
m.youtube.com/watch    →  WebView ✅
youtube.com/shorts     →  WebView ✅
youtube.com/embed      →  Native ✅
Other platforms        →  Existing logic ✅
```

---

## 🔧 Debug Commands (Console)

```javascript
// Check if YouTube player is ready
(global as any).youtubeWebViewControls !== undefined

// Test play command
(global as any).youtubeWebViewControls?.play()

// Get current time
(global as any).youtubeWebViewControls?.getCurrentTime()

// Check mode for URL
const info = detectYoutubePlaybackMode('https://youtu.be/ABC');
console.log(info.mode); // 'webview'
```

---

## ✅ Verification Checklist

### Core Functionality
- [ ] YouTube videos load full screen
- [ ] Voice commands control playback
- [ ] Back button returns to main screen
- [ ] Loading states display correctly
- [ ] Error messages in Chinese

### Existing Features
- [ ] MP4 playback still works
- [ ] HLS streams still work
- [ ] Adult content still works
- [ ] Vimeo still works
- [ ] Voice control on other players works

---

## 📊 Testing URLs

### ✅ Use These for Testing

**Standard Watch:**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Short URL:**
```
https://youtu.be/dQw4w9WgXcQ
```

**Embed URL:**
```
https://www.youtube.com/embed/dQw4w9WgXcQ
```

**Shorts:**
```
https://www.youtube.com/shorts/EXAMPLE_ID
```

---

## 🚨 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| HTTP 403 | Embed disabled | Try different video |
| HTTP 404 | Video deleted | Check URL |
| Timeout | Slow network | Wait and retry |
| No audio | Muted | Say "取消靜音" |
| Wrong player | URL format | System auto-detects |

---

## 💡 Pro Tips

1. **Always Listen Mode** - Enable for hands-free control
2. **Share URLs** - Use YouTube's share button for clean URLs
3. **Public Videos** - Ensure videos are public/unlisted
4. **Network** - Use WiFi for best experience
5. **Commands** - Speak clearly and distinctly

---

## 📞 Quick Support

**Check Logs:**
```bash
grep '[YouTubeWebViewPlayer]' console
grep '[UniversalVideoPlayer]' console
grep '[VoiceControl]' console
```

**Test Mode Detection:**
```typescript
import { detectYoutubePlaybackMode } from '@/utils/youtubePlaybackManager';
const result = detectYoutubePlaybackMode(yourUrl);
console.log(result);
```

**Verify Voice Integration:**
```typescript
import { isYouTubeWebViewReady } from '@/utils/youtubeVoiceControl';
console.log('Ready:', isYouTubeWebViewReady());
```

---

## 🎉 Success Indicators

✅ Video loads full screen  
✅ "播放" makes video play  
✅ Back button → Voice Control screen  
✅ Loading spinner shows  
✅ MP4 still works  
✅ No crashes  

---

## 📦 What Changed

**Added:**
- YouTube mode detector
- YouTube WebView player
- Voice control integration

**Modified:**
- UniversalVideoPlayer (routing only)
- VoiceControlProvider (YouTube priority)

**Unchanged:**
- All existing players
- UI layout
- Navigation
- Voice control core

---

## 🏁 Final Check

Run this mental checklist:
1. ✅ Can load YouTube URLs?
2. ✅ Can control with voice?
3. ✅ Back button works?
4. ✅ MP4 still plays?
5. ✅ No console errors?

**If all ✅ → System working correctly!**

---

**Status:** Production Ready  
**Version:** 1.0.0  
**Date:** 2025-11-10  

---

**Quick Links:**
- 📖 Technical Docs: `YOUTUBE_DUAL_MODE_IMPLEMENTATION_COMPLETE.md`
- 📘 User Guide: `YOUTUBE_USER_GUIDE.md`
- 📊 Full Report: `YOUTUBE_COMPLETE_IMPLEMENTATION_REPORT.md`
