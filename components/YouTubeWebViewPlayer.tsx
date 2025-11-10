/**
 * YouTube WebView Player
 * 
 * Task 2-9: YouTube WebView player with voice control integration
 * - Unified UI with existing players
 * - Voice command support via JavaScript injection
 * - Consistent back button behavior
 * - Loading states and error handling
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export interface YouTubeWebViewPlayerProps {
  url: string;
  videoId: string;
  embedUrl: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onBackPress?: () => void;
  onYoutubeWebReady?: () => void;
  autoPlay?: boolean;
  style?: any;
}

export interface YouTubePlayerControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  seekForward: (seconds: number) => void;
  seekBackward: (seconds: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  getPlayerState: () => Promise<'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued'>;
}

export default function YouTubeWebViewPlayer({
  url,
  videoId,
  embedUrl,
  onError,
  onLoad,
  onPlaybackStart,
  onPlaybackEnd,
  onBackPress,
  onYoutubeWebReady,
  autoPlay = false,
  style,
}: YouTubeWebViewPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const webViewRef = useRef<WebView>(null);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const maxRetries = 3;

  console.log('[YouTubeWebViewPlayer] Initialized with:', {
    url,
    videoId,
    embedUrl,
    autoPlay,
  });

  // Handle scroll animation
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
    console.log('[YouTubeWebViewPlayer] Back button pressed');
    if (onBackPress) {
      onBackPress();
    } else {
      console.log('[YouTubeWebViewPlayer] No onBackPress handler provided');
    }
  }, [onBackPress]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Inject YouTube IFrame API and setup player
  const injectYouTubeAPI = useCallback(() => {
    const script = `
      (function() {
        // Remove default page margins and setup style
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.backgroundColor = '#000';
        
        // Setup scroll detection
        let scrollTimer;
        window.addEventListener('scroll', function() {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'scroll_start' }));
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(function() {
            window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'scroll_stop' }));
          }, 100);
        }, { passive: true });

        // YouTube IFrame API setup
        if (!window.YT && !window.ytApiLoading) {
          console.log('[YouTube] Loading IFrame API');
          window.ytApiLoading = true;
          
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.onerror = function() {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'youtube_api_error',
              error: 'Failed to load YouTube IFrame API'
            }));
          };
          
          const firstScriptTag = document.getElementsByTagName('script')[0];
          if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          } else {
            document.head.appendChild(tag);
          }
        }

        // Initialize player when API is ready
        window.onYouTubeIframeAPIReady = function() {
          console.log('[YouTube] IFrame API Ready');
          
          const iframe = document.querySelector('iframe');
          if (!iframe) {
            console.error('[YouTube] No iframe found');
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'youtube_error',
              error: 'No iframe element found'
            }));
            return;
          }

          try {
            window.youtubePlayer = new YT.Player(iframe, {
              events: {
                'onReady': function(event) {
                  console.log('[YouTube] Player ready');
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'youtube_ready',
                    videoId: '${videoId}',
                    duration: event.target.getDuration()
                  }));
                },
                'onStateChange': function(event) {
                  const states = {
                    '-1': 'unstarted',
                    '0': 'ended',
                    '1': 'playing',
                    '2': 'paused',
                    '3': 'buffering',
                    '5': 'cued'
                  };
                  
                  const state = states[event.data] || 'unknown';
                  console.log('[YouTube] State change:', state);
                  
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'youtube_state_change',
                    state: state,
                    isPlaying: event.data === 1,
                    currentTime: event.target.getCurrentTime(),
                    duration: event.target.getDuration()
                  }));

                  if (event.data === 1) {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'playback_start'
                    }));
                  } else if (event.data === 0) {
                    window.ReactNativeWebView?.postMessage(JSON.stringify({
                      type: 'playback_end'
                    }));
                  }
                },
                'onError': function(event) {
                  const errorCodes = {
                    2: 'Invalid parameter',
                    5: 'HTML5 player error',
                    100: 'Video not found or private',
                    101: 'Video not allowed in embedded players',
                    150: 'Video not allowed in embedded players'
                  };
                  
                  const errorMsg = errorCodes[event.data] || 'Unknown error';
                  console.error('[YouTube] Player error:', errorMsg);
                  
                  window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'youtube_error',
                    error: errorMsg,
                    errorCode: event.data
                  }));
                }
              }
            });
          } catch (error) {
            console.error('[YouTube] Failed to create player:', error);
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'youtube_error',
              error: error.toString()
            }));
          }
        };

        // Auto-initialize if API is already loaded
        if (window.YT && window.YT.Player) {
          console.log('[YouTube] API already loaded, initializing player');
          window.onYouTubeIframeAPIReady();
        }

        console.log('[YouTube] Setup complete');
      })();
      true;
    `;

    return script;
  }, [videoId]);

  // Voice control command injection functions
  const createVoiceControlMethods = useCallback((): YouTubePlayerControls => {
    return {
      play: () => {
        console.log('[YouTubeWebViewPlayer] Executing: play');
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.playVideo === 'function') {
            window.youtubePlayer.playVideo();
          }
          true;
        `);
      },
      pause: () => {
        console.log('[YouTubeWebViewPlayer] Executing: pause');
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.pauseVideo === 'function') {
            window.youtubePlayer.pauseVideo();
          }
          true;
        `);
      },
      stop: () => {
        console.log('[YouTubeWebViewPlayer] Executing: stop');
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.stopVideo === 'function') {
            window.youtubePlayer.stopVideo();
          }
          true;
        `);
      },
      seekTo: (seconds: number) => {
        console.log('[YouTubeWebViewPlayer] Executing: seekTo', seconds);
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.seekTo === 'function') {
            window.youtubePlayer.seekTo(${seconds}, true);
          }
          true;
        `);
      },
      seekForward: (seconds: number) => {
        console.log('[YouTubeWebViewPlayer] Executing: seekForward', seconds);
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.getCurrentTime === 'function') {
            const currentTime = window.youtubePlayer.getCurrentTime();
            window.youtubePlayer.seekTo(currentTime + ${seconds}, true);
          }
          true;
        `);
      },
      seekBackward: (seconds: number) => {
        console.log('[YouTubeWebViewPlayer] Executing: seekBackward', seconds);
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.getCurrentTime === 'function') {
            const currentTime = window.youtubePlayer.getCurrentTime();
            window.youtubePlayer.seekTo(Math.max(0, currentTime - ${seconds}), true);
          }
          true;
        `);
      },
      setVolume: (volume: number) => {
        console.log('[YouTubeWebViewPlayer] Executing: setVolume', volume);
        const clampedVolume = Math.max(0, Math.min(100, volume * 100));
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.setVolume === 'function') {
            window.youtubePlayer.setVolume(${clampedVolume});
          }
          true;
        `);
      },
      mute: () => {
        console.log('[YouTubeWebViewPlayer] Executing: mute');
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.mute === 'function') {
            window.youtubePlayer.mute();
          }
          true;
        `);
      },
      unmute: () => {
        console.log('[YouTubeWebViewPlayer] Executing: unmute');
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.unMute === 'function') {
            window.youtubePlayer.unMute();
          }
          true;
        `);
      },
      setPlaybackRate: (rate: number) => {
        console.log('[YouTubeWebViewPlayer] Executing: setPlaybackRate', rate);
        webViewRef.current?.injectJavaScript(`
          if (window.youtubePlayer && typeof window.youtubePlayer.setPlaybackRate === 'function') {
            window.youtubePlayer.setPlaybackRate(${rate});
          }
          true;
        `);
      },
      getCurrentTime: async () => {
        return new Promise((resolve) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && typeof window.youtubePlayer.getCurrentTime === 'function') {
              const time = window.youtubePlayer.getCurrentTime();
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'current_time_response',
                time: time
              }));
            }
            true;
          `);
          // Timeout fallback
          setTimeout(() => resolve(0), 1000);
        });
      },
      getDuration: async () => {
        return new Promise((resolve) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && typeof window.youtubePlayer.getDuration === 'function') {
              const duration = window.youtubePlayer.getDuration();
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'duration_response',
                duration: duration
              }));
            }
            true;
          `);
          // Timeout fallback
          setTimeout(() => resolve(0), 1000);
        });
      },
      getPlayerState: async () => {
        return new Promise((resolve) => {
          webViewRef.current?.injectJavaScript(`
            if (window.youtubePlayer && typeof window.youtubePlayer.getPlayerState === 'function') {
              const state = window.youtubePlayer.getPlayerState();
              const states = {
                '-1': 'unstarted',
                '0': 'ended',
                '1': 'playing',
                '2': 'paused',
                '3': 'buffering',
                '5': 'cued'
              };
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'player_state_response',
                state: states[state] || 'unknown'
              }));
            }
            true;
          `);
          // Timeout fallback
          setTimeout(() => resolve('unstarted'), 1000);
        });
      },
    };
  }, []);

  // Expose control methods when ready
  useEffect(() => {
    if (isReady && webViewRef.current) {
      const controls = createVoiceControlMethods();
      // Store controls globally for voice command access
      (global as any).youtubeWebViewControls = controls;
      console.log('[YouTubeWebViewPlayer] Controls registered globally');
    }
  }, [isReady, createVoiceControlMethods]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[YouTubeWebViewPlayer] Message received:', data.type);

      switch (data.type) {
        case 'youtube_ready':
          setIsReady(true);
          setIsLoading(false);
          onLoad?.();
          onYoutubeWebReady?.();
          console.log('[YouTubeWebViewPlayer] YouTube player ready');
          break;

        case 'youtube_state_change':
          if (data.state === 'playing') {
            onPlaybackStart?.();
          } else if (data.state === 'ended') {
            onPlaybackEnd?.();
          }
          break;

        case 'playback_start':
          onPlaybackStart?.();
          break;

        case 'playback_end':
          onPlaybackEnd?.();
          break;

        case 'youtube_error':
        case 'youtube_api_error':
          const errorMsg = data.error || 'Unknown YouTube error';
          console.error('[YouTubeWebViewPlayer] Error:', errorMsg);
          setPlaybackError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
          break;

        case 'scroll_start':
          handleScroll();
          break;

        case 'scroll_stop':
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          setIsScrolling(false);
          break;
      }
    } catch (error) {
      console.error('[YouTubeWebViewPlayer] Error parsing message:', error);
    }
  }, [onLoad, onYoutubeWebReady, onPlaybackStart, onPlaybackEnd, onError, handleScroll]);

  const handleLoadEnd = useCallback(() => {
    console.log('[YouTubeWebViewPlayer] WebView load ended');
    // Don't set isLoading false here, wait for youtube_ready message
  }, []);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    
    // Ignore non-HTTP(S) scheme redirects (these are normal)
    if (nativeEvent.code === 0 || nativeEvent.code === -1002) {
      const desc = String(nativeEvent.description || '').toLowerCase();
      if (desc.includes('scheme that is not http') || 
          desc.includes('redirection') ||
          desc.includes('unsupported url')) {
        console.log('[YouTubeWebViewPlayer] Ignored non-HTTP(S) redirect');
        return;
      }
    }

    console.error('[YouTubeWebViewPlayer] WebView error:', {
      code: nativeEvent.code,
      description: nativeEvent.description,
      domain: nativeEvent.domain,
      url: nativeEvent.url,
    });

    if (retryCount < maxRetries) {
      console.log(`[YouTubeWebViewPlayer] Retrying (${retryCount + 1}/${maxRetries})`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setPlaybackError(null);
        setIsLoading(true);
      }, 2000);
    } else {
      const errorMsg = nativeEvent.description || 'Failed to load YouTube video';
      setPlaybackError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    }
  }, [retryCount, maxRetries, onError]);

  const handleHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[YouTubeWebViewPlayer] HTTP error:', {
      statusCode: nativeEvent.statusCode,
      url: nativeEvent.url,
    });

    if (nativeEvent.statusCode === 403) {
      const errorMsg = 'YouTube video blocked (Error 403). This video may be private, region-restricted, or embedding disabled.';
      setPlaybackError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    } else if (nativeEvent.statusCode >= 400) {
      if (retryCount < maxRetries) {
        console.log(`[YouTubeWebViewPlayer] Retrying after HTTP error (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setPlaybackError(null);
          setIsLoading(true);
        }, 2000);
      } else {
        const errorMsg = `HTTP Error ${nativeEvent.statusCode}`;
        setPlaybackError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    }
  }, [retryCount, maxRetries, onError]);

  if (playbackError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>無法播放 YouTube 影片</Text>
          <Text style={styles.errorMessage}>{playbackError}</Text>
          <Text style={styles.errorHint}>Video ID: {videoId}</Text>
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.youtube.com/',
          }
        }}
        style={styles.webView}
        originWhitelist={['http://*', 'https://*', 'about:*']}
        onShouldStartLoadWithRequest={(request) => {
          const reqUrl = request.url;
          
          // Allow HTTP(S), about:, and data: schemes
          if (reqUrl.startsWith('http://') || reqUrl.startsWith('https://') || 
              reqUrl.startsWith('about:') || reqUrl.startsWith('data:')) {
            return true;
          }
          
          // Block other schemes silently
          console.log('[YouTubeWebViewPlayer] Blocked non-HTTP(S) URL:', reqUrl);
          return false;
        }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        mixedContentMode="always"
        cacheEnabled={false}
        incognito={false}
        allowsProtectedMedia={true}
        allowFileAccess={true}
        scalesPageToFit={false}
        bounces={true}
        scrollEnabled={true}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        webviewDebuggingEnabled={__DEV__}
        injectedJavaScript={injectYouTubeAPI()}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>載入 YouTube 影片...</Text>
          </View>
        )}
        onLoadStart={() => {
          console.log('[YouTubeWebViewPlayer] Load started');
          setIsLoading(true);
        }}
        onLoadEnd={handleLoadEnd}
        onMessage={handleMessage}
        onScroll={handleScroll}
        onError={handleError}
        onHttpError={handleHttpError}
      />
      
      {/* Back Button - Consistent with all players */}
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

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>載入 YouTube 影片...</Text>
          {retryCount > 0 && (
            <Text style={styles.retryText}>重試中... ({retryCount}/{maxRetries})</Text>
          )}
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
  retryText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
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
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
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
