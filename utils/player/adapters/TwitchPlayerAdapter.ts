import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class TwitchPlayerAdapter extends BasePlayerAdapter {
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
  private channelOrVideo: string | null = null;
  private embedType: 'video' | 'channel' | 'clip' = 'channel';
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log('[TwitchPlayerAdapter] Twitch player initialized');
    
    this.parseUrl(config.url);
    
    if (!this.channelOrVideo) {
      this.reportError({
        code: 'INVALID_TWITCH_URL',
        message: 'Failed to extract Twitch channel or video ID from URL',
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: config.url,
      });
    }
  }
  
  private parseUrl(url: string): void {
    const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/i);
    if (videoMatch && videoMatch[1]) {
      this.channelOrVideo = videoMatch[1];
      this.embedType = 'video';
      console.log('[TwitchPlayerAdapter] Detected video:', this.channelOrVideo);
      return;
    }
    
    const clipMatch = url.match(/twitch\.tv\/\w+\/clip\/([\w-]+)|clips\.twitch\.tv\/([\w-]+)/i);
    if (clipMatch && (clipMatch[1] || clipMatch[2])) {
      this.channelOrVideo = clipMatch[1] || clipMatch[2];
      this.embedType = 'clip';
      console.log('[TwitchPlayerAdapter] Detected clip:', this.channelOrVideo);
      return;
    }
    
    const channelMatch = url.match(/twitch\.tv\/([\w-]+)/i);
    if (channelMatch && channelMatch[1] && channelMatch[1] !== 'videos') {
      this.channelOrVideo = channelMatch[1];
      this.embedType = 'channel';
      console.log('[TwitchPlayerAdapter] Detected channel:', this.channelOrVideo);
      return;
    }
  }
  
  getEmbedUrl(): string | null {
    if (!this.channelOrVideo) {
      return null;
    }
    
    const parent = typeof window !== 'undefined' && window.location.hostname 
      ? window.location.hostname 
      : 'localhost';
    
    const baseParams = {
      autoplay: this.config?.autoPlay ? 'true' : 'false',
      muted: 'false',
      time: '0h0m0s',
      parent,
    };
    
    const params = new URLSearchParams(baseParams);
    
    switch (this.embedType) {
      case 'video':
        return `https://player.twitch.tv/?video=${this.channelOrVideo}&${params.toString()}`;
      case 'clip':
        return `https://clips.twitch.tv/embed?clip=${this.channelOrVideo}&${params.toString()}`;
      case 'channel':
        return `https://player.twitch.tv/?channel=${this.channelOrVideo}&${params.toString()}`;
      default:
        return null;
    }
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
    this.injectCommand('pause(); setCurrentTime(0);');
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
    this.injectCommand(`setMuted(${muted});`);
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    console.warn('[TwitchPlayerAdapter] Playback rate control not supported by Twitch embed');
    this.updateState({ playbackRate: 1.0 });
  }
  
  private injectCommand(command: string): void {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      const script = `
        (function() {
          try {
            var iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage('${command}', '*');
            } else {
              console.warn('Twitch player iframe not found');
            }
          } catch(e) {
            console.error('Twitch player command error:', e);
          }
        })();
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[TwitchPlayerAdapter] WebView reference set');
  }
  
  async destroy(): Promise<void> {
    console.log('[TwitchPlayerAdapter] Destroying player');
    this.webViewRef = null;
    this.channelOrVideo = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
