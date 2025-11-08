export type PlayerType = 'native' | 'webview' | 'hls' | 'dash' | 'cloud' | 'ffmpeg' | 'rtmp' | 'social';

export interface PlayerCapabilities {
  supportsHLS: boolean;
  supportsDASH: boolean;
  supportsRTMP: boolean;
  supportsRTSP: boolean;
  supportsAV1: boolean;
  supportsVP9: boolean;
  supportsHEVC: boolean;
  supportsAC3: boolean;
  supportsEAC3: boolean;
  maxResolution: '480p' | '720p' | '1080p' | '1440p' | '4K' | '8K';
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  isSeeking: boolean;
  currentTime: number;
  duration: number;
  bufferedPercentage: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  error: PlayerError | null;
}

export interface PlayerError {
  code: string;
  message: string;
  severity: 'warning' | 'error' | 'fatal';
  recoverable: boolean;
  timestamp: number;
  url?: string;
  platform?: string;
  stackTrace?: string;
}

export interface PlayerConfig {
  url: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  preload?: 'none' | 'metadata' | 'auto';
  maxBufferSize?: number;
  enableRangeRequests?: boolean;
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
}

export interface PlayerAdapter {
  type: PlayerType;
  capabilities: PlayerCapabilities;
  
  initialize(config: PlayerConfig): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(timeInSeconds: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  setPlaybackRate(rate: number): Promise<void>;
  
  getState(): PlaybackState;
  getCapabilities(): PlayerCapabilities;
  
  destroy(): Promise<void>;
  
  onStateChange(callback: (state: PlaybackState) => void): () => void;
  onError(callback: (error: PlayerError) => void): () => void;
}

export abstract class BasePlayerAdapter implements PlayerAdapter {
  abstract type: PlayerType;
  abstract capabilities: PlayerCapabilities;
  
  protected config: PlayerConfig | null = null;
  protected state: PlaybackState = {
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
  };
  
  protected stateChangeCallbacks: Array<(state: PlaybackState) => void> = [];
  protected errorCallbacks: Array<(error: PlayerError) => void> = [];
  
  async initialize(config: PlayerConfig): Promise<void> {
    this.config = config;
    console.log(`[${this.type}Adapter] Initialized with:`, config);
  }
  
  abstract play(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract seek(timeInSeconds: number): Promise<void>;
  abstract setVolume(volume: number): Promise<void>;
  abstract setMuted(muted: boolean): Promise<void>;
  abstract setPlaybackRate(rate: number): Promise<void>;
  abstract destroy(): Promise<void>;
  
  getState(): PlaybackState {
    return { ...this.state };
  }
  
  getCapabilities(): PlayerCapabilities {
    return { ...this.capabilities };
  }
  
  protected updateState(updates: Partial<PlaybackState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }
  
  protected reportError(error: PlayerError): void {
    this.state.error = error;
    console.error(`[${this.type}Adapter] Error:`, error);
    this.errorCallbacks.forEach(callback => callback(error));
  }
  
  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => callback(this.getState()));
  }
  
  onStateChange(callback: (state: PlaybackState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }
  
  onError(callback: (error: PlayerError) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index !== -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }
}
