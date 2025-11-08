/**
 * 独立的 MP4 播放器组件
 * 专门用于播放 MP4 和直接视频文件
 * 使用全新的架构，与其他播放器完全独立
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { AlertCircle, Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, RefreshCw } from 'lucide-react-native';
import { mp4PlayerModule, MP4PlayerConfig } from '@/utils/player/MP4PlayerModule';
import Colors from '@/constants/colors';

export interface DedicatedMP4PlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  showControls?: boolean;
}

export default function DedicatedMP4Player({
  url,
  onError,
  onLoad,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  showControls = true,
}: DedicatedMP4PlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);

  console.log('[DedicatedMP4Player] Rendering with URL:', url);

  const safeUrl = validatedUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const player = useVideoPlayer(safeUrl, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay && validatedUrl) {
      player.play();
    }
  });

  useEffect(() => {
    validateAndPrepareVideo();
  }, [url]);

  const validateAndPrepareVideo = async () => {
    console.log('[DedicatedMP4Player] Validating video URL...');
    setIsValidating(true);
    setError(null);

    if (!url || url.trim() === '') {
      const errorMsg = 'Invalid URL: URL is empty';
      console.error('[DedicatedMP4Player]', errorMsg);
      setError(errorMsg);
      setIsValidating(false);
      onError?.(errorMsg);
      return;
    }

    const codecInfo = mp4PlayerModule.detectCodec(url);
    console.log('[DedicatedMP4Player] Codec detection result:', codecInfo);

    if (!codecInfo.supported) {
      const errorMsg = mp4PlayerModule.generateDiagnosticInfo(url, codecInfo.errorMessage || undefined);
      console.error('[DedicatedMP4Player] Unsupported codec:', errorMsg);
      setError(errorMsg);
      setIsValidating(false);
      onError?.(errorMsg);
      return;
    }

    try {
      const validationResult = await mp4PlayerModule.validateMP4Url(url);
      console.log('[DedicatedMP4Player] Validation result:', validationResult);

      if (!validationResult.isValid) {
        const errorMsg = validationResult.errorMessage || 'Failed to validate MP4 URL';
        console.error('[DedicatedMP4Player]', errorMsg);
        setError(mp4PlayerModule.generateDiagnosticInfo(url, errorMsg));
        setIsValidating(false);
        onError?.(errorMsg);
        return;
      }

      if (!validationResult.canPlay) {
        const errorMsg = `不支持的视频格式\n\nContent-Type: ${validationResult.contentType}\n\n该视频格式无法播放，请使用 MP4 (H.264) 格式`;
        console.error('[DedicatedMP4Player]', errorMsg);
        setError(mp4PlayerModule.generateDiagnosticInfo(url, errorMsg));
        setIsValidating(false);
        onError?.(errorMsg);
        return;
      }

      if (!validationResult.supportsRange) {
        console.warn('[DedicatedMP4Player] Server does not support Range requests - seeking may not work');
      }

      const finalUrl = validationResult.redirectUrl || url;
      console.log('[DedicatedMP4Player] Using validated URL:', finalUrl);
      
      setValidatedUrl(finalUrl);
      setIsValidating(false);
      setIsLoading(false);
      onLoad?.();
    } catch (error: any) {
      console.error('[DedicatedMP4Player] Validation error:', error);
      const errorMsg = mp4PlayerModule.generateDiagnosticInfo(url, error.message);
      setError(errorMsg);
      setIsValidating(false);
      onError?.(error.message);
    }
  };

  useEffect(() => {
    if (!player) return;

    const playingSubscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const statusSubscription = player.addListener('statusChange', (status) => {
      console.log('[DedicatedMP4Player] Player status:', status.status);

      if (status.status === 'readyToPlay') {
        setIsLoading(false);
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

        console.error('[DedicatedMP4Player] Player error:', errorMsg);
        const fullErrorMsg = mp4PlayerModule.generateDiagnosticInfo(url, errorMsg);
        setError(fullErrorMsg);
        onError?.(fullErrorMsg);
      }
    });

    return () => {
      playingSubscription.remove();
      statusSubscription.remove();
    };
  }, [player, autoPlay, onPlaybackStart, onError, url]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
      onPlaybackStart?.();
    }
    setIsPlaying(!isPlaying);
  }, [player, isPlaying, onPlaybackStart]);

  const handleMute = useCallback(() => {
    if (!player) return;
    
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [player, isMuted]);

  const handleSeek = useCallback((seconds: number) => {
    if (!player) return;
    
    const currentTime = player.currentTime || 0;
    const newPosition = Math.max(0, currentTime + seconds);
    player.currentTime = newPosition;
  }, [player]);

  const handleRetry = () => {
    console.log('[DedicatedMP4Player] Retrying...');
    setError(null);
    setValidatedUrl(null);
    validateAndPrepareVideo();
  };

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.semantic.danger} />
          <Text style={styles.errorTitle}>MP4 播放失败</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isValidating || !validatedUrl) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>正在验证视频...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      activeOpacity={1}
      onPress={() => setShowControlsOverlay(!showControlsOverlay)}
    >
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen
        allowsPictureInPicture
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>正在加载视频...</Text>
        </View>
      )}

      {showControls && showControlsOverlay && (
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
          </View>
        </View>
      )}
    </TouchableOpacity>
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
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});
