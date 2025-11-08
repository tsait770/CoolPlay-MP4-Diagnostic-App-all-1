import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export interface AdultPlatformConfig {
  platform: string;
  urlPatterns: RegExp[];
  embedUrlBuilder?: (videoId: string, config: PlayerConfig) => string;
  videoIdExtractor: (url: string) => string | null;
  requiresCookieManagement?: boolean;
  requiresUserAgent?: string;
  supportsDirectExtraction?: boolean;
}

export const ADULT_PLATFORM_CONFIGS: Record<string, AdultPlatformConfig> = {
  pornhub: {
    platform: 'Pornhub',
    urlPatterns: [
      /pornhub\.com\/view_video\.php\?viewkey=([\w]+)/i,
      /pornhub\.com\/embed\/([\w]+)/i,
    ],
    videoIdExtractor: (url) => {
      const match = url.match(/viewkey=([\w]+)|embed\/([\w]+)/i);
      return match ? (match[1] || match[2]) : null;
    },
    embedUrlBuilder: (videoId, config) => {
      return `https://www.pornhub.com/embed/${videoId}?autoplay=${config.autoPlay ? '1' : '0'}`;
    },
    requiresCookieManagement: true,
    supportsDirectExtraction: true,
  },
  xvideos: {
    platform: 'Xvideos',
    urlPatterns: [
      /xvideos\.com\/video([\d]+)/i,
      /xvideos\.com\/embedframe\/([\d]+)/i,
    ],
    videoIdExtractor: (url) => {
      const match = url.match(/video([\d]+)|embedframe\/([\d]+)/i);
      return match ? (match[1] || match[2]) : null;
    },
    embedUrlBuilder: (videoId) => {
      return `https://www.xvideos.com/embedframe/${videoId}`;
    },
    requiresCookieManagement: true,
  },
  xnxx: {
    platform: 'Xnxx',
    urlPatterns: [
      /xnxx\.com\/video-([\w]+)/i,
    ],
    videoIdExtractor: (url) => {
      const match = url.match(/video-([\w]+)/i);
      return match ? match[1] : null;
    },
    requiresCookieManagement: true,
  },
  spankbang: {
    platform: 'Spankbang',
    urlPatterns: [
      /spankbang\.com\/([\w]+)\/video\/([\w]+)/i,
    ],
    videoIdExtractor: (url) => {
      const match = url.match(/spankbang\.com\/([\w]+)\/video\/([\w]+)/i);
      return match ? match[2] : null;
    },
    embedUrlBuilder: (videoId) => {
      return `https://spankbang.com/${videoId}/embed/`;
    },
  },
};

export class AdultPlatformAdapter extends BasePlayerAdapter {
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
  private platformConfig: AdultPlatformConfig | null = null;
  private directUrl: string | null = null;
  
  constructor(platformName: string) {
    super();
    this.platformConfig = ADULT_PLATFORM_CONFIGS[platformName.toLowerCase()];
    if (!this.platformConfig) {
      console.warn(`[AdultPlatformAdapter] Unknown platform: ${platformName}, using generic config`);
    }
  }
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log('[AdultPlatformAdapter] Initializing adult platform player');
    
    if (this.platformConfig) {
      this.videoId = this.platformConfig.videoIdExtractor(config.url);
      
      if (this.videoId && this.platformConfig.embedUrlBuilder) {
        const embedUrl = this.platformConfig.embedUrlBuilder(this.videoId, config);
        console.log('[AdultPlatformAdapter] Generated embed URL:', embedUrl);
      }
      
      if (!this.videoId) {
        console.warn('[AdultPlatformAdapter] Could not extract video ID');
      }
    }
    
    if (this.platformConfig?.supportsDirectExtraction) {
      this.directUrl = await this.extractDirectUrl(config.url);
    }
  }
  
  private async extractDirectUrl(url: string): Promise<string | null> {
    console.log('[AdultPlatformAdapter] Attempting to extract direct URL (not implemented)');
    return null;
  }
  
  getEmbedUrl(): string | null {
    if (!this.platformConfig || !this.videoId) {
      return this.config?.url || null;
    }
    
    if (this.platformConfig.embedUrlBuilder && this.videoId) {
      return this.platformConfig.embedUrlBuilder(this.videoId, this.config!);
    }
    
    return this.config?.url || null;
  }
  
  getDirectUrl(): string | null {
    return this.directUrl;
  }
  
  getUserAgent(): string | null {
    return this.platformConfig?.requiresUserAgent || null;
  }
  
  requiresCookies(): boolean {
    return this.platformConfig?.requiresCookieManagement || false;
  }
  
  async play(): Promise<void> {
    this.injectVideoCommand('play()');
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    this.injectVideoCommand('pause()');
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    this.injectVideoCommand('pause(); currentTime = 0');
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    this.injectVideoCommand(`currentTime = ${timeInSeconds}`);
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.injectVideoCommand(`volume = ${clampedVolume}`);
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    this.injectVideoCommand(`muted = ${muted}`);
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    this.injectVideoCommand(`playbackRate = ${clampedRate}`);
    this.updateState({ playbackRate: clampedRate });
  }
  
  private injectVideoCommand(command: string): void {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      const script = `
        (function() {
          try {
            var videos = document.querySelectorAll('video');
            if (videos.length > 0) {
              var video = videos[0];
              video.${command};
            } else {
              console.warn('Video element not found on page');
            }
          } catch(e) {
            console.error('Adult platform video command error:', e);
          }
        })();
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[AdultPlatformAdapter] WebView reference set');
  }
  
  async destroy(): Promise<void> {
    console.log('[AdultPlatformAdapter] Destroying player');
    this.webViewRef = null;
    this.videoId = null;
    this.platformConfig = null;
    this.directUrl = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
