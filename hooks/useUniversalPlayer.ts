import { useState, useEffect, useCallback, useRef } from 'react';
import { RedundancyPipeline, PipelineResult, PlayerAdapter, PlaybackState, PlayerError } from '@/utils/player';

export interface UseUniversalPlayerConfig {
  url: string;
  autoPlay?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  onError?: (error: PlayerError) => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

export interface UseUniversalPlayerReturn {
  adapter: PlayerAdapter | null;
  state: PlaybackState;
  isInitializing: boolean;
  error: PlayerError | null;
  
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (time: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setMuted: (muted: boolean) => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  
  retry: () => Promise<void>;
}

export function useUniversalPlayer(config: UseUniversalPlayerConfig): UseUniversalPlayerReturn {
  const [adapter, setAdapter] = useState<PlayerAdapter | null>(null);
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    isBuffering: false,
    isSeeking: false,
    currentTime: 0,
    duration: 0,
    bufferedPercentage: 0,
    volume: 1.0,
    isMuted: false,
    playbackRate: 1.0,
    error: null,
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<PlayerError | null>(null);
  
  const unsubscribeRef = useRef<(() => void)[]>([]);
  const pipelineRef = useRef<RedundancyPipeline | null>(null);
  
  const initializePlayer = useCallback(async () => {
    console.log('[useUniversalPlayer] Initializing player for URL:', config.url);
    
    setIsInitializing(true);
    setError(null);
    
    unsubscribeRef.current.forEach(unsub => unsub());
    unsubscribeRef.current = [];
    
    if (adapter) {
      await adapter.destroy();
      setAdapter(null);
    }
    
    try {
      const pipeline = new RedundancyPipeline({
        url: config.url,
        autoRetry: config.autoRetry !== false,
        maxRetries: config.maxRetries || 3,
        onProgress: (stage, attempt) => {
          console.log(`[useUniversalPlayer] Pipeline progress: ${stage} (attempt ${attempt})`);
        },
        onFallback: (from, to) => {
          console.log(`[useUniversalPlayer] Falling back from ${from} to ${to}`);
        },
      });
      
      pipelineRef.current = pipeline;
      
      const result: PipelineResult = await pipeline.execute();
      
      if (result.success && result.adapter) {
        console.log('[useUniversalPlayer] Player initialized successfully:', result.adapter.type);
        
        const unsubState = result.adapter.onStateChange((newState) => {
          setState(newState);
          
          if (newState.isPlaying && !state.isPlaying) {
            config.onPlaybackStart?.();
          }
        });
        
        const unsubError = result.adapter.onError((err) => {
          console.error('[useUniversalPlayer] Player error:', err);
          setError(err);
          config.onError?.(err);
        });
        
        unsubscribeRef.current = [unsubState, unsubError];
        
        setAdapter(result.adapter);
        setIsInitializing(false);
        
      } else {
        console.error('[useUniversalPlayer] Failed to initialize player');
        console.error('[useUniversalPlayer] Attempts:', result.attempts);
        
        const finalError = result.finalError || {
          code: 'INITIALIZATION_FAILED',
          message: '無法初始化播放器',
          severity: 'fatal',
          recoverable: false,
          timestamp: Date.now(),
        };
        
        setError(finalError);
        config.onError?.(finalError);
        setIsInitializing(false);
      }
      
    } catch (err) {
      console.error('[useUniversalPlayer] Initialization error:', err);
      
      const initError: PlayerError = {
        code: 'INITIALIZATION_EXCEPTION',
        message: `初始化異常: ${err}`,
        severity: 'fatal',
        recoverable: true,
        timestamp: Date.now(),
      };
      
      setError(initError);
      config.onError?.(initError);
      setIsInitializing(false);
    }
  }, [config.url, config.autoRetry, config.maxRetries]);
  
  useEffect(() => {
    initializePlayer();
    
    return () => {
      console.log('[useUniversalPlayer] Cleaning up');
      
      unsubscribeRef.current.forEach(unsub => unsub());
      unsubscribeRef.current = [];
      
      if (adapter) {
        adapter.destroy().catch(err => {
          console.warn('[useUniversalPlayer] Error destroying adapter:', err);
        });
      }
    };
  }, [config.url]);
  
  const play = useCallback(async () => {
    if (!adapter) {
      console.warn('[useUniversalPlayer] Cannot play: adapter not initialized');
      return;
    }
    
    try {
      await adapter.play();
    } catch (err) {
      console.error('[useUniversalPlayer] Play error:', err);
    }
  }, [adapter]);
  
  const pause = useCallback(async () => {
    if (!adapter) {
      console.warn('[useUniversalPlayer] Cannot pause: adapter not initialized');
      return;
    }
    
    try {
      await adapter.pause();
    } catch (err) {
      console.error('[useUniversalPlayer] Pause error:', err);
    }
  }, [adapter]);
  
  const stop = useCallback(async () => {
    if (!adapter) {
      console.warn('[useUniversalPlayer] Cannot stop: adapter not initialized');
      return;
    }
    
    try {
      await adapter.stop();
    } catch (err) {
      console.error('[useUniversalPlayer] Stop error:', err);
    }
  }, [adapter]);
  
  const seek = useCallback(async (time: number) => {
    if (!adapter) {
      console.warn('[useUniversalPlayer] Cannot seek: adapter not initialized');
      return;
    }
    
    try {
      await adapter.seek(time);
    } catch (err) {
      console.error('[useUniversalPlayer] Seek error:', err);
    }
  }, [adapter]);
  
  const setVolume = useCallback(async (volume: number) => {
    if (!adapter) {
      console.warn('[useUniversalPlayer] Cannot set volume: adapter not initialized');
      return;
    }
    
    try {
      await adapter.setVolume(volume);
    } catch (err) {
      console.error('[useUniversalPlayer] Set volume error:', err);
    }
  }, [adapter]);
  
  const setMuted = useCallback(async (muted: boolean) => {
    if (!adapter) {
      console.warn('[useUniversalPlayer] Cannot set muted: adapter not initialized');
      return;
    }
    
    try {
      await adapter.setMuted(muted);
    } catch (err) {
      console.error('[useUniversalPlayer] Set muted error:', err);
    }
  }, [adapter]);
  
  const setPlaybackRate = useCallback(async (rate: number) => {
    if (!adapter) {
      console.warn('[useUniversalPlayer] Cannot set playback rate: adapter not initialized');
      return;
    }
    
    try {
      await adapter.setPlaybackRate(rate);
    } catch (err) {
      console.error('[useUniversalPlayer] Set playback rate error:', err);
    }
  }, [adapter]);
  
  const retry = useCallback(async () => {
    console.log('[useUniversalPlayer] Retrying...');
    await initializePlayer();
  }, [initializePlayer]);
  
  return {
    adapter,
    state,
    isInitializing,
    error,
    
    play,
    pause,
    stop,
    seek,
    setVolume,
    setMuted,
    setPlaybackRate,
    
    retry,
  };
}
