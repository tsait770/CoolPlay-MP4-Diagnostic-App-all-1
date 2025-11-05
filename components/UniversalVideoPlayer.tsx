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
    // 使用標準 YouTube embed，並優化參數以提高兼容性
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
      widget_referrer: 'https://rork.app',
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const getYouTubeWebPlayerUrl = (videoId: string): string => {
    // 使用標準 YouTube 播放頁面作為備選
    return `https://www.youtube.com/watch?v=${videoId}&autoplay=${autoPlay ? '1' : '0'}`;
  };

  const getYouTubeNoEmbedUrl = (videoId: string): string => {
    // 使用 YouTube nocookie 作為最後備選
    const params = new URLSearchParams({
      autoplay: autoPlay ? '1' : '0',
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
      controls: '1',
      fs: '1',
      enablejsapi: '0',
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  const getVimeoEmbedUrl = (videoId: string): string => {
    return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}`;
  };

  const handleLoadTimeout = () => {
    console.warn('[UniversalVideoPlayer] Load timeout exceeded');
    const timeoutError = 'Video load timeout. The video is taking too long to load.';
    
    if (retryCount < maxRetries) {
      console.log(`[UniversalVideoPlayer] Retrying... (${retryCount + 1}/${maxRetries})`);
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      setPlaybackError(null);
    } else {
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
      
      if (retryCount === 0) {
        // 第一次嘗試：標準 embed
        embedUrl = getYouTubeEmbedUrl(sourceInfo.videoId);
      } else if (retryCount === 1) {
        // 第二次嘗試：完整播放頁面
        embedUrl = getYouTubeWebPlayerUrl(sourceInfo.videoId);
      } else {
        // 第三次嘗試：nocookie embed
        embedUrl = getYouTubeNoEmbedUrl(sourceInfo.videoId);
      }
      
      console.log('[UniversalVideoPlayer] YouTube embed URL:', embedUrl);
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
        injectedJavaScript={injectedJavaScript}
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
          
          const errorDetails = {
            code: nativeEvent.code || 'N/A',
            description: nativeEvent.description || 'No description',
            url: nativeEvent.url || url,
            canGoBack: nativeEvent.canGoBack,
            canGoForward: nativeEvent.canGoForward,
            loading: nativeEvent.loading,
            title: nativeEvent.title || 'N/A',
          };
          
          console.error('[UniversalVideoPlayer] WebView error:', JSON.stringify({
            ...errorDetails,
            sourceType: sourceInfo.type,
            platform: sourceInfo.platform,
            retryCount,
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
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setPlaybackError(null);
              }, 1500);
              return;
            }
            
            const error = `YouTube 視頻載入失敗\n\n可能原因：\n• 視頻被設為私人或已刪除\n• 視頻限制嵌入播放\n• 地區限制\n• 網路連線問題\n\n已嘗試 ${maxRetries} 種不同的載入方式。\n\n建議：\n1. 檢查視頻連結是否正確\n2. 在瀏覽器中測試是否能播放\n3. 稍後再試`;
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
              const errorMsg = nativeEvent.description || nativeEvent.code || 'Unknown error';
            const error = `Failed to load ${sourceInfo.platform}: ${errorMsg}`;
              setPlaybackError(error);
              onError?.(error);
            }
          }
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[UniversalVideoPlayer] WebView HTTP error:', nativeEvent);
          clearLoadTimeout();
          
          if (nativeEvent.statusCode >= 400) {
            if (retryCount < maxRetries && nativeEvent.statusCode >= 500) {
              console.log(`[UniversalVideoPlayer] Retrying after HTTP ${nativeEvent.statusCode} (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                setIsLoading(true);
                setPlaybackError(null);
              }, 2000);
            } else {
              const error = `HTTP Error ${nativeEvent.statusCode}: ${nativeEvent.url}`;
              setPlaybackError(error);
              onError?.(error);
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
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
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
