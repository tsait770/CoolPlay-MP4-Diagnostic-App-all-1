# WebView 错误处理优化

## 问题描述
用户在使用视频播放器时遇到两个主要错误：

1. **NSURLErrorDomain -1002**: "不支援的URL" 错误
2. **Error Code 0**: "Redirection to URL with a scheme that is not HTTP(S)" 错误

这些错误通常由以下原因引起：
- 某些网站尝试重定向到非HTTP(S) URL scheme（如 `intent://`, `tel://`, `mailto://`, `app://` 等）
- WebView在加载过程中遇到不支持的URL格式

## 解决方案

### 1. 增强URL Scheme过滤
在 `UniversalVideoPlayer.tsx` 中的 `onShouldStartLoadWithRequest` 回调中：

```typescript
onShouldStartLoadWithRequest={(request) => {
  const reqUrl = request.url;
  
  // 允许 HTTP(S), about:, 和 data: schemes
  if (reqUrl.startsWith('http://') || reqUrl.startsWith('https://') || 
      reqUrl.startsWith('about:') || reqUrl.startsWith('data:')) {
    return true;
  }
  
  // 阻止其他schemes (intent://, tel://, mailto://, etc.)
  const schemeMatch = reqUrl.match(/^([a-z][a-z0-9+.-]*):/);
  const scheme = schemeMatch ? schemeMatch[1] : 'unknown';
  
  console.log('[UniversalVideoPlayer] Blocked non-HTTP(S) URL scheme:', {
    scheme,
    url: reqUrl,
  });
  
  // 静默阻止，不显示错误
  return false;
}}
```

### 2. 优化错误处理逻辑
在 `onError` 回调中添加错误过滤：

```typescript
onError={(syntheticEvent) => {
  const { nativeEvent } = syntheticEvent;
  
  // 忽略非HTTP(S) scheme重定向错误
  if (nativeEvent.code === 0) {
    const desc = String(nativeEvent.description || '').toLowerCase();
    if (desc.includes('scheme that is not http') || 
        desc.includes('redirection to url with a scheme')) {
      console.log('[UniversalVideoPlayer] Ignored non-HTTP(S) scheme redirect');
      return;
    }
  }
  
  // 忽略NSURLErrorDomain -1002 (不支援的URL)
  if (nativeEvent.code === -1002) {
    const desc = String(nativeEvent.description || '').toLowerCase();
    if (desc.includes('unsupported url') || desc.includes('不支援的url')) {
      console.log('[UniversalVideoPlayer] Ignored unsupported URL scheme error');
      return;
    }
  }
  
  // 只记录重要错误
  const isSignificantError = nativeEvent.code !== 0 && nativeEvent.code !== -1002;
  if (isSignificantError) {
    console.error('[UniversalVideoPlayer] WebView error:', {
      code: nativeEvent.code,
      description: nativeEvent.description,
      // ...
    });
  }
  
  // ... 继续处理其他错误
}}
```

## 改进效果

### 用户体验
- ✅ **消除误导性错误提示**: 用户不再看到因为scheme重定向导致的错误信息
- ✅ **静默处理非关键错误**: 自动过滤掉不影响播放的技术性错误
- ✅ **保持播放稳定性**: 只处理真正影响播放的错误

### 技术改进
- ✅ **精准的URL scheme验证**: 明确区分允许和禁止的URL schemes
- ✅ **详细的错误日志**: 记录被阻止的schemes以便调试
- ✅ **智能错误分类**: 区分重要和非重要错误

## 测试建议

### 1. 测试不同类型的视频源
- YouTube视频
- 成人网站视频
- 直播流（HLS/DASH）
- 社交媒体视频

### 2. 验证错误处理
- 观察控制台日志中被阻止的URL schemes
- 确认用户界面不显示误导性错误
- 验证正常视频可以正常播放

### 3. 边界情况
- 测试包含多次重定向的URL
- 测试包含特殊字符的URL
- 测试地区限制内容

## 注意事项

1. **日志监控**: 在开发模式下，注意观察控制台中关于被阻止schemes的日志
2. **错误码**: 以下错误码现在被静默处理：
   - `0`: URL scheme重定向错误
   - `-1002`: 不支持的URL错误
3. **用户反馈**: 如果某些合法内容无法播放，检查是否被错误过滤

## 相关文件
- `components/UniversalVideoPlayer.tsx` - 主要修改文件
- `utils/videoSourceDetector.ts` - URL源检测逻辑

## 未来优化方向
1. 添加更多白名单schemes（如果需要）
2. 提供用户自定义scheme过滤选项
3. 增强错误恢复机制
