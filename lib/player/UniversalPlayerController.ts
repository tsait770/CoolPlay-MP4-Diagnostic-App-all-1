

export enum PlayerState {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
  ENDED = 'ended',
  ERROR = 'error',
}

export enum PlayerType {
  NATIVE = 'native',
  WEBVIEW = 'webview',
  ADULT_PLATFORM = 'adult_platform',
}

export interface PlayerStatus {
  state: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  error?: string;
}

export interface UniversalPlayerController {
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(time: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setPlaybackRate(rate: number): Promise<void>;
  setMuted(muted: boolean): Promise<void>;
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  dispose(): void;
  getStatus(): Promise<PlayerStatus>;
  subscribe(listener: (status: PlayerStatus) => void): () => void;
  getPlayerType(): PlayerType;
}

export interface VideoSourceConfig {
  uri: string;
  type: 'direct' | 'stream' | 'hls' | 'dash' | 'rtmp' | 'youtube' | 'vimeo' | 'adult' | 'webview';
  platform?: string;
  headers?: Record<string, string>;
  requiresWebView?: boolean;
  requiresAgeVerification?: boolean;
}
