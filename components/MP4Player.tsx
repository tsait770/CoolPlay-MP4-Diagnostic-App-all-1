import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { convertToPlayableUrl } from '@/utils/videoSourceDetector';

export interface MP4PlayerProps {
  uri: string;
  onError?: (error: string) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onBackPress?: () => void;
}

export function MP4Player({ 
  uri, 
  onError, 
  onPlaybackStart, 
  onPlaybackEnd, 
  autoPlay = false, 
  style,
  onBackPress 
}: MP4PlayerProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const videoRef = useRef<VideoView>(null);

  const processedUri = React.useMemo(() => {
    if (!uri || uri.trim() === '') {
      return '';
    }
    const converted = convertToPlayableUrl(uri);
    console.log('[MP4Player] URI conversion:', { original: uri, converted });
    return converted;
  }, [uri]);

  const player = useVideoPlayer(processedUri, (player) => {
    if (!player) return;
    
    console.log('[MP4Player] Initializing player with URI:', processedUri);
    player.loop = false;
    player.muted = false;
    
    if (autoPlay) {
      console.log('[MP4Player] Auto-play enabled, starting playback');
      try {
        player.play();
      } catch (e) {
        console.warn('[MP4Player] Auto-play failed:', e);
      }
    }
  });

  useEffect(() => {
    if (!player) {
      console.warn('[MP4Player] Player instance is null');
      return;
    }

    if (!processedUri || processedUri.trim() === '') {
      console.warn('[MP4Player] No valid URI to play');
      setError('No video URL provided');
      setIsLoading(false);
      return;
    }

    console.log('[MP4Player] ========== Player Status ==========');
    console.log('[MP4Player] Original URI:', uri);
    console.log('[MP4Player] Processed URI:', processedUri);
    console.log('[MP4Player] Auto-play:', autoPlay);
    console.log('[MP4Player] Platform:', Platform.OS);
    console.log('[MP4Player] Player instance:', player ? 'Available' : 'NULL');

    if (processedUri && processedUri !== '') {
      try {
        new URL(processedUri);
      } catch (urlError) {
        const errorMsg = 'Invalid video URL format';
        console.error('[MP4Player] URL validation failed:', urlError);
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        return;
      }
    }

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[MP4Player] Status change:', {
        status: status.status,
        oldStatus: status.oldStatus,
        timestamp: new Date().toISOString(),
      });
      
      if (status.status === 'readyToPlay') {
        console.log('[MP4Player] ✅ Video ready to play');
        console.log('[MP4Player] Duration:', player.duration, 'seconds');
        console.log('[MP4Player] Current time:', player.currentTime, 'seconds');
        
        setIsLoading(false);
        setError(null);
        setHasInitialized(true);
        
        if (autoPlay && player) {
          console.log('[MP4Player] Auto-playing video');
          try {
            player.play();
            onPlaybackStart?.();
          } catch (e) {
            console.error('[MP4Player] Auto-play failed:', e);
          }
        }
      } else if (status.status === 'loading') {
        console.log('[MP4Player] 📥 Loading video...', processedUri);
        setIsLoading(true);
      } else if (status.status === 'error') {
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
        
        console.error('[MP4Player] ❌ Playback error:', {
          message: errorMsg,
          uri: processedUri,
          timestamp: new Date().toISOString(),
        });
        
        const fullErrorMsg = `Unable to play video: ${errorMsg}`;
        setIsLoading(false);
        setError(fullErrorMsg);
        onError?.(fullErrorMsg);
      } else if (status.status === 'idle') {
        console.log('[MP4Player] 💤 Player idle');
      }
    });

    const playingSubscription = player.addListener('playingChange', (event) => {
      console.log('[MP4Player] Playing state changed:', {
        isPlaying: event.isPlaying,
        currentTime: player.currentTime,
        duration: player.duration,
      });
      
      if (event.isPlaying && hasInitialized) {
        onPlaybackStart?.();
      }
    });

    const volumeSubscription = player.addListener('volumeChange', (event) => {
      console.log('[MP4Player] Volume changed:', {
        volume: event.volume,
        isMuted: event.isMuted,
      });
    });

    return () => {
      console.log('[MP4Player] Cleaning up player subscriptions');
      statusSubscription.remove();
      playingSubscription.remove();
      volumeSubscription.remove();
    };
  }, [player, uri, processedUri, autoPlay, hasInitialized, onPlaybackStart, onError]);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
    }
  }, [onBackPress]);



  if (!uri || uri.trim() === '') {
    console.warn('[MP4Player] No URI provided, returning null');
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading video...</Text>
          <Text style={styles.loadingSubtext}>Please wait while the video loads</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Play Video</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            Please check:
            {'\n'}• The video URL is valid
            {'\n'}• The video file is accessible
            {'\n'}• Your internet connection is stable
            {'\n'}• The video format is supported (MP4, WebM, OGG)
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
      <VideoView
        ref={videoRef}
        player={player} 
        style={[styles.video, isFullscreen && styles.fullscreenVideo]}
        nativeControls={true}
        contentFit={isFullscreen ? "cover" : "contain"}
        allowsFullscreen={true}
        allowsPictureInPicture={true}
      />
      {isFullscreen && onBackPress && (
        <TouchableOpacity 
          onPress={handleBackPress}
          style={[styles.backButton, { top: insets.top + 16 }]}
        >
          <View style={styles.backButtonInner}>
            <ArrowLeft color="#ffffff" size={24} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    borderRadius: 0,
    borderWidth: 0,
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    gap: 16,
    padding: 20,
  },
  loadingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  errorText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorHint: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'left',
    marginTop: 12,
    lineHeight: 18,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MP4Player;
