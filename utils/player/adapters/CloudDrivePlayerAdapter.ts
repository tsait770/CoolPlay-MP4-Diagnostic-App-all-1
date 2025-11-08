import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class CloudDrivePlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'cloud';
  
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
  
  private platform: string;
  private directUrl: string | null = null;
  private webViewRef: any = null;
  
  constructor(platform: string) {
    super();
    this.platform = platform;
  }
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log(`[CloudDrivePlayerAdapter] Initializing ${this.platform} player`);
    
    this.directUrl = await this.extractDirectUrl(config.url);
    
    if (!this.directUrl) {
      this.reportError({
        code: 'CLOUD_DRIVE_URL_EXTRACTION_FAILED',
        message: `無法從 ${this.platform} 解析直接播放連結`,
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: config.url,
        platform: this.platform,
      });
    } else {
      console.log(`[CloudDrivePlayerAdapter] Direct URL extracted:`, this.directUrl);
    }
  }
  
  private async extractDirectUrl(url: string): Promise<string | null> {
    console.log(`[CloudDrivePlayerAdapter] Extracting direct URL from ${this.platform}`);
    
    try {
      switch (this.platform.toLowerCase()) {
        case 'google drive':
          return this.extractGoogleDriveUrl(url);
        case 'dropbox':
          return this.extractDropboxUrl(url);
        case 'onedrive':
          return this.extractOneDriveUrl(url);
        case 'mega':
          return this.extractMegaUrl(url);
        default:
          console.warn(`[CloudDrivePlayerAdapter] Unsupported platform: ${this.platform}`);
          return null;
      }
    } catch (error) {
      console.error(`[CloudDrivePlayerAdapter] URL extraction error:`, error);
      return null;
    }
  }
  
  private extractGoogleDriveUrl(url: string): string | null {
    const fileIdMatch = url.match(/\/file\/d\/([\w-]+)/);
    if (!fileIdMatch || !fileIdMatch[1]) {
      return null;
    }
    
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  private extractDropboxUrl(url: string): string | null {
    if (url.includes('dl=0')) {
      return url.replace('dl=0', 'dl=1');
    }
    
    if (url.includes('?')) {
      return `${url}&dl=1`;
    }
    
    return `${url}?dl=1`;
  }
  
  private extractOneDriveUrl(url: string): string | null {
    if (url.includes('embed?')) {
      return url;
    }
    
    console.warn('[CloudDrivePlayerAdapter] OneDrive URL extraction not fully implemented');
    return url;
  }
  
  private extractMegaUrl(url: string): string | null {
    console.warn('[CloudDrivePlayerAdapter] Mega URL extraction not implemented');
    return null;
  }
  
  getPlaybackUrl(): string | null {
    return this.directUrl;
  }
  
  async play(): Promise<void> {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      this.webViewRef.injectJavaScript('if (typeof playVideo === "function") playVideo();');
    }
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      this.webViewRef.injectJavaScript('if (typeof pauseVideo === "function") pauseVideo();');
    }
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      this.webViewRef.injectJavaScript('if (typeof stopVideo === "function") stopVideo();');
    }
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      this.webViewRef.injectJavaScript(`if (typeof seekTo === "function") seekTo(${timeInSeconds});`);
    }
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      this.webViewRef.injectJavaScript(`if (typeof setVolume === "function") setVolume(${clampedVolume});`);
    }
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      const command = muted ? 'mute' : 'unMute';
      this.webViewRef.injectJavaScript(`if (typeof ${command} === "function") ${command}();`);
    }
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      this.webViewRef.injectJavaScript(`if (typeof setPlaybackRate === "function") setPlaybackRate(${clampedRate});`);
    }
    this.updateState({ playbackRate: clampedRate });
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log(`[CloudDrivePlayerAdapter] WebView reference set for ${this.platform}`);
  }
  
  async destroy(): Promise<void> {
    console.log(`[CloudDrivePlayerAdapter] Destroying ${this.platform} player`);
    this.webViewRef = null;
    this.directUrl = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
