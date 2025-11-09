import {
  UniversalPlayerController,
  PlayerState,
  PlayerStatus,
  PlayerType,
  VideoSourceConfig,
} from '../UniversalPlayerController';

export class NativePlayerAdapter implements UniversalPlayerController {
  private player: any;
  private listeners: Set<(status: PlayerStatus) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentState: PlayerState = PlayerState.IDLE;

  constructor(player: any, config?: VideoSourceConfig) {
    console.log('[NativePlayerAdapter] Initializing with player instance');
    this.player = player;
    this.currentState = PlayerState.READY;
    this.startStatusMonitoring();
  }

  getPlayerType(): PlayerType {
    return PlayerType.NATIVE;
  }

  private startStatusMonitoring(): void {
    this.intervalId = setInterval(() => {
      this.notifyListeners();
    }, 250);
  }

  private stopStatusMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notifyListeners(): void {
    this.getStatus().then(status => {
      this.listeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('[NativePlayerAdapter] Error in listener:', error);
        }
      });
    });
  }

  async play(): Promise<void> {
    try {
      if (this.player && typeof this.player.play === 'function') {
        this.player.play();
        this.currentState = PlayerState.PLAYING;
        console.log('[NativePlayerAdapter] Play started');
      }
    } catch (error) {
      console.error('[NativePlayerAdapter] Error playing:', error);
      this.currentState = PlayerState.ERROR;
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      if (this.player && typeof this.player.pause === 'function') {
        this.player.pause();
        this.currentState = PlayerState.PAUSED;
        console.log('[NativePlayerAdapter] Paused');
      }
    } catch (error) {
      console.error('[NativePlayerAdapter] Error pausing:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.player && typeof this.player.pause === 'function') {
        this.player.pause();
        this.player.currentTime = 0;
        this.currentState = PlayerState.IDLE;
        console.log('[NativePlayerAdapter] Stopped');
      }
    } catch (error) {
      console.error('[NativePlayerAdapter] Error stopping:', error);
      throw error;
    }
  }

  async seek(time: number): Promise<void> {
    try {
      if (this.player) {
        const duration = this.player.duration || 0;
        const clampedTime = Math.max(0, Math.min(time, duration));
        this.player.currentTime = clampedTime;
        console.log('[NativePlayerAdapter] Seeked to:', clampedTime);
      }
    } catch (error) {
      console.error('[NativePlayerAdapter] Error seeking:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      if (this.player) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.player.volume = clampedVolume;
        console.log('[NativePlayerAdapter] Volume set to:', clampedVolume);
      }
    } catch (error) {
      console.error('[NativePlayerAdapter] Error setting volume:', error);
      throw error;
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    try {
      if (this.player) {
        const clampedRate = Math.max(0.25, Math.min(2.0, rate));
        this.player.playbackRate = clampedRate;
        console.log('[NativePlayerAdapter] Playback rate set to:', clampedRate);
      }
    } catch (error) {
      console.error('[NativePlayerAdapter] Error setting playback rate:', error);
      throw error;
    }
  }

  async setMuted(muted: boolean): Promise<void> {
    try {
      if (this.player) {
        this.player.muted = muted;
        console.log('[NativePlayerAdapter] Muted:', muted);
      }
    } catch (error) {
      console.error('[NativePlayerAdapter] Error setting muted:', error);
      throw error;
    }
  }

  async enterFullscreen(): Promise<void> {
    console.log('[NativePlayerAdapter] Enter fullscreen requested');
  }

  async exitFullscreen(): Promise<void> {
    console.log('[NativePlayerAdapter] Exit fullscreen requested');
  }

  async getStatus(): Promise<PlayerStatus> {
    try {
      const isPlaying = this.player?.playing || false;
      const currentTime = this.player?.currentTime || 0;
      const duration = this.player?.duration || 0;
      
      if (isPlaying && this.currentState !== PlayerState.PLAYING) {
        this.currentState = PlayerState.PLAYING;
      } else if (!isPlaying && this.currentState === PlayerState.PLAYING) {
        if (currentTime >= duration && duration > 0) {
          this.currentState = PlayerState.ENDED;
        } else {
          this.currentState = PlayerState.PAUSED;
        }
      }

      return {
        state: this.currentState,
        currentTime,
        duration,
        volume: this.player?.volume || 1.0,
        muted: this.player?.muted || false,
        playbackRate: this.player?.playbackRate || 1.0,
        isFullscreen: false,
      };
    } catch (error) {
      console.error('[NativePlayerAdapter] Error getting status:', error);
      return {
        state: PlayerState.ERROR,
        currentTime: 0,
        duration: 0,
        volume: 1.0,
        muted: false,
        playbackRate: 1.0,
        isFullscreen: false,
        error: String(error),
      };
    }
  }

  subscribe(listener: (status: PlayerStatus) => void): () => void {
    this.listeners.add(listener);
    console.log('[NativePlayerAdapter] Listener subscribed. Total:', this.listeners.size);
    
    return () => {
      this.listeners.delete(listener);
      console.log('[NativePlayerAdapter] Listener unsubscribed. Total:', this.listeners.size);
    };
  }

  dispose(): void {
    console.log('[NativePlayerAdapter] Disposing...');
    this.stopStatusMonitoring();
    this.listeners.clear();
    
    if (this.player) {
      try {
        if (typeof this.player.pause === 'function') {
          this.player.pause();
        }
      } catch (error) {
        console.error('[NativePlayerAdapter] Error disposing player:', error);
      }
    }
  }
}
