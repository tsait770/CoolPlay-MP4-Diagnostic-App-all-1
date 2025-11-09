import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { VideoView, useVideoPlayer as useExpoVideoPlayer } from 'expo-video';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Mp4PlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  style?: any;
  onBack?: () => void;
}

export default function Mp4Player({
  url,
  onError,
  onLoad,
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  style,
  onBack,
}: Mp4PlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const player = useExpoVideoPlayer(url, (player) => {
    player.loop = false;
    player.muted = isMuted;
    if (autoPlay) {
      player.play();
    }
  });

  useEffect(() => {
    if (showControls && isPlaying) {
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
  }, [showControls, isPlaying]);

  useEffect(() => {
    const handleVoiceCommand = (event: any) => {
      const detail = event?.detail ?? {};
      const cmd: string | undefined = (detail.intent as string) ?? (detail.command as string);
      if (!cmd || !player) return;

      console.log('[Mp4Player] Voice command received:', cmd);

      switch (cmd) {
        case 'PlayVideoIntent':
          player.play();
          break;
        case 'PauseVideoIntent':
          player.pause();
          break;
        case 'StopVideoIntent':
          player.pause();
          player.currentTime = 0;
          break;
        case 'ReplayVideoIntent':
          player.currentTime = 0;
          player.play();
          break;
        case 'Forward10Intent':
          handleSeek(10);
          break;
        case 'Forward20Intent':
          handleSeek(20);
          break;
        case 'Forward30Intent':
          handleSeek(30);
          break;
        case 'Rewind10Intent':
          handleSeek(-10);
          break;
        case 'Rewind20Intent':
          handleSeek(-20);
          break;
        case 'Rewind30Intent':
          handleSeek(-30);
          break;
        case 'MuteIntent':
          player.muted = true;
          setIsMuted(true);
          break;
        case 'UnmuteIntent':
          player.muted = false;
          setIsMuted(false);
          break;
        case 'VolumeMaxIntent':
          player.volume = 1.0;
          break;
        case 'VolumeUpIntent':
          player.volume = Math.min(1.0, (player.volume || 0.5) + 0.2);
          break;
        case 'VolumeDownIntent':
          player.volume = Math.max(0, (player.volume || 0.5) - 0.2);
          break;
        case 'SpeedHalfIntent':
          player.playbackRate = 0.5;
          break;
        case 'SpeedNormalIntent':
          player.playbackRate = 1.0;
          break;
        case 'Speed125Intent':
          player.playbackRate = 1.25;
          break;
        case 'Speed150Intent':
          player.playbackRate = 1.5;
          break;
        case 'Speed200Intent':
          player.playbackRate = 2.0;
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('voiceCommand', handleVoiceCommand);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('voiceCommand', handleVoiceCommand);
      }
    };
  }, [player, handleSeek]);

  useEffect(() => {
    if (!player) return;

    const playingSubscription = player.addListener('playingChange', (event) => {
      const playing = event.isPlaying;
      setIsPlaying(playing);
      
      if (playing && !isPlaying) {
        onPlaybackStart?.();
      } else if (!playing && isPlaying) {
        onPlaybackEnd?.();
      }
    });

    const statusSubscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        setIsLoading(false);
        onLoad?.();
      } else if (status.status === 'error') {
        let errorMsg = 'Unknown playback error';
        if (status.error) {
          if (typeof status.error === 'object' && 'message' in status.error) {
            errorMsg = String((status.error as any).message || 'Unknown error');
          } else if (typeof status.error === 'string') {
            errorMsg = status.error;
          }
        }
        
        console.error('[Mp4Player] Playback error:', {
          error: status.error,
          errorMessage: errorMsg,
          url,
        });
        
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
      }
    });

    const timeInterval = setInterval(() => {
      if (player) {
        setCurrentTime(player.currentTime || 0);
        setDuration(player.duration || 0);
      }
    }, 100);

    return () => {
      playingSubscription.remove();
      statusSubscription.remove();
      clearInterval(timeInterval);
    };
  }, [player, onLoad, onError, onPlaybackStart, onPlaybackEnd, url, isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  }, [player, isPlaying]);

  const handleMute = useCallback(() => {
    if (!player) return;
    
    const newMuted = !isMuted;
    player.muted = newMuted;
    setIsMuted(newMuted);
  }, [player, isMuted]);

  const handleSeek = useCallback((seconds: number) => {
    if (!player) return;
    
    const currentTime = player.currentTime || 0;
    const newPosition = Math.max(0, Math.min(duration, currentTime + seconds));
    player.currentTime = newPosition;
  }, [player, duration]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!url || url.trim() === '') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No video URL provided</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Playback Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreen, style]}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit={isFullscreen ? "cover" : "contain"}
          nativeControls={false}
          allowsFullscreen
          allowsPictureInPicture
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary.accent || Colors.accent.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {showControls && !error && !isLoading && (
          <>
            <View style={styles.topControls}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={handleFullscreen} style={styles.controlButton}>
                {isFullscreen ? (
                  <Minimize size={24} color="#fff" />
                ) : (
                  <Maximize size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity onPress={() => handleSeek(-10)} style={styles.controlButton}>
                <SkipBack size={32} color="#fff" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
                {isPlaying ? (
                  <Pause size={40} color="#fff" />
                ) : (
                  <Play size={40} color="#fff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleSeek(10)} style={styles.controlButton}>
                <SkipForward size={32} color="#fff" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
              <TouchableOpacity onPress={handleMute} style={styles.controlButton}>
                {isMuted ? (
                  <VolumeX size={20} color="#fff" />
                ) : (
                  <Volume2 size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
    borderRadius: 0,
    zIndex: 1000,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject as any,
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
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    transform: [{ translateY: -40 }],
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  controlButton: {
    padding: 8,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});
