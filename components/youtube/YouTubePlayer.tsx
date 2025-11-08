/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * YouTube Player Component (播放通道)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 职责：
 * - 接收解析后的视频信息
 * - 负责 WebView 播放器的渲染与控制
 * - 处理播放事件与错误
 * - 提供播放状态回调
 * 
 * ⚠️ 重要限制：
 * - 不得直接解析 URL（使用 YouTubeParser）
 * - 不得访问全局状态
 * - 使用本地状态 + 事件回调
 * - 单一职责：只负责播放
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';

export interface YouTubePlayerProps {
  videoId: string;
  embedUrl: string;
  autoPlay?: boolean;
  onReady?: () => void;
  onError?: (error: string, errorCode?: number) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onStateChange?: (state: 'playing' | 'paused' | 'buffering' | 'ended' | 'error') => void;
  style?: any;
  maxRetries?: number;
  retryDelay?: number;
  attemptNumber?: number;
}

interface PlayerState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  errorCode: number | null;
  retryCount: number;
  currentState: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';
}

export default function YouTubePlayer({
  videoId,
  embedUrl,
  autoPlay = false,
  onReady,
  onError,
  onPlaybackStart,
  onPlaybackEnd,
  onStateChange,
  style,
  maxRetries = 3,
  retryDelay = 2000,
  attemptNumber = 0,
}: YouTubePlayerProps) {
  const [state, setState] = useState<PlayerState>({
    isLoading: true,
    isReady: false,
    error: null,
    errorCode: null,
    retryCount: 0,
    currentState: 'loading',
  });

  const webViewRef = useRef<WebView>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log('[YouTubePlayer] Rendering:', {
    videoId,
    embedUrl,
    attemptNumber,
    retryCount: state.retryCount,
    currentState: state.currentState,
  });

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const getUserAgentForAttempt = (attempt: number): string => {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    ];

    return userAgents[attempt % userAgents.length];
  };

  const getWebViewHeaders = useCallback(() => {
    const userAgent = getUserAgentForAttempt(attemptNumber + state.retryCount);

    return {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.youtube.com/',
      'Origin': 'https://rork.app',
      'DNT': '1',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': state.retryCount >= 2 ? '?1' : '?0',
      'sec-ch-ua-platform': state.retryCount >= 2 ? '"iOS"' : '"Windows"',
    };
  }, [attemptNumber, state.retryCount]);

  const handleLoadStart = useCallback(() => {
    console.log('[YouTubePlayer] WebView load started');
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      currentState: 'loading',
    }));

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      console.warn('[YouTubePlayer] Load timeout - taking too long');
    }, 30000);
  }, []);

  const handleLoadEnd = useCallback(() => {
    console.log('[YouTubePlayer] WebView load ended');
    
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      isReady: true,
      retryCount: 0,
      currentState: 'ready',
    }));

    onReady?.();
  }, [onReady]);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[YouTubePlayer] WebView error:', nativeEvent);

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const errorDescription = nativeEvent.description || 'Unknown error';
    const errorCode = nativeEvent.code || null;

    if (state.retryCount < maxRetries) {
      const nextRetry = state.retryCount + 1;
      console.log(`[YouTubePlayer] Scheduling retry ${nextRetry}/${maxRetries} in ${retryDelay}ms`);
      
      retryTimeoutRef.current = setTimeout(() => {
        console.log(`[YouTubePlayer] Executing retry ${nextRetry}/${maxRetries}`);
        
        setState(prev => ({
          ...prev,
          retryCount: nextRetry,
          isLoading: true,
          error: null,
          currentState: 'loading',
        }));

        if (webViewRef.current) {
          webViewRef.current.reload();
        }
      }, retryDelay);
      
      return;
    }

    const errorMsg = `YouTube 播放失败\n\n错误: ${errorDescription}\n\n已尝试 ${maxRetries + 1} 次\n\nVideo ID: ${videoId}\n\n建议:\n1. 检查视频是否可嵌入\n2. 检查网络连接\n3. 视频可能被设为私人或受限\n4. 在 YouTube 网站直接测试该视频`;
    
    console.error('[YouTubePlayer] Max retries reached:', errorMsg);
    
    setState(prev => ({
      ...prev,
      error: errorMsg,
      errorCode,
      isLoading: false,
      currentState: 'error',
    }));

    onError?.(errorMsg, errorCode);
    onStateChange?.('error');
  }, [state.retryCount, maxRetries, retryDelay, videoId, onError, onStateChange]);

  const handleHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[YouTubePlayer] HTTP error:', nativeEvent);

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const { statusCode, description } = nativeEvent;

    const errorMessages: Record<number, string> = {
      403: `视频访问被拒绝 (HTTP 403)\n\n可能原因:\n• 视频禁止嵌入播放\n• 地区限制\n• 视频已被删除或设为私人\n\nVideo ID: ${videoId}`,
      404: `视频不存在 (HTTP 404)\n\n视频可能已被删除\n\nVideo ID: ${videoId}`,
      429: `请求过于频繁 (HTTP 429)\n\n请稍后再试`,
    };

    let errorMsg = errorMessages[statusCode] || `HTTP 错误 ${statusCode}\n\n${description || '无法加载 YouTube 视频'}`;

    if (state.retryCount < maxRetries && statusCode !== 404) {
      const nextRetry = state.retryCount + 1;
      console.log(`[YouTubePlayer] HTTP error ${statusCode}, scheduling retry ${nextRetry}/${maxRetries}`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          retryCount: nextRetry,
          isLoading: true,
          error: null,
        }));

        if (webViewRef.current) {
          webViewRef.current.reload();
        }
      }, retryDelay);
      
      return;
    }

    console.error('[YouTubePlayer] HTTP error:', errorMsg);
    
    setState(prev => ({
      ...prev,
      error: errorMsg,
      errorCode: statusCode,
      isLoading: false,
      currentState: 'error',
    }));

    onError?.(errorMsg, statusCode);
    onStateChange?.('error');
  }, [state.retryCount, maxRetries, retryDelay, videoId, onError, onStateChange]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[YouTubePlayer] Message from WebView:', data);
      
      if (data.type === 'playerReady') {
        console.log('[YouTubePlayer] Player is ready');
        setState(prev => ({
          ...prev,
          isReady: true,
          isLoading: false,
          currentState: 'ready',
        }));
        onReady?.();
      } else if (data.type === 'stateChange') {
        const playerState = data.state;
        console.log('[YouTubePlayer] Player state changed:', playerState);
        
        if (playerState === 'playing') {
          onPlaybackStart?.();
          onStateChange?.('playing');
        } else if (playerState === 'ended') {
          onPlaybackEnd?.();
          onStateChange?.('ended');
        } else if (playerState === 'paused') {
          onStateChange?.('paused');
        } else if (playerState === 'buffering') {
          onStateChange?.('buffering');
        }
      } else if (data.type === 'error') {
        console.error('[YouTubePlayer] Player error from iframe:', data);
        handleError({ nativeEvent: { description: data.message, code: data.errorCode } });
      }
    } catch (error) {
      console.warn('[YouTubePlayer] Failed to parse message:', error);
    }
  }, [onReady, onPlaybackStart, onPlaybackEnd, onStateChange, handleError]);

  const handleManualRetry = useCallback(() => {
    console.log('[YouTubePlayer] Manual retry triggered');
    
    setState({
      isLoading: true,
      isReady: false,
      error: null,
      errorCode: null,
      retryCount: 0,
      currentState: 'loading',
    });

    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  const injectedJavaScript = `
    (function() {
      var logPrefix = '[YouTube Player]';
      console.log(logPrefix, 'Injected script executing');
      
      window.addEventListener('error', function(e) {
        console.error(logPrefix, 'Error:', e.message);
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: e.message,
              errorCode: null
            }));
          }
        } catch (err) {
          console.error(logPrefix, 'Failed to post error message:', err);
        }
        return true;
      }, true);

      window.onerror = function(msg, url, line, col, error) {
        console.error(logPrefix, 'Global error:', msg);
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: msg,
              errorCode: null
            }));
          }
        } catch (err) {
          console.error(logPrefix, 'Failed to post global error:', err);
        }
        return true;
      };

      function setupIframe() {
        try {
          if (document.body) {
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'hidden';
            document.body.style.backgroundColor = '#000';
          }
          
          if (document.documentElement) {
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.backgroundColor = '#000';
          }
          
          var iframes = document.querySelectorAll('iframe');
          
          if (iframes.length > 0) {
            for (var i = 0; i < iframes.length; i++) {
              var iframe = iframes[i];
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
              iframe.style.position = 'absolute';
              iframe.style.top = '0';
              iframe.style.left = '0';
              iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
              iframe.setAttribute('allowfullscreen', 'true');
            }
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'playerReady',
                iframeCount: iframes.length
              }));
            }
            
            return true;
          }
        } catch (e) {
          console.error(logPrefix, 'Setup error:', e);
        }
        
        return false;
      }

      var attempts = 0;
      var maxAttempts = 30;
      
      function trySetup() {
        attempts++;
        
        if (setupIframe()) {
          console.log(logPrefix, 'Setup successful after', attempts, 'attempts');
        } else if (attempts < maxAttempts) {
          setTimeout(trySetup, 200);
        } else {
          console.warn(logPrefix, 'Max setup attempts reached');
        }
      }

      setTimeout(trySetup, 500);
      
    })();
    true;
  `;

  if (state.error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>YouTube 播放失败</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          
          {state.retryCount < maxRetries && (
            <TouchableOpacity style={styles.retryButton} onPress={handleManualRetry}>
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{
          uri: embedUrl,
          headers: getWebViewHeaders(),
        }}
        style={styles.webView}
        originWhitelist={['*']}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="always"
        cacheEnabled={true}
        allowsProtectedMedia={true}
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
              {state.retryCount > 0 
                ? `正在重试... (${state.retryCount}/${maxRetries})` 
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
      
      {state.isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>
            {state.retryCount > 0 
              ? `正在重试... (${state.retryCount}/${maxRetries})` 
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
