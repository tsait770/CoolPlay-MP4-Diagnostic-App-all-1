import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export interface MP4PlayerProps {
  uri: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onBackPress?: () => void;
}

export default function MP4Player({
  uri,
  onError,
  onLoad,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  onBackPress,
}: MP4PlayerProps) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasCalledOnLoad = useRef(false);

  // Initialize player with proper configuration
  const player = useVideoPlayer(uri, (player) => {
    console.log('[MP4Player] Initializing player with URI:', uri);
    player.loop = false;
    player.muted = false;
    player.volume = 1.0;
    
    if (autoPlay) {
      console.log('[MP4Player] AutoPlay enabled, starting playback');
      // Add a small delay to ensure player is ready
      setTimeout(() => {
        player.play().catch((err) => {
          console.error('[MP4Player] AutoPlay failed:', err);
        });
      }, 100);
    }
  });

  useEffect(() => {
    if (!player) {
      console.warn('[MP4Player] Player not initialized');
      return;
    }

    console.log('[MP4Player] Setting up event listeners for URI:', uri);

    // Reset state when URI changes
    setIsLoading(true);
    setError(null);
    hasCalledOnLoad.current = false;

    // Status change listener
    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[MP4Player] Status changed:', status.status, 'URI:', uri);

      if (status.status === 'idle') {
        console.log('[MP4Player] Player is idle');
        setIsLoading(true);
      } else if (status.status === 'loading') {
        console.log('[MP4Player] Player is loading');
        setIsLoading(true);
      } else if (status.status === 'readyToPlay') {
        console.log('[MP4Player] Player is ready to play');
        setIsLoading(false);
        setError(null);
        
        // Only call onLoad once per URI - schedule in next tick
        if (!hasCalledOnLoad.current && onLoad) {
          console.log('[MP4Player] Scheduling onLoad callback');
          hasCalledOnLoad.current = true;
          setTimeout(() => {
            onLoad();
          }, 0);
        }
        
        // Start playing if autoPlay is enabled
        if (autoPlay && player) {
          console.log('[MP4Player] Starting autoPlay after ready');
          player.play().catch((err) => {
            console.error('[MP4Player] Failed to start autoPlay:', err);
          });
        }
      } else if (status.status === 'error') {
        console.error('[MP4Player] Player error status detected');
        setIsLoading(false);
        
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
        setError(errorMsg);
        
        // Schedule error callback in next tick
        if (onError) {
          setTimeout(() => {
            onError(errorMsg);
          }, 0);
        }
      }
    });

    // Playing change listener
    const playingSubscription = player.addListener('playingChange', (event) => {
      console.log('[MP4Player] Playing state changed:', event.isPlaying, 'oldIsPlaying:', event.oldIsPlaying);
      
      if (event.isPlaying && onPlaybackStart) {
        console.log('[MP4Player] Playback started, scheduling onPlaybackStart');
        setTimeout(() => {
          onPlaybackStart();
        }, 0);
      } else if (!event.isPlaying && event.oldIsPlaying) {
        // Check if video ended
        const currentTime = player.currentTime || 0;
        const duration = player.duration || 0;
        
        console.log('[MP4Player] Playback paused/stopped. CurrentTime:', currentTime, 'Duration:', duration);
        
        if (duration > 0 && currentTime >= duration - 0.5) {
          console.log('[MP4Player] Video ended, scheduling onPlaybackEnd');
          if (onPlaybackEnd) {
            setTimeout(() => {
              onPlaybackEnd();
            }, 0);
          }
        }
      }
    });

    // Cleanup listeners on unmount or URI change
    return () => {
      console.log('[MP4Player] Cleaning up event listeners');
      statusSubscription.remove();
      playingSubscription.remove();
    };
  }, [player, uri, autoPlay, onLoad, onError, onPlaybackStart, onPlaybackEnd]);

  const handleBackPress = () => {
    console.log('[MP4Player] Back button pressed');
    if (onBackPress) {
      onBackPress();
    }
  };

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Video Load Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
        {onBackPress && (
          <View style={[styles.backButtonContainer, { top: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <View style={styles.backButtonInner}>
                <ArrowLeft color="#ffffff" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // If no URI, don't render
  if (!uri || !uri.trim()) {
    console.warn('[MP4Player] No URI provided');
    return null;
  }

  // Render video player
  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
      <VideoView
        ref={videoRef}
        player={player}
        style={[styles.video, isFullscreen && styles.fullscreenVideo]}
        contentFit={isFullscreen ? "cover" : "contain"}
        nativeControls={true}
        allowsFullscreen={true}
        allowsPictureInPicture={true}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {onBackPress && (
        <View style={[styles.backButtonContainer, { top: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <ArrowLeft color="#ffffff" size={20} />
            </View>
          </TouchableOpacity>
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
    position: 'relative',
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
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1001,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
