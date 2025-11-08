/**
 * 独立的 YouTube 播放器组件
 * 专门用于播放 YouTube 视频
 * 使用全新的架构，与其他播放器完全独立
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { youTubePlayerModule, YouTubePlayerConfig } from '@/utils/player/YouTubePlayerModule';
import Colors from '@/constants/colors';

export interface DedicatedYouTubePlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  onPlaybackStart?: () => void;
  autoPlay?: boolean;
  style?: any;
  maxRetries?: number;
  retryDelay?: number;
}

export default function DedicatedYouTubePlayer({
  url,
  onError,
  onLoad,
  onPlaybackStart,
  autoPlay = false,
  style,
  maxRetries = 5,
  retryDelay = 2000,
}: DedicatedYouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const webViewRef = useRef<WebView>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log('[DedicatedYouTubePlayer] Rendering with URL:', url);
  console.log('[DedicatedYouTubePlayer] Retry count:', retryCount);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [url, retryCount]);

  const initializePlayer = () => {
    console.log('[DedicatedYouTubePlayer] Initializing player...');

    if (!youTubePlayerModule.isValidYouTubeUrl(url)) {
      const errorMsg = 'Invalid YouTube URL format';
      console.error('[DedicatedYouTubePlayer]', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
      setIsLoading(false);
      return;
    }

    const config: YouTubePlayerConfig = {
      url,
      autoplay: autoPlay,
      controls: true,
      loop: false,
      muted: false,
    };

    const result = youTubePlayerModule.generateEmbedUrlWithFallback(config, retryCount);

    if (!result.isValid) {
      const errorMsg = result.errorMessage || 'Failed to generate YouTube embed URL';
      console.error('[DedicatedYouTubePlayer]', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
      setIsLoading(false);
      return;
    }

    console.log('[DedicatedYouTubePlayer] Setting embed URL:', result.embedUrl);
    console.log('[DedicatedYouTubePlayer] Video ID:', result.videoId);
    
    setEmbedUrl(result.embedUrl);
    setVideoId(result.videoId);
    setError(null);
    setIsLoading(true);
  };

  const handleLoadStart = () => {
    console.log('[DedicatedYouTubePlayer] Load started');
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    console.log('[DedicatedYouTubePlayer] Load ended');
    setIsLoading(false);
    setRetryCount(0);
    onLoad?.();
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[DedicatedYouTubePlayer] WebView error:', nativeEvent);

    if (retryCount < maxRetries) {
      const nextRetry = retryCount + 1;
      console.log(`[DedicatedYouTubePlayer] Scheduling retry ${nextRetry}/${maxRetries} in ${retryDelay}ms`);
      
      retryTimeoutRef.current = setTimeout(() => {
        console.log(`[DedicatedYouTubePlayer] Executing retry ${nextRetry}/${maxRetries}`);
        setRetryCount(nextRetry);
      }, retryDelay);
      
      return;
    }

    const errorMsg = `YouTube 播放失败\n\n错误详情: ${nativeEvent.description || 'Unknown error'}\n\n已尝试 ${maxRetries + 1} 次\n\n建议:\n1. 检查视频是否可嵌入\n2. 检查网络连接\n3. 在 YouTube 网站直接测试该视频\n4. 视频可能被设为私人或受地区限制`;
    
    console.error('[DedicatedYouTubePlayer] Max retries reached:', errorMsg);
    setError(errorMsg);
    setIsLoading(false);
    onError?.(errorMsg);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[DedicatedYouTubePlayer] HTTP error:', nativeEvent);

    const { statusCode } = nativeEvent;

    let errorMsg = '';

    switch (statusCode) {
      case 403:
        errorMsg = `YouTube 访问被拒绝 (403)\n\n可能原因:\n• 视频禁止嵌入播放\n• 地区限制\n• 视频已被删除或设为私人\n\nVideo ID: ${videoId}`;
        break;
      case 404:
        errorMsg = `视频不存在 (404)\n\n视频可能已被删除\nVideo ID: ${videoId}`;
        break;
      case 429:
        errorMsg = `请求过于频繁 (429)\n\n请稍后再试`;
        break;
      default:
        errorMsg = `HTTP 错误 ${statusCode}\n\n无法加载 YouTube 视频`;
    }

    if (retryCount < maxRetries && statusCode !== 404) {
      console.log(`[DedicatedYouTubePlayer] HTTP error ${statusCode}, retrying...`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(retryCount + 1);
      }, retryDelay);
      
      return;
    }

    console.error('[DedicatedYouTubePlayer] HTTP error:', errorMsg);
    setError(errorMsg);
    setIsLoading(false);
    onError?.(errorMsg);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[DedicatedYouTubePlayer] Message from WebView:', data);

      switch (data.type) {
        case 'playerReady':
          console.log('[DedicatedYouTubePlayer] Player is ready');
          setIsLoading(false);
          onPlaybackStart?.();
          break;
        case 'playerTimeout':
          console.warn('[DedicatedYouTubePlayer] Player load timeout');
          break;
        case 'error':
          console.error('[DedicatedYouTubePlayer] Player error:', data.message);
          break;
      }
    } catch (error) {
      console.warn('[DedicatedYouTubePlayer] Failed to parse WebView message:', error);
    }
  };

  const handleRetry = () => {
    console.log('[DedicatedYouTubePlayer] Manual retry triggered');
    setError(null);
    setRetryCount(0);
    initializePlayer();
  };

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>YouTube 播放失败</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          {retryCount < maxRetries && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!embedUrl) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>正在初始化 YouTube 播放器...</Text>
        </View>
      </View>
    );
  }

  const webViewConfig = youTubePlayerModule.getWebViewConfig(retryCount);
  const injectedJavaScript = youTubePlayerModule.generateInjectedJavaScript();

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{
          uri: embedUrl,
          headers: webViewConfig.headers,
        }}
        style={styles.webView}
        originWhitelist={['*']}
        allowsFullscreenVideo={webViewConfig.allowsFullscreenVideo}
        allowsInlineMediaPlayback={webViewConfig.allowsInlineMediaPlayback}
        mediaPlaybackRequiresUserAction={webViewConfig.mediaPlaybackRequiresUserAction}
        javaScriptEnabled={webViewConfig.javaScriptEnabled}
        domStorageEnabled={webViewConfig.domStorageEnabled}
        sharedCookiesEnabled={webViewConfig.sharedCookiesEnabled}
        thirdPartyCookiesEnabled={webViewConfig.thirdPartyCookiesEnabled}
        mixedContentMode={webViewConfig.mixedContentMode}
        cacheEnabled={webViewConfig.cacheEnabled}
        allowsProtectedMedia={webViewConfig.allowsProtectedMedia}
        scalesPageToFit={false}
        bounces={false}
        scrollEnabled={false}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={injectedJavaScript}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>
              {retryCount > 0 
                ? `正在重试... (${retryCount}/${maxRetries})` 
                : '正在加载 YouTube 视频...'}
            </Text>
          </View>
        )}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>
            {retryCount > 0 
              ? `正在重试... (${retryCount}/${maxRetries})` 
              : '正在加载 YouTube 视频...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
