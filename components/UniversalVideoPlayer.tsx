import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { detectVideoSource, canPlayVideo } from '@/utils/videoSourceDetector';
import { getSocialMediaConfig } from '@/utils/socialMediaPlayer';
import { useMembership } from '@/providers/MembershipProvider';
import SocialMediaPlayer from '@/components/SocialMediaPlayer';
import YouTubePlayerStandalone from '@/components/YouTubePlayerStandalone';
import MP4Player from '@/components/MP4Player';
import Colors from '@/constants/colors';

export interface UniversalVideoPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onAgeVerificationRequired?: () => void;
  loadTimeout?: number;
  maxRetries?: number;
  onBackPress?: () => void;
}

export default function UniversalVideoPlayer({
  url,
  onError,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  onAgeVerificationRequired,
  loadTimeout = 30000,
  maxRetries = 4,
  onBackPress,
}: UniversalVideoPlayerProps) {
  const { tier } = useMembership();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Detect source info FIRST before anything else
  const sourceInfo = detectVideoSource(url);
  const playbackEligibility = canPlayVideo(url, tier);
  
  // Determine which player to use based on source info
  const shouldUseMp4Player =
    sourceInfo.type === 'direct' &&
    url && url.trim() !== '' &&
    (url.toLowerCase().endsWith('.mp4') ||
     url.toLowerCase().includes('.mp4?') ||
     url.toLowerCase().includes('/mp4/'));

  const shouldUseNativePlayer =
    !shouldUseMp4Player &&
    (sourceInfo.type === 'direct' ||
    sourceInfo.type === 'stream' ||
    sourceInfo.type === 'hls' ||
    sourceInfo.type === 'dash');

  // Only initialize native player if we're actually using it
  // For WebView-required URLs, skip native player initialization
  const shouldInitializeNativePlayer = shouldUseNativePlayer && url && url.trim() !== '';
  
  // Use null URL when we don't need the native player to prevent loading errors
  const nativePlayerUrl = shouldInitializeNativePlayer ? url : 'about:blank';
  
  const player = useVideoPlayer(nativePlayerUrl, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay && shouldInitializeNativePlayer) {
      player.play();
    }
  });
  
  console.log('[UniversalVideoPlayer] Source detection:', {
    url,
    type: sourceInfo.type,
    platform: sourceInfo.platform,
    requiresWebView: sourceInfo.requiresWebView,
    requiresAgeVerification: sourceInfo.requiresAgeVerification,
    canPlay: playbackEligibility.canPlay,
    shouldUseMp4Player,
  });

  useEffect(() => {
    if (isScrolling) {
      Animated.timing(backButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backButtonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isScrolling, backButtonOpacity]);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 120);
  }, []);

  const handleBackPress = useCallback(() => {
    // Call parent's back handler to clear the video
    if (onBackPress) {
      onBackPress();
    } else {
      // If no onBackPress handler, try to navigate back
      // Check if we can go back in WebView first (for multi-page navigation)
      if (webViewRef.current) {
        console.log('[UniversalVideoPlayer] Attempting WebView back navigation');
        // For now, just call onBackPress since we want to return to voice control
        // WebView history navigation is not the primary goal
      }
      // No router.back() call - parent should handle navigation
      console.log('[UniversalVideoPlayer] Back pressed, parent should handle navigation');
    }
  }, [onBackPress]);

  useEffect(() => {
    console.log('[UniversalVideoPlayer] Initialized with:', {
      url,
      sourceType: sourceInfo.type,
      platform: sourceInfo.platform,
      membershipTier: tier,
      canPlay: playbackEligibility.canPlay,
    });

    if (!playbackEligibility.canPlay) {
      const error = playbackEligibility.reason || 'Cannot play this video';
      setPlaybackError(error);
      if (onError) onError(error);
    }

    if (sourceInfo.requiresAgeVerification) {
      console.log('[UniversalVideoPlayer] Age verification required');
      if (onAgeVerificationRequired) onAgeVerificationRequired();
    }
  }, [url, sourceInfo.type, sourceInfo.platform, sourceInfo.requiresAgeVerification, tier, playbackEligibility.canPlay, playbackEligibility.reason, onError, onAgeVerificationRequired]);

  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
        onPlaybackStart?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (player) {
      player.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (seconds: number) => {
    if (player) {
      const currentTime = player.currentTime || 0;
      const newPosition = Math.max(0, currentTime + seconds);
      player.currentTime = newPosition;
    }
  };

  useEffect(() => {
    if (!player) return;
    
    // Only listen to native player events if we're actually using the native player
    if (!shouldUseNativePlayer || !shouldInitializeNativePlayer) {
      return;
    }

    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
        if (autoPlay) {
          onPlaybackStart?.();
        }
      } else if (status.status === 'error') {
        // Only report errors if we're actually using the native player
        if (!shouldInitializeNativePlayer) {
          return;
        }
        
        // Extract readable error message
        let errorMsg = 'Unknown playback error';
        if (status.error) {
          if (typeof status.error === 'object' && 'message' in status.error) {
            errorMsg = String((status.error as any).message || 'Unknown error');
          } else if (typeof status.error === 'string') {
            errorMsg = status.error;
          } else {
            errorMsg = JSON.stringify(status.error);
          }
        }
        
        console.error('[UniversalVideoPlayer] Native player error:', {
          error: status.error,
          errorMessage: errorMsg,
          url,
          sourceType: sourceInfo.type,
          platform: sourceInfo.platform,
          shouldUseNativePlayer,
          shouldInitializeNativePlayer,
          shouldUseWebView: sourceInfo.requiresWebView,
        });
        
        const fullErrorMsg = `Playback error: ${errorMsg}`;
        setPlaybackError(fullErrorMsg);
        onError?.(fullErrorMsg);
      }
    });

    return () => {
      subscription.remove();
      statusSubscription.remove();
    };
  }, [player, autoPlay, onPlaybackStart, onError, url, sourceInfo.type, sourceInfo.platform, shouldUseNativePlayer, shouldInitializeNativePlayer, sourceInfo.requiresWebView]);

  const getVimeoEmbedUrl = (videoId: string): string => {
    return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}`;
  };

  const handleLoadTimeout = () => {
    console.warn('[UniversalVideoPlayer] Load timeout exceeded');
    console.log('[UniversalVideoPlayer] Timeout Details:', {
      url,
      sourceType: sourceInfo.type,
      platform: sourceInfo.platform,
      retryCount,
      maxRetries,
      loadDuration: Date.now() - loadStartTime,
    });
    
    const timeoutError = `視頻載入超時\n\n載入時間超過 ${loadTimeout/1000} 秒。\n\n可能原因：\n• 網路連線速度較慢\n• 視頻伺服器回應緩慢\n• 視頻檔案過大\n\n建議：\n1. 檢查網路連線\n2. 稍後再試\n3. 嘗試使用其他網路環境`;
    
    if (retryCount < maxRetries) {
      console.log(`[UniversalVideoPlayer] Auto-retry initiated (${retryCount + 1}/${maxRetries})`);
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      setPlaybackError(null);
    } else {
      console.error('[UniversalVideoPlayer] Max retries reached, giving up');
      setPlaybackError(timeoutError);
      setIsLoading(false);
      onError?.(timeoutError);
    }
  };

  const startLoadTimeout = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    loadTimeoutRef.current = setTimeout(handleLoadTimeout, loadTimeout);
    setLoadStartTime(Date.now());
  };

  const clearLoadTimeout = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    const loadTime = Date.now() - loadStartTime;
    console.log(`[UniversalVideoPlayer] Load completed in ${loadTime}ms`);
  };

  const renderWebViewPlayer = () => {
    if (sourceInfo.type === 'youtube') {
      console.log('[UniversalVideoPlayer] Using standalone YouTube player');
      return (
        <YouTubePlayerStandalone
          url={url}
          onError={onError}
          onLoad={() => {
            setIsLoading(false);
            setRetryCount(0);
          }}
          isFullscreen={isFullscreen}
          toggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onBackPress={onBackPress}
        />
      );
    }

    let embedUrl = url;
    let injectedJavaScript = '';

    if (sourceInfo.type === 'vimeo' && sourceInfo.videoId) {
      embedUrl = getVimeoEmbedUrl(sourceInfo.videoId);
      console.log('[UniversalVideoPlayer] Vimeo embed URL:', embedUrl);
    } else if (sourceInfo.type === 'adult') {
      injectedJavaScript = `
        (function() {
          var style = document.createElement('style');
          style.innerHTML = 'video { width: 100% !important; height: 100% !important; object-fit: contain; }';
          document.head.appendChild(style);
          
          setTimeout(function() {
            var videos = document.querySelectorAll('video');
            if (videos.length > 0) {
              videos[0].play().catch(function(e) { console.log('Autoplay blocked:', e); });
            }
          }, 1000);
        })();
      `;
    }

    console.log('[UniversalVideoPlayer] WebView rendering for:', sourceInfo.platform || 'Unknown');

    return (
      <View style={styles.webViewWrapper}>
        <WebView
        ref={webViewRef}
        source={{ 
          uri: embedUrl,
          headers: sourceInfo.type === 'youtube' ? {
            'User-Agent': retryCount >= 3 
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
              : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.youtube.com/',
            'DNT': '1',
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
          } : sourceInfo.type === 'adult' ? {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7,ja;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
          } : {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }}
        style={styles.webView}
        originWhitelist={['http://*', 'https://*', 'about:*']}
        onShouldStartLoadWithRequest={(request) => {
          // Prevent loading non-HTTP(S) scheme URLs
          const url = request.url;
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
            console.log('[UniversalVideoPlayer] Blocked non-HTTP(S) URL scheme:', url);
            return false;
          }
          return true;
        }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={sourceInfo.type !== 'adult'}
        thirdPartyCookiesEnabled={sourceInfo.type !== 'adult'}
        mixedContentMode="always"
        cacheEnabled={sourceInfo.type !== 'adult'}
        incognito={sourceInfo.type === 'adult'}
        // YouTube 特定配置
        allowsProtectedMedia={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        scalesPageToFit={false}
        bounces={true}
        scrollEnabled={sourceInfo.type !== 'youtube'}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={(injectedJavaScript || '') + `
          (function() {
            try {
              document.body.style.margin = '0';
              document.body.style.padding = '0';
              document.body.style.overflow = 'hidden';
              document.documentElement.style.overflow = 'hidden';
              
              var style = document.createElement('style');
              style.innerHTML = '* { -webkit-overflow-scrolling: touch !important; } body { overscroll-behavior: contain; }';
              if (document.head) {
                document.head.appendChild(style);
              }
              
              let scrollTimer;
              window.addEventListener('scroll', function() {
                window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'scroll_start' }));
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(function() {
                  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'scroll_stop' }));
                }, 100);
              }, { passive: true });
              
              console.log('[WebView] Page styles and scroll detection injected successfully');
            } catch(e) {
              console.error('[WebView] Failed to inject styles:', e);
            }
          })();
        `}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>{`Loading ${sourceInfo.platform || 'video'}...`}</Text>
          </View>
        )}
        onLoadStart={() => {
          console.log('[UniversalVideoPlayer] WebView load started for', sourceInfo.platform);
          setIsLoading(true);
          startLoadTimeout();
        }}
        onLoadEnd={() => {
          console.log('[UniversalVideoPlayer] WebView load ended for', sourceInfo.platform);
          clearLoadTimeout();
          setIsLoading(false);
          setRetryCount(0);
        }}
        onScroll={handleScroll}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'scroll_start') {
              handleScroll();
            } else if (data.type === 'scroll_stop') {
              if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
              }
              setIsScrolling(false);
            }
          } catch (e) {}
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          
          // Ignore errors from non-HTTP(S) scheme redirects
          if (nativeEvent.code === 0 && nativeEvent.description && 
              nativeEvent.description.toLowerCase().includes('scheme that is not http')) {
            console.log('[UniversalVideoPlayer] Ignored non-HTTP(S) scheme redirect attempt');
            return;
          }
          
          console.error('[UniversalVideoPlayer] WebView error:', JSON.stringify({
            code: nativeEvent.code,
            description: nativeEvent.description,
            domain: nativeEvent.domain,
            url: nativeEvent.url,
            canGoBack: nativeEvent.canGoBack,
            canGoForward: nativeEvent.canGoForward,
            loading: nativeEvent.loading,
          }, null, 2));
          clearLoadTimeout();
          
          if (sourceInfo.type === 'youtube') {
            console.log('[UniversalVideoPlayer] YouTube loading error:', {
              error: nativeEvent,
              retryCount,
              embedUrl,
            });
            
            if (retryCount < maxRetries) {
              console.log(`[UniversalVideoPlayer] Retrying YouTube with alternative method (${retryCount + 1}/${maxRetries})`);
              console.log('[UniversalVideoPlayer] Next attempt will use different embed strategy');
              const retryDelay = Math.min(2000 * (retryCount + 1), 6000);
              console.log(`[UniversalVideoPlayer] Retry delay: ${retryDelay}ms`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setPlaybackError(null);
              }, retryDelay);
              return;
            }
            
            console.error('[UniversalVideoPlayer] All YouTube retry attempts exhausted');
            console.error('[UniversalVideoPlayer] Final Error Report:', {
              videoId: sourceInfo.videoId,
              totalAttempts: maxRetries + 1,
              error: nativeEvent,
            });
            
            const error = `YouTube 播放失敗 (Error Code 4)\n\n嘗試了 ${maxRetries + 1} 種播放方式，視頻無法載入\n\n🔍 可能原因：\n1. 視頻設定為私人/不公開\n2. 視頻已被刪除或下架\n3. 禁止嵌入到第三方應用\n4. 地區限制（您的地區不可觀看）\n5. 年齡限制內容（需要登入驗證）\n6. 版權限制\n\n📋 視頻資訊：\nVideo ID: ${sourceInfo.videoId}\nYouTube URL: https://youtu.be/${sourceInfo.videoId}\n\n🛠️ 診斷步驟：\n1. 在瀏覽器直接打開 YouTube 連結測試\n2. 確認視頻存在且可公開訪問\n3. 檢查視頻設定是否允許嵌入\n4. 使用 VPN 嘗試其他地區\n5. 等待幾分鐘後重試\n\n💡 建議：\n如果這是您自己的視頻，請前往 YouTube Studio 檢查嵌入設定\n如果問題持續，請聯繫技術支援並提供 Video ID`;
            setPlaybackError(error);
            onError?.(error);
            return;
          }
          
          // For adult platforms, provide more helpful error messages
          if (sourceInfo.type === 'adult') {
            console.log(`[UniversalVideoPlayer] Adult platform error for ${sourceInfo.platform}`);
            if (retryCount < maxRetries) {
              console.log(`[UniversalVideoPlayer] Auto-retry for adult platform (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setPlaybackError(null);
              }, 2000);
            } else {
              const error = `${sourceInfo.platform} 無法載入。這可能是由於網站結構變更或網路問題。請確認連結有效或稍後再試。`;
              setPlaybackError(error);
              onError?.(error);
            }
          } else {
            if (retryCount < maxRetries) {
              console.log(`[UniversalVideoPlayer] Auto-retry after error (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setPlaybackError(null);
              }, 1000);
            } else {
              const error = `Failed to load ${sourceInfo.platform}: ${nativeEvent.description}`;
              setPlaybackError(error);
              onError?.(error);
            }
          }
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[UniversalVideoPlayer] WebView HTTP error:', JSON.stringify({
            statusCode: nativeEvent.statusCode,
            url: nativeEvent.url,
            description: nativeEvent.description,
            title: nativeEvent.title,
            canGoBack: nativeEvent.canGoBack,
            canGoForward: nativeEvent.canGoForward,
            loading: nativeEvent.loading,
          }, null, 2));
          console.error('[UniversalVideoPlayer] HTTP Error Details:', JSON.stringify({
            statusCode: nativeEvent.statusCode,
            url: nativeEvent.url,
            description: nativeEvent.description,
            sourceType: sourceInfo.type,
            platform: sourceInfo.platform,
            retryCount,
          }, null, 2));
          clearLoadTimeout();
          
          if (nativeEvent.statusCode >= 400) {
            let errorMessage = '';
            let shouldRetry = false;
            let isYouTubeError4Related = false;
            
            switch (nativeEvent.statusCode) {
              case 401:
                errorMessage = '視頻需要身份驗證\n\n此視頻需要登入才能播放。請確認：\n• 您已在該網站登入\n• 視頻不是私人或受限內容\n\n建議在瀏覽器中開啟此連結以進行身份驗證。';
                break;
              case 403:
                // HTTP 403 is commonly associated with YouTube Error Code 4
                isYouTubeError4Related = sourceInfo.type === 'youtube';
                if (isYouTubeError4Related) {
                  errorMessage = `YouTube 錯誤碼 4 檢測\n\n此視頻無法播放，常見原因：\n• 視頻被設為「私人」或「不公開」\n• 視頻已被刪除或下架\n• 視頻禁止嵌入播放\n• 地區限制（您所在地區無法觀看）\n• 年齡限制內容\n• 版權限制\n\n來源: ${sourceInfo.platform}\nVideo ID: ${sourceInfo.videoId}\n當前嘗試: ${retryCount + 1}/${maxRetries + 1}\n\n建議解決方案：\n1. 在 YouTube 網站直接測試該連結\n2. 確認視頻設定允許嵌入\n3. 檢查視頻是否在您的地區可用\n4. 使用 VPN 嘗試不同地區\n5. ��繫視頻上傳者確認權限設定`;
                  shouldRetry = retryCount < maxRetries;
                } else {
                  errorMessage = `視頻訪問被拒絕 (403 Forbidden)\n\n無法播放此視頻，可能原因：\n• 視頻來源阻止嵌入播放\n• 需要特定的權限或訂閱\n• 地區限制\n• 防盜鏈保護\n\n來源: ${sourceInfo.platform || '未知'}\n\n建議：\n1. 嘗試在瀏覽器中直接開啟連結\n2. 確認視頻允許嵌入播放\n3. 檢查是否需要登入或訂閱\n4. 使用 VPN 嘗試不同地區`;
                  shouldRetry = retryCount < maxRetries;
                }
                break;
              case 404:
                errorMessage = '視頻不存在 (404 Not Found)\n\n找不到此視頻，可能原因：\n• 視頻已被刪除\n• 連結錯誤或已過期\n• 視頻ID不正確\n\n請檢查連結是否正確。';
                break;
              case 429:
                errorMessage = '請求過於頻繁 (429 Too Many Requests)\n\n暫時無法載入視頻。伺服器偵測到過多請求。\n請稍候 30-60 秒後再試。';
                shouldRetry = retryCount < maxRetries;
                break;
              case 451:
                errorMessage = '內容因法律原因無法訪問 (451 Unavailable For Legal Reasons)\n\n此視頻在您所在地區受到法律限制。';
                break;
              default:
                if (nativeEvent.statusCode >= 500) {
                  errorMessage = `伺服器錯誤 (${nativeEvent.statusCode})\n\n視頻伺服器暫時無法回應。請稍後再試。`;
                  shouldRetry = retryCount < maxRetries;
                } else {
                  errorMessage = `HTTP 錯誤 ${nativeEvent.statusCode}\n\n無法載入視頻。請檢查連結是否正確。`;
                }
            }
            
            if (shouldRetry) {
              console.log(`[UniversalVideoPlayer] Retrying after HTTP ${nativeEvent.statusCode} (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setPlaybackError(null);
              }, 2000);
            } else {
              console.error(`[UniversalVideoPlayer] HTTP ${nativeEvent.statusCode} error for ${nativeEvent.url}`);
              setPlaybackError(errorMessage);
              onError?.(errorMessage);
            }
          }
        }}
        />
        <Animated.View
          style={[
            styles.backButtonContainer,
            { top: insets.top - 4, opacity: backButtonOpacity }
          ]}
          pointerEvents={isScrolling ? 'none' : 'auto'}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <ArrowLeft color="#ffffff" size={20} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderNativePlayer = () => {
    console.log('[UniversalVideoPlayer] Rendering native player for:', url);

    return (
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={() => setShowControls(true)}
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen
          allowsPictureInPicture
        />
        
        {showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek(-10)}
              >
                <SkipBack size={24} color="#fff" />
                <Text style={styles.controlButtonText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButtonLarge}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={48} color="#fff" fill="#fff" />
                ) : (
                  <Play size={48} color="#fff" fill="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek(10)}
              >
                <SkipForward size={24} color="#fff" />
                <Text style={styles.controlButtonText}>10s</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.controlButton} onPress={handleMute}>
                {isMuted ? (
                  <VolumeX size={24} color="#fff" />
                ) : (
                  <Volume2 size={24} color="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize size={24} color="#fff" />
                ) : (
                  <Maximize size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderError = () => {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={Colors.semantic.danger} />
        <Text style={styles.errorTitle}>Unable to Play Video</Text>
        <Text style={styles.errorMessage}>{playbackError}</Text>
        {!playbackEligibility.canPlay && (
          <Text style={styles.errorHint}>
            {tier === 'free' ? 'Upgrade to Basic or Premium for full access' : 'Please check your membership status'}
          </Text>
        )}
      </View>
    );
  };

  if (playbackError) {
    return renderError();
  }

  const socialMediaConfig = getSocialMediaConfig(url);
  const useSocialMediaPlayer = socialMediaConfig && 
    (sourceInfo.type === 'twitter' || sourceInfo.type === 'instagram' || sourceInfo.type === 'tiktok');

  const shouldUseWebView =
    !useSocialMediaPlayer &&
    (sourceInfo.requiresWebView ||
    sourceInfo.type === 'youtube' ||
    sourceInfo.type === 'vimeo' ||
    sourceInfo.type === 'webview' ||
    sourceInfo.type === 'adult' ||
    sourceInfo.type === 'twitter' ||
    sourceInfo.type === 'instagram' ||
    sourceInfo.type === 'tiktok' ||
    sourceInfo.type === 'twitch' ||
    sourceInfo.type === 'facebook' ||
    sourceInfo.type === 'dailymotion' ||
    sourceInfo.type === 'rumble' ||
    sourceInfo.type === 'odysee' ||
    sourceInfo.type === 'bilibili' ||
    sourceInfo.type === 'gdrive' ||
    sourceInfo.type === 'dropbox');

  const shouldUseNativePlayerRender =
    !useSocialMediaPlayer &&
    !shouldUseWebView &&
    (sourceInfo.type === 'direct' ||
    sourceInfo.type === 'stream' ||
    sourceInfo.type === 'hls' ||
    sourceInfo.type === 'dash');

  console.log('[UniversalVideoPlayer] Player selection:', {
    useSocialMediaPlayer,
    shouldUseWebView,
    shouldUseMp4Player,
    shouldUseNativePlayer: shouldUseNativePlayerRender,
    sourceType: sourceInfo.type,
  });

  // Validate URL after hooks
  if (!url || url.trim() === '') {
    console.warn('[UniversalVideoPlayer] No URL provided');
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.primary.textSecondary} />
          <Text style={styles.errorTitle}>No Video Selected</Text>
          <Text style={styles.errorMessage}>Please select a video to play</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {useSocialMediaPlayer ? (
        <SocialMediaPlayer
          url={url}
          onError={onError}
          onLoad={() => setIsLoading(false)}
          onPlaybackStart={onPlaybackStart}
          autoRetry={true}
          maxRetries={3}
          style={style}
          onBackPress={onBackPress}
        />
      ) : shouldUseMp4Player ? (
        <MP4Player
          uri={url}
          onError={onError}
          onLoad={() => {
            setIsLoading(false);
            setRetryCount(0);
          }}
          onPlaybackStart={onPlaybackStart}
          onPlaybackEnd={onPlaybackEnd}
          autoPlay={autoPlay}
          style={style}
          onBackPress={onBackPress}
        />
      ) : shouldUseWebView ? (
        renderWebViewPlayer()
      ) : shouldUseNativePlayerRender ? (
        renderNativePlayer()
      ) : (
        renderError()
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
  webViewWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 16,
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
  },
  errorHint: {
    fontSize: 12,
    color: Colors.primary.accent,
    marginTop: 16,
    textAlign: 'center',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1001,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(30, 30, 30, 0.53)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  } as any,
  backButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
