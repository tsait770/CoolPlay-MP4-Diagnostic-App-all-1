import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
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
} from 'lucide-react-native';
import { detectVideoSource, canPlayVideo } from '@/utils/videoSourceDetector';
import { getSocialMediaConfig } from '@/utils/socialMediaPlayer';
import { useMembership } from '@/providers/MembershipProvider';
import SocialMediaPlayer from '@/components/SocialMediaPlayer';
import { logDiagnostic } from '@/utils/videoDiagnostics';
import { PlayerRouter } from '@/utils/player/PlayerRouter';
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
}: UniversalVideoPlayerProps) {
  const { tier } = useMembership();
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Detect source info FIRST before anything else
  const sourceInfo = detectVideoSource(url);
  const playbackEligibility = canPlayVideo(url, tier);
  
  // Determine which player to use based on source info
  const shouldUseNativePlayer =
    sourceInfo.type === 'direct' ||
    sourceInfo.type === 'stream' ||
    sourceInfo.type === 'hls' ||
    sourceInfo.type === 'dash';

  // Only initialize native player if we're actually using it
  // For WebView-required URLs, use a dummy URL for the native player to avoid errors
  // IMPORTANT: Always provide a valid URL - never empty string
  const validUrl = React.useMemo(() => {
    if (validatedUrl && validatedUrl.trim() !== '') return validatedUrl;
    if (url && url.trim() !== '') return url;
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }, [validatedUrl, url]);
  
  const safeUrl = React.useMemo(() => {
    if (shouldUseNativePlayer && validatedUrl && validatedUrl.trim() !== '') {
      return validatedUrl;
    }
    if (shouldUseNativePlayer && url && url.trim() !== '') {
      return url;
    }
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }, [shouldUseNativePlayer, validatedUrl, url]);
  
  // Route early to determine player type
  const routeResult = React.useMemo(() => {
    if (!url || url.trim() === '') {
      return {
        playerType: 'unknown' as const,
        sourceInfo: {
          type: 'unknown' as const,
          platform: 'Unknown',
          requiresPremium: false,
          error: 'Invalid URL: URL is empty',
          requiresWebView: false,
        },
        shouldUseNewPlayer: false,
        originalUrl: url || '',
        processedUrl: url || '',
        reason: 'Invalid URL',
      };
    }
    return PlayerRouter.getInstance().route(url);
  }, [url]);
  
  // Only initialize native player if needed
  const player = useVideoPlayer(safeUrl, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay && shouldUseNativePlayer) {
      player.play();
    }
  });
  
  console.log('[UniversalVideoPlayer] Player routing:', {
    url,
    playerType: routeResult.playerType,
    shouldUseNewPlayer: routeResult.shouldUseNewPlayer,
    reason: routeResult.reason,
  });
  
  console.log('[UniversalVideoPlayer] Source detection:', {
    url,
    type: sourceInfo.type,
    platform: sourceInfo.platform,
    requiresWebView: sourceInfo.requiresWebView,
    requiresAgeVerification: sourceInfo.requiresAgeVerification,
    canPlay: playbackEligibility.canPlay,
  });

  useEffect(() => {
    logDiagnostic(url);
  }, [url]);

  useEffect(() => {
    setValidatedUrl(url);
  }, [url]);

  useEffect(() => {
    console.log('[UniversalVideoPlayer] Initialized with:', {
      url,
      sourceType: sourceInfo.type,
      platform: sourceInfo.platform,
      membershipTier: tier,
      canPlay: playbackEligibility.canPlay,
      shouldUseNativePlayer,
      shouldUseWebView: sourceInfo.requiresWebView,
    });

    if (!playbackEligibility.canPlay) {
      const error = playbackEligibility.reason || 'Cannot play this video';
      console.error('[UniversalVideoPlayer] Playback not allowed:', error);
      setPlaybackError(error);
      if (onError) onError(error);
    }

    if (sourceInfo.requiresAgeVerification) {
      console.log('[UniversalVideoPlayer] Age verification required');
      if (onAgeVerificationRequired) onAgeVerificationRequired();
    }
  }, [url, sourceInfo.type, sourceInfo.platform, sourceInfo.requiresAgeVerification, tier, playbackEligibility.canPlay, playbackEligibility.reason, shouldUseNativePlayer, onError, onAgeVerificationRequired]);

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
          validUrl,
          safeUrl,
          sourceType: sourceInfo.type,
          platform: sourceInfo.platform,
          shouldUseNativePlayer,
          shouldUseWebView: sourceInfo.requiresWebView,
          playerStatus: player.status,
        });
        
        // If this is a URL that should use WebView, provide helpful error
        if (sourceInfo.requiresWebView || sourceInfo.type === 'youtube' || sourceInfo.type === 'adult') {
          errorMsg = `This ${sourceInfo.platform} video cannot be played with the native player. The video will be loaded in a web player instead.`;
          console.log('[UniversalVideoPlayer] Switching to WebView for:', sourceInfo.platform);
          // Don't set error, let WebView handle it
          return;
        }
        
        if (errorMsg.includes('source.uri') || errorMsg.includes('empty') || errorMsg.includes('invalid')) {
          errorMsg = `Invalid video source: ${errorMsg}`;
        }
        
        const fullErrorMsg = `Playback error: ${errorMsg}`;
        setPlaybackError(fullErrorMsg);
        onError?.(fullErrorMsg);
      }
    });

    return () => {
      subscription.remove();
      statusSubscription.remove();
    };
  }, [player, autoPlay, onPlaybackStart, onError, url, sourceInfo.type, sourceInfo.platform]);

  const getVimeoEmbedUrl = (videoId: string): string => {
    return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}`;
  };

  const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&playsinline=1&enablejsapi=1`;
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
    let embedUrl = url;
    let injectedJavaScript = '';

    if (sourceInfo.type === 'youtube' && sourceInfo.videoId) {
      embedUrl = getYouTubeEmbedUrl(sourceInfo.videoId);
    } else if (sourceInfo.type === 'vimeo' && sourceInfo.videoId) {
      embedUrl = getVimeoEmbedUrl(sourceInfo.videoId);
      console.log('[UniversalVideoPlayer] Vimeo embed URL:', embedUrl);
    } else if (sourceInfo.type === 'adult') {
      // Validate URL before using it
      if (!url || url.trim() === '') {
        console.error('[UniversalVideoPlayer] Adult platform URL is empty');
        setPlaybackError(`無法載入 ${sourceInfo.platform} 視頻：URL 無效`);
        return null;
      }
      embedUrl = url.trim();
      console.log('[UniversalVideoPlayer] Adult platform URL:', {
        platform: sourceInfo.platform,
        url: embedUrl,
        urlLength: embedUrl.length,
      });
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

    // Validate embedUrl before rendering
    if (!embedUrl || embedUrl.trim() === '') {
      console.error('[UniversalVideoPlayer] embedUrl is empty, cannot render WebView');
      console.error('[UniversalVideoPlayer] Context:', {
        url,
        sourceType: sourceInfo.type,
        platform: sourceInfo.platform,
        embedUrl,
      });
      setPlaybackError(`無法載入視頻：URL 無效或為空`);
      return null;
    }

    console.log('[UniversalVideoPlayer] WebView rendering for:', sourceInfo.platform || 'Unknown');
    console.log('[UniversalVideoPlayer] WebView embedUrl:', embedUrl);
    console.log('[UniversalVideoPlayer] WebView source will be:', {
      uri: embedUrl,
      isValid: !!(embedUrl && embedUrl.trim() !== ''),
      length: embedUrl?.length || 0,
    });

    return (
      <WebView
        ref={webViewRef}
        source={{ 
          uri: embedUrl,
          headers: sourceInfo.type === 'youtube' ? {
            'User-Agent': retryCount >= 3 
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
              : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.youtube.com/',
            'DNT': '1',
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
            'Sec-Ch-Ua-Mobile': retryCount >= 3 ? '?1' : '?0',
            'Sec-Ch-Ua-Platform': retryCount >= 3 ? '"iOS"' : '"Windows"',
            'Upgrade-Insecure-Requests': '1',
          } : sourceInfo.type === 'adult' ? {
            'User-Agent': retryCount === 0
              ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
              : retryCount === 1
              ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
              : retryCount === 2
              ? 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7,ja;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Referer': embedUrl.includes('airav') ? 'https://airav.io/' : embedUrl,
            'Origin': embedUrl.includes('airav') ? 'https://airav.io' : new URL(embedUrl).origin,
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
            'Sec-Ch-Ua-Mobile': retryCount >= 3 ? '?1' : '?0',
            'Sec-Ch-Ua-Platform': retryCount >= 3 ? '"iOS"' : '"Windows"',
            'Cache-Control': 'max-age=0',
          } : {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }}
        style={styles.webView}
        originWhitelist={['*']}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={sourceInfo.type !== 'adult'}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="always"
        cacheEnabled={sourceInfo.type !== 'adult'}
        incognito={sourceInfo.type === 'adult'}
        allowsProtectedMedia={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        scalesPageToFit={false}
        bounces={sourceInfo.type !== 'youtube'}
        scrollEnabled={sourceInfo.type !== 'youtube'}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={injectedJavaScript || `
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
              
              console.log('[WebView] Page styles injected successfully');
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
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          const errorDetails = {
            code: nativeEvent.code,
            description: nativeEvent.description,
            domain: nativeEvent.domain,
            url: nativeEvent.url,
            sourceType: sourceInfo.type,
            platform: sourceInfo.platform,
            retryCount,
          };
          console.error('[UniversalVideoPlayer] WebView error:', JSON.stringify(errorDetails, null, 2));
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
            
            const error = `YouTube 播放失敗\n\n嘗試次數: ${maxRetries + 1}\n\nVideo ID: ${sourceInfo.videoId}\n\n⚠️ 可能原因：\n• 視頻被設為私人\n• 視頻禁止嵌入\n• 地區限制\n• 網路問題`;
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
          console.error('[UniversalVideoPlayer] WebView HTTP error:', JSON.stringify(nativeEvent, null, 2));
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
    );
  };

  const renderNativePlayer = () => {
    console.log('[UniversalVideoPlayer] Rendering native player for:', url);
    console.log('[UniversalVideoPlayer] Player object:', player);
    console.log('[UniversalVideoPlayer] Source info:', sourceInfo);

    if (!player) {
      console.error('[UniversalVideoPlayer] Player not initialized');
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>Player Initialization Failed</Text>
          <Text style={styles.errorMessage}>Unable to initialize video player</Text>
        </View>
      );
    }

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
});
