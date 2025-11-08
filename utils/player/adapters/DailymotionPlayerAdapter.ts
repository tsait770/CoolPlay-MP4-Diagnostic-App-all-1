import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class DailymotionPlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'webview';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: true,
    supportsDASH: false,
    supportsRTMP: false,
    supportsRTSP: false,
    supportsAV1: false,
    supportsVP9: true,
    supportsHEVC: false,
    supportsAC3: false,
    supportsEAC3: false,
    maxResolution: '1080p',
  };
  
  private webViewRef: any = null;
  private videoId: string | null = null;
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log('[DailymotionPlayerAdapter] Dailymotion player initialized');
    
    this.videoId = this.extractVideoId(config.url);
    
    if (!this.videoId) {
      this.reportError({
        code: 'INVALID_DAILYMOTION_URL',
        message: 'Failed to extract Dailymotion video ID from URL',
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: config.url,
      });
    }
  }
  
  private extractVideoId(url: string): string | null {
    const patterns = [
      /dailymotion\.com\/video\/([\w]+)/i,
      /dai\.ly\/([\w]+)/i,
      /dailymotion\.com\/embed\/video\/([\w]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log('[DailymotionPlayerAdapter] Extracted video ID:', match[1]);
        return match[1];
      }
    }
    
    return null;
  }
  
  getEmbedUrl(): string | null {
    if (!this.videoId) {
      return null;
    }
    
    const params = new URLSearchParams({
      autoplay: this.config?.autoPlay ? '1' : '0',
      mute: '0',
      'controls': 'true',
      'ui-highlight': 'ff0000',
      'ui-logo': 'false',
      'sharing-enable': 'false',
    });
    
    return `https://www.dailymotion.com/embed/video/${this.videoId}?${params.toString()}`;
  }
  
  async play(): Promise<void> {
    this.injectCommand('play');
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    this.injectCommand('pause');
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    this.injectCommand('pause');
    this.injectCommand('seek', 0);
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    this.injectCommand('seek', timeInSeconds);
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.injectCommand('volume', clampedVolume);
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    this.injectCommand('muted', muted);
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    this.injectCommand('playbackRate', clampedRate);
    this.updateState({ playbackRate: clampedRate });
  }
  
  private injectCommand(method: string, value?: any): void {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      const script = `
        (function() {
          try {
            var iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              var message = {
                command: '${method}',
                parameters: ${value !== undefined ? JSON.stringify([value]) : '[]'}
              };
              iframe.contentWindow.postMessage(JSON.stringify(message), '*');
            } else {
              console.warn('Dailymotion player iframe not found');
            }
          } catch(e) {
            console.error('Dailymotion player command error:', e);
          }
        })();
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[DailymotionPlayerAdapter] WebView reference set');
  }
  
  async destroy(): Promise<void> {
    console.log('[DailymotionPlayerAdapter] Destroying player');
    this.webViewRef = null;
    this.videoId = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
