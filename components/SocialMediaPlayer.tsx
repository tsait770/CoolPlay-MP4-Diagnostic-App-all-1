import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getSocialMediaConfig,
  getDefaultHeaders,
  getUserAgent,
} from '@/utils/socialMediaPlayer';
import Colors from '@/constants/colors';

export interface SocialMediaPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  onPlaybackStart?: () => void;
  autoRetry?: boolean;
  maxRetries?: number;
  style?: any;
  onBackPress?: () => void;
}

export default function SocialMediaPlayer({
  url,
  onError,
  onLoad,
  onPlaybackStart,
  autoRetry = true,
  maxRetries = 3,
  style,
  onBackPress,
}: SocialMediaPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStrategyIndex, setCurrentStrategyIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backButtonOpacity = useRef(new Animated.Value(1)).current;
  
  const insets = useSafeAreaInsets();

  const config = getSocialMediaConfig(url);

  const logAttempt = useCallback((strategyName: string, success: boolean, error?: string) => {
    console.log(`[SocialMediaPlayer] Attempt: ${strategyName} - ${success ? 'Success' : 'Failed'}`, error);
  }, []);

  const tryNextStrategy = useCallback(() => {
    if (!config) {
      const errorMsg = 'Unsupported social media platform';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (currentStrategyIndex >= config.embedStrategies.length) {
      const errorMsg = `Failed to load ${config.platform} video after trying all strategies`;
      setError(errorMsg);
      onError?.(errorMsg);
      setIsLoading(false);
      return;
    }

    const strategy = config.embedStrategies[currentStrategyIndex];
    console.log(`[SocialMediaPlayer] Trying strategy ${currentStrategyIndex + 1}/${config.embedStrategies.length}: ${strategy.name}`);

    const newEmbedUrl = strategy.getEmbedUrl(url);
    
    if (!newEmbedUrl) {
      logAttempt(strategy.name, false, 'Failed to generate embed URL');
      setCurrentStrategyIndex((prev) => prev + 1);
      return;
    }

    setEmbedUrl(newEmbedUrl);
    setIsLoading(true);
    setError(null);
  }, [config, currentStrategyIndex, url, onError, logAttempt]);

  useEffect(() => {
    if (!config) {
      const errorMsg = 'Unsupported social media platform';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    tryNextStrategy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentStrategyIndex > 0 && config) {
      tryNextStrategy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStrategyIndex]);

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
    if (onBackPress) {
      onBackPress();
    } else {
      console.log('[SocialMediaPlayer] Back pressed, parent should handle navigation');
    }
  }, [onBackPress]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleLoadStart = useCallback(() => {
    console.log('[SocialMediaPlayer] WebView load started');
    setIsLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    console.log('[SocialMediaPlayer] WebView load ended');
    setIsLoading(false);
    
    if (config) {
      const strategy = config.embedStrategies[currentStrategyIndex];
      logAttempt(strategy.name, true);
    }
    
    onLoad?.();
    onPlaybackStart?.();
  }, [config, currentStrategyIndex, onLoad, onPlaybackStart, logAttempt]);

  const handleError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('[SocialMediaPlayer] WebView error:', nativeEvent);

      if (!config) return;

      const strategy = config.embedStrategies[currentStrategyIndex];
      const errorMsg = nativeEvent.description || 'Unknown error';
      logAttempt(strategy.name, false, errorMsg);

      if (autoRetry && currentStrategyIndex < config.embedStrategies.length - 1) {
        console.log('[SocialMediaPlayer] Auto-retrying with next strategy...');
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          setCurrentStrategyIndex((prev) => prev + 1);
        }, 1000);
      } else {
        const finalError = `Failed to load ${config.platform} video: ${errorMsg}`;
        setError(finalError);
        setIsLoading(false);
        onError?.(finalError);
      }
    },
    [config, currentStrategyIndex, autoRetry, onError, logAttempt]
  );

  const handleHttpError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('[SocialMediaPlayer] WebView HTTP error:', nativeEvent);

      if (nativeEvent.statusCode >= 400 && config) {
        const strategy = config.embedStrategies[currentStrategyIndex];
        const errorMsg = `HTTP ${nativeEvent.statusCode}`;
        logAttempt(strategy.name, false, errorMsg);

        if (autoRetry && currentStrategyIndex < config.embedStrategies.length - 1) {
          console.log('[SocialMediaPlayer] Auto-retrying with next strategy after HTTP error...');
          
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            setCurrentStrategyIndex((prev) => prev + 1);
          }, 1000);
        } else {
          const finalError = `HTTP Error ${nativeEvent.statusCode}`;
          setError(finalError);
          setIsLoading(false);
          onError?.(finalError);
        }
      }
    },
    [config, currentStrategyIndex, autoRetry, onError, logAttempt]
  );

  const handleManualRetry = useCallback(() => {
    console.log('[SocialMediaPlayer] Manual retry requested');
    setRetryCount((prev) => prev + 1);
    setCurrentStrategyIndex(0);
    setError(null);
  }, []);

  const renderError = () => {
    if (!config) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>不支援的平台</Text>
          <Text style={styles.errorMessage}>此社交媒體平台暫不支援</Text>
        </View>
      );
    }

    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={Colors.semantic.danger} />
        <Text style={styles.errorTitle}>播放失敗</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorSubtext}>
          已嘗試 {currentStrategyIndex + 1}/{config.embedStrategies.length} 種方法
        </Text>
        
        {retryCount < maxRetries && (
          <TouchableOpacity style={styles.retryButton} onPress={handleManualRetry}>
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.retryButtonText}>重試</Text>
          </TouchableOpacity>
        )}

        {retryCount >= maxRetries && (
          <Text style={styles.maxRetriesText}>
            已達到最大重試次數，請稍後再試
          </Text>
        )}
      </View>
    );
  };

  if (!config || !embedUrl) {
    return renderError();
  }

  const strategy = config.embedStrategies[currentStrategyIndex];
  const headers = {
    ...getDefaultHeaders(config.platform),
    ...(strategy.headers || {}),
  };

  const userAgent = strategy.userAgent || getUserAgent(config.platform);

  return (
    <View style={[styles.container, style]}>
      {error ? (
        renderError()
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{
              uri: embedUrl,
              headers,
            }}
            style={styles.webView}
            originWhitelist={['*']}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled={Platform.OS === 'android'}
            mixedContentMode="always"
            userAgent={userAgent}
            startInLoadingState
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleHttpError}
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
            injectedJavaScript={`
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
            `}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary.accent} />
                <Text style={styles.loadingText}>
                  載入 {config.platform} 影片...
                </Text>
                <Text style={styles.loadingSubtext}>
                  方法 {currentStrategyIndex + 1}/{config.embedStrategies.length}: {strategy.name}
                </Text>
              </View>
            )}
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
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary.accent} />
              <Text style={styles.loadingText}>
                載入 {config.platform} 影片...
              </Text>
              <Text style={styles.loadingSubtext}>
                方法 {currentStrategyIndex + 1}/{config.embedStrategies.length}: {strategy.name}
              </Text>
            </View>
          )}
        </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
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
  errorSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  maxRetriesText: {
    fontSize: 12,
    color: '#999',
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
