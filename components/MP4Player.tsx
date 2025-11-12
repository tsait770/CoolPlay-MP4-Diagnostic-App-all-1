import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
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

  const processedUri = convertToPlayableUrl(uri);

  const player = useVideoPlayer(processedUri, (player) => {
    player.loop = false;
    player.muted = false;
    if (autoPlay) {
      player.play();
    }
  });

  useEffect(() => {
    if (!player) return;

    console.log('[MP4Player] Initializing player for:', uri);
    console.log('[MP4Player] Processed URI:', processedUri);

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[MP4Player] Status change:', status.status);
      
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
        setError(null);
        if (autoPlay) {
          onPlaybackStart?.();
        }
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
        
        console.error('[MP4Player] Playback error:', errorMsg);
        setIsLoading(false);
        setError(errorMsg);
        onError?.(errorMsg);
      }
    });

    const playingSubscription = player.addListener('playingChange', (event) => {
      console.log('[MP4Player] Playing state:', event.isPlaying);
      if (event.isPlaying) {
        onPlaybackStart?.();
      }
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
    };
  }, [player, uri, processedUri, autoPlay, onPlaybackStart, onError]);

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
    }
  }, [onBackPress]);

  if (!uri || uri.trim() === '') {
    console.warn('[MP4Player] No URI provided');
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Video Load Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Please check the video URL and try again</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
      <VideoView
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
  },
  loadingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    gap: 12,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
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
    textAlign: 'center',
    marginTop: 8,
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
