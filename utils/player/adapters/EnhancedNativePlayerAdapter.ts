import { Platform } from 'react-native';
import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export interface VideoFormat {
  format: string;
  isSupported: boolean;
  requiresTranscoding: boolean;
}

export const VIDEO_FORMATS: Record<string, VideoFormat> = {
  'mp4': { format: 'mp4', isSupported: true, requiresTranscoding: false },
  'webm': { format: 'webm', isSupported: true, requiresTranscoding: false },
  'mov': { format: 'mov', isSupported: Platform.OS === 'ios', requiresTranscoding: Platform.OS !== 'ios' },
  'mkv': { format: 'mkv', isSupported: false, requiresTranscoding: true },
  'avi': { format: 'avi', isSupported: false, requiresTranscoding: true },
  'flv': { format: 'flv', isSupported: false, requiresTranscoding: true },
  'wmv': { format: 'wmv', isSupported: false, requiresTranscoding: true },
  'm3u8': { format: 'm3u8', isSupported: true, requiresTranscoding: false },
  'mpd': { format: 'mpd', isSupported: Platform.OS === 'android', requiresTranscoding: false },
};

export class EnhancedNativePlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'native';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: true,
    supportsDASH: Platform.OS === 'android',
    supportsRTMP: false,
    supportsRTSP: false,
    supportsAV1: Platform.OS === 'android' && Platform.Version >= 30,
    supportsVP9: Platform.OS === 'android',
    supportsHEVC: Platform.OS === 'ios',
    supportsAC3: Platform.OS === 'ios',
    supportsEAC3: Platform.OS === 'ios',
    maxResolution: Platform.OS === 'ios' ? '4K' : '1080p',
  };
  
  private playerRef: any = null;
  private updateListenerRef: any = null;
  private statusListenerRef: any = null;
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log('[EnhancedNativePlayerAdapter] Initializing with config:', {
      url: config.url,
      autoPlay: config.autoPlay,
      platform: Platform.OS,
    });
    
    const format = this.detectFormat(config.url);
    if (format && !format.isSupported && format.requiresTranscoding) {
      this.reportError({
        code: 'UNSUPPORTED_FORMAT',
        message: `Format ${format.format} requires transcoding. Please use FFmpegPlayerAdapter.`,
        severity: 'error',
        recoverable: true,
        timestamp: Date.now(),
        url: config.url,
      });
    }
    
    this.updateState({
      volume: config.volume || 1.0,
      isMuted: config.muted || false,
      playbackRate: config.playbackRate || 1.0,
    });
  }
  
  detectFormat(url: string): VideoFormat | null {
    const urlLower = url.toLowerCase();
    
    for (const [ext, format] of Object.entries(VIDEO_FORMATS)) {
      if (urlLower.includes(`.${ext}`) || urlLower.includes(`/${ext}/`)) {
        console.log('[EnhancedNativePlayerAdapter] Detected format:', format);
        return format;
      }
    }
    
    if (urlLower.includes('m3u8')) {
      return VIDEO_FORMATS.m3u8;
    }
    if (urlLower.includes('.mpd')) {
      return VIDEO_FORMATS.mpd;
    }
    
    return null;
  }
  
  setPlayerRef(player: any): void {
    this.playerRef = player;
    console.log('[EnhancedNativePlayerAdapter] Player reference set');
    
    if (player) {
      this.setupPlayerListeners();
      this.startTimeTracking();
    }
  }
  
  private setupPlayerListeners(): void {
    if (!this.playerRef || !this.playerRef.addListener) {
      console.warn('[EnhancedNativePlayerAdapter] Player does not support listeners');
      return;
    }
    
    if (this.updateListenerRef) {
      this.updateListenerRef.remove();
    }
    
    if (this.statusListenerRef) {
      this.statusListenerRef.remove();
    }
    
    try {
      this.updateListenerRef = this.playerRef.addListener('playingChange', (event: any) => {
        console.log('[EnhancedNativePlayerAdapter] Playing change:', event.isPlaying);
        this.updateState({
          isPlaying: event.isPlaying,
          isPaused: !event.isPlaying,
        });
      });
      
      this.statusListenerRef = this.playerRef.addListener('statusChange', (status: any) => {
        console.log('[EnhancedNativePlayerAdapter] Status change:', status.status);
        
        switch (status.status) {
          case 'readyToPlay':
            this.updateState({
              isBuffering: false,
              duration: status.duration || 0,
            });
            break;
          
          case 'loading':
            this.updateState({ isBuffering: true });
            break;
          
          case 'error':
            const errorMsg = status.error?.message || status.error || 'Unknown playback error';
            this.reportError({
              code: 'PLAYBACK_ERROR',
              message: errorMsg,
              severity: 'error',
              recoverable: false,
              timestamp: Date.now(),
              url: this.config?.url,
            });
            break;
        }
      });
      
      console.log('[EnhancedNativePlayerAdapter] Listeners attached successfully');
    } catch (error) {
      console.warn('[EnhancedNativePlayerAdapter] Failed to attach listeners:', error);
    }
  }
  
  private startTimeTracking(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    
    this.timeUpdateInterval = setInterval(() => {
      if (this.playerRef && this.state.isPlaying) {
        const currentTime = this.playerRef.currentTime || 0;
        const duration = this.playerRef.duration || this.state.duration;
        
        if (currentTime !== this.state.currentTime) {
          this.updateState({ currentTime, duration });
        }
      }
    }, 250);
  }
  
  private stopTimeTracking(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }
  
  async play(): Promise<void> {
    if (!this.playerRef) {
      throw new Error('[EnhancedNativePlayerAdapter] Player not initialized');
    }
    
    try {
      await this.playerRef.play();
      this.updateState({ isPlaying: true, isPaused: false });
      console.log('[EnhancedNativePlayerAdapter] Playback started');
    } catch (error) {
      console.error('[EnhancedNativePlayerAdapter] Play failed:', error);
      this.reportError({
        code: 'PLAY_FAILED',
        message: `Failed to start playback: ${error}`,
        severity: 'error',
        recoverable: true,
        timestamp: Date.now(),
      });
      throw error;
    }
  }
  
  async pause(): Promise<void> {
    if (!this.playerRef) {
      throw new Error('[EnhancedNativePlayerAdapter] Player not initialized');
    }
    
    try {
      this.playerRef.pause();
      this.updateState({ isPlaying: false, isPaused: true });
      console.log('[EnhancedNativePlayerAdapter] Playback paused');
    } catch (error) {
      console.error('[EnhancedNativePlayerAdapter] Pause failed:', error);
      this.reportError({
        code: 'PAUSE_FAILED',
        message: `Failed to pause playback: ${error}`,
        severity: 'warning',
        recoverable: true,
        timestamp: Date.now(),
      });
      throw error;
    }
  }
  
  async stop(): Promise<void> {
    if (!this.playerRef) {
      return;
    }
    
    try {
      this.playerRef.pause();
      if (this.playerRef.currentTime !== undefined) {
        this.playerRef.currentTime = 0;
      }
      this.updateState({
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
      });
      console.log('[EnhancedNativePlayerAdapter] Playback stopped');
    } catch (error) {
      console.warn('[EnhancedNativePlayerAdapter] Stop failed:', error);
    }
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    if (!this.playerRef) {
      throw new Error('[EnhancedNativePlayerAdapter] Player not initialized');
    }
    
    const clampedTime = Math.max(0, Math.min(timeInSeconds, this.state.duration));
    
    try {
      this.updateState({ isSeeking: true });
      this.playerRef.currentTime = clampedTime;
      this.updateState({
        currentTime: clampedTime,
        isSeeking: false,
      });
      console.log('[EnhancedNativePlayerAdapter] Seeked to:', clampedTime);
    } catch (error) {
      this.updateState({ isSeeking: false });
      console.error('[EnhancedNativePlayerAdapter] Seek failed:', error);
      this.reportError({
        code: 'SEEK_FAILED',
        message: `Failed to seek: ${error}`,
        severity: 'warning',
        recoverable: true,
        timestamp: Date.now(),
      });
      throw error;
    }
  }
  
  async setVolume(volume: number): Promise<void> {
    if (!this.playerRef) {
      throw new Error('[EnhancedNativePlayerAdapter] Player not initialized');
    }
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.playerRef.volume = clampedVolume;
    this.updateState({ volume: clampedVolume });
    console.log('[EnhancedNativePlayerAdapter] Volume set to:', clampedVolume);
  }
  
  async setMuted(muted: boolean): Promise<void> {
    if (!this.playerRef) {
      throw new Error('[EnhancedNativePlayerAdapter] Player not initialized');
    }
    
    this.playerRef.muted = muted;
    this.updateState({ isMuted: muted });
    console.log('[EnhancedNativePlayerAdapter] Muted:', muted);
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.playerRef) {
      throw new Error('[EnhancedNativePlayerAdapter] Player not initialized');
    }
    
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    if (this.playerRef.playbackRate !== undefined) {
      this.playerRef.playbackRate = clampedRate;
      this.updateState({ playbackRate: clampedRate });
      console.log('[EnhancedNativePlayerAdapter] Playback rate set to:', clampedRate);
    } else {
      console.warn('[EnhancedNativePlayerAdapter] Playback rate not supported');
    }
  }
  
  async destroy(): Promise<void> {
    console.log('[EnhancedNativePlayerAdapter] Destroying player');
    
    this.stopTimeTracking();
    
    if (this.updateListenerRef) {
      this.updateListenerRef.remove();
      this.updateListenerRef = null;
    }
    
    if (this.statusListenerRef) {
      this.statusListenerRef.remove();
      this.statusListenerRef = null;
    }
    
    if (this.playerRef) {
      try {
        await this.stop();
      } catch (error) {
        console.warn('[EnhancedNativePlayerAdapter] Error stopping player:', error);
      }
      
      this.playerRef = null;
    }
    
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
