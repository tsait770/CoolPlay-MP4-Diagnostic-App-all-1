import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated } from 'react-native';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface VideoSourceInfo {
  platform: string;
  type: 'supported' | 'extended' | 'unsupported';
  description: string;
  videoId?: string;
}

interface VideoSourceDetectionResult {
  isSupported: boolean;
  sourceInfo: VideoSourceInfo;
}

function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let videoId: string | null = null;

  const standardMatch = url.match(/(?:youtube\.com\/watch\?.*[&?]v=|youtube\.com\/watch\?v=)([\w-]+)/i);
  if (standardMatch) {
    videoId = standardMatch[1];
  }

  const shortMatch = url.match(/youtu\.be\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (shortMatch) {
    videoId = shortMatch[1];
  }

  const embedMatch = url.match(/youtube\.com\/embed\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (embedMatch) {
    videoId = embedMatch[1];
  }

  const vMatch = url.match(/youtube\.com\/v\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (vMatch) {
    videoId = vMatch[1];
  }

  const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)(?:[?&][^\s]*)?/i);
  if (shortsMatch) {
    videoId = shortsMatch[1];
  }

  if (videoId) {
    videoId = videoId.split('&')[0].split('?')[0];
    return videoId;
  }

  return null;
}

function detectVideoSource(url: string): VideoSourceDetectionResult {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([\w-]+)(?:[&?][^\s]*)?/i;

  if (youtubeRegex.test(url)) {
    const videoId = getYouTubeVideoId(url);
    return {
      isSupported: true,
      sourceInfo: {
        platform: 'YouTube',
        type: 'supported',
        description: 'Supported YouTube video source',
        videoId: videoId || undefined
      }
    };
  }

  return {
    isSupported: false,
    sourceInfo: {
      platform: 'Unknown',
      type: 'unsupported',
      description: 'Not a supported YouTube video URL'
    }
  };
}

interface YouTubePlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  onPlaybackStatusUpdate?: (status: { isPlaying: boolean; currentTime: number; duration: number }) => void;
  registerControls?: (controls: {
    play: () => void;
    pause: () => void;
    seekTo: (seconds: number) => void;
    setVolume: (volume: number) => void;
    setPlaybackRate: (rate: number) => void;
  }) => void;
  isFullscreen?: boolean;
  toggleFullscreen?: () => void;
  onBackPress?: () => void;
}

const YouTubePlayerStandalone: React.FC<YouTubePlayerProps> = ({
  url,
  onError,
  onLoad,
  onPlaybackStatusUpdate,
  registerControls,
  isFullscreen = false,
  toggleFullscreen,
  onBackPress
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sourceInfo = detectVideoSource(url);

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

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const getEmbedUrl = useCallback(() => {
    if (sourceInfo.sourceInfo.platform === 'YouTube' && sourceInfo.sourceInfo.videoId) {
      const origin = Platform.OS === 'web' 
        ? (typeof window !== 'undefined' ? window.location.origin : 'https://localhost')
        : 'https://localhost';
      return `https://www.youtube.com/embed/${sourceInfo.sourceInfo.videoId}?enablejsapi=1&autoplay=0&controls=1&rel=0&modestbranding=1&playsinline=1&origin=${origin}`;
    }
    return null;
  }, [sourceInfo]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoad?.();

    if (sourceInfo.sourceInfo.platform === 'YouTube' && webViewRef.current) {
      const initScript = `
        if (!window.YT && !window.ytApiLoading) {
          window.ytApiLoading = true;
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.onload = function() {
            console.log('YouTube API loaded');
          };
          const firstScriptTag = document.getElementsByTagName('script')[0];
          if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          } else {
            document.head.appendChild(tag);
          }
        }

        function initYouTubePlayer() {
          if (typeof YT !== 'undefined' && YT.Player) {
            const iframe = document.querySelector('iframe');
            if (iframe) {
              const player = new YT.Player(iframe, {
                events: {
                  'onReady': function(event) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'youtube_ready',
                      duration: event.target.getDuration()
                    }));
                  },
                  'onStateChange': function(event) {
                    const state = event.data;
                    const isPlaying = state === YT.PlayerState.PLAYING;
                    const currentTime = event.target.getCurrentTime();
                    const duration = event.target.getDuration();
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'youtube_state_change',
                      isPlaying: isPlaying,
                      currentTime: currentTime,
                      duration: duration,
                      state: state
                    }));
                  }
                }
              });
              window.youtubePlayer = player;
            }
          } else {
            setTimeout(initYouTubePlayer, 500);
          }
        }
        
        setTimeout(initYouTubePlayer, 1000);
        true;
      `;
      
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(initScript);
      }, 2000);
      
      const scrollDetectionScript = `
        (function() {
          let scrollTimer;
          window.addEventListener('scroll', function() {
            window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'scroll_start' }));
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
              window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'scroll_stop' }));
            }, 100);
          }, { passive: true });
        })();
        true;
      `;
      
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(scrollDetectionScript);
      }, 2500);
    }
  }, [onLoad, sourceInfo]);

  const handleError = useCallback((error: any) => {
    const errorDetails = {
      description: error?.nativeEvent?.description,
      code: error?.nativeEvent?.code,
      domain: error?.nativeEvent?.domain,
      url: error?.nativeEvent?.url,
      title: error?.nativeEvent?.title,
      canGoBack: error?.nativeEvent?.canGoBack,
      canGoForward: error?.nativeEvent?.canGoForward,
      loading: error?.nativeEvent?.loading,
    };
    console.error('[YouTubePlayerStandalone] WebView error details:', JSON.stringify(errorDetails, null, 2));

    setIsLoading(false);
    setHasError(true);

    const errorMessage = error?.nativeEvent?.description || 'Failed to load video';
    onError?.(errorMessage);
  }, [onError]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'youtube_ready' || data.type === 'youtube_state_change') {
        onPlaybackStatusUpdate?.({
          duration: data.duration * 1000,
          isPlaying: data.isPlaying || false,
          currentTime: data.currentTime * 1000 || 0
        });
      } else if (data.type === 'scroll_start') {
        handleScroll();
      } else if (data.type === 'scroll_stop') {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        setIsScrolling(false);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onPlaybackStatusUpdate, handleScroll]);

  useEffect(() => {
    if (webViewRef.current && sourceInfo.sourceInfo.platform === 'YouTube') {
      const controls = {
        play: () => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.playVideo) {
              window.youtubePlayer.playVideo();
            }
            true;
          `);
        },
        pause: () => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.pauseVideo) {
              window.youtubePlayer.pauseVideo();
            }
            true;
          `);
        },
        seekTo: (seconds: number) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.seekTo) {
              window.youtubePlayer.seekTo(${seconds}, true);
            }
            true;
          `);
        },
        setVolume: (volume: number) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.setVolume) {
              window.youtubePlayer.setVolume(${volume * 100});
            }
            true;
          `);
        },
        setPlaybackRate: (rate: number) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && window.youtubePlayer.setPlaybackRate) {
              window.youtubePlayer.setPlaybackRate(${rate});
            }
            true;
          `);
        }
      };

      registerControls?.(controls);
    }
  }, [sourceInfo, registerControls]);

  if (!sourceInfo.isSupported || sourceInfo.sourceInfo.platform !== 'YouTube') {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>不支援的視頻格式或平台</Text>
          <Text style={styles.platformText}>僅支援 YouTube 視頻</Text>
        </View>
      </View>
    );
  }

  if (!url || url.trim() === '') {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>無效的視頻連結</Text>
        </View>
      </View>
    );
  }

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>無法解析 YouTube 視頻ID</Text>
          <Text style={styles.platformText}>請檢查連結格式</Text>
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={styles.errorText}>視頻載入失敗</Text>
          <Text style={styles.platformText}>請檢查網路連接或稍後再試</Text>
        </View>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.container} onScroll={handleScroll}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>載入中...</Text>
            </View>
          )}
          <iframe
            src={embedUrl}
            style={styles.iframe}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleLoadEnd}
            onError={handleError}
          />
        </View>
        <Animated.View
          style={[
            styles.backButtonContainer,
            { top: insets.top - 4, opacity: backButtonOpacity }
          ]}
          pointerEvents={isScrolling ? 'none' : 'auto'}
        >
          <TouchableOpacity
            onPress={() => {
              if (onBackPress) {
                onBackPress();
              } else {
                console.log('[YouTubePlayerStandalone] Back pressed, parent should handle navigation');
              }
            }}
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
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>載入中...</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{
            uri: embedUrl,
            headers: {
              'Referer': 'https://localhost'
            }
          }}
          style={styles.webview}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('[YouTubePlayerStandalone] WebView HTTP error:', JSON.stringify({
              statusCode: nativeEvent.statusCode,
              description: nativeEvent.description,
              url: nativeEvent.url,
              title: nativeEvent.title,
              canGoBack: nativeEvent.canGoBack,
              canGoForward: nativeEvent.canGoForward,
              loading: nativeEvent.loading,
            }, null, 2));
            handleError(syntheticEvent);
          }}
          onMessage={handleMessage}
          onScroll={handleScroll}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          originWhitelist={['*']}
        />
      </View>
      <Animated.View
        style={[
          styles.backButtonContainer,
          { top: insets.top - 4, opacity: backButtonOpacity }
        ]}
        pointerEvents={isScrolling ? 'none' : 'auto'}
      >
        <TouchableOpacity
          onPress={() => {
            if (onBackPress) {
              onBackPress();
            } else {
              console.log('[YouTubePlayerStandalone] Back pressed, parent should handle navigation');
            }
          }}
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

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 1200,
    aspectRatio: 16/9,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  platformText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '500',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: 20,
  } as any,
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

export default YouTubePlayerStandalone;
