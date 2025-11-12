import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Validate URI before initializing player
  const validUri = uri && uri.trim() !== '' ? uri : null;
  
  console.log('[MP4Player] Initializing with URI:', validUri);
  console.log('[MP4Player] URI details:', {
    uri: validUri,
    autoPlay,
    hasError: !!error,
    isLoading,
  });
  
  const player = useVideoPlayer(validUri || 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTYgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAA/ZYiEACD/2lu4PtiAGCZiIJmO35BneLS4/AKawbwF3gS81VgCN/Hrr5/Vp4UEDhArEAAAAwAAAwAAFgJPWwAAAAA=', (player) => {
    if (!validUri) {
      console.warn('[MP4Player] No valid URI provided');
      return;
    }
    
    player.loop = false;
    player.muted = false;
    if (autoPlay) {
      console.log('[MP4Player] Autoplay enabled, starting playback');
      player.play();
    }
  });

  // Check if URI is valid
  useEffect(() => {
    if (!validUri) {
      const errorMsg = 'No valid video URI provided';
      console.error('[MP4Player]', errorMsg);
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      return;
    }
  }, [validUri, onError]);

  useEffect(() => {
    if (!player || !validUri) return;

    console.log('[MP4Player] Setting up player listeners for URI:', validUri);

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[MP4Player] Status changed:', status.status);

      if (status.status === 'idle') {
        setIsLoading(true);
      } else if (status.status === 'loading') {
        setIsLoading(true);
      } else if (status.status === 'readyToPlay') {
        setIsLoading(false);
        setError(null);
        if (onLoad) {
          onLoad();
        }
        if (autoPlay) {
          player.play();
        }
      } else if (status.status === 'error') {
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
        if (onError) {
          onError(errorMsg);
        }
      }
    });

    const playingSubscription = player.addListener('playingChange', (event) => {
      console.log('[MP4Player] Playing state changed:', event.isPlaying);
      if (event.isPlaying && onPlaybackStart) {
        onPlaybackStart();
      } else if (!event.isPlaying && event.oldIsPlaying && onPlaybackEnd) {
        const currentTime = player.currentTime || 0;
        const duration = player.duration || 0;
        if (duration > 0 && currentTime >= duration - 0.5) {
          onPlaybackEnd();
        }
      }
    });

    return () => {
      statusSubscription.remove();
      playingSubscription.remove();
    };
  }, [player, uri, autoPlay, onLoad, onError, onPlaybackStart, onPlaybackEnd]);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    }
  };

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Playback Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
        {onBackPress && (
          <View
            style={[
              styles.backButtonContainer,
              { top: insets.top + 8 }
            ]}
          >
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
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
        <View
          style={[
            styles.backButtonContainer,
            { top: insets.top + 8 }
          ]}
        >
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#ffffff" size={20} />
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
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    zIndex: 9999,
  },
  video: {
    flex: 1,
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
    backgroundColor: '#000',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
