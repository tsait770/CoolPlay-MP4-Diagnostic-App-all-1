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
import { useMembership } from '@/providers/MembershipProvider';
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
  const { tier } = useMembership();
  const [isLoading, setIsLoading] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay) {
      player.play();
    }
  });

  const sourceInfo = detectVideoSource(url);
  const playbackEligibility = canPlayVideo(url, tier);

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
        const errorMsg = `Playback error: ${status.error}`;
        setPlaybackError(errorMsg);
        onError?.(errorMsg);
      }
    });

    return () => {
      subscription.remove();
      statusSubscription.remove();
    };
  }, [player, autoPlay, onPlaybackStart, onError]);

  const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  };

  const getVimeoEmbedUrl = (videoId: string): string => {
    return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlay ? 1 : 0}`;
  };

  const renderWebViewPlayer = () => {
    let embedUrl = url;

    if (sourceInfo.type === 'youtube' && sourceInfo.videoId) {
      embedUrl = getYouTubeEmbedUrl(sourceInfo.videoId);
    } else if (sourceInfo.type === 'vimeo' && sourceInfo.videoId) {
      embedUrl = getVimeoEmbedUrl(sourceInfo.videoId);
    }

    console.log('[UniversalVideoPlayer] Rendering WebView for:', embedUrl);

    return (
      <WebView
        ref={webViewRef}
        source={{ 
          uri: embedUrl,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }}
        style={styles.webView}
        originWhitelist={['*']}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={!autoPlay}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>Loading {sourceInfo.platform}...</Text>
          </View>
        )}
        onLoadStart={() => {
          console.log('[UniversalVideoPlayer] WebView load started');
          setIsLoading(true);
        }}
        onLoadEnd={() => {
          console.log('[UniversalVideoPlayer] WebView load ended');
          setIsLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[UniversalVideoPlayer] WebView error:', nativeEvent);
          const error = `Failed to load ${sourceInfo.platform}: ${nativeEvent.description}`;
          setPlaybackError(error);
          onError?.(error);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[UniversalVideoPlayer] WebView HTTP error:', nativeEvent);
          if (nativeEvent.statusCode >= 400) {
            const error = `HTTP Error ${nativeEvent.statusCode}: ${nativeEvent.url}`;
            setPlaybackError(error);
            onError?.(error);
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

  const shouldUseWebView =
    sourceInfo.requiresWebView ||
    sourceInfo.type === 'youtube' ||
    sourceInfo.type === 'vimeo' ||
    sourceInfo.type === 'webview' ||
    sourceInfo.type === 'adult';

  const shouldUseNativePlayer =
    sourceInfo.type === 'direct' ||
    sourceInfo.type === 'stream' ||
    sourceInfo.type === 'hls' ||
    sourceInfo.type === 'dash';

  return (
    <View style={[styles.container, style]}>
      {shouldUseWebView ? renderWebViewPlayer() : null}
      {shouldUseNativePlayer ? renderNativePlayer() : null}
      {!shouldUseWebView && !shouldUseNativePlayer ? renderError() : null}
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
