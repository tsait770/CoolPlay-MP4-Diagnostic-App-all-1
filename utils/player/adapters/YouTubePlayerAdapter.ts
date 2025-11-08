import { BasePlayerAdapter, PlayerCapabilities, PlayerConfig, PlayerType } from '../PlayerAdapter';

export class YouTubePlayerAdapter extends BasePlayerAdapter {
  type: PlayerType = 'youtube';
  
  capabilities: PlayerCapabilities = {
    supportsHLS: true,
    supportsDASH: true,
    supportsRTMP: false,
    supportsRTSP: false,
    supportsAV1: true,
    supportsVP9: true,
    supportsHEVC: false,
    supportsAC3: false,
    supportsEAC3: false,
    maxResolution: '4K',
  };
  
  private webViewRef: any = null;
  private videoId: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 4;
  
  async initialize(config: PlayerConfig): Promise<void> {
    await super.initialize(config);
    
    this.videoId = this.extractVideoId(config.url);
    console.log('[YouTubePlayerAdapter] YouTube player initialized');
    console.log('[YouTubePlayerAdapter] Video ID:', this.videoId);
    
    if (!this.videoId) {
      this.reportError({
        code: 'INVALID_VIDEO_ID',
        message: 'Failed to extract YouTube video ID from URL',
        severity: 'fatal',
        recoverable: false,
        timestamp: Date.now(),
        url: config.url,
      });
    }
  }
  
  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/i,
      /(?:youtu\.be\/)([\w-]{11})/i,
      /(?:youtube\.com\/embed\/)([\w-]{11})/i,
      /(?:youtube\.com\/v\/)([\w-]{11})/i,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
      /(?:youtube-nocookie\.com\/embed\/)([\w-]{11})/i,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }
  
  getEmbedUrl(strategyIndex: number = 0): string | null {
    if (!this.videoId) {
      return null;
    }
    
    const strategies = [
      () => {
        const params = new URLSearchParams({
          autoplay: this.config?.autoPlay ? '1' : '0',
          playsinline: '1',
          rel: '0',
          modestbranding: '1',
          fs: '1',
          controls: '1',
          enablejsapi: '1',
          html5: '1',
          iv_load_policy: '3',
          cc_load_policy: '0',
          disablekb: '0',
          wmode: 'transparent',
          widget_referrer: 'https://rork.app',
          origin: typeof window !== 'undefined' ? window.location.origin : 'https://rork.app',
        });
        return `https://www.youtube.com/embed/${this.videoId}?${params.toString()}`;
      },
      () => {
        const params = new URLSearchParams({
          autoplay: this.config?.autoPlay ? '1' : '0',
          playsinline: '1',
          rel: '0',
          modestbranding: '1',
          controls: '1',
          fs: '1',
          html5: '1',
        });
        return `https://www.youtube-nocookie.com/embed/${this.videoId}?${params.toString()}`;
      },
      () => {
        return `https://www.youtube.com/embed/${this.videoId}?enablejsapi=0&autoplay=${this.config?.autoPlay ? '1' : '0'}&controls=1&fs=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;
      },
      () => {
        return `https://m.youtube.com/watch?v=${this.videoId}&autoplay=${this.config?.autoPlay ? '1' : '0'}`;
      },
      () => {
        return `https://yewtu.be/embed/${this.videoId}?autoplay=${this.config?.autoPlay ? '1' : '0'}`;
      },
    ];
    
    const index = Math.min(strategyIndex, strategies.length - 1);
    const strategy = strategies[index];
    
    console.log(`[YouTubePlayerAdapter] Using strategy ${index + 1}/${strategies.length}`);
    return strategy();
  }
  
  async play(): Promise<void> {
    this.injectCommand('playVideo();');
    this.updateState({ isPlaying: true, isPaused: false });
  }
  
  async pause(): Promise<void> {
    this.injectCommand('pauseVideo();');
    this.updateState({ isPlaying: false, isPaused: true });
  }
  
  async stop(): Promise<void> {
    this.injectCommand('stopVideo();');
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    });
  }
  
  async seek(timeInSeconds: number): Promise<void> {
    this.injectCommand(`seekTo(${timeInSeconds}, true);`);
    this.updateState({ currentTime: timeInSeconds });
  }
  
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.injectCommand(`setVolume(${clampedVolume * 100});`);
    this.updateState({ volume: clampedVolume });
  }
  
  async setMuted(muted: boolean): Promise<void> {
    this.injectCommand(muted ? 'mute();' : 'unMute();');
    this.updateState({ isMuted: muted });
  }
  
  async setPlaybackRate(rate: number): Promise<void> {
    const clampedRate = Math.max(0.25, Math.min(2.0, rate));
    this.injectCommand(`setPlaybackRate(${clampedRate});`);
    this.updateState({ playbackRate: clampedRate });
  }
  
  private injectCommand(command: string): void {
    if (this.webViewRef && this.webViewRef.injectJavaScript) {
      const script = `
        (function() {
          try {
            if (player && player.${command}) {
              player.${command}
            } else {
              console.warn('YouTube player command not available: ${command}');
            }
          } catch(e) {
            console.error('YouTube player command error:', e);
          }
        })();
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }
  
  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    console.log('[YouTubePlayerAdapter] WebView reference set');
  }
  
  handleError(error: any): boolean {
    console.error('[YouTubePlayerAdapter] Error occurred:', error);
    
    if (this.retryCount < this.maxRetries) {
      console.log(`[YouTubePlayerAdapter] Retry attempt ${this.retryCount + 1}/${this.maxRetries}`);
      this.retryCount++;
      return true;
    }
    
    this.reportError({
      code: 'YOUTUBE_PLAYBACK_FAILED',
      message: `YouTube 播放失敗。已嘗試 ${this.maxRetries + 1} 種播放方式。\n\n可能原因：\n1. 視頻設定為私人/不公開\n2. 視頻已被刪除\n3. 禁止嵌入\n4. 地區限制\n5. 年齡限制`,
      severity: 'fatal',
      recoverable: false,
      timestamp: Date.now(),
      url: this.config?.url,
      platform: 'YouTube',
    });
    
    return false;
  }
  
  getCurrentRetryIndex(): number {
    return this.retryCount;
  }
  
  async destroy(): Promise<void> {
    console.log('[YouTubePlayerAdapter] Destroying player');
    this.webViewRef = null;
    this.videoId = null;
    this.retryCount = 0;
    this.stateChangeCallbacks = [];
    this.errorCallbacks = [];
    this.config = null;
  }
}
