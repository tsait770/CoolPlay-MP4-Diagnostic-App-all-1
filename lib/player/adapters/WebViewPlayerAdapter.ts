import { RefObject } from 'react';
import { WebView } from 'react-native-webview';
import {
  UniversalPlayerController,
  PlayerState,
  PlayerStatus,
  PlayerType,
  VideoSourceConfig,
} from '../UniversalPlayerController';

export class WebViewPlayerAdapter implements UniversalPlayerController {
  private webViewRef: RefObject<WebView>;
  private listeners: Set<(status: PlayerStatus) => void> = new Set();
  private currentState: PlayerState = PlayerState.LOADING;
  private config: VideoSourceConfig;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 1.0;
  private muted: boolean = false;
  private playbackRate: number = 1.0;

  constructor(webViewRef: RefObject<WebView>, config: VideoSourceConfig) {
    console.log('[WebViewPlayerAdapter] Initializing with config:', config);
    this.webViewRef = webViewRef;
    this.config = config;
  }

  getPlayerType(): PlayerType {
    if (this.config.type === 'adult') {
      return PlayerType.ADULT_PLATFORM;
    }
    return PlayerType.WEBVIEW;
  }

  private injectScript(script: string): void {
    if (this.webViewRef.current) {
      this.webViewRef.current.injectJavaScript(`
        (function() {
          try {
            ${script}
          } catch(e) {
            console.error('[WebView] Script error:', e);
          }
        })();
      `);
    }
  }

  private notifyListeners(): void {
    this.getStatus().then(status => {
      this.listeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('[WebViewPlayerAdapter] Error in listener:', error);
        }
      });
    });
  }

  async play(): Promise<void> {
    console.log('[WebViewPlayerAdapter] Play');
    if (this.config.type === 'youtube' || this.config.type === 'vimeo') {
      this.injectScript('if (typeof playVideo === "function") playVideo();');
    }
    this.currentState = PlayerState.PLAYING;
    this.notifyListeners();
  }

  async pause(): Promise<void> {
    console.log('[WebViewPlayerAdapter] Pause');
    if (this.config.type === 'youtube' || this.config.type === 'vimeo') {
      this.injectScript('if (typeof pauseVideo === "function") pauseVideo();');
    }
    this.currentState = PlayerState.PAUSED;
    this.notifyListeners();
  }

  async stop(): Promise<void> {
    console.log('[WebViewPlayerAdapter] Stop');
    if (this.config.type === 'youtube' || this.config.type === 'vimeo') {
      this.injectScript('if (typeof stopVideo === "function") stopVideo();');
    }
    this.currentState = PlayerState.IDLE;
    this.currentTime = 0;
    this.notifyListeners();
  }

  async seek(time: number): Promise<void> {
    console.log('[WebViewPlayerAdapter] Seek to:', time);
    if (this.config.type === 'youtube' || this.config.type === 'vimeo') {
      this.injectScript(`if (typeof seekTo === "function") seekTo(${time});`);
    }
    this.currentTime = time;
    this.notifyListeners();
  }

  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    console.log('[WebViewPlayerAdapter] Set volume:', clampedVolume);
    if (this.config.type === 'youtube' || this.config.type === 'vimeo') {
      this.injectScript(`if (typeof setVolume === "function") setVolume(${clampedVolume});`);
    }
    this.volume = clampedVolume;
    this.notifyListeners();
  }

  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    console.log('[WebViewPlayerAdapter] Set playback rate:', clampedRate);
    if (this.config.type === 'youtube') {
      this.injectScript(`
        if (player && player.setPlaybackRate) {
          player.setPlaybackRate(${clampedRate});
        }
      `);
    } else if (this.config.type === 'vimeo') {
      this.injectScript(`
        if (player && player.setPlaybackRate) {
          player.setPlaybackRate(${clampedRate});
        }
      `);
    }
    this.playbackRate = clampedRate;
    this.notifyListeners();
  }

  async setMuted(muted: boolean): Promise<void> {
    console.log('[WebViewPlayerAdapter] Set muted:', muted);
    if (this.config.type === 'youtube' || this.config.type === 'vimeo') {
      const script = muted 
        ? 'if (typeof mute === "function") mute();'
        : 'if (typeof unMute === "function") unMute();';
      this.injectScript(script);
    }
    this.muted = muted;
    this.notifyListeners();
  }

  async enterFullscreen(): Promise<void> {
    console.log('[WebViewPlayerAdapter] Enter fullscreen');
  }

  async exitFullscreen(): Promise<void> {
    console.log('[WebViewPlayerAdapter] Exit fullscreen');
  }

  async getStatus(): Promise<PlayerStatus> {
    return {
      state: this.currentState,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      muted: this.muted,
      playbackRate: this.playbackRate,
      isFullscreen: false,
    };
  }

  subscribe(listener: (status: PlayerStatus) => void): () => void {
    this.listeners.add(listener);
    console.log('[WebViewPlayerAdapter] Listener subscribed. Total:', this.listeners.size);
    
    return () => {
      this.listeners.delete(listener);
      console.log('[WebViewPlayerAdapter] Listener unsubscribed. Total:', this.listeners.size);
    };
  }

  updateState(newState: Partial<PlayerStatus>): void {
    if (newState.state) this.currentState = newState.state;
    if (newState.currentTime !== undefined) this.currentTime = newState.currentTime;
    if (newState.duration !== undefined) this.duration = newState.duration;
    if (newState.volume !== undefined) this.volume = newState.volume;
    if (newState.muted !== undefined) this.muted = newState.muted;
    if (newState.playbackRate !== undefined) this.playbackRate = newState.playbackRate;
    
    this.notifyListeners();
  }

  dispose(): void {
    console.log('[WebViewPlayerAdapter] Disposing...');
    this.listeners.clear();
  }
}
