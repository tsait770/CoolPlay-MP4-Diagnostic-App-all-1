import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
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
}

export default function SocialMediaPlayer({
  url,
  onError,
  onLoad,
  onPlaybackStart,
  autoRetry = true,
  maxRetries = 3,
  style,
}: SocialMediaPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStrategyIndex, setCurrentStrategyIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
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
});
