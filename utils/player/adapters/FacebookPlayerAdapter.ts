import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class FacebookPlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'webview';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: true,
    supportsDASH: true,
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
    console.log('[FacebookPlayerAdapter] Facebook player initialized');
    
    this.videoId = this.extractVideoId(config.url);
    
    if (!this.videoId) {
      this.reportError({
        code: 'INVALID_FACEBOOK_URL',
        message: 'Failed to extract Facebook video ID from URL',
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: config.url,
      });
    }
  }
  
  private extractVideoId(url: string): string | null {
    const patterns = [
      /facebook\.com\/watch\/?\?v=(\d+)/i,
      /facebook\.com\/[\w.-]+\/videos\/(\d+)/i,
      /fb\.watch\/([\w-]+)/i,
      /facebook\.com\/reel\/(\d+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log('[FacebookPlayerAdapter] Extracted video ID:', match[1]);
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
      href: `https://www.facebook.com/watch/?v=${this.videoId}`,
      show_text: 'false',
      autoplay: this.config?.autoPlay ? 'true' : 'false',
      mute: 'false',
    });
    
    return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
  }
  
  getDirectUrl(): string {
    if (!this.videoId) {
      return '';
    }
    return `https://www.facebook.com/watch/?v=${this.videoId}`;
  }
  
  async play(): Promise<void> {
    this.injectCommand('play();');
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    this.injectCommand('pause();');
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    this.injectCommand('pause();');
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    this.injectCommand(`seek(${timeInSeconds});`);
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.injectCommand(`setVolume(${clampedVolume});`);
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    this.injectCommand(muted ? 'mute();' : 'unmute();');
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    console.warn('[FacebookPlayerAdapter] Playback rate control not supported by Facebook embed');
    this.updateState({ playbackRate: 1.0 });
  }
  
  private injectCommand(command: string): void {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      const script = `
        (function() {
          try {
            var video = document.querySelector('video');
            if (video) {
              if (command.startsWith('play')) {
                video.play();
              } else if (command.startsWith('pause')) {
                video.pause();
              } else if (command.startsWith('seek')) {
                var time = parseFloat(command.match(/\\d+(\\.\\d+)?/)[0]);
                video.currentTime = time;
              } else if (command.startsWith('setVolume')) {
                var volume = parseFloat(command.match(/\\d+(\\.\\d+)?/)[0]);
                video.volume = volume;
              } else if (command.startsWith('mute')) {
                video.muted = true;
              } else if (command.startsWith('unmute')) {
                video.muted = false;
              }
            } else {
              console.warn('Facebook video element not found');
            }
          } catch(e) {
            console.error('Facebook player command error:', e);
          }
        })();
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[FacebookPlayerAdapter] WebView reference set');
  }
  
  async destroy(): Promise<void> {
    console.log('[FacebookPlayerAdapter] Destroying player');
    this.webViewRef = null;
    this.videoId = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
