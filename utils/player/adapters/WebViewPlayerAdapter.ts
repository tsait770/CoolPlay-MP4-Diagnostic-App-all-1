import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class WebViewPlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'webview';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: true,
    supportsDASH: true,
    supportsRTMP: true,
    supportsRTSP: true,
    supportsAV1: true,
    supportsVP9: true,
    supportsHEVC: true,
    supportsAC3: true,
    supportsEAC3: true,
    maxResolution: '4K',
  };
  
  private webViewRef: any = null;
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log('[WebViewPlayerAdapter] WebView player initialized');
    console.log('[WebViewPlayerAdapter] URL:', config.url);
  }
  
  async play(): Promise<void> {
    this.injectJavaScript('if (typeof playVideo === "function") playVideo();');
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    this.injectJavaScript('if (typeof pauseVideo === "function") pauseVideo();');
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    this.injectJavaScript('if (typeof stopVideo === "function") stopVideo();');
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    this.injectJavaScript(`if (typeof seekTo === "function") seekTo(${timeInSeconds});`);
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.injectJavaScript(`if (typeof setVolume === "function") setVolume(${clampedVolume});`);
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    const command = muted ? 'mute' : 'unMute';
    this.injectJavaScript(`if (typeof ${command} === "function") ${command}();`);
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    this.injectJavaScript(`if (typeof setPlaybackRate === "function") setPlaybackRate(${clampedRate});`);
    this.updateState({ playbackRate: clampedRate });
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[WebViewPlayerAdapter] WebView reference set');
  }
  
  private injectJavaScript(script: string): void {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      this.webViewRef.injectJavaScript(script);
      console.log('[WebViewPlayerAdapter] Injected script:', script.substring(0, 50));
    } else {
      console.warn('[WebViewPlayerAdapter] WebView not available for script injection');
    }
  }
  
  handleMessage(data: any): void {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        this.processMessage(parsed);
      } else {
        this.processMessage(data);
      }
    } catch (error) {
      console.warn('[WebViewPlayerAdapter] Failed to parse message:', error);
    }
  }
  
  private processMessage(message: any): void {
    if (!message || typeof message !== 'object') {
      return;
    }
    
    switch (message.type) {
      case 'ready':
        this.updateState({ isBuffering: false });
        break;
      case 'play':
        this.updateState({ isPlaying: true, isPaused: false });
        break;
      case 'pause':
        this.updateState({ isPlaying: false, isPaused: true });
        break;
      case 'buffering':
        this.updateState({ isBuffering: true });
        break;
      case 'timeupdate':
        if (typeof message.currentTime === 'number') {
          this.updateState({ currentTime: message.currentTime });
        }
        break;
      case 'durationchange':
        if (typeof message.duration === 'number') {
          this.updateState({ duration: message.duration });
        }
        break;
      case 'error':
        this.reportError({
          code: message.code || 'WEBVIEW_ERROR',
          message: message.message || 'WebView playback error',
          severity: 'error',
          recoverable: true,
          timestamp: Date.now(),
        });
        break;
    }
  }
  
  async destroy(): Promise<void> {
    console.log('[WebViewPlayerAdapter] Destroying player');
    this.webViewRef = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
