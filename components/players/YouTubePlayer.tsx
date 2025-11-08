/**
 * YouTube Player Component
 * Uses WebView + YouTube iFrame API for reliable playback
 * Handles Error 15, Error 4, and all common YouTube playback issues
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

export interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  onError?: (error: string) => void;
  onReady?: () => void;
  onStateChange?: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void;
  style?: any;
  maxRetries?: number;
}

const YOUTUBE_ERROR_MESSAGES: Record<number, string> = {
  2: '無效的參數錯誤\n視頻ID可能不正確',
  4: '視頻不可用\n可能是私人影片、已刪除或地區限制',
  5: 'HTML5 播放器錯誤\n請重新整理或稍後再試',
  15: '嵌入播放被禁止\n此視頻不允許在應用中播放',
  100: '視頻找不到\n視頻ID不存在或已被刪除',
  101: '嵌入限制\n視頻擁有者限制了嵌入播放',
  150: '嵌入播放限制\n此視頻不允許在嵌入式播放器中播放',
};

export default function YouTubePlayer({
  videoId,
  autoplay = false,
  onError,
  onReady,
  onStateChange,
  style,
  maxRetries = 4,
}: YouTubePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentStrategy, setCurrentStrategy] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multiple embed strategies to try
  const getEmbedStrategies = (): string[] => {
    const origin = 'https://rork.app';
    const baseParams = `autoplay=${autoplay ? '1' : '0'}&playsinline=1&rel=0&modestbranding=1&controls=1&iv_load_policy=3`;
    
    return [
      // Strategy 1: Standard embed with enablejsapi
      `https://www.youtube.com/embed/${videoId}?${baseParams}&enablejsapi=1&origin=${origin}`,
      // Strategy 2: No-cookie domain
      `https://www.youtube-nocookie.com/embed/${videoId}?${baseParams}&enablejsapi=1&origin=${origin}`,
      // Strategy 3: Without enablejsapi (some restricted videos work without it)
      `https://www.youtube.com/embed/${videoId}?${baseParams}`,
      // Strategy 4: No-cookie without enablejsapi
      `https://www.youtube-nocookie.com/embed/${videoId}?${baseParams}`,
      // Strategy 5: Minimal parameters
      `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? '1' : '0'}&playsinline=1`,
    ];
  };

  const embedUrl = getEmbedStrategies()[currentStrategy];

  const getUserAgent = (): string => {
    // Use desktop UA for first few attempts, then try mobile
    if (retryCount < 2) {
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    } else {
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    }
  };

  const handleLoadStart = () => {
    console.log('[YouTubePlayer] Load started:', {
      videoId,
      embedUrl,
      retryCount,
      currentStrategy,
    });
    setIsLoading(true);
    setError(null);

    // Set timeout for load
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(() => {
      handleLoadTimeout();
    }, 15000);
  };

  const handleLoadEnd = () => {
    console.log('[YouTubePlayer] Load ended successfully');
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    setIsLoading(false);
    setRetryCount(0);
    setCurrentStrategy(0);
    onReady?.();
  };

  const handleLoadTimeout = () => {
    console.warn('[YouTubePlayer] Load timeout');
    if (retryCount < maxRetries) {
      console.log(`[YouTubePlayer] Retrying (${retryCount + 1}/${maxRetries})`);
      const nextStrategy = (currentStrategy + 1) % getEmbedStrategies().length;
      setCurrentStrategy(nextStrategy);
      setRetryCount(prev => prev + 1);
    } else {
      const timeoutError = '視頻載入超時\n\n請檢查：\n• 網路連線是否正常\n• 視頻是否存在\n• 是否有地區限制';
      setError(timeoutError);
      onError?.(timeoutError);
      setIsLoading(false);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[YouTubePlayer] WebView error:', nativeEvent);
    
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    if (retryCount < maxRetries) {
      console.log(`[YouTubePlayer] Auto-retry after error (${retryCount + 1}/${maxRetries})`);
      setTimeout(() => {
        const nextStrategy = (currentStrategy + 1) % getEmbedStrategies().length;
        setCurrentStrategy(nextStrategy);
        setRetryCount(prev => prev + 1);
        setError(null);
      }, 2000);
    } else {
      const errorMessage = `YouTube 播放失敗\n\n${nativeEvent.description || '未知錯誤'}\n\n已嘗試 ${maxRetries + 1} 次\nVideo ID: ${videoId}`;
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[YouTubePlayer] HTTP error:', {
      statusCode: nativeEvent.statusCode,
      url: nativeEvent.url,
    });

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    let errorMessage = '';
    let shouldRetry = false;

    switch (nativeEvent.statusCode) {
      case 403:
        errorMessage = 'YouTube 錯誤碼 4/403\n\n此視頻無法播放，可能原因：\n• 視頻被設為私人或不公開\n• 視頻禁止嵌入播放\n• 地區限制\n• 視頻已被刪除';
        shouldRetry = retryCount < maxRetries;
        break;
      case 404:
        errorMessage = '視頻不存在 (404)\n\n此視頻ID不存在或已被刪除';
        break;
      case 429:
        errorMessage = '請求過於頻繁 (429)\n\n請稍候片刻後再試';
        shouldRetry = retryCount < maxRetries;
        break;
      default:
        errorMessage = `HTTP 錯誤 ${nativeEvent.statusCode}\n\n無法載入視頻`;
        shouldRetry = retryCount < maxRetries;
    }

    if (shouldRetry) {
      console.log(`[YouTubePlayer] Retrying after HTTP error (${retryCount + 1}/${maxRetries})`);
      setTimeout(() => {
        const nextStrategy = (currentStrategy + 1) % getEmbedStrategies().length;
        setCurrentStrategy(nextStrategy);
        setRetryCount(prev => prev + 1);
        setError(null);
      }, 2000);
    } else {
      setError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[YouTubePlayer] Message from player:', data);

      if (data.event === 'onStateChange') {
        switch (data.data) {
          case -1:
            onStateChange?.('buffering');
            break;
          case 0:
            onStateChange?.('ended');
            break;
          case 1:
            onStateChange?.('playing');
            setIsLoading(false);
            break;
          case 2:
            onStateChange?.('paused');
            break;
          case 3:
            onStateChange?.('buffering');
            break;
        }
      }

      if (data.event === 'onError') {
        const errorCode = data.data;
        const errorMsg = YOUTUBE_ERROR_MESSAGES[errorCode] || `YouTube 錯誤碼 ${errorCode}`;
        console.error('[YouTubePlayer] YouTube player error:', errorCode);
        
        if (retryCount < maxRetries && (errorCode === 4 || errorCode === 15 || errorCode === 150)) {
          console.log(`[YouTubePlayer] Retrying after YouTube error ${errorCode}`);
          setTimeout(() => {
            const nextStrategy = (currentStrategy + 1) % getEmbedStrategies().length;
            setCurrentStrategy(nextStrategy);
            setRetryCount(prev => prev + 1);
            setError(null);
          }, 2000);
        } else {
          setError(errorMsg);
          onError?.(errorMsg);
          setIsLoading(false);
        }
      }

      if (data.event === 'onReady') {
        console.log('[YouTubePlayer] Player ready');
        setIsLoading(false);
        onReady?.();
      }
    } catch (err) {
      console.error('[YouTubePlayer] Error parsing message:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const injectedJavaScript = `
    (function() {
      console.log('[YouTubePlayer] Injected script running');
      
      let player = null;
      let playerReady = false;
      
      function onYouTubeIframeAPIReady() {
        console.log('[YouTubePlayer] YouTube API ready');
        const iframe = document.querySelector('iframe');
        if (!iframe) {
          console.error('[YouTubePlayer] No iframe found');
          return;
        }
        
        try {
          player = new YT.Player(iframe, {
            events: {
              onReady: function(event) {
                console.log('[YouTubePlayer] onReady triggered');
                playerReady = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'onReady'
                }));
              },
              onStateChange: function(event) {
                console.log('[YouTubePlayer] onStateChange:', event.data);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'onStateChange',
                  data: event.data
                }));
              },
              onError: function(event) {
                console.error('[YouTubePlayer] onError:', event.data);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  event: 'onError',
                  data: event.data
                }));
              }
            }
          });
        } catch (error) {
          console.error('[YouTubePlayer] Error creating player:', error);
        }
      }
      
      if (typeof YT !== 'undefined' && YT.Player) {
        onYouTubeIframeAPIReady();
      } else {
        window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      }
      
      setTimeout(function() {
        const iframe = document.querySelector('iframe');
        const video = document.querySelector('video');
        if (iframe || video) {
          console.log('[YouTubePlayer] Player element detected');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'elementDetected'
          }));
        }
      }, 2000);
    })();
  `;

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>YouTube 播放錯誤</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>
            嘗試次數: {retryCount}/{maxRetries}
          </Text>
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
          headers: {
            'User-Agent': getUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8',
            'Referer': 'https://www.youtube.com/',
            'DNT': '1',
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
          },
        }}
        style={styles.webView}
        originWhitelist={['*']}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        mixedContentMode="always"
        scalesPageToFit={false}
        bounces={false}
        scrollEnabled={false}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={injectedJavaScript}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.loadingText}>
              載入 YouTube 視頻中...
              {retryCount > 0 && ` (嘗試 ${retryCount}/${maxRetries})`}
            </Text>
          </View>
        )}
        startInLoadingState
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>
            載入 YouTube 視頻中...
            {retryCount > 0 && `\n嘗試 ${retryCount}/${maxRetries}`}
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
    textAlign: 'center',
    paddingHorizontal: 24,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: Colors.accent.primary,
    marginTop: 8,
    textAlign: 'center',
  },
});
