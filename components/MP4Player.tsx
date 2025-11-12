import { VideoView } from 'expo-video';
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalVideoPlayer } from '@/hooks/useLocalVideoPlayer';

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
  const videoRef = useRef<VideoView>(null);
  
  // Use the simplified local video player hook
  const {
    player,
    isLoading,
    error,
    isFullscreen,
    loadVideo,
    play,
    toggleFullscreen,
  } = useLocalVideoPlayer();

  // Load video when URI changes
  useEffect(() => {
    if (!uri || uri.trim() === '') {
      console.warn('[MP4Player] No URI provided');
      return;
    }

    console.log('[MP4Player] ========== Loading Video ==========');
    console.log('[MP4Player] URI:', uri);

    loadVideo(uri, 'Local Video');
  }, [uri, loadVideo]);

  // Auto-play when ready
  useEffect(() => {
    if (autoPlay && player && !isLoading && !error) {
      console.log('[MP4Player] Auto-play enabled, playing...');
      const timeout = setTimeout(() => {
        play();
        onPlaybackStart?.();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [autoPlay, player, isLoading, error, play, onPlaybackStart]);

  // Forward error to parent
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle back press when fullscreen
  const handleBackPress = () => {
    if (isFullscreen) {
      toggleFullscreen();
    }
    onBackPress?.();
  };



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
        nativeControls={Platform.OS === 'android' ? true : true}
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
