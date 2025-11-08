import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class SocialMediaPlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'social';
  
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
  private webViewRef: any = null;
  
  constructor(platform: string) {
    super();
    this.platform = platform;
  }
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    console.log(`[SocialMediaPlayerAdapter] Initializing ${this.platform} player`);
    console.log(`[SocialMediaPlayerAdapter] URL:`, config.url);
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
    this.injectCommand('stop');
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    this.injectCommand('seek', { time: timeInSeconds });
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.injectCommand('volume', { value: clampedVolume });
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    this.injectCommand('mute', { muted });
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    this.injectCommand('playbackRate', { rate: clampedRate });
    this.updateState({ playbackRate: clampedRate });
  }
  
  private injectCommand(command: string, params?: any): void {
    if (!this.webViewRef || !this.webViewRef.injectJavaScript) {
      console.warn(`[SocialMediaPlayerAdapter] WebView not available for ${this.platform}`);
      return;
    }
    
    const script = this.buildCommandScript(command, params);
    this.webViewRef.injectJavaScript(script);
    console.log(`[SocialMediaPlayerAdapter] Injected command: ${command}`);
  }
  
  private buildCommandScript(command: string, params?: any): string {
    switch (this.platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        return this.buildTwitterCommand(command, params);
      case 'instagram':
        return this.buildInstagramCommand(command, params);
      case 'tiktok':
        return this.buildTikTokCommand(command, params);
      default:
        return this.buildGenericCommand(command, params);
    }
  }
  
  private buildTwitterCommand(command: string, params?: any): string {
    switch (command) {
      case 'play':
        return `
          (function() {
            var videos = document.querySelectorAll('video');
            if (videos.length > 0) {
              videos[0].play();
            }
          })();
        `;
      case 'pause':
        return `
          (function() {
            var videos = document.querySelectorAll('video');
            if (videos.length > 0) {
              videos[0].pause();
            }
          })();
        `;
      default:
        return this.buildGenericCommand(command, params);
    }
  }
  
  private buildInstagramCommand(command: string, params?: any): string {
    return this.buildGenericCommand(command, params);
  }
  
  private buildTikTokCommand(command: string, params?: any): string {
    return this.buildGenericCommand(command, params);
  }
  
  private buildGenericCommand(command: string, params?: any): string {
    const paramsJson = params ? JSON.stringify(params) : '{}';
    return `
      (function() {
        var videos = document.querySelectorAll('video');
        if (videos.length > 0) {
          var video = videos[0];
          switch ('${command}') {
            case 'play':
              video.play();
              break;
            case 'pause':
              video.pause();
              break;
            case 'stop':
              video.pause();
              video.currentTime = 0;
              break;
            case 'seek':
              var params = ${paramsJson};
              if (params.time !== undefined) {
                video.currentTime = params.time;
              }
              break;
            case 'volume':
              var params = ${paramsJson};
              if (params.value !== undefined) {
                video.volume = params.value;
              }
              break;
            case 'mute':
              var params = ${paramsJson};
              if (params.muted !== undefined) {
                video.muted = params.muted;
              }
              break;
            case 'playbackRate':
              var params = ${paramsJson};
              if (params.rate !== undefined) {
                video.playbackRate = params.rate;
              }
              break;
          }
        }
      })();
    `;
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log(`[SocialMediaPlayerAdapter] WebView reference set for ${this.platform}`);
  }
  
  async destroy(): Promise<void> {
    console.log(`[SocialMediaPlayerAdapter] Destroying ${this.platform} player`);
    this.webViewRef = null;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
