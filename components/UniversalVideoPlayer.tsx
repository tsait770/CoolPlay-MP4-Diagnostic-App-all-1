/**
 * Universal Video Player - Rebuilt Version
 * Routes to appropriate player based on video source
 * Preserves: Voice control, Adult video playback, Social media
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import YouTubePlayer from '@/components/players/YouTubePlayer';
import MP4Player from '@/components/players/MP4Player';
import SocialMediaPlayer from '@/components/SocialMediaPlayer';
import { routeVideoSource, extractYouTubeVideoIdFromUrl } from '@/utils/videoSourceRouter';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';

export interface UniversalVideoPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onAgeVerificationRequired?: () => void;
}

export default function UniversalVideoPlayer({
  url,
  onError,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  onAgeVerificationRequired,
}: UniversalVideoPlayerProps) {
  const [playerError, setPlayerError] = useState<string | null>(null);

  const handleError = (error: string) => {
    console.error('[UniversalVideoPlayer] Error:', error);
    setPlayerError(error);
    onError?.(error);
  };

  const handleReady = () => {
    console.log('[UniversalVideoPlayer] Player ready');
    setPlayerError(null);
  };

  if (!url || url.trim() === '') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.primary.textSecondary} />
          <Text style={styles.errorTitle}>請選擇視頻</Text>
          <Text style={styles.errorMessage}>請選擇要播放的視頻</Text>
        </View>
      </View>
    );
  }

  const sourceInfo = routeVideoSource(url);
  
  console.log('[UniversalVideoPlayer] Source routing:', {
    url,
    sourceInfo,
  });

  if (sourceInfo.requiresAgeVerification && onAgeVerificationRequired) {
    onAgeVerificationRequired();
  }

  if (playerError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>播放錯誤</Text>
          <Text style={styles.errorMessage}>{playerError}</Text>
        </View>
      </View>
    );
  }

  // Route to appropriate player
  if (sourceInfo.usePlayer === 'youtube') {
    const videoId = extractYouTubeVideoIdFromUrl(url);
    if (!videoId) {
      return (
        <View style={[styles.container, style]}>
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color={Colors.semantic.danger} />
            <Text style={styles.errorTitle}>YouTube 錯誤</Text>
            <Text style={styles.errorMessage}>無法解析 YouTube 視頻 ID</Text>
          </View>
        </View>
      );
    }

    return (
      <YouTubePlayer
        videoId={videoId}
        autoplay={autoPlay}
        onError={handleError}
        onReady={handleReady}
        onStateChange={(state) => {
          if (state === 'playing') {
            onPlaybackStart?.();
          } else if (state === 'ended') {
            onPlaybackEnd?.();
          }
        }}
        style={style}
      />
    );
  }

  if (sourceInfo.usePlayer === 'mp4') {
    return (
      <MP4Player
        url={url}
        autoplay={autoPlay}
        onError={handleError}
        onReady={handleReady}
        onPlaybackStart={onPlaybackStart}
        onPlaybackEnd={onPlaybackEnd}
        style={style}
      />
    );
  }

  if (sourceInfo.usePlayer === 'social') {
    return (
      <SocialMediaPlayer
        url={url}
        onError={handleError}
        onLoad={handleReady}
        onPlaybackStart={onPlaybackStart}
        autoRetry
        maxRetries={3}
        style={style}
      />
    );
  }

  if (sourceInfo.usePlayer === 'webview') {
    console.log('[UniversalVideoPlayer] Using WebView for:', sourceInfo.platform || 'Unknown');
    
    let injectedJavaScript = '';
    
    if (sourceInfo.type === 'adult') {
      injectedJavaScript = `
        (function() {
          try {
            var style = document.createElement('style');
            style.innerHTML = 'video { width: 100% !important; height: 100% !important; object-fit: contain; }';
            document.head.appendChild(style);
            
            setTimeout(function() {
              var videos = document.querySelectorAll('video');
              if (videos.length > 0) {
                videos[0].play().catch(function(e) { 
                  console.log('Autoplay blocked:', e); 
                });
              }
            }, 1000);
          } catch(e) {
            console.error('Script error:', e);
          }
        })();
      `;
    }

    return (
      <WebView
        source={{ 
          uri: url,
          headers: sourceInfo.type === 'adult' ? {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'DNT': '1',
          } : {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        }}
        style={[styles.webView, style]}
        originWhitelist={['*']}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={sourceInfo.type !== 'adult'}
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        cacheEnabled={sourceInfo.type !== 'adult'}
        incognito={sourceInfo.type === 'adult'}
        allowsProtectedMedia
        allowFileAccess
        injectedJavaScript={injectedJavaScript}
        onLoadStart={() => console.log('[UniversalVideoPlayer] WebView load started')}
        onLoadEnd={() => {
          console.log('[UniversalVideoPlayer] WebView load ended');
          handleReady();
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[UniversalVideoPlayer] WebView error:', nativeEvent);
          handleError(`WebView error: ${nativeEvent.description || 'Unknown error'}`);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={Colors.semantic.danger} />
        <Text style={styles.errorTitle}>不支援的格式</Text>
        <Text style={styles.errorMessage}>此視頻格式暫不支援播放</Text>
      </View>
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
  },
});
