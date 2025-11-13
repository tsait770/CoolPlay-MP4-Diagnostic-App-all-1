/**
 * Local MP4 Video Player Hook
 * 
 * Simplified video player hook specifically optimized for local MP4 file playback
 * on both iOS and Android platforms using expo-video.
 * 
 * Key Features:
 * - Automatic local file preparation (iOS cache copying)
 * - Platform-specific optimizations
 * - Clean state management
 * - Error handling and retry logic
 */

import { useVideoPlayer as useExpoVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { prepareLocalVideo, type PrepareLocalVideoResult } from '@/utils/videoHelpers';

interface VideoPlayerState {
  uri?: string;
  title?: string;
  isPlaying: boolean;
  volume: number;
  speed: number;
  duration: number;
  position: number;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
  prepareResult: PrepareLocalVideoResult | null;
}

export function useLocalVideoPlayer() {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    volume: 1,
    speed: 1,
    duration: 0,
    position: 0,
    isFullscreen: false,
    isLoading: false,
    error: null,
    prepareResult: null,
  });

  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [, setHasInitialized] = useState(false);

  // Initialize player with current URI or a valid placeholder
  // expo-video requires a valid source for initialization
  const player = useExpoVideoPlayer(
    currentUri || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    (player) => {
      // Initialize player settings when created
      player.loop = false;
      player.muted = false;
      player.volume = 1.0;
    }
  );

  // Track if the current URI is a local file
  const isLocalFile = useMemo(() => {
    if (!currentUri) return false;
    return currentUri.startsWith('file://') || 
           currentUri.startsWith('content://') || 
           currentUri.startsWith('ph://') ||
           currentUri.startsWith('assets-library://');
  }, [currentUri]);
  
  // Listen to currentUri changes to update player
  useEffect(() => {
    if (!currentUri || !player) return;
    
    console.log('[useLocalVideoPlayer] URI changed, player will auto-update via useExpoVideoPlayer');
  }, [currentUri, player]);

  const loadVideo = useCallback(async (uri: string, title?: string) => {
    if (!uri?.trim()) {
      setState(prev => ({ ...prev, error: 'Empty video URL provided', isLoading: false }));
      return;
    }

    console.log('[useLocalVideoPlayer] ========== Loading Video ==========');
    console.log('[useLocalVideoPlayer] URI:', uri);
    console.log('[useLocalVideoPlayer] Title:', title);
    console.log('[useLocalVideoPlayer] Platform:', Platform.OS);

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      uri: undefined,
      title: undefined,
    }));

    try {
      const isLocal = uri.startsWith('file://') || 
                      uri.startsWith('content://') || 
                      uri.startsWith('ph://') ||
                      uri.startsWith('assets-library://');

      let processedUri = uri;
      let prepResult: PrepareLocalVideoResult | null = null;

      // For local files, prepare them first
      if (isLocal) {
        console.log('[useLocalVideoPlayer] 📁 Local file detected, preparing...');
        prepResult = await prepareLocalVideo(uri);
        
        if (!prepResult.success || !prepResult.uri) {
          throw new Error(prepResult.error || 'Failed to prepare local video file');
        }
        
        processedUri = prepResult.uri;
        console.log('[useLocalVideoPlayer] ✅ Local file prepared:', processedUri);
      }

      // Validate URL format
      try {
        new URL(processedUri);
      } catch {
        throw new Error('Invalid video URL format');
      }

      // Reset state before loading
      setState(prev => ({
        ...prev,
        isPlaying: false,
        position: 0,
        duration: 0,
      }));

      // Update state with new source - this will trigger player re-initialization via useExpoVideoPlayer dependency
      console.log('[useLocalVideoPlayer] 🔄 Setting new video source:', processedUri);
      setCurrentUri(processedUri);
      setHasInitialized(true);
      
      // Wait for player to initialize with new source
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update state
      setState(prev => ({
        ...prev,
        uri: processedUri,
        title: title || 'Video',
        isLoading: false,
        prepareResult: prepResult,
      }));

      console.log('[useLocalVideoPlayer] ✅ Video loaded successfully');
    } catch (error) {
      console.error('[useLocalVideoPlayer] ❌ Load error:', error);
      
      setCurrentUri(null);
      setHasInitialized(false);
      
      setState(prev => ({
        ...prev,
        uri: undefined,
        title: undefined,
        isPlaying: false,
        position: 0,
        duration: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while loading video',
        prepareResult: null,
      }));
    }
  }, []);

  const play = useCallback(async () => {
    try {
      if (!player) return;
      player.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      console.log('[useLocalVideoPlayer] ▶️ Playing');
    } catch (error) {
      console.error('[useLocalVideoPlayer] Error playing video:', error);
    }
  }, [player]);

  const pause = useCallback(async () => {
    try {
      if (!player) return;
      player.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
      console.log('[useLocalVideoPlayer] ⏸️ Paused');
    } catch (error) {
      console.error('[useLocalVideoPlayer] Error pausing video:', error);
    }
  }, [player]);

  const seek = useCallback(async (seconds: number) => {
    try {
      if (!player) return;
      const currentTime = player.currentTime || 0;
      const duration = player.duration || state.duration || 0;
      const newPosition = Math.max(0, Math.min(currentTime + seconds, duration));
      player.currentTime = newPosition;
      setState(prev => ({ ...prev, position: newPosition }));
      console.log('[useLocalVideoPlayer] ⏩ Seeked to:', newPosition);
    } catch (error) {
      console.error('[useLocalVideoPlayer] Error seeking:', error);
    }
  }, [player, state.duration]);

  const setVolume = useCallback(async (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    try {
      if (!player) return;
      player.volume = clampedVolume;
      setState(prev => ({ ...prev, volume: clampedVolume }));
      console.log('[useLocalVideoPlayer] 🔊 Volume set to:', clampedVolume);
    } catch (error) {
      console.error('[useLocalVideoPlayer] Error setting volume:', error);
    }
  }, [player]);

  const setSpeed = useCallback(async (speed: number) => {
    try {
      if (!player) return;
      player.playbackRate = speed;
      setState(prev => ({ ...prev, speed }));
      console.log('[useLocalVideoPlayer] ⚡ Speed set to:', speed);
    } catch (error) {
      console.error('[useLocalVideoPlayer] Error setting speed:', error);
    }
  }, [player]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const videoElement = document.querySelector('video');
        if (videoElement) {
          if (!document.fullscreenElement) {
            await videoElement.requestFullscreen();
            setState(prev => ({ ...prev, isFullscreen: true }));
          } else {
            await document.exitFullscreen();
            setState(prev => ({ ...prev, isFullscreen: false }));
          }
        }
      } else {
        // Native fullscreen handling (use state to drive UI changes)
        setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
      }
      console.log('[useLocalVideoPlayer] 📺 Fullscreen toggled');
    } catch (error) {
      console.error('[useLocalVideoPlayer] Error toggling fullscreen:', error);
      setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
    }
  }, []);

  // Listen to player status updates
  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener('statusChange', (status) => {
      console.log('[useLocalVideoPlayer] Status:', status.status);
      
      if (status.status === 'readyToPlay') {
        setState(prev => ({ ...prev, isLoading: false, error: null }));
      } else if (status.status === 'loading') {
        setState(prev => ({ ...prev, isLoading: true }));
      } else if (status.status === 'error') {
        const errorMsg = status.error 
          ? (typeof status.error === 'object' && 'message' in status.error 
              ? String((status.error as any).message) 
              : String(status.error))
          : 'Unknown playback error';
        setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
      }
    });

    const playingSub = player.addListener('playingChange', (event) => {
      setState(prev => ({ ...prev, isPlaying: event.isPlaying }));
    });

    const timeUpdate = setInterval(() => {
      if (player.duration > 0) {
        setState(prev => ({
          ...prev,
          duration: player.duration,
          position: player.currentTime,
        }));
      }
    }, 100);

    return () => {
      statusSub.remove();
      playingSub.remove();
      clearInterval(timeUpdate);
    };
  }, [player]);

  // Web fullscreen event listeners
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setState(prev => ({ ...prev, isFullscreen: isCurrentlyFullscreen }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return useMemo(() => ({
    player,
    ...state,
    isLocalFile,
    loadVideo,
    play,
    pause,
    seek,
    setVolume,
    setSpeed,
    toggleFullscreen,
  }), [
    player,
    state,
    isLocalFile,
    loadVideo,
    play,
    pause,
    seek,
    setVolume,
    setSpeed,
    toggleFullscreen,
  ]);
}
