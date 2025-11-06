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
  maxRetries = 3,
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
  const safeUrl = shouldUseNativePlayer && url && url.trim() !== '' ? url : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  
  const player = useVideoPlayer(safeUrl, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay && shouldUseNativePlayer) {
      player.play();
    }
  });
  
  console.log('[UniversalVideoPlayer] Source detection:', {
    url,
    type: sourceInfo.type,
    platform: sourceInfo.platform,
    requiresWebView: sourceInfo.requiresWebView,
    requiresAgeVerification: sourceInfo.requiresAgeVerification,
  });

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
          sourceType: sourceInfo.type,
          platform: sourceInfo.platform,
          shouldUseNativePlayer,
          shouldUseWebView: sourceInfo.requiresWebView,
        });
        
        // If this is a URL that should use WebView, provide helpful error
        if (sourceInfo.requiresWebView || sourceInfo.type === 'youtube' || sourceInfo.type === 'adult') {
          errorMsg = `This ${sourceInfo.platform} video cannot be played with the native player. The video will be loaded in a web player instead.`;
          console.log('[UniversalVideoPlayer] Switching to WebView for:', sourceInfo.platform);
          // Don't set error, let WebView handle it
          return;
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

  const getYouTubeEmbedUrl = (videoId: string): string => {
    // Enhanced YouTube embed with comprehensive parameters for maximum compatibility
    const params = new URLSearchParams({
      autoplay: autoPlay ? '1' : '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      fs: '1',
      iv_load_policy: '3',
      enablejsapi: '1',
      controls: '1',
      showinfo: '0',
      cc_load_policy: '0',
      disablekb: '0',
      origin: 'https://rork.app',
      widget_referrer: 'https://rork.app',
      // Additional parameters to handle Error Code 4
      html5: '1',
      wmode: 'transparent',
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const getYouTubeWebPlayerUrl = (videoId: string): string => {
    // Standard YouTube watch page as fallback - more permissive
    const params = new URLSearchParams({
      v: videoId,
      autoplay: autoPlay ? '1' : '0',
      // Force HTML5 player
      html5: '1',
    });
    return `https://www.youtube.com/watch?${params.toString()}`;
  };

  const getYouTubeNoEmbedUrl = (videoId: string): string => {
    // YouTube nocookie domain - privacy-focused alternative
    const params = new URLSearchParams({
      autoplay: autoPlay ? '1' : '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      controls: '1',
      fs: '1',
      enablejsapi: '0',
      origin: 'https://rork.app',
      html5: '1',
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  const getYouTubeMobileUrl = (videoId: string): string => {
    // Mobile-optimized YouTube URL (4th fallback)
    return `https://m.youtube.com/watch?v=${videoId}&autoplay=${autoPlay ? '1' : '0'}`;
  };

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
    let embedUrl = url;
    let injectedJavaScript = '';

    if (sourceInfo.type === 'youtube' && sourceInfo.videoId) {
      console.log('[UniversalVideoPlayer] Rendering YouTube with videoId:', sourceInfo.videoId, 'retry:', retryCount);
      console.log('[UniversalVideoPlayer] YouTube Error Code 4 Detection System Active');
      
      // Progressive fallback strategy for YouTube Error Code 4
      if (retryCount === 0) {
        // Attempt 1: Standard embed with enhanced parameters
        embedUrl = getYouTubeEmbedUrl(sourceInfo.videoId);
        console.log('[UniversalVideoPlayer] Using Standard YouTube Embed (Attempt 1/4)');
      } else if (retryCount === 1) {
        // Attempt 2: Full watch page (more permissive)
        embedUrl = getYouTubeWebPlayerUrl(sourceInfo.videoId);
        console.log('[UniversalVideoPlayer] Using YouTube Watch Page (Attempt 2/4)');
      } else if (retryCount === 2) {
        // Attempt 3: Privacy-enhanced nocookie domain
        embedUrl = getYouTubeNoEmbedUrl(sourceInfo.videoId);
        console.log('[UniversalVideoPlayer] Using YouTube NoCookie Domain (Attempt 3/4)');
      } else {
        // Attempt 4: Mobile-optimized URL
        embedUrl = getYouTubeMobileUrl(sourceInfo.videoId);
        console.log('[UniversalVideoPlayer] Using YouTube Mobile URL (Attempt 4/4)');
      }
      
      console.log('[UniversalVideoPlayer] YouTube embed URL:', embedUrl);
      console.log('[UniversalVideoPlayer] Video availability check: Starting load...');
    } else if (sourceInfo.type === 'vimeo' && sourceInfo.videoId) {
      embedUrl = getVimeoEmbedUrl(sourceInfo.videoId);
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

    console.log('[UniversalVideoPlayer] Rendering WebView for:', embedUrl, 'retry:', retryCount);

    return (
      <WebView
        ref={webViewRef}
        source={{ 
          uri: embedUrl,
          headers: sourceInfo.type === 'youtube' ? {
            // YouTube WebView 需要的 headers
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh-CN;q=0.7',
            'Referer': 'https://www.youtube.com/',
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
          } : sourceInfo.type === 'adult' ? {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Upgrade-Insecure-Requests': '1',
          } : {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }}
        style={styles.webView}
        originWhitelist={['*']}
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
        allowsProtectedMedia
        allowFileAccess
        scalesPageToFit={false}
        bounces={true}
        scrollEnabled={true}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={injectedJavaScript || `
          (function() {
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
            
            var style = document.createElement('style');
            style.innerHTML = '* { -webkit-overflow-scrolling: touch !important; }';
            document.head.appendChild(style);
          })();
        `}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>Loading {sourceInfo.platform}...</Text>
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
          console.error('[UniversalVideoPlayer] WebView error:', nativeEvent);
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
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setPlaybackError(null);
              }, 2000); // Increased delay for YouTube
              return;
            }
            
            console.error('[UniversalVideoPlayer] All YouTube retry attempts exhausted');
            console.error('[UniversalVideoPlayer] Final Error Report:', {
              videoId: sourceInfo.videoId,
              totalAttempts: maxRetries + 1,
              error: nativeEvent,
            });
            
            const error = `YouTube 錯誤碼 4 - 播放失敗\n\n視頻無法載入 (已嘗試 ${maxRetries + 1} 種方式)\n\n最常見原因：\n• 視頻被設為「私人」或「不公開」\n• 視頻已被版權方刪除或下架\n• 視頻禁止在第三方應用嵌入\n• 地區限制（該視頻在您的國家/地區不可用）\n• 年齡限制（需要登入 YouTube 驗證年齡）\n\nVideo ID: ${sourceInfo.videoId}\nURL: https://youtu.be/${sourceInfo.videoId}\n\n診斷步驟：\n1. 在瀏覽器中測試: https://youtu.be/${sourceInfo.videoId}\n2. 檢查視頻是否存在且可公開訪問\n3. 確認視頻允許嵌入播放\n4. 嘗試使用 VPN 切換地區\n5. 稍後再試（可能是暫時性問題）\n\n如持續發生此問題，請聯繫技術支援並提供 Video ID。`;
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
          console.error('[UniversalVideoPlayer] WebView HTTP error:', nativeEvent);
          console.error('[UniversalVideoPlayer] HTTP Error Details:', {
            statusCode: nativeEvent.statusCode,
            url: nativeEvent.url,
            description: nativeEvent.description,
            sourceType: sourceInfo.type,
            platform: sourceInfo.platform,
            retryCount,
          });
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
